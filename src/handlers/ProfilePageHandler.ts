import { FloatingPanel } from "../ui/FloatingPanel"
import { ProfileDataService } from "./ProfileDataService"
import { ProfileDownloadManager } from "./ProfileDownloadManager"
import type { MediaHandler } from "./MediaHandler"

export class ProfilePageHandler {
  dataService: ProfileDataService
  downloadManager: ProfileDownloadManager
  private panel: FloatingPanel | null = null

  constructor({ mediaHandler }: { mediaHandler: MediaHandler }) {
    this.dataService = new ProfileDataService()
    this.downloadManager = new ProfileDownloadManager({ mediaHandler, dataService: this.dataService })
  }

  mount_ui() {
    if (this.panel) return
    this.panel = new FloatingPanel()
    this.panel.mount({ dataService: this.dataService, downloadManager: this.downloadManager })
  }
}
