export class HotkeyManager {
  addHotkey(key: string, fn: () => void): { dispose: () => void } {
    const callback = (ev: KeyboardEvent) => {
      if (ev.key.toLowerCase() !== key.toLowerCase()) return
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
