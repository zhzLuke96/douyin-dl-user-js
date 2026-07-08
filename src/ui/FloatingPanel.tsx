import { render } from "preact"
import { FloatingPanelApp } from "./FloatingPanelUI"
import type { ProfileDataService } from "../handlers/ProfileDataService"
import type { ProfileDownloadManager } from "../handlers/ProfileDownloadManager"

export class FloatingPanel {
  private root: HTMLElement | null = null
  mounted = false

  mount({ dataService, downloadManager }: { dataService: ProfileDataService; downloadManager: ProfileDownloadManager }) {
    this.root = document.createElement("div")
    this.root.id = "dy-dl-floating-panel"
    document.body.appendChild(this.root)
    this.mounted = true
    try {
      render(<FloatingPanelApp dataService={dataService} downloadManager={downloadManager} />, this.root)
    } catch (e) {
      console.error("[dy-dl] FloatingPanelUI 加载失败", e)
    }
  }

  unmount() {
    if (this.root && this.mounted) {
      render(null, this.root)
      this.root.remove()
      this.root = null
      this.mounted = false
    }
  }
}
