import { render } from "preact"
import { Config } from "../core/Config"
import { Downloader } from "../core/Downloader"
import { DownloadHistory } from "../core/DownloadHistory"
import { Modal } from "../ui/Modal"
import { createToast } from "../utils/dom"
import { formatDate, runInContext } from "../utils/format"
import type { PlayerInstanceLite } from "../types/lite"

export class MediaHandler {
  player: PlayerInstanceLite | null = null
  current_media: any = null
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

  _build_filename(
    media: any = this.current_media,
    filename_template = Config.global.features.filename_template || Config.defaults.filename_template,
    filename_max_length = Config.global.features.filename_max_length || 64,
    throw_err = false,
  ): string {
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
      rawDesc = rawDesc.replace(new RegExp("#" + t + "\\s*", "g"), "")
    })
    rawDesc = rawDesc.trim().replace(/[#/?<>\\:*|":]/g, "")
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
    if (baseName.length > filename_max_length) baseName = baseName.slice(0, filename_max_length)
    baseName = baseName.replace(/\./g, "_")
    return baseName
  }

  _bind_player_events() {
    if (!this.player) return
    const update = () => {
      if (this.player?.config?.awemeInfo) this.current_media = (this.player as any).config.awemeInfo
    }
    update()
    ;(this.player as any).on("play", update)
    ;(this.player as any).on("seeked", update)
  }

  async _start_detect_player_change() {
    while (true) {
      const cp = (window as any).player || (typeof unsafeWindow !== "undefined" && (unsafeWindow as any).player)
      if (this.player !== cp) {
        this.player = cp
        if (this.player) this._bind_player_events()
      }
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

    if (!video_obj.bitRateList || video_obj.bitRateList.length === 0) return this._get_video_urls_default(video_obj)
    const bitRateList = video_obj.bitRateList.filter((x: any) => x.format !== "dash")
    let candidates = [...bitRateList]

    if (codecPref !== "default") {
      const isPrefer = codecPref.endsWith("_prefer")
      const wantH265 = codecPref.includes("h265")
      const matched = candidates.filter((br: any) => isH265(br) === wantH265)
      if (matched.length > 0) candidates = matched
      else if (!isPrefer) return this._get_video_urls_default(video_obj)
    }

    if (mode !== "default" && candidates.length > 1) {
      const vsizeof = (a: any) => (a?.width || 0) * (a?.height || 0)
      const fsizeof = (a: any) => a.dataSize || 0

      if (mode === "max") candidates.sort((a: any, b: any) => vsizeof(b) - vsizeof(a))
      else if (mode === "min") candidates.sort((a: any, b: any) => vsizeof(a) - vsizeof(b))
      else if (mode === "max_file") candidates.sort((a: any, b: any) => fsizeof(b) - fsizeof(a))
      else if (mode === "min_file") candidates.sort((a: any, b: any) => fsizeof(a) - fsizeof(b))

      if (["1080P", "720P", "540P", "360P", "2K", "4K"].includes(mode)) {
        const kwMap: any = { "1080P": ["1080"], "720P": ["720"], "540P": ["540"], "360P": ["360"], "2K": ["2k", "2048"], "4K": ["4K", "4096"] }
        const kws = kwMap[mode] || []
        const matched = candidates.filter((br: any) => kws.some((kw: string) => (br.gearName || "").toLowerCase().includes(kw.toLowerCase())))
        if (matched.length > 0) candidates = matched
      }
    }

    const allUrls: string[] = []
    candidates.forEach((br: any) => allUrls.push(...extractUrls(br)))
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

  async _download_media_logic(media: any, options: any = {}): Promise<any> {
    const { toastTarget = null, toast = null, toastPrefix = "", alertOnFail = true, addHistory = true } = options
    if (!media) {
      if (alertOnFail) alert("[dy-dl]无当前媒体信息")
      return { ok: false, reason: "missing_media" }
    }
    const { video, images } = media
    const filename_base = this._build_filename(media)
    const isAlbum = Array.isArray(images) && images.length > 0
    const total = isAlbum ? images.length : 1
    const scopedToast = toast || createToast(toastTarget, 5000)
    const toastUpdate = (msg: string, dur = 5000) => {
      const p = toastPrefix ? toastPrefix + " " + msg : msg
      scopedToast.update(p, dur)
    }

    if (isAlbum) {
      let downloadedCount = 0
      for (let idx = 0; idx < images.length; idx++) {
        toastUpdate("下载图集 (" + (idx + 1) + "/" + total + ")")
        const item = images[idx]
        const fn = filename_base + "_" + (idx + 1)
        if (item.video) {
          const urls = this._get_video_urls(item.video)
          if (urls.length > 0) {
            const ok = await this.downloader.download_file(urls[0], fn, urls, { silent: !alertOnFail, media })
            if (ok) downloadedCount++
          }
          continue
        }
        const img_urls = item.urlList?.filter(Boolean) || item.downloadUrlList?.filter(Boolean)
        if (img_urls?.length > 0) {
          const ok = await this.downloader.download_file(img_urls[0], fn, img_urls, { silent: !alertOnFail, media })
          if (ok) downloadedCount++
        }
      }
      toastUpdate("图集下载完成")
      if (downloadedCount === 0 && images.length > 0) {
        if (alertOnFail) alert("[dy-dl]图集下载失败")
        return { ok: false, reason: "no_valid_media" }
      }
      if (downloadedCount && addHistory) DownloadHistory.add(media)
      return { ok: downloadedCount > 0 }
    }

    toastUpdate("正在下载...")
    const video_urls = this._get_video_urls(video)
    if (video_urls.length > 0) {
      const ok = await this.downloader.download_file(video_urls[0], filename_base, video_urls, { silent: !alertOnFail, media })
      if (ok && addHistory) DownloadHistory.add(media)
      if (ok) {
        toastUpdate("下载完成")
        return { ok: true }
      }
    }
    if (alertOnFail) alert("[dy-dl]无法下载当前媒体")
    return { ok: false, reason: "no_valid_media" }
  }

  async _download_current_media_logic() {
    return this._download_media_logic(this.current_media, { toastTarget: document.querySelector(".dy-dl-video-btn"), alertOnFail: true, addHistory: true })
  }

  async download_thumb() {
    if (!this.current_media) {
      alert("[dy-dl]无当前媒体信息")
      return
    }
    const thumb = this.current_media.video.originCoverUrlList[1] || this.current_media.video.originCoverUrlList[0]
    this.downloader.download_file(thumb, "thumb_" + this._build_filename(this.current_media), [], { media: this.current_media })
  }

  async show_media_details() {
    if (!this.current_media) {
      alert("[dy-dl]无当前媒体信息")
      return
    }
    const modal = new Modal((_root, overlay) => {
      overlay.style.zIndex = "999999"
      if (document.fullscreenElement) document.fullscreenElement.appendChild(overlay)
    })
    modal.root.style.cssText = "width:800px;max-width:90vw;background:transparent;box-shadow:none;border-radius:8px;overflow:hidden"
    const filenameBase = this._build_filename(this.current_media)

    try {
      const { MediaDetailModalApp } = await import("../ui/MediaDetailModal")
      render(<MediaDetailModalApp media={this.current_media} filenameBase={filenameBase} />, modal.root)
    } catch (e) {
      console.error("[dy-dl] 媒体详情组件加载失败", e)
      modal.root.textContent = "组件加载失败，请刷新重试"
    }
  }

  async open_config_modal() {
    const modal = new Modal((_root, overlay) => {
      overlay.style.zIndex = "999999"
      if (document.fullscreenElement) document.fullscreenElement.appendChild(overlay)
    })
    modal.root.style.cssText = "width:650px;max-width:90vw;background:transparent;box-shadow:none;border-radius:8px;overflow:hidden"
    try {
      const { ConfigModalApp } = await import("../ui/ConfigModal")
      render(<ConfigModalApp config={Config.global} />, modal.root)
    } catch (e) {
      console.error("[dy-dl] 配置组件加载失败", e)
      modal.root.textContent = "组件加载失败"
    }
  }

  init() {
    this._start_detect_player_change()
  }
}
