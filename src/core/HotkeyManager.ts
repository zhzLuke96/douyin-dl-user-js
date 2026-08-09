type ShortcutParts = {
  key: string
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
}

function parseShortcut(shortcut: string): ShortcutParts | null {
  const parts = shortcut
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
  if (parts.length === 0) return null
  const result: ShortcutParts = { key: "", ctrl: false, alt: false, shift: false, meta: false }
  for (const part of parts) {
    if (part === "ctrl" || part === "control") result.ctrl = true
    else if (part === "alt" || part === "option") result.alt = true
    else if (part === "shift") result.shift = true
    else if (part === "meta" || part === "command" || part === "cmd" || part === "win" || part === "windows") result.meta = true
    else if (result.key) return null
    else result.key = part
  }
  return result.key ? result : null
}

function matchesShortcut(ev: KeyboardEvent, shortcut: ShortcutParts): boolean {
  return ev.key.toLowerCase() === shortcut.key && ev.ctrlKey === shortcut.ctrl && ev.altKey === shortcut.alt && ev.shiftKey === shortcut.shift && ev.metaKey === shortcut.meta
}

/** 快捷键管理器 */
export class HotkeyManager {
  /**
   * 注册快捷键，支持 M、Ctrl+M、Alt+Shift+M 等写法
   */
  addHotkey(shortcut: string, fn: () => void): { dispose: () => void } {
    const parsed = parseShortcut(shortcut)
    if (!parsed) return { dispose: () => {} }
    const callback = (ev: KeyboardEvent) => {
      if (!matchesShortcut(ev, parsed)) return
      const activeElement = document.activeElement as HTMLElement | null
      if (activeElement) {
        const tagName = activeElement.tagName
        const isInputElement = tagName === "INPUT" || tagName === "TEXTAREA" || activeElement.isContentEditable
        if (isInputElement) return
      }
      ev.preventDefault()
      fn()
    }
    document.addEventListener("keydown", callback)
    const dispose = () => document.removeEventListener("keydown", callback)
    return { dispose }
  }
}
