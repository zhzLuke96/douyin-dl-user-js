import { render } from "preact"
import { Config } from "../core/Config"
import { Downloader } from "../core/download/Downloader"
import { DownloadHistory } from "../core/download/DownloadHistory"
import { Modal } from "../ui/modals/Modal"
import { createToast } from "../utils/dom"
import { formatDate, runInContext } from "../utils/format"
import { normalizeBasename } from "../utils/string"
import type { PlayerInstanceLite } from "../types/lite"
import { DouyinMedia } from "@/types"
import { getBestCoverUrl } from "./douyin/getBestCoverUrl"
import { getDouyinPlayer, readPlayerMedia, subscribePlayer } from "./PlayerAdapter"

const escapeRegExp = (value: string): string => {
  let result = ""
  for (const char of value) {
    if ("\\^$.*+?()[]{}|".includes(char)) result += "\\"
    result += char
  }
  return result
}

// #region 主入口组件 ---
/**
 * 这个类是主要逻辑
 *
 * 包含如何解析操作、解析从player里提取的media对象
 */
export class MediaHandler {
  player: PlayerInstanceLite | null = null
  current_media: DouyinMedia.MediaRoot | null = null
  dispose_player_events: (() => void) | null = null
  downloading = false
  downloader: Downloader
  download_current_media: (...args: any[]) => Promise<void>

  constructor(downloader: Downloader) {
    this.downloader = downloader
    this.download_current_media = this._lock_download(this._download_current_media_logic.bind(this))
  }

  static toShortId(bigintStr: string): string {
    try {
      return BigInt(bigintStr).toString(36)
    } catch {
      return bigintStr
    }
  }

