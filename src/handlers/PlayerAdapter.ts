// Player 版本适配层：
// - 老 xgplayer: player.config.awemeInfo / player.video / player.danmaku.main
// - 新 React player: player._config._config.pluginsConfig.*.awemeInfo

const NEW_PLAYER_MEDIA_PLUGINS = ["WatchLaterPlugin", "DanmakuPlugin", "PlayClaritySettingPlugin", "Pip"] as const

const ACTIVE_VIDEO_SELECTORS = [
  "#sliderVideo video",
  '[data-e2e="feed-active-video"] video',
  ".slider-video video",
  ".douyin-player-video-container video",
  ".xg-video-container video",
] as const

function hasMediaShape(media: any): boolean {
  if (!media || typeof media !== "object") return false
  const hasAwemeId = typeof media.awemeId === "string" || typeof media.awemeId === "number"
  return hasAwemeId && (!!media.video || Array.isArray(media.images))
}

function isVideoElement(value: any): value is HTMLVideoElement {
  try {
    return Boolean(value && (value.tagName === "VIDEO" || value.localName === "video"))
  } catch {
    return false
  }
}

export function getDouyinPlayer(): any {
  try {
    const isolated = (window as any).player
    if (isolated) return isolated
    return typeof unsafeWindow !== "undefined" ? (unsafeWindow as any).player : null
  } catch {
    return null
  }
}

export function isNewPlayer(player: any): boolean {
  return Boolean(player?._config?._config?.pluginsConfig)
}

export function readPlayerMedia(player: any): any | null {
  if (!player) return null

  try {
    const pluginsConfig = player?._config?._config?.pluginsConfig
    if (pluginsConfig && typeof pluginsConfig === "object") {
      for (const key of NEW_PLAYER_MEDIA_PLUGINS) {
        const awemeInfo = pluginsConfig[key]?.awemeInfo
        if (hasMediaShape(awemeInfo)) return awemeInfo
      }
    }

    if (hasMediaShape(player?.config?.awemeInfo)) return player.config.awemeInfo
    if (hasMediaShape(player?.controls?.playerConfig?.awemeInfo)) return player.controls.playerConfig.awemeInfo
  } catch {
    return null
  }
  return null
}

export function readPlayerVideoElement(player: any): HTMLVideoElement | null {
  try {
    const directCandidates = [player?.video, player?.controls?.video, player?._video, player?._core?._media]
    for (const candidate of directCandidates) {
      if (isVideoElement(candidate)) return candidate
    }
  } catch {
    // Player 内部很多 Proxy，读取某个字段抛错时退回 DOM 查询
  }

  for (const selector of ACTIVE_VIDEO_SELECTORS) {
    const video = document.querySelector<HTMLVideoElement>(selector)
    if (video) return video
  }
  return document.querySelector<HTMLVideoElement>("video")
}

export function readPlayerVideoSize(player: any): { width: number; height: number } | null {
  const media = readPlayerMedia(player)
  const video = media?.video
  if (video?.width && video?.height) return { width: video.width, height: video.height }
  const videoEl = readPlayerVideoElement(player)
  if (videoEl?.videoWidth && videoEl?.videoHeight) return { width: videoEl.videoWidth, height: videoEl.videoHeight }
  return null
}

export function subscribePlayer(player: any, handler: () => void): () => void {
  try {
    if (!player || typeof player.on !== "function") return () => {}

    const on = player.on.bind(player)
    const off = typeof player.off === "function" ? player.off.bind(player) : typeof player.removeListener === "function" ? player.removeListener.bind(player) : null

    const events = ["play", "seeked"] as const
    for (const event of events) {
      try {
        on(event, handler)
      } catch {
        // 新版事件注册表未稳定，轮询仍会兜底
      }
    }
    return () => {
      if (!off) return
      for (const event of events) off(event, handler)
    }
  } catch {
    return () => {}
  }
}
