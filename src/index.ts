// douyin-dl-user-js 入口
import { Downloader } from "./core/Downloader"
import { DOMPatcher } from "./core/DOMPatcher"
import { HotkeyManager } from "./core/HotkeyManager"
import { MediaHandler } from "./handlers/MediaHandler"
import { VideoHandler } from "./handlers/VideoHandler"
import { DanmakuHandler } from "./handlers/DanmakuHandler"
import { ProfilePageHandler } from "./handlers/ProfilePageHandler"

const downloader = new Downloader()
const mediaHandler = new MediaHandler(downloader)
const videoHandler = new VideoHandler()
const danmakuHandler = new DanmakuHandler()
const profilePageHandler = new ProfilePageHandler({ mediaHandler })
const domPatcher = new DOMPatcher({
  downloader,
  mediaHandler,
  videoHandler,
  danmakuHandler,
  profilePageHandler,
})
const hotkeyManager = new HotkeyManager()

mediaHandler.init()
domPatcher.startObserving()
profilePageHandler.mount_ui()

hotkeyManager.addHotkey("m", () => mediaHandler.download_current_media())

console.log("[dy-dl]已启动")
