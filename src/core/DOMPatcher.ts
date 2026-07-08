import { Config } from "./Config"
import { TooltipsButton } from "../ui/TooltipsButton"
import { ProfileDataService } from "../handlers/ProfileDataService"
import type { Downloader } from "./Downloader"
import type { MediaHandler } from "../handlers/MediaHandler"
import type { VideoHandler } from "../handlers/VideoHandler"
import type { DanmakuHandler } from "../handlers/DanmakuHandler"
import type { ProfilePageHandler } from "../handlers/ProfilePageHandler"

export class DOMPatcher {
  downloader: Downloader
  mediaHandler: MediaHandler
  videoHandler: VideoHandler
  danmakuHandler: DanmakuHandler
  profilePageHandler: ProfilePageHandler
  private observer: MutationObserver
  feed_card_selector_cls = "dy-dl-feed-selector"

  constructor(options: { downloader: Downloader; mediaHandler: MediaHandler; videoHandler: VideoHandler; danmakuHandler: DanmakuHandler; profilePageHandler: ProfilePageHandler }) {
    this.downloader = options.downloader
    this.mediaHandler = options.mediaHandler
    this.videoHandler = options.videoHandler
    this.danmakuHandler = options.danmakuHandler
    this.profilePageHandler = options.profilePageHandler
    this.observer = new MutationObserver(this._handleMutations.bind(this))
    Config.global.events.on("config_change", this._on_config_change.bind(this))
  }

  static render_html(html: string): HTMLElement {
    const div = document.createElement("div")
    div.innerHTML = html.trim()
    return div.children[0] as HTMLElement
  }

  private _on_config_change() {
    this._sync_feed_cards()
  }

  private _sync_feed_cards() {
    document.body.querySelectorAll(ProfileDataService.FEED_CARD_SELECTOR).forEach((card) => this._handleProfileCard(card as HTMLElement))
  }

