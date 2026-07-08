export function normalizeFilename(name: string, options: { replacementChar?: string; maxLength?: number } = {}): string {
  const { replacementChar = "_", maxLength = 255 } = options
  if (typeof name !== "string") return ""

  const lastDotIndex = name.lastIndexOf(".")
  let baseName = name
  let extension = ""

  if (lastDotIndex > 0 && lastDotIndex < name.length - 1) {
    baseName = name.slice(0, lastDotIndex)
    extension = name.slice(lastDotIndex)
  }

  const illegalChars = /[\\/:*?"<>|\x00-\x1f\x7f]/g
  let cleanBase = baseName.replace(illegalChars, replacementChar)

  const reservedNames = /^(CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(\..*)?$/i
  if (reservedNames.test(cleanBase)) {
    cleanBase = replacementChar + cleanBase
  }

  cleanBase = cleanBase.trim().replace(/^\.+/, "").replace(/\.+$/, "")

  if (cleanBase.length === 0) {
    cleanBase = "file"
  }

  const multiReplacement = new RegExp(`${replacementChar}{2,}`, "g")
  cleanBase = cleanBase.replace(multiReplacement, replacementChar)

  const maxBaseLength = maxLength - extension.length
  if (maxBaseLength > 0 && cleanBase.length > maxBaseLength) {
    cleanBase = cleanBase.slice(0, maxBaseLength)
  }

  let result = cleanBase + extension

  if (result.length === 0) {
    result = "file"
  }

  return result
}

export function isProfilePagePath(pathname = location.pathname): boolean {
  return pathname.startsWith("/user/")
}
