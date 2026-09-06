import { describe, expect, it } from "vitest"
import { DownloaderLauncher } from "../../../src/core/download/DownloaderLauncher"

const link = "https://example.com/video"

describe("DownloaderLauncher command filenames", () => {
  it("uses a normalized filename in curl output", () => {
    const command = DownloaderLauncher.toCurlCommand(link, "bad?name.mp4")
    expect(command).toBe(`curl -L -C - "${link}" -o "bad_name.mp4"`)
  })

  it("uses a normalized filename in aria2 output", () => {
    const launcher = new DownloaderLauncher()
    const command = launcher.getAria2Command(link, 'bad"name.mp4')
    expect(command).toBe(`aria2c "${link}" --out "bad_name.mp4"`)
  })

  it("removes shell-sensitive characters after filename normalization", () => {
    const command = DownloaderLauncher.toCurlCommand(link, "bad!&`name.mp4")
    expect(command).toBe(`curl -L -C - "${link}" -o "bad___name.mp4"`)
  })
})