  private _handleMutations(mutations: MutationRecord[]) {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return
        const el = node as HTMLElement
        if (el.classList.contains("semi-portal")) {
          const tn = el.querySelector(".semi-tooltip-wrapper")
          if (tn) {
            setTimeout(() => this._handleTooltip(tn as HTMLElement))
            return
          }
        }
        if (el.parentElement === document.body && el.classList.length === 0) {
          setTimeout(() => this._handleModal(el))
          return
        }
        if (el.localName === "xg-controls" || el.querySelector("xg-controls")) {
          this._handleXgControl(el)
          return
        }
        if (el.matches(ProfileDataService.FEED_CARD_SELECTOR)) {
          this._handleProfileCard(el)
          return
        }
        if (el.localName === "li") {
          Array.from(el.querySelectorAll(ProfileDataService.FEED_CARD_SELECTOR)).forEach((dom) => this._handleProfileCard(dom as HTMLElement))
        }
      })
    })
  }

  private _handleModal(modalNode: HTMLElement) {
    const close_icon = modalNode.querySelector("#svg_icon_ic_close")
    const img = modalNode.querySelector("img")
    const container = img?.closest(`div[style*="transform: scale(1)"] > div`) || img?.parentElement
    if (!close_icon || !img || !container) return
    if (container.querySelector(".dy-dl-modal-btn")) return
    const btn = document.createElement("div")
    btn.textContent = "下载图片"
    btn.className = "LV01TNDE dy-dl-modal-btn"
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      this.downloader.download_file(img!.src, "douyin_image")
    })
    Object.assign(btn.style, {
      position: "absolute",
      bottom: "35px",
      right: "35px",
      color: "#fff",
      backgroundColor: "rgba(0,0,0,0.5)",
      padding: "5px 10px",
      borderRadius: "4px",
      fontSize: "16px",
      zIndex: "999999",
      cursor: "pointer",
    })
    container.appendChild(btn)
  }

  private _handleTooltip(tooltipNode: HTMLElement) {
    const tc = tooltipNode.querySelector(".semi-tooltip-content") as HTMLElement
    if (!tc || !tc.textContent?.includes("添加到表情")) return
    const imgNode = DOMPatcher.render_html(tooltipNode.outerHTML).querySelector("img")
    if (!imgNode?.src) return
    const existing = tc.querySelector(".download-button")
    if (existing) return
    const btn = document.createElement("div")
    btn.textContent = "下载表情包"
    btn.className = "LV01TNDE download-button"
    btn.style.cssText = "cursor: pointer; padding-top: 4px;"
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      this.downloader.download_file(imgNode!.src, "douyin_emoticon")
    })
    tc.appendChild(btn)
  }

  private _handleXgControl(xgNode: HTMLElement) {
    const right_grid = xgNode.querySelector(".xg-right-grid") as HTMLElement
    if (!right_grid) return
    if (right_grid.querySelector(".dy-dl-video-btn")) return
    const btn = new TooltipsButton(
      "插件",
      [
        { html: `<div class="xgTips item"><span>快捷键：</span><span class="shortcutKey">M</span>` },
        { label: "需求/反馈", callback: () => window.open("https://github.com/zhzLuke96/douyin-dl-user-js/issues", "_blank", "noopener,noreferrer") },
        { label: "设置", callback: () => this.mediaHandler.open_config_modal() },
        { label: "媒体详情", callback: () => this.mediaHandler.show_media_details() },
        {
          label: "下载弹幕",
          callback: () => {
            if (!this.mediaHandler.player) {
              alert("当前没有播放器实例")
              return
            }
            if (!this.mediaHandler.current_media) {
              alert("当前没有媒体实例")
              return
            }
            const content = this.danmakuHandler.getDanmakuAssFileContent(this.mediaHandler.player)
            if (content) {
              const fn = this.mediaHandler._build_filename(this.mediaHandler.current_media)
              this.downloader.download_blob(new Blob([content], { type: "text/plain" }), fn + ".ass")
            }
          },
        },
        { label: "复制视频帧", callback: () => this.videoHandler.copy_current_frame() },
        { label: "下载视频帧", callback: () => this.videoHandler.download_current_frame() },
        { label: "下载", callback: () => this.mediaHandler.download_current_media() },
      ],
      () => {},
    )
    const db = btn.render()
    const qs = right_grid.querySelector(".xgplayer-quality-setting")
    const vc = right_grid.querySelector(".xgplayer-volume")
    if (qs) right_grid.insertBefore(db, qs)
    else if (vc) right_grid.insertBefore(db, vc)
    else right_grid.appendChild(db)
  }

  private _handleProfileCard(card: HTMLElement) {
    const dom = card.querySelector("." + this.feed_card_selector_cls) as HTMLElement
    if (!Config.global.features.enable_profile_downloader) {
      dom?.remove()
      return
    } else if (dom) return
    const media = this.profilePageHandler.dataService._extractFeedMedia(card)
    const { awemeId } = media || {}
    if (!awemeId) return
    const pos = window.getComputedStyle(card).position
    if (!pos || pos === "static") card.style.position = "relative"
    const badge = document.createElement("label")
    badge.className = this.feed_card_selector_cls
    Object.assign(badge.style, {
      position: "absolute",
      top: "10px",
      left: "10px",
      zIndex: "5",
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 10px",
      borderRadius: "999px",
      background: "rgba(0,0,0,0.55)",
      border: "1px solid rgba(255,255,255,0.25)",
      color: "#fff",
      fontSize: "12px",
      fontFamily: "sans-serif",
      cursor: "pointer",
      userSelect: "none",
    })
    const cb = document.createElement("input")
    cb.type = "checkbox"
    cb.className = "dy-dl-feed-checkbox"
    cb.style.cssText = "margin: 0; cursor: pointer;"
    cb.checked = this.profilePageHandler.downloadManager._isFeedSelected(awemeId)
    const label = document.createElement("span")
    label.className = "dy-dl-feed-select-label"
    label.textContent = "选择"
    const stop = (ev: Event) => ev.stopPropagation()
    ;["click", "mousedown", "mouseup", "touchstart"].forEach((n) => badge.addEventListener(n, stop))
    cb.addEventListener("change", (ev) => {
      ev.stopPropagation()
      this.profilePageHandler.downloadManager.markSelect(awemeId, cb.checked)
    })
    badge.append(cb, label)
    card.appendChild(badge)
    const off = this.profilePageHandler.downloadManager.on("countsUpdated", () => {
      if (!badge.parentElement) {
        off()
        return
      }
      cb.checked = this.profilePageHandler.downloadManager._isFeedSelected(awemeId)
    })
  }

  startObserving() {
    this.observer.observe(document.body, { childList: true, subtree: true })
    document.querySelectorAll("xg-controls").forEach((c) => this._handleXgControl(c as HTMLElement))
  }
}
