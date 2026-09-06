/**
 * 规范化最终保存的文件名，处理 Windows 禁字符、控制字符、保留名与长度。
 * 输入应为不含路径的文件名，可以是带扩展名的完整文件名。
 */
export interface NormalizeFilenameOptions {
  replacementChar?: string
  maxLength?: number
}

const ILLEGAL_FILENAME_CHARS = /[\\/:*?"<>|\x00-\x1f\x7f]/g
const RESERVED_NAMES = /^(CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(\..*)?$/i
const DEFAULT_MAX_LENGTH = 255
const DEFAULT_FALLBACK = "file"

function getReplacementChar(value?: string): string {
  if (typeof value !== "string" || value.length !== 1) return "_"
  if (/[\\/:*?"<>|\x00-\x1f\x7f]/.test(value)) return "_"
  return value
}

function getMaxLength(value?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return DEFAULT_MAX_LENGTH
  return Math.floor(value)
}

function truncateUtf16(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  let result = ""
  for (const char of value) {
    if (result.length + char.length > maxLength) break
    result += char
  }
  return result
}

function escapeRegExp(value: string): string {
  let result = ""
  for (const char of value) {
    if ("\\^$.*+?()[]{}|".includes(char)) result += "\\"
    result += char
  }
  return result
}

interface CleanSegmentOptions {
  replacementChar: string
  replaceDots: boolean
  allowReserved: boolean
  maxLength: number
}

function cleanSegment(value: string, options: CleanSegmentOptions): string {
  let clean = value.replace(ILLEGAL_FILENAME_CHARS, options.replacementChar)
  if (options.replaceDots) clean = clean.replace(/\./g, options.replacementChar)
  clean = clean
    .trim()
    .replace(/^\.+/, "")
    .replace(/[.\s]+$/, "")
  if (!clean || clean === "." || clean === "..") clean = DEFAULT_FALLBACK
  if (options.allowReserved && RESERVED_NAMES.test(clean)) clean = options.replacementChar + clean
  clean = clean.replace(new RegExp(`${escapeRegExp(options.replacementChar)}{2,}`, "g"), options.replacementChar)
  clean = truncateUtf16(clean, options.maxLength)
  if (!clean) clean = truncateUtf16(DEFAULT_FALLBACK, options.maxLength)
  return clean
}

function normalizeOptions(options: NormalizeFilenameOptions): { replacementChar: string; maxLength: number } {
  return {
    replacementChar: getReplacementChar(options.replacementChar),
    maxLength: getMaxLength(options.maxLength),
  }
}

/**
 * 规范化完整文件名。最后一个点之后被视为扩展名，扩展名同样会清洗。
 */
export function normalizeFilename(name: unknown, options: NormalizeFilenameOptions = {}): string {
  const { replacementChar, maxLength } = normalizeOptions(options)
  const raw = typeof name === "string" ? name : ""
  const lastDotIndex = raw.lastIndexOf(".")
  const possibleExt = lastDotIndex > 0 && lastDotIndex < raw.length - 1 ? raw.slice(lastDotIndex + 1) : ""
  const hasExtension = /[^\s.]/.test(possibleExt)
  const rawBase = hasExtension ? raw.slice(0, lastDotIndex) : raw
  const rawExt = hasExtension ? possibleExt : ""

  const cleanExt = rawExt ? cleanSegment(rawExt, { replacementChar, replaceDots: false, allowReserved: false, maxLength }) : ""
  const cleanBase = cleanSegment(rawBase, {
    replacementChar,
    replaceDots: false,
    allowReserved: true,
    maxLength: Math.max(1, maxLength - (cleanExt ? cleanExt.length + 1 : 0)),
  })

  if (!cleanBase && !cleanExt) return DEFAULT_FALLBACK
  if (!cleanExt) return cleanBase
  if (!cleanBase) return "." + cleanExt
  return `${cleanBase}.${cleanExt}`
}

/**
 * 规范化不带扩展名的文件名，并把其中的点一并处理，避免后续拼接扩展名时误判。
 */
export function normalizeBasename(name: unknown, options: NormalizeFilenameOptions = {}): string {
  const { replacementChar, maxLength } = normalizeOptions(options)
  const raw = typeof name === "string" ? name : ""
  return cleanSegment(raw, { replacementChar, replaceDots: true, allowReserved: true, maxLength })
}

/**
 * 规范化单个路径分段，用于作者目录等只应包含一段路径的值。
 */
export function normalizePathSegment(name: unknown, options: NormalizeFilenameOptions = {}): string {
  const { replacementChar, maxLength } = normalizeOptions(options)
  const raw = typeof name === "string" ? name : ""
  return cleanSegment(raw, { replacementChar, replaceDots: false, allowReserved: true, maxLength })
}

/**
 * 判断是否为作者主页路径
 */
export function isProfilePagePath(pathname = location.pathname): boolean {
  const segments = pathname.split("/").filter(Boolean)
  return segments.length === 2 && segments[0] === "user"
}
