import { describe, expect, it } from "vitest"
import { normalizeBasename, normalizeFilename, normalizePathSegment } from "../../src/utils/string"

const WINDOWS_ILLEGAL_CHARS = ["<", ">", ":", '"', "/", "\\", "|", "?", "*"] as const

describe("normalizeFilename Windows rules", () => {
  it.each(WINDOWS_ILLEGAL_CHARS)("replaces illegal char %s with underscore", (char) => {
    expect(normalizeFilename(`a${char}b.mp4`)).toBe("a_b.mp4")
  })

  it("handles all Windows forbidden characters in one name", () => {
    expect(normalizeFilename('a<b>c:d"e/f\\g|h?i*j.mp4')).toBe("a_b_c_d_e_f_g_h_i_j.mp4")
  })

  it("replaces control characters 0x00-0x1F and DEL", () => {
    for (let code = 0; code <= 0x1f; code++) {
      expect(normalizeFilename(`a${String.fromCharCode(code)}b.mp4`)).toBe("a_b.mp4")
    }
    expect(normalizeFilename("a\u007fb.mp4")).toBe("a_b.mp4")
  })

  it("prefixes reserved device names with and without extensions", () => {
    const reserved = ["CON", "PRN", "AUX", "NUL"]
    for (let index = 1; index <= 9; index++) {
      reserved.push(`COM${index}`, `LPT${index}`)
    }
    for (const name of reserved) {
      expect(normalizeFilename(name)).toBe(`_${name}`)
      expect(normalizeFilename(`${name}.mp4`)).toBe(`_${name}.mp4`)
      expect(normalizeFilename(name.toLowerCase())).toBe(`_${name.toLowerCase()}`)
    }
  })

  it("never ends with a dot or space", () => {
    expect(normalizeFilename("foo. ")).toBe("foo")
    expect(normalizeFilename("CON. ")).toBe("_CON")
    for (const value of ["foo.", "foo ", "foo. ", "foo..", "foo. ."]) {
      expect(normalizeFilename(value)).not.toMatch(/[.\s]$/)
    }
  })

  it("does not allow path separators or traversal to escape the segment", () => {
    for (const value of ["../../evil?.mp4", "..\\evil.mp4", "/etc/passwd", "C:\\Windows\\system32\\evil.exe"]) {
      const normalized = normalizeFilename(value)
      expect(normalized).not.toContain("/")
      expect(normalized).not.toContain("\\")
      expect(normalized).not.toContain("?")
    }
  })

  it("cleans extensions too", () => {
    expect(normalizeFilename("foo.mp?4")).toBe("foo.mp_4")
  })

  it("merges consecutive replacement underscores to save length", () => {
    expect(normalizeFilename("a??b.mp4")).toBe("a_b.mp4")
    expect(normalizeFilename("a<><>b.mp4")).toBe("a_b.mp4")
    expect(normalizeBasename("a..??b")).toBe("a_b")
    expect(normalizePathSegment("a??b")).toBe("a_b")
  })

  it("limits the complete filename to maxLength including extension", () => {
    const normalized = normalizeFilename("a".repeat(300) + ".mp4")
    expect(normalized.length).toBeLessThanOrEqual(255)
    expect(normalized.endsWith(".mp4")).toBe(true)
  })

  it("returns a safe fallback for empty input", () => {
    expect(normalizeFilename("")).toBe("file")
  })
})

describe("normalizeBasename", () => {
  it("replaces dots so the name is treated as a basename", () => {
    expect(normalizeBasename("author.name")).toBe("author_name")
    expect(normalizeBasename("a.b.c")).toBe("a_b_c")
  })

  it("respects maxLength", () => {
    expect(normalizeBasename("a".repeat(64), { maxLength: 64 })).toBe("a".repeat(64))
    expect(normalizeBasename("a".repeat(65), { maxLength: 64 })).toBe("a".repeat(64))
  })

  it("does not cut a surrogate pair when truncating", () => {
    const value = "a".repeat(63) + "😀"
    expect(normalizeBasename(value, { maxLength: 64 })).toBe("a".repeat(63))
    expect(normalizeBasename(value, { maxLength: 65 })).toBe(value)
  })

  it("handles reserved names and illegal characters", () => {
    expect(normalizeBasename("CON")).toBe("_CON")
    expect(normalizeBasename("a?b")).toBe("a_b")
    expect(normalizeBasename("a\u0000b")).toBe("a_b")
  })

  it("returns a safe fallback for invalid input", () => {
    expect(normalizeBasename(null)).toBe("file")
    expect(normalizeBasename(undefined)).toBe("file")
  })
})

describe("normalizePathSegment", () => {
  it("rejects empty and traversal-only path segments", () => {
    expect(normalizePathSegment(".")).toBe("file")
    expect(normalizePathSegment("..")).toBe("file")
  })

  it("removes path separators and illegal characters", () => {
    expect(normalizePathSegment("user/name?")).toBe("user_name_")
    expect(normalizePathSegment("user\\name?")).toBe("user_name_")
  })

  it("keeps internal dots while still handling reserved names", () => {
    expect(normalizePathSegment("CON.foo")).toBe("_CON.foo")
    expect(normalizePathSegment("123.author")).toBe("123.author")
  })

  it("does not end with a dot or space", () => {
    for (const value of ["foo.", "foo ", "foo. "]) {
      expect(normalizePathSegment(value)).not.toMatch(/[.\s]$/)
    }
  })
})
