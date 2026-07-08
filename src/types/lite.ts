// 轻量类型 — 仅含代码实际使用的字段，避免引用 3840 行 douyin.ts

export interface PlayerInstanceLite {
  config?: {
    awemeInfo?: any
  }
  danmaku?: {
    main?: {
      data?: Array<{ content?: string; time?: number; [key: string]: any }>
    }
  }
  sizeInfo?: {
    width?: number
    height?: number
  }
  video?: HTMLVideoElement
  on?(event: string, handler: Function): void
}

export interface MediaLite {
  awemeId?: string
  desc?: string
  groupId?: string
  isPrivate?: boolean
  createTime?: number
  authorUserId?: string
  authorInfo?: {
    uid?: string
    secUid?: string
    nickname?: string
    avatarThumb?: { urlList?: string[] }
    customVerify?: string
    enterpriseVerifyReason?: string
    followerCount?: number
    totalFavorited?: number
  }
  video?: {
    bitRateList?: Array<{
      gearName?: string
      width?: number
      height?: number
      isH265?: number
      format?: string
      fps?: number
      bitRate?: number
      dataSize?: number
      playApi?: string
      playAddr?: Array<{ src: string }>
    }>
    playApi?: string
    playApiH265?: string
    originCoverUrlList?: string[]
    width?: number
    height?: number
  }
  images?: Array<{
    video?: any
    urlList?: string[]
    downloadUrlList?: string[]
    width?: number
    height?: number
  }>
  music?: {
    musicName?: string
    title?: string
    author?: string
    duration?: number
    coverThumb?: { urlList?: string[] }
    playUrl?: { urlList?: string[] }
  }
  shareInfo?: { shareUrl?: string }
  stats?: {
    diggCount?: number
    commentCount?: number
    collectCount?: number
    shareCount?: number
  }
  awemeControl?: {
    canComment?: boolean
    canShare?: boolean
  }
  download?: { allowDownload?: boolean }
  textExtra?: Array<{ hashtagName?: string }>
}
