/**
 * 创建可定位的 Toast
 * 目标元素或选择器，用于将 Toast 定位在其正上方；若未提供则显示在右下角
 * 默认自动消失时间（毫秒），设为 0 则不自动消失
 */
export function createToast(target?: HTMLElement | string | null, defaultDuration = 2000): { update: (message: string, duration?: number) => void; close: () => void } {
  let toastEl: HTMLElement | null = null
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const getTargetElement = (): HTMLElement | null => {
    if (!target) return null
    if (typeof target === "string") return document.querySelector(target)
    return (target as HTMLElement).nodeType === Node.ELEMENT_NODE ? (target as HTMLElement) : null
  }

  const updatePosition = () => {
    if (!toastEl) return
    const targetEl = getTargetElement()
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect()
      const top = rect.top - toastEl.offsetHeight - 5
      const left = rect.left + (rect.width - toastEl.offsetWidth) / 2
      toastEl.style.top = `${top}px`
      toastEl.style.left = `${left}px`
      toastEl.style.right = "auto"
      toastEl.style.bottom = "auto"
    } else {
      toastEl.style.bottom = "20px"
      toastEl.style.right = "20px"
      toastEl.style.top = "auto"
      toastEl.style.left = "auto"
    }
  }

  const close = () => {
    if (toastEl) {
      toastEl.remove()
      toastEl = null
    }
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const update = (message: string, duration = defaultDuration) => {
    if (!toastEl) {
      toastEl = document.createElement("div")
      toastEl.className = "dy-dl-toast"
      Object.assign(toastEl.style, {
        position: "fixed",
        background: "rgba(0,0,0,0.7)",
        color: "#fff",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        zIndex: "999999",
        pointerEvents: "none",
        transition: "opacity 0.3s",
        fontFamily: "sans-serif",
        whiteSpace: "nowrap",
      })
      document.body.appendChild(toastEl)
    }
    toastEl.textContent = message
    updatePosition()

    if (timeoutId) clearTimeout(timeoutId)
    if (duration > 0) {
      timeoutId = setTimeout(close, duration)
    }
  }

  return { update, close }
}
