// ========== Main Script Logic =============
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

mediaHandler.init() // Starts player detection
domPatcher.startObserving() // Starts DOM observation and initial scan
// 尝试注入 UI，可能放到 dom patcher 里面好点，但这样够了，要是没有就刷新就完事了
profilePageHandler.mount_ui()

// TODO: 支持自定义快捷键，没太想好怎么搞好点...
hotkeyManager.addHotkey("m", () => mediaHandler.download_current_media())

console.log("[dy-dl]已启动")
