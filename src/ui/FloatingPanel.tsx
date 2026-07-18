import { render } from "preact"
import { FloatingPanelApp } from "./FloatingPanelUI"
import type { ProfileDataService } from "../handlers/profile/ProfileDataService"
import type { ProfileDownloadManager } from "../handlers/profile/ProfileDownloadManager"

export class FloatingPanel {
  private root: HTMLElement | null = null
  mounted = false

  // 挂载浮动面板到 DOM
  mount({ dataService, downloadManager, onOpenSettings }: { dataService: ProfileDataService; downloadManager: ProfileDownloadManager; onOpenSettings?: () => void }) {
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
