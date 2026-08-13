import { Emitter } from "../../core/Emitter"
import { ProfileDownloadState } from "../../core/download/ProfileDownloadState"
import { throttle } from "../../utils/performance"
import type { MediaHandler } from "../MediaHandler"
import type { ProfileDataService } from "./ProfileDataService"

/** 事件定义（供外部订阅） */
interface Events extends Record<string, any[]> {
  stateChanged: [ProfileDownloadManager]
  countsUpdated: [ReturnType<ProfileDownloadManager["getCounts"]>]
  jobStarted: []
  jobPaused: []
  jobResumed: []
  jobEnded: []
  jobCompleted: []
  jobLog: [JobLogEntry[]]
}

export type DownloadType = "content" | "cover"
export type JobLogStatus = "info" | "running" | "success" | "failed"
export type JobItemStatus = "pending" | "running" | "success" | "failed"

export interface JobLogEntry {
  time: number
  type: DownloadType
  awemeId: string
  desc: string
  status: JobLogStatus
  message: string
}

export interface FeedCardStatus {
  selected: boolean
  contentDownloaded: boolean
  coverDownloaded: boolean
  failed: boolean
  coverFailed: boolean
  running: boolean
  runningType: DownloadType | null
}

interface FailedItem {
  count: number
  reason: string
  updatedAt: number
  desc: string
}

export class ProfileDownloadManager extends Emitter<Events> {
  mediaHandler: MediaHandler
  dataService: ProfileDataService
  jobState: ReturnType<(typeof ProfileDownloadState)["create_default"]> | null = null
  jobRunning = false
  jobStopRequested = false
  jobEndRequested = false
  jobLog: JobLogEntry[] = []
  currentDownloadType: DownloadType = "content"
  /** 本次任务并发数，不写入全局配置 */
  private _concurrency = 1
  /** 本次任务的方块状态，不持久化 */
  private _itemStatus: Record<string, JobItemStatus> = {}
  /** 选中的媒体 */
  selectedIds = new Set<string>()
  private collect_timer: ReturnType<typeof setInterval> | null = null

  constructor({ mediaHandler, dataService }: { mediaHandler: MediaHandler; dataService: ProfileDataService }) {
    super()
    this.mediaHandler = mediaHandler
    this.dataService = dataService
    const collect = throttle(this.collect.bind(this), 1000)
    this.collect_timer = setInterval(collect, 5 * 1000)
    window.addEventListener("wheel", collect, { passive: false })
  }

  collect() {
    if (!this.dataService.isProfilePage()) return
    this._ensureJobState()
    const prev = this.jobState?.knownIds.length || 0
    const mediaList = this.dataService.collectCurrentFeedMedia()
    this.mergeMediaIntoState(mediaList)
    const changed = (this.jobState?.knownIds.length || 0) - prev
    if (changed) {
      this.emit("stateChanged", this)
      this.emit("countsUpdated", this.getCounts())
    }
  }

  // 确保 jobState 与当前页面 profile 匹配
  private _ensureJobState(profile?: any) {
    if (!profile) {
      profile = this.dataService.getProfileContext()
    }
    if (!profile) {
      if (!this.jobRunning) {
        this.jobState = null
        this._clearSessionState()
      }
      return null
    }
    if (!this.jobState || (!this.jobRunning && this.jobState.profileKey !== profile.profileKey)) {
      if (!this.jobRunning) {
        this._clearSessionState()
        this.jobState = ProfileDownloadState.load(profile.profileKey, profile)
      }
    }
    return this.jobState
  }

  /** 页面跳转后同步当前会话状态 */
  syncPageState() {
    this._ensureJobState()
    this.emit("stateChanged", this)
  }

  private _clearSessionState() {
    this.jobLog = []
    this.selectedIds.clear()
    this._itemStatus = {}
    this.currentDownloadType = "content"
    this._concurrency = 1
  }

  private _saveJobState() {
    if (!this.jobState?.profileKey) return this.jobState
    this.jobState = ProfileDownloadState.save(this.jobState.profileKey, this.jobState)
    return this.jobState
  }

  private _push_log(status: JobLogStatus, message: string, media?: any, type: DownloadType = this.currentDownloadType) {
    this.jobLog.push({
      time: Date.now(),
      type,
      awemeId: media?.awemeId || "",
      desc: media?.desc || "",
      status,
      message,
    })
    if (this.jobLog.length > 200) this.jobLog.splice(0, this.jobLog.length - 200)
    this.emit("jobLog", this.jobLog.slice())
  }

  mergeMediaIntoState(mediaList: any[]) {
    if (!this.jobState) return
    const knownIds = new Set(this.jobState.knownIds || [])
    mediaList.forEach((media) => {
      if (media?.awemeId) knownIds.add(media.awemeId)
    })
    this.jobState.knownIds = Array.from(knownIds)
  }

