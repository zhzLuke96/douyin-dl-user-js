import { Emitter } from "../core/Emitter"
import { ProfileDownloadState } from "../core/ProfileDownloadState"
import { throttle } from "../utils/performance"
import type { MediaHandler } from "./MediaHandler"
import type { ProfileDataService } from "./ProfileDataService"

interface Events extends Record<string, any[]> {
  stateChanged: [ProfileDownloadManager]
  countsUpdated: [ReturnType<ProfileDownloadManager["getCounts"]>]
  jobStarted: []
  jobStopped: []
  jobCompleted: []
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
    const prev = this.jobState?.knownIds.length || 0
    const mediaList = this.dataService.collectCurrentFeedMedia()
    this.mergeMediaIntoState(mediaList)
    const changed = (this.jobState?.knownIds.length || 0) - prev
    if (changed) {
      this.emit("stateChanged", this)
      this.emit("countsUpdated", this.getCounts())
    }
  }

  private _ensureJobState(profile?: any) {
    if (!profile) {
      profile = this.dataService.getProfileContext()
    }
    if (!profile) {
      this.jobState = null
      return null
    }
    if (!this.jobState || (!this.jobRunning && this.jobState.profileKey !== profile.profileKey)) {
      this.jobState = ProfileDownloadState.load(profile.profileKey, profile)
    }
    return this.jobState
  }

  private _saveJobState() {
    if (!this.jobState?.profileKey) return this.jobState
    this.jobState = ProfileDownloadState.save(this.jobState.profileKey, this.jobState)
    return this.jobState
  }

  mergeMediaIntoState(mediaList: any[]) {
    if (!this.jobState) return
    const knownIds = new Set(this.jobState.knownIds || [])
    mediaList.forEach((media) => {
      if (media?.awemeId) knownIds.add(media.awemeId)
    })
    this.jobState.knownIds = Array.from(knownIds)
  }

  markDownloaded(media: any) {
    if (!this.jobState || !media?.awemeId) return
    const downloadedIds = new Set(this.jobState.downloadedIds || [])
    downloadedIds.add(media.awemeId)
    this.jobState.downloadedIds = Array.from(downloadedIds)
    if (this.jobState.failedItems?.[media.awemeId]) delete this.jobState.failedItems[media.awemeId]
  }

  markFailed(media: any, reason = "unknown") {
    if (!this.jobState || !media?.awemeId) return
    const prev: Partial<FailedItem> = this.jobState.failedItems?.[media.awemeId] || {}
    this.jobState.failedItems = this.jobState.failedItems || {}
    this.jobState.failedItems[media.awemeId] = { count: Number(prev.count || 0) + 1, reason, updatedAt: Date.now(), desc: media.desc || prev.desc || "" }
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

  getCounts() {
    return {
      known: this.jobState?.knownIds?.length || 0,
      downloaded: this.jobState?.downloadedIds?.length || 0,
      failed: Object.keys(this.jobState?.failedItems || {}).length,
      selected: this.selectedIds.size,
      is_selected_all: this.isSelectAll(),
    }
  }

  getSnapshot(profileNameFallback = "当前作者主页") {
    const isProfilePage = this.dataService.isProfilePage()
    const profile = !this.jobRunning && isProfilePage ? this.dataService.getProfileContext() : null
    const profileName = this.jobState?.profileName || profile?.profileName || profileNameFallback
    const statusLabel = this.jobRunning ? "进行中" : this.jobState?.status === "completed" ? "已完成" : this.jobState?.status === "paused" ? "已暂停" : "待开始"
    return {
      jobRunning: this.jobRunning,
      profileName,
      statusLabel,
      counts: this.getCounts(),
      summary: statusLabel + " 选择/发现: " + this.selectedIds.size + "/" + (this.jobState?.knownIds?.length || 0),
    }
  }

  resetState(): boolean {
    const profile = this.dataService.getProfileContext()
    if (!profile) return false
    if (this.jobRunning) this.stopJob()
    ProfileDownloadState.reset(profile.profileKey)
    this.jobState = ProfileDownloadState.create_default(profile)
    this.collect()
    this.emit("stateChanged", this)
    return true
  }

  stopJob() {
    this.jobStopRequested = true
    if (this.jobState?.profileKey) {
      this.jobState.status = "paused"
      this._saveJobState()
    }
    this.emit("stateChanged", this)
    this.emit("jobStopped")
  }

  async startJob() {
    if (!this.dataService.isProfilePage()) throw new Error("请在作者主页中使用全量下载。")
    if (this.jobRunning) return
    if (this.mediaHandler.downloading) throw new Error("当前已有下载任务在进行中。")
    const releaseLock = this.mediaHandler._flag_start_download()
    this.jobRunning = true
    this.jobStopRequested = false
    this.emit("jobStarted")
    this.emit("stateChanged", this)
    try {
      await this._runDownloadLoop()
    } finally {
      this.jobRunning = false
      this.jobStopRequested = false
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

    const selectedIdsArray = Array.from(this.selectedIds)
    const downloadedSet = new Set(this.jobState.downloadedIds || [])
    const pendingIds = selectedIdsArray.filter((id) => !downloadedSet.has(id))

    if (pendingIds.length === 0) {
      this.jobState.status = "completed"
      this.jobState.completedAt = Date.now()
      this._saveJobState()
      this.emit("jobCompleted")
      this.emit("stateChanged", this)
      return
    }

    for (const awemeId of pendingIds) {
      if (this.jobStopRequested) {
        this.jobState.status = "paused"
        this._saveJobState()
        this.emit("stateChanged", this)
        return
      }
      const media = this.dataService.feedMediaCache.get(awemeId)
      if (!media) {
        console.warn("[dy-dl] 缓存中未找到作品", awemeId)
        this.markFailed({ awemeId, desc: "未缓存" }, "cache_miss")
        this._saveJobState()
        this.emit("countsUpdated", this.getCounts())
        continue
      }
      const result = await this.mediaHandler._download_media_logic(media, {
        toastTarget: null,
        toast: { update: () => {} },
        toastPrefix: "批量下载",
        alertOnFail: false,
        addHistory: true,
      })
      if (result?.ok) this.markDownloaded(media)
      else this.markFailed(media, result?.reason || "download_failed")
      this._saveJobState()
      this.emit("countsUpdated", this.getCounts())
      await new Promise((r) => setTimeout(r, 500))
    }
    if (!this.jobState) return
    this.jobState.status = "completed"
    this.jobState.completedAt = Date.now()
    this._saveJobState()
    this.emit("jobCompleted")
    this.emit("stateChanged", this)
  }
}
