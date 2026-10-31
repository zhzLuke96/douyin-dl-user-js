import { render } from "preact"
import { FloatingPanelApp } from "./FloatingPanelUI"
import type { ProfileDataService } from "../handlers/profile/ProfileDataService"
import type { ProfileDownloadManager } from "../handlers/profile/ProfileDownloadManager"

const PANEL_HIDE_STYLE_ID = "dy-dl-floating-panel-hide-style"

// 详情弹层打开时隐藏浮动面板，避免遮挡播放器。
// #sliderVideo 仅在详情弹层存在，主页普通态与卡片悬停预览态均不命中。
const PANEL_HIDE_CSS = "body:has(#sliderVideo video) #dy-dl-floating-panel { display: none; }"

export class FloatingPanel {
  private root: HTMLElement | null = null
  mounted = false

  // 挂载浮动面板到 DOM
  mount({ dataService, downloadManager, onOpenSettings }: { dataService: ProfileDataService; downloadManager: ProfileDownloadManager; onOpenSettings?: () => void }) {
    this.injectVisibilityStyle()
    this.root = document.createElement("div")
    this.root.id = "dy-dl-floating-panel"
    document.body.appendChild(this.root)
    this.mounted = true
    try {
      render(<FloatingPanelApp dataService={dataService} downloadManager={downloadManager} onOpenSettings={onOpenSettings} />, this.root)
    } catch (e) {
      console.error("[dy-dl] FloatingPanelUI 加载失败", e)
    }
  }

  // 注入面板隐藏规则，重复挂载时不会叠加
  private injectVisibilityStyle() {
    if (document.getElementById(PANEL_HIDE_STYLE_ID)) return
    const style = document.createElement("style")
    style.id = PANEL_HIDE_STYLE_ID
    style.textContent = PANEL_HIDE_CSS
    document.head.appendChild(style)
  }

  // 卸载浮动面板
  unmount() {
    if (this.root && this.mounted) {
      render(null, this.root)
      this.root.remove()
      this.root = null
      this.mounted = false
    }
  }
}