  markDownloaded(media: any, downloadType: DownloadType = "content") {
    if (!this.jobState || !media?.awemeId) return
    if (downloadType === "cover") {
      const downloadedIds = new Set(this.jobState.coverDownloadedIds || [])
      downloadedIds.add(media.awemeId)
      this.jobState.coverDownloadedIds = Array.from(downloadedIds)
      if (this.jobState.coverFailedItems?.[media.awemeId]) delete this.jobState.coverFailedItems[media.awemeId]
    } else {
      const downloadedIds = new Set(this.jobState.downloadedIds || [])
      downloadedIds.add(media.awemeId)
      this.jobState.downloadedIds = Array.from(downloadedIds)
      if (this.jobState.failedItems?.[media.awemeId]) delete this.jobState.failedItems[media.awemeId]
    }
  }

  markFailed(media: any, reason = "unknown", downloadType: DownloadType = "content") {
    if (!this.jobState || !media?.awemeId) return
    if (downloadType === "cover") {
      const prev: Partial<FailedItem> = this.jobState.coverFailedItems?.[media.awemeId] || {}
      this.jobState.coverFailedItems = this.jobState.coverFailedItems || {}
      this.jobState.coverFailedItems[media.awemeId] = { count: Number(prev.count || 0) + 1, reason, updatedAt: Date.now(), desc: media.desc || prev.desc || "" }
    } else {
      const prev: Partial<FailedItem> = this.jobState.failedItems?.[media.awemeId] || {}
      this.jobState.failedItems = this.jobState.failedItems || {}
      this.jobState.failedItems[media.awemeId] = { count: Number(prev.count || 0) + 1, reason, updatedAt: Date.now(), desc: media.desc || prev.desc || "" }
    }
  }

  markSelect(awemeId: string, selected: boolean) {
    const changed = selected ? !this.selectedIds.has(awemeId) : this.selectedIds.has(awemeId)
    if (selected) this.selectedIds.add(awemeId)
    else this.selectedIds.delete(awemeId)
    if (changed) {
      this.emit("stateChanged", this)
      this.emit("countsUpdated", this.getCounts())
    }
  }

  markSelectAll(selected: boolean) {
    if (!selected) this.selectedIds.clear()
    else this.jobState?.knownIds?.forEach((id) => this.selectedIds.add(id))
    this.emit("stateChanged", this)
    this.emit("countsUpdated", this.getCounts())
  }

  isSelectAll(): boolean {
    return this.selectedIds.size === this.jobState?.knownIds?.length
  }

  _isFeedSelected(awemeId: string): boolean {
    return this.selectedIds.has(awemeId)
  }

  getFeedCardStatus(awemeId: string): FeedCardStatus {
    const running = this._itemStatus[awemeId] === "running"
    return {
      selected: this.selectedIds.has(awemeId),
      contentDownloaded: this.jobState?.downloadedIds?.includes(awemeId) || false,
      coverDownloaded: this.jobState?.coverDownloadedIds?.includes(awemeId) || false,
      failed: Boolean(this.jobState?.failedItems?.[awemeId]),
      coverFailed: Boolean(this.jobState?.coverFailedItems?.[awemeId]),
      running,
      runningType: running ? this.currentDownloadType : null,
    }
  }

  getCounts() {
    return {
      known: this.jobState?.knownIds?.length || 0,
      downloaded: this.jobState?.downloadedIds?.length || 0,
      failed: Object.keys(this.jobState?.failedItems || {}).length,
      coverDownloaded: this.jobState?.coverDownloadedIds?.length || 0,
      coverFailed: Object.keys(this.jobState?.coverFailedItems || {}).length,
      selected: this.selectedIds.size,
      is_selected_all: this.isSelectAll(),
    }
  }

  private _normalizeConcurrency(value: unknown): number {
    const raw = Number(value)
    const next = Number.isFinite(raw) ? Math.floor(raw) : 1
    return Math.min(Math.max(next, 1), 5)
  }

  private _deriveItemStatuses(): Record<string, JobItemStatus> {
    const statuses: Record<string, JobItemStatus> = {}
    if (!this.jobState) return statuses
    const isCover = this.currentDownloadType === "cover"
    const downloadedSet = new Set(isCover ? this.jobState.coverDownloadedIds || [] : this.jobState.downloadedIds || [])
    const failedItems = isCover ? this.jobState.coverFailedItems || {} : this.jobState.failedItems || {}
    const failedSet = new Set(Object.keys(failedItems))
    this.selectedIds.forEach((id) => {
      if (failedSet.has(id)) statuses[id] = "failed"
      else if (downloadedSet.has(id)) statuses[id] = "success"
      else statuses[id] = "pending"
    })
    return statuses
  }

