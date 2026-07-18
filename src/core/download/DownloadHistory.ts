import type { MediaLite } from "../../types/lite"

export class DownloadHistory {
  static STORAGE_KEY = "__douyin-dl-history__"
  static MAX_ITEMS = 50 // 最多保存50条记录

  static get(): any[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  static add(media: MediaLite, downloadTime = Date.now()) {
    const history = this.get()
    const record = {
      id: media.awemeId || `hist_${Date.now()}_${Math.random()}`,
      desc: media.desc || "(无描述)",
      shareUrl: media.shareInfo?.shareUrl || "",
      downloadTime,
      media: {
        // 只保存必要字段，避免存储过大
        awemeId: media.awemeId,
        desc: media.desc,
        shareUrl: media.shareInfo?.shareUrl,
        authorNickname: media.authorInfo?.nickname,
        // 可额外保存封面等，但注意localStorage容量限制
      },
    }
    history.unshift(record) // 最新在前
    if (history.length > this.MAX_ITEMS) history.pop()
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history))
    return record
  }

  static clear() {
    localStorage.removeItem(this.STORAGE_KEY)
  }
}
