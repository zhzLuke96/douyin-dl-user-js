import { isProfilePagePath } from "../utils/string"

export class ProfileDataService {
  static FEED_CARD_SELECTOR = '.waterfall-videoCardContainer[href], [href*="/video/"][target="_blank"], [href*="/note/"][target="_blank"]'

  feedMediaCache = new Map<string, any>()

  static findReactFiber(node: HTMLElement): any {
    let current: HTMLElement | null = node
    while (current) {
      const fiberKey = Object.keys(current).find((key) => key.startsWith("__reactFiber$"))
      if (fiberKey) return (current as any)[fiberKey]
      current = current.parentElement
    }
    return null
  }

  static getAwemeIdFromHref(href = ""): string {
    const match = href.match(/\/(?:video|note)\/(\d+)/)
    return match?.[1] || ""
  }

  _extractFeedMedia(card: HTMLElement): any {
    let fiber = ProfileDataService.findReactFiber(card)
    while (fiber) {
      const props = fiber.memoizedProps
      const candidate = props?.awemeInfo || props?.itemInfo?.awemeInfo || (props?.itemInfo?.awemeId ? props.itemInfo : null)
      if (candidate?.awemeId) {
        this.feedMediaCache.set(candidate.awemeId, candidate)
        return candidate
      }
      fiber = fiber.return
    }
    const awemeId = ProfileDataService.getAwemeIdFromHref(card.getAttribute("href") || "")
    return awemeId ? this.feedMediaCache.get(awemeId) || null : null
  }

  collectCurrentFeedMedia(): any[] {
    const medias: any[] = []
    const seen = new Set<string>()
    document.querySelectorAll(ProfileDataService.FEED_CARD_SELECTOR).forEach((card) => {
      const media = this._extractFeedMedia(card as HTMLElement)
      if (!media?.awemeId || seen.has(media.awemeId)) return
      seen.add(media.awemeId)
      this.feedMediaCache.set(media.awemeId, media)
      medias.push(media)
    })
    return medias
  }

  isProfilePage(): boolean {
    return isProfilePagePath()
  }

  getProfileContext(): { secUid: string; profileName: string; tabKey: string; profileKey: string } | null {
    if (!this.isProfilePage()) return null
    const pathSecUid = location.pathname.replace(/^\/user\//, "").trim()
    const scannedMedia = this.collectCurrentFeedMedia().find((m) => m?.authorInfo?.secUid)
    const secUid = pathSecUid && pathSecUid !== "self" ? pathSecUid : scannedMedia?.authorInfo?.secUid || pathSecUid || ""
    const titleName = document.title.split("的抖音")[0]?.trim() || ""
    const profileName = scannedMedia?.authorInfo?.nickname || titleName
    const activeTab = new URLSearchParams(location.search).get("showTab") || "post"
    const profileKey = secUid || "self" + ":" + activeTab
    return { secUid, profileName, tabKey: activeTab, profileKey }
  }

  _findScrollContainer(): HTMLElement {
    const firstCard = document.querySelector(ProfileDataService.FEED_CARD_SELECTOR)
    let current = firstCard instanceof HTMLElement ? firstCard.parentElement : null
    while (current instanceof HTMLElement) {
      const style = window.getComputedStyle(current)
      const isScrollable = ["auto", "scroll", "overlay"].includes(style.overflowY) && current.scrollHeight > current.clientHeight + 100
      if (isScrollable) return current
      current = current.parentElement
    }
    return (
      (document.querySelector(".route-scroll-container") as HTMLElement) ||
      (document.querySelector(".parent-route-container") as HTMLElement) ||
      (document.scrollingElement as HTMLElement) ||
      document.documentElement
    )
  }

  async scrollPageOnce(): Promise<boolean> {
    const container = this._findScrollContainer()
    if (!container) return false
    const isDoc = container === document.body || container === document.documentElement || container === document.scrollingElement
    const beforeTop = isDoc ? window.scrollY : container.scrollTop
    const clientHeight = isDoc ? window.innerHeight : container.clientHeight
    const scrollHeight = container.scrollHeight
    const maxTop = Math.max(0, scrollHeight - clientHeight)
    const nextTop = Math.min(beforeTop + Math.max(clientHeight * 0.85, 480), maxTop)
    if (nextTop <= beforeTop + 4) return false
    if (isDoc) window.scrollTo({ top: nextTop, behavior: "smooth" })
    else container.scrollTo({ top: nextTop, behavior: "smooth" })
    await new Promise((r) => setTimeout(r, 1200))
    return true
  }
}