  getSnapshot(profileNameFallback = "当前作者主页") {
    if (!this.jobState) this._ensureJobState()
    const isProfilePage = this.dataService.isProfilePage()
    const profile = !this.jobRunning && isProfilePage ? this.dataService.getProfileContext() : null
    const profileName = this.jobState?.profileName || profile?.profileName || profileNameFallback
    const statusLabel = this.jobRunning
      ? this.jobStopRequested
        ? this.jobEndRequested
          ? "结束中..."
          : "暂停中..."
        : "进行中"
      : this.jobState?.status === "completed"
        ? "已完成"
        : this.jobState?.status === "paused"
          ? "已暂停"
          : this.jobState?.status === "idle"
            ? "已结束"
            : "待开始"
    const counts = this.getCounts()
    const itemStatuses = Object.keys(this._itemStatus).length > 0 ? this._itemStatus : this._deriveItemStatuses()
    return {
      jobRunning: this.jobRunning,
      jobStopRequested: this.jobStopRequested,
      jobStatus: this.jobState?.status || "idle",
      profileName,
      statusLabel,
      counts,
      jobLog: this.jobLog.slice(),
      downloadType: this.currentDownloadType,
      concurrency: this._concurrency,
      itemStatuses: { ...itemStatuses },
    }
  }

  // 重置状态
  resetState(): boolean {
    const profile = this.dataService.getProfileContext()
    if (!profile) return false
    if (this.jobRunning) this.endJob()
    this.jobLog = []
    ProfileDownloadState.reset(profile.profileKey)
    this.currentDownloadType = "content"
    this._concurrency = 1
    this._itemStatus = {}
    this.jobState = ProfileDownloadState.create_default(profile)
    this.collect()
    this.emit("stateChanged", this)
    return true
  }

  // 暂停当前下载，循环会在当前项结束后停止
  pauseJob() {
    if (!this.jobRunning || this.jobStopRequested) return
    this.jobStopRequested = true
    if (this.jobState?.profileKey) {
      this.jobState.status = "paused"
      this._saveJobState()
    }
    this._push_log("info", "已暂停")
    this.emit("jobPaused")
    this.emit("stateChanged", this)
  }

  // 继续上次暂停的下载
  resumeJob() {
    if (this.jobRunning) return
    if (this.jobState?.status !== "paused") return
    return this.startJob(this.currentDownloadType, this._concurrency)
  }

  // 结束当前下载阶段，回到选择阶段
  endJob() {
    if (this.jobRunning) this.jobStopRequested = true
    this.jobEndRequested = true
    if (this.jobState?.profileKey) {
      this.jobState.status = "idle"
      this._saveJobState()
    }
    this._push_log("info", "已结束")
    this.emit("jobEnded")
    this.emit("stateChanged", this)
  }

  // 启动下载循环（由外部调用，这里只做前置准备）
  async startJob(downloadType: DownloadType = this.currentDownloadType, concurrency = 1) {
    if (!this.dataService.isProfilePage()) throw new Error("请在作者主页中使用全量下载。")
    if (this.jobRunning) return
    if (this.mediaHandler.downloading) throw new Error("当前已有下载任务在进行中。")
    const releaseLock = this.mediaHandler._flag_start_download()
    const resuming = this.jobState?.status === "paused" && downloadType === this.currentDownloadType
    if (!resuming) this.jobLog = []
    this.currentDownloadType = downloadType
    this._concurrency = this._normalizeConcurrency(concurrency)
    this.jobRunning = true
    this.jobStopRequested = false
    this.jobEndRequested = false
    this.emit("jobStarted")
    this._push_log("info", resuming ? "继续下载" : "开始下载")
    if (resuming) this.emit("jobResumed")
    this.emit("stateChanged", this)
    try {
      await this._runDownloadLoop()
    } finally {
      this.jobRunning = false
      this.jobStopRequested = false
      this.jobEndRequested = false
      releaseLock()
      this.emit("stateChanged", this)
    }
  }

