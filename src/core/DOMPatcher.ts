import { Config } from "./Config"
import { TooltipsButton } from "../ui/TooltipsButton"
import { ProfileDataService } from "../handlers/profile/ProfileDataService"
import type { Downloader } from "./download/Downloader"
import type { MediaHandler } from "../handlers/MediaHandler"
import type { VideoHandler } from "../handlers/VideoHandler"
import type { DanmakuHandler } from "../handlers/DanmakuHandler"
import type { ProfilePageHandler } from "../handlers/profile/ProfilePageHandler"

/**
 * DOM Patcher - 负责DOM监听、注入下载按钮及相关UI元素
 */
export class DOMPatcher {
  downloader: Downloader
  mediaHandler: MediaHandler
  videoHandler: VideoHandler
  danmakuHandler: DanmakuHandler
  profilePageHandler: ProfilePageHandler
  private observer: MutationObserver
  feed_card_selector_cls = "dy-dl-feed-selector"

  /**
   * @param options - 包含各处理器实例的配置对象
   */
  constructor(options: { downloader: Downloader; mediaHandler: MediaHandler; videoHandler: VideoHandler; danmakuHandler: DanmakuHandler; profilePageHandler: ProfilePageHandler }) {
    this.downloader = options.downloader
    this.mediaHandler = options.mediaHandler
    this.videoHandler = options.videoHandler
    this.danmakuHandler = options.danmakuHandler
    this.profilePageHandler = options.profilePageHandler
    this.observer = new MutationObserver(this._handleMutations.bind(this))
    Config.global.events.on("config_change", this._on_config_change.bind(this))
  }

  /**
   * 渲染 HTML 字符串为 DOM 元素
   */
  static render_html(html: string): HTMLElement {
    const div = document.createElement("div")
    div.innerHTML = html.trim()
    return div.children[0] as HTMLElement
  }

  /** 从节点向上遍历 DOM 树查找 img 元素 */
  static findImage(node: HTMLElement): HTMLImageElement | null {
    let img: HTMLImageElement | null
    let current: HTMLElement | null = node
    while (current) {
      img = current.querySelector("img")
      if (img) return img
      current = current.parentElement instanceof HTMLElement ? current.parentElement : null
    }
    return null
  }

  /** 配置变更时同步卡片选择器和快捷键提示 */
  private _on_config_change() {
    this._sync_shortcut_labels()
    this._sync_feed_cards()
  }

  /** 同步播放器菜单中的快捷键提示 */
  private _sync_shortcut_labels() {
    const label = this._shortcut_label()
    document.body.querySelectorAll(".dy-dl-video-btn .shortcutKey").forEach((el) => {
      el.textContent = label
    })
  }

  /** 当前下载快捷键展示文本 */
  private _shortcut_label(): string {
    const features = Config.global.features
    if (!features.enable_download_shortcut) return "已禁用"
    return features.download_shortcut?.trim() || "未设置"
  }

  /** 同步所有 feed 卡片的选择器状态 */
  private _sync_feed_cards() {
    document.body.querySelectorAll(ProfileDataService.FEED_CARD_SELECTOR).forEach((card) => this._handleProfileCard(card as HTMLElement))
  }

  /** 处理 DOM 变更 */
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

  /** 处理模态框，注入图片下载按钮 */
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

  /** 处理 Tooltip，注入表情下载按钮 */
  private _handleTooltip(tooltipNode: HTMLElement) {
    const tc = tooltipNode.querySelector(".semi-tooltip-content") as HTMLElement
    if (!tc || !tc.textContent?.includes("添加到表情")) return
    const imgNode = DOMPatcher.findImage(tooltipNode)
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

  /** 处理播放器控件，注入插件菜单 */
  private _handleXgControl(xgNode: HTMLElement) {
    const right_grid = xgNode.querySelector(".xg-right-grid") as HTMLElement
    if (!right_grid) return
    if (right_grid.querySelector(".dy-dl-video-btn")) return
    const btn = new TooltipsButton(
      "插件",
      [
        {
          render: () => {
            const item = document.createElement("div")
            item.className = "xgTips item"
            const label = document.createElement("span")
            label.textContent = "快捷键："
            const shortcut = document.createElement("span")
            shortcut.className = "shortcutKey"
            shortcut.textContent = this._shortcut_label()
            item.append(label, shortcut)
            return item
          },
        },
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

  /** 处理个人主页卡片，注入选择器 */
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

    const mask = document.createElement("div")
    mask.className = this.feed_card_selector_cls
    mask.setAttribute("role", "button")
    mask.setAttribute("aria-label", "切换视频选择")
    Object.assign(mask.style, {
      position: "absolute",
      inset: "0",
      zIndex: "10",
      cursor: "pointer",
      background: "transparent",
      userSelect: "none",
      touchAction: "manipulation",
    })

    const badge = document.createElement("div")
    Object.assign(badge.style, {
      position: "absolute",
      top: "10px",
      left: "10px",
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
      pointerEvents: "none",
      userSelect: "none",
    })
    const cb = document.createElement("input")
    cb.type = "checkbox"
    cb.className = "dy-dl-feed-checkbox"
    cb.style.cssText = "margin: 0; pointer-events: none;"
    const label = document.createElement("span")
    label.className = "dy-dl-feed-select-label"
    label.textContent = "选择"
    badge.append(cb, label)
    mask.append(badge)
    card.appendChild(mask)

    const renderState = (selected: boolean) => {
      cb.checked = selected
      mask.setAttribute("aria-pressed", selected ? "true" : "false")
      mask.style.boxShadow = selected ? "inset 0 0 0 2px rgba(64,150,255,0.75)" : "none"
    }

    const toggle = (ev: Event) => {
      ev.preventDefault()
      ev.stopPropagation()
      const selected = !this.profilePageHandler.downloadManager._isFeedSelected(awemeId)
      this.profilePageHandler.downloadManager.markSelect(awemeId, selected)
    }
    mask.addEventListener("click", toggle)
    mask.addEventListener("mousedown", (ev) => ev.stopPropagation())

    renderState(this.profilePageHandler.downloadManager._isFeedSelected(awemeId))
    const off = this.profilePageHandler.downloadManager.on("countsUpdated", () => {
      if (!mask.parentElement) {
        off()
        return
      }
      renderState(this.profilePageHandler.downloadManager._isFeedSelected(awemeId))
    })
  }

  /** 启动 DOM 观察 */
  startObserving() {
    this.observer.observe(document.body, { childList: true, subtree: true })
    document.querySelectorAll("xg-controls").forEach((c) => this._handleXgControl(c as HTMLElement))
  }
}
