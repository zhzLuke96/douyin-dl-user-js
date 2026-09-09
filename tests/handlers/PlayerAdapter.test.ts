import { describe, expect, it } from "vitest"
import { isNewPlayer, readPlayerMedia } from "../../src/handlers/PlayerAdapter"

const media = {
  awemeId: "123",
  video: { playApi: "https://example.com/a.mp4" },
  images: [],
}

describe("PlayerAdapter player media", () => {
  it("reads legacy xgplayer media from player.config.awemeInfo", () => {
    const player = { config: { awemeInfo: media } }
    expect(isNewPlayer(player)).toBe(false)
    expect(readPlayerMedia(player)).toBe(media)
  })

  it("reads new player media from plugin configs", () => {
    const player = {
      _config: { _config: { pluginsConfig: { WatchLaterPlugin: { awemeInfo: media }, Pip: { awemeInfo: { awemeId: "456", video: null } } } } },
    }
    expect(isNewPlayer(player)).toBe(true)
    expect(readPlayerMedia(player)).toBe(media)
  })

  it("ignores incomplete media nodes", () => {
    expect(readPlayerMedia({ config: { awemeInfo: { awemeId: "123" } } })).toBeNull()
    expect(readPlayerMedia(null)).toBeNull()
  })
})