  private async _runDownloadLoop() {
    const profile = this.dataService.getProfileContext()
    if (!profile) throw new Error("无法获取作者信息。")
    this._ensureJobState(profile)
    if (!this.jobState) return
    this.jobState.status = "running"
    this.jobState.lastRunAt = Date.now()
    this.jobState.completedAt = 0
    this._saveJobState()
    this.emit("stateChanged", this)

    // 获取所有选中但尚未成功下载的作品ID
    const downloadType = this.currentDownloadType
    const downloadedIds = downloadType === "cover" ? this.jobState.coverDownloadedIds || [] : this.jobState.downloadedIds || []
    const failedItems = downloadType === "cover" ? this.jobState.coverFailedItems || {} : this.jobState.failedItems || {}
    const downloadedSet = new Set(downloadedIds)
    const failedSet = new Set(Object.keys(failedItems))
    const selectedIdsArray = Array.from(this.selectedIds)
    const pendingIds = selectedIdsArray.filter((id) => !downloadedSet.has(id) || failedSet.has(id))
    this._itemStatus = this._deriveItemStatuses()
    this.emit("stateChanged", this)

    if (pendingIds.length === 0) {
      this.jobState.status = this.jobEndRequested ? "idle" : "completed"
      if (this.jobState.status === "completed") this.jobState.completedAt = Date.now()
      this._saveJobState()
      if (this.jobState.status === "completed") {
        this._push_log("info", "没有待下载项，任务完成")
        this.emit("jobCompleted")
      }
      this.emit("stateChanged", this)
      return
    }

    // 按本次任务并发数下载选中的作品
    const concurrency = this._concurrency
    this._push_log("info", `并发数：${concurrency}`)
    await this._runConcurrentWorkers(pendingIds, downloadType, concurrency)
    if (!this.jobState) return
    if (this.jobStopRequested) {
      this.jobState.status = this.jobEndRequested ? "idle" : "paused"
      this._saveJobState()
      this.emit("stateChanged", this)
      return
    }
    // 任务完成
    this.jobState.status = this.jobEndRequested ? "idle" : "completed"
    if (this.jobState.status === "completed") this.jobState.completedAt = Date.now()
    this._saveJobState()
    if (this.jobState.status === "completed") {
      this._push_log("info", "下载完成")
      this.emit("jobCompleted")
    }
    this.emit("stateChanged", this)
  }

  private async _downloadOne(awemeId: string, downloadType: DownloadType): Promise<void> {
    if (this.jobStopRequested) return
    const media = this.dataService.feedMediaCache.get(awemeId)
    if (!media) {
      const fakeMedia = { awemeId, desc: "未缓存" }
      console.warn("[dy-dl] 缓存中未找到作品", awemeId)
      this._itemStatus[awemeId] = "failed"
      this._push_log("failed", "缓存中未找到作品，已标记失败", fakeMedia)
      this.markFailed(fakeMedia, "cache_miss", downloadType)
      this._saveJobState()
      this.emit("stateChanged", this)
      this.emit("countsUpdated", this.getCounts())
      return
    }
    this._itemStatus[awemeId] = "running"
    this.emit("stateChanged", this)
    this._push_log("running", "开始下载", media)
    // 执行下载（复用 mediaHandler 的下载逻辑）
    const result =
      downloadType === "cover"
        ? await this.mediaHandler._download_cover_logic(media, { alertOnFail: false })
        : await this.mediaHandler._download_media_logic(media, {
            toastTarget: null,
            toast: { update: () => {} },
            toastPrefix: "批量下载",
            alertOnFail: false,
            addHistory: true,
          })
    const reason = result?.reason || (downloadType === "cover" ? "cover_download_failed" : "download_failed")
    if (result?.ok) {
      this._itemStatus[awemeId] = "success"
      this.markDownloaded(media, downloadType)
      this._push_log("success", "下载成功", media)
    } else {
      this._itemStatus[awemeId] = "failed"
      this.markFailed(media, reason, downloadType)
      this._push_log("failed", "下载失败：" + reason, media)
    }
    this._saveJobState()
    this.emit("stateChanged", this)
    this.emit("countsUpdated", this.getCounts())
    // 每项下载后稍作延迟，降低并发请求过快风险
    await new Promise((r) => setTimeout(r, 500))
  }

  private async _runConcurrentWorkers(pendingIds: string[], downloadType: DownloadType, concurrency: number): Promise<void> {
    let cursor = 0
    const worker = async () => {
      while (!this.jobStopRequested) {
        const index = cursor++
        if (index >= pendingIds.length) return
        const awemeId = pendingIds[index]
        try {
          await this._downloadOne(awemeId, downloadType)
        } catch (error) {
          const media = this.dataService.feedMediaCache.get(awemeId)
          const fallbackMedia = { awemeId, desc: "下载异常" }
          console.error("[dy-dl] 批量下载任务异常", error)
          this._itemStatus[awemeId] = "failed"
          this._push_log("failed", "下载异常：" + (error instanceof Error ? error.message : String(error)), media || fallbackMedia)
          this.markFailed(media || fallbackMedia, "unexpected_error", downloadType)
          this._saveJobState()
          this.emit("stateChanged", this)
          this.emit("countsUpdated", this.getCounts())
        }
      }
    }
    const workerCount = Math.min(concurrency, pendingIds.length)
    await Promise.all(Array.from({ length: workerCount }, () => worker()))
  }
}