  /** 文件名
   *
   * [nickname] + [short_id] + [tags] + [desc]
   * max length: 64
   */
  _build_filename(
    media = this.current_media,
    filename_template = Config.global.features.filename_template || Config.defaults.filename_template,
    filename_max_length = Config.global.features.filename_max_length || 64,
    throw_err = false,
  ): string {
    if (!media) {
      throw new Error("缺少 media")
    }
    const {
      authorInfo: { nickname },
      awemeId,
      desc,
      textExtra,
    } = media
    const short_id = MediaHandler.toShortId(awemeId)
    const tag_list = textExtra?.map((x: any) => x.hashtagName).filter(Boolean) || []
    const tags = tag_list.map((x: string) => "#" + x).join("_")
    let rawDesc = desc || ""
    tag_list.forEach((t: string) => {
      rawDesc = rawDesc.replace(new RegExp("#" + escapeRegExp(t) + "\\s*", "g"), "")
    })
    rawDesc = rawDesc.trim().replace(/[#/?<>\\:*|":]/g, "_")
    // 渲染文件名用的上下文
    const context: any = {
      nickname,
      short_id,
      tags,
      desc: rawDesc,
      aweme_id: awemeId,
      media,
      author_info: media.authorInfo,
      uid: media.authorUserId,
      music_name: media.music?.musicName || "",
      now_date: new Date(),
      create_date: new Date(media.createTime * 1000),
    }
    // 添加格式化之后的时间
    context.now_YYYYMMDD = formatDate(context.now_date, "YYYYMMDD")
    context.now_YYYYMMDD_HHmmss = formatDate(context.now_date, "YYYYMMDD_HHmmss")
    context.create_date_YYYYMMDD = formatDate(context.create_date, "YYYYMMDD")
    context.create_date_YYYYMMDD_HHmmss = formatDate(context.create_date, "YYYYMMDD_HHmmss")
    let baseName: string
    try {
      baseName = runInContext(context, filename_template)
    } catch (error) {
      if (throw_err) throw error
      console.error("[dy-dl] Error rendering filename template:", error)
      baseName = runInContext(context, Config.defaults.filename_template)
    }
    return normalizeBasename(baseName, { maxLength: filename_max_length })
  }

  _bind_player_events() {
    if (!this.player) return
    this.dispose_player_events?.()
    const update = () => {
      const media = readPlayerMedia(this.player)
      if (media) this.current_media = media
    }
    update()
    this.dispose_player_events = subscribePlayer(this.player, update)
  }

  /**
   * !!!
   * 此为核心逻辑
   * !!!
   *
   * NOTE: 有可能在某次抖音更新之后就不可用，依赖于 xg-video 对全局状态注入
   */
  async _start_detect_player_change() {
    while (true) {
      const cp = getDouyinPlayer()
      if (this.player !== cp) {
        this.player = cp
        if (this.player) this._bind_player_events()
      }
      const media = readPlayerMedia(cp)
      if (media) this.current_media = media
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  _flag_start_download(): () => void {
    this.downloading = true
    return () => {
      this.downloading = false
    }
  }

  _lock_download(fn: (...args: any[]) => Promise<any>): (...args: any[]) => Promise<void> {
    return async (...args) => {
      if (this.downloading) {
        alert("[dy-dl]正在下载中...请稍等或刷新页面")
        return
      }
      const release = this._flag_start_download()
      try {
        await fn(...args)
      } finally {
        await new Promise((r) => setTimeout(r, 300))
        release()
      }
    }
  }

  /**
   * 从 video 对象上取得所有 url，支持分辨率策略 + 编码偏好
   * 先按 codec 筛选，再按分辨率模式筛选
   */
  _get_video_urls(video_obj: any): string[] {
    if (!video_obj) return []
    const mode = Config.global.features.download_video_mode || "default"
    const codecPref = Config.global.features.video_download_codecs || "default"

    const isH265 = (br: any) => br.isH265 === 1 || (br.gearName || "").toLowerCase().includes("h265") || (br.format || "").toLowerCase().includes("h265")
    const extractUrls = (br: any) => {
      const urls = []
      if (br.playApi) urls.push(br.playApi)
      if (Array.isArray(br.playAddr)) urls.push(...br.playAddr.map((a: any) => a.src))
      return urls.filter(Boolean)
    }

    // 如果 bitRateList 为空，直接回退默认逻辑
    if (!video_obj.bitRateList || video_obj.bitRateList.length === 0) return this._get_video_urls_default(video_obj)
    // 第零步，过滤掉所有 dash 格式，因为这种需要手动合并音频，不太方便，我们这里也做不到...
    const bitRateList = video_obj.bitRateList.filter((x: any) => x.format !== "dash")
    let candidates = [...bitRateList]

    // ====================== 第一步：按 codec 偏好筛选 ======================
    if (codecPref !== "default") {
      const isPrefer = codecPref.endsWith("_prefer")
      const wantH265 = codecPref.includes("h265")
      const matched = candidates.filter((br: any) => isH265(br) === wantH265)
      if (matched.length > 0) candidates = matched
      else if (!isPrefer) return this._get_video_urls_default(video_obj)
    }

    // ====================== 第二步：按分辨率模式筛选 ======================
    if (mode !== "default" && candidates.length > 1) {
      const vsizeof = (a: any) => (a?.width || 0) * (a?.height || 0)
      const fsizeof = (a: any) => a.dataSize || 0

      // 按分辨率面积降序，取最大尺寸
      if (mode === "max") candidates.sort((a: any, b: any) => vsizeof(b) - vsizeof(a))
      // 按分辨率面积升序，取最小尺寸
      else if (mode === "min") candidates.sort((a: any, b: any) => vsizeof(a) - vsizeof(b))
      // 按文件大小降序，取最大文件
      else if (mode === "max_file") candidates.sort((a: any, b: any) => fsizeof(b) - fsizeof(a))
      // 按文件大小升序，取最小文件
      else if (mode === "min_file") candidates.sort((a: any, b: any) => fsizeof(a) - fsizeof(b))
      // 按清晰度关键字匹配（1080P、720P 等）
      if (["1080P", "720P", "540P", "360P", "2K", "4K"].includes(mode)) {
        const kwMap: any = { "1080P": ["1080"], "720P": ["720"], "540P": ["540"], "360P": ["360"], "2K": ["2k", "2048"], "4K": ["4K", "4096"] }
        const kws = kwMap[mode] || []
        const matched = candidates.filter((br: any) => kws.some((kw: string) => (br.gearName || "").toLowerCase().includes(kw.toLowerCase())))
        if (matched.length > 0) candidates = matched
      }
    }

    // ====================== 提取最终 URL ======================
    const allUrls: string[] = []
    candidates.forEach((br: any) => allUrls.push(...extractUrls(br)))
    // 补充顶层 playApi / playApiH265（兜底）
    if (codecPref === "default" || codecPref.includes("h264")) {
      if (video_obj.playApi) allUrls.push(video_obj.playApi)
    }
    if (codecPref === "default" || codecPref.includes("h265")) {
      if (video_obj.playApiH265) allUrls.push(video_obj.playApiH265)
    }
    const result = Array.from(new Set(allUrls.filter(Boolean)))
    if (result.length === 0) return this._get_video_urls_default(video_obj)
    return result
  }

  /** 默认的 URL 提取逻辑 */
  _get_video_urls_default(video_obj: any): string[] {
    const sources: string[] = []
    if (video_obj.playApi) sources.push(video_obj.playApi)
    if (Array.isArray(video_obj.playAddr)) sources.push(...video_obj.playAddr.map((x: any) => x.src))
    if (video_obj.bitRateList)
      video_obj.bitRateList
        .filter((x: any) => x.format !== "dash")
        .forEach((x: any) => {
          if (x.playApi) sources.push(x.playApi)
        })
    if (video_obj.playApiH265) sources.push(video_obj.playApiH265)
    return Array.from(new Set(sources.filter(Boolean)))
  }

  /**
   * 抖音作品有两种形式：
   * 1. 单图、单视频
   * 2. 图集
   *
   * 如果是图集形式，必须从 images 这个数组里面取字段，其他字段都有可能是 fallback 值
   */
  async _download_media_logic(media: any, options: any = {}): Promise<any> {
    const { toastTarget = null, toast = null, toastPrefix = "", alertOnFail = true, addHistory = true } = options
    if (!media) {
      if (alertOnFail) alert("[dy-dl]无当前媒体信息")
      return { ok: false, reason: "missing_media" }
    }
    const { video, images } = media
    const filename_base = this._build_filename(media)
    // 判断是否为图集
    const isAlbum = Array.isArray(images) && images.length > 0
    const total = isAlbum ? images.length : 1
    const scopedToast = toast || createToast(toastTarget, 5000)
    const toastUpdate = (msg: string, dur = 5000) => {
      const p = toastPrefix ? toastPrefix + " " + msg : msg
      scopedToast.update(p, dur)
    }

    if (isAlbum) {
      // 下载图集
      // TODO 要是能支持 zip 打包会更好一点
      let downloadedCount = 0
      let lastError = ""
      for (let idx = 0; idx < images.length; idx++) {
        toastUpdate("下载图集 (" + (idx + 1) + "/" + total + ")")
        const item = images[idx]
        const fn = filename_base + "_" + (idx + 1)
        // 包含视频的图集项
        if (item.video) {
          const urls = this._get_video_urls(item.video)
          if (urls.length > 0) {
            const dl = await this.downloader.download_file_with_error(urls[0], fn, urls, { silent: !alertOnFail, media, mediaType: "video" })
            if (dl.ok) downloadedCount++
            else lastError = lastError || dl.error_msg
          } else {
            lastError = lastError || "未找到视频地址"
          }
          continue
        }
        // 单纯的图片图集项
        // NOTE: .urlList 里面是 q75的webp 图片， downloadUrlList 里面是完整原版大图但是带水印...
        const img_urls = item.urlList?.filter(Boolean) || item.downloadUrlList?.filter(Boolean)
        if (img_urls?.length > 0) {
          const dl = await this.downloader.download_file_with_error(img_urls[0], fn, img_urls, { silent: !alertOnFail, media, mediaType: "image" })
          if (dl.ok) downloadedCount++
          else lastError = lastError || dl.error_msg
        } else {
          lastError = lastError || "未找到图片地址"
        }
      }
      toastUpdate("图集下载完成")
      if (downloadedCount === 0 && images.length > 0) {
        if (alertOnFail) alert("[dy-dl]图集下载失败")
        return { ok: false, reason: "no_valid_media", message: lastError || "图集下载失败" }
      }
      if (downloadedCount && addHistory) DownloadHistory.add(media)
      return { ok: downloadedCount > 0 }
    }

    // 单视频或单图片（老版本可能直接在video字段放图片信息，但新版通常是images）
    toastUpdate("正在下载...")
    const video_urls = this._get_video_urls(video)
    let lastError: string
    if (video_urls.length > 0) {
      const dl = await this.downloader.download_file_with_error(video_urls[0], filename_base, video_urls, { silent: !alertOnFail, media, mediaType: "video" })
      if (dl.ok && addHistory) DownloadHistory.add(media)
      if (dl.ok) {
        toastUpdate("下载完成")
        return { ok: true }
      }
      lastError = dl.error_msg
    } else {
      lastError = "未找到视频地址"
    }
    if (alertOnFail) alert("[dy-dl]无法下载当前媒体")
    return { ok: false, reason: "no_valid_media", message: lastError || "无法下载当前媒体" }
  }

  async _download_cover_logic(media: any, options: any = {}): Promise<any> {
    const { alertOnFail = true } = options
    if (!media) {
      if (alertOnFail) alert("[dy-dl]无当前媒体信息")
      return { ok: false, reason: "missing_media" }
    }
    const coverUrl = getBestCoverUrl(media)
    if (!coverUrl) return { ok: false, reason: "no_cover", message: "未找到封面地址" }
    const dl = await this.downloader.download_file_with_error(coverUrl, "thumb_" + this._build_filename(media), [], { silent: !alertOnFail, media, mediaType: "image" })
    if (!dl.ok) return { ok: false, reason: "cover_download_failed", message: dl.error_msg || "封面下载失败" }
    return { ok: true }
  }

  async _download_current_media_logic() {
    return this._download_media_logic(this.current_media, { toastTarget: document.querySelector(".dy-dl-video-btn"), alertOnFail: true, addHistory: true })
  }

  // 下载封面
  async download_thumb() {
    // 1. 检查媒体是否存在
    if (!this.current_media) {
      alert("[dy-dl] 无当前媒体信息")
      return
    }

    // 2. 调用独立的提取函数，获得最高清封面 URL
    const bestThumb = getBestCoverUrl(this.current_media)

    // 3. 结果处理
    if (!bestThumb) {
      alert("[dy-dl] 未找到任何可用的封面图")
      return
    }

    // 4. 执行下载
    this.downloader.download_file(bestThumb, "thumb_" + this._build_filename(this.current_media), [], { media: this.current_media, mediaType: "image" })
  }

  // 显示媒体详情
  async show_media_details() {
    if (!this.current_media) {
      alert("[dy-dl]无当前媒体信息")
      return
    }
    // 1. 创建 Modal
    const modal = new Modal((_root, overlay) => {
      // issues #18 fix z-index
      overlay.style.zIndex = "999999"
      // 全屏兼容
      if (document.fullscreenElement) document.fullscreenElement.appendChild(overlay)
    })
    // 注意：需要确保容器有尺寸，或者 Modal 类本身处理了 root 的基础样式
    // 这里简单加一个 inline style 确保 root 撑开
    modal.root.style.cssText = "width:800px;max-width:90vw;background:transparent;box-shadow:none;border-radius:8px;overflow:hidden"
    // 2. 准备数据
    const filenameBase = this._build_filename(this.current_media)

    // 3. 挂载 UI (使用 Preact render)
    try {
      const { MediaDetailModalApp } = await import("../ui/modals/MediaDetailModal")
      render(<MediaDetailModalApp media={this.current_media} filenameBase={filenameBase} />, modal.root)
    } catch (e) {
      console.error("[dy-dl] 媒体详情组件加载失败", e)
      modal.root.textContent = "组件加载失败，请刷新重试"
    }
  }

  async open_config_modal() {
    // 创建模态框
    const modal = new Modal((_root, overlay) => {
      overlay.style.zIndex = "999999"
      if (document.fullscreenElement) document.fullscreenElement.appendChild(overlay)
    })
    modal.root.style.cssText = "width:650px;max-width:90vw;background:transparent;box-shadow:none;border-radius:8px;overflow:hidden"
    try {
      const { ConfigModalApp } = await import("../ui/modals/ConfigModal")
      render(<ConfigModalApp config={Config.global} modal={modal} />, modal.root)
    } catch (e) {
      console.error("[dy-dl] 配置组件加载失败", e)
      modal.root.textContent = "组件加载失败"
    }
  }

  init() {
    this._start_detect_player_change()
  }
}
