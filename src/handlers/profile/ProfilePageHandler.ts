import { FloatingPanel } from "../../ui/FloatingPanel"
import { ProfileDataService } from "./ProfileDataService"
import { ProfileDownloadManager } from "./ProfileDownloadManager"
import type { MediaHandler } from "../MediaHandler"

export class ProfilePageHandler {
  dataService: ProfileDataService
  downloadManager: ProfileDownloadManager
  private mediaHandler: MediaHandler
  private panel: FloatingPanel | null = null

  constructor({ mediaHandler }: { mediaHandler: MediaHandler }) {
    this.mediaHandler = mediaHandler
    this.dataService = new ProfileDataService()
    this.downloadManager = new ProfileDownloadManager({ mediaHandler, dataService: this.dataService })
    this.watchPageChanges()
  }

  private watchPageChanges() {
    let lastHref = location.href
    setInterval(() => {
      if (location.href === lastHref) return
      lastHref = location.href
      this.downloadManager.syncPageState()
    }, 500)
  }

  mount_ui() {
    if (this.panel) return
    this.panel = new FloatingPanel()
    this.panel.mount({ dataService: this.dataService, downloadManager: this.downloadManager, onOpenSettings: () => this.mediaHandler.open_config_modal() })
  }
}
