export interface TooltipItem {
  label?: string
  callback?: () => void
  html?: string
  render?: () => HTMLElement
}

function renderHtml(html: string): HTMLElement {
  const div = document.createElement("div")
  div.innerHTML = html.trim()
  return div.children[0] as HTMLElement
}

/**
 * 带有 hover 的按钮
 * NOTE: dy-dl-video-btn 是用于标记是否注入用的
 */
export class TooltipsButton {
  label: string
  items: TooltipItem[]
  onclick: () => void

  constructor(label: string, items: TooltipItem[], onclick: () => void) {
    this.label = label
    this.items = items
    this.onclick = onclick
  }

  render(): HTMLElement {
    const htmlStr =
      "<xg-icon" +
      '  class="xgplayer-playclarity-setting dy-dl-video-btn"' +
      '  data-state="normal"' +
      '  data-index="11"' +
      ">" +
      '  <div class="gear isSmoothSwitchClarityLogin">' +
      '    <div class="virtual"></div>' +
      '    <div class="btn" tabindex="0">' +
      this.label +
      "</div>" +
      "  </div>" +
      "</xg-icon>"

    const root = renderHtml(htmlStr)
    const $gear = root.querySelector(".gear") as HTMLElement
    const $items_list = root.querySelector(".virtual") as HTMLElement
    const $btn = root.querySelector(".btn") as HTMLElement

    $gear.addEventListener("mouseenter", () => $gear.classList.add("hover"))
    $gear.addEventListener("mouseleave", () => $gear.classList.remove("hover"))

    for (const item of this.items) {
      if (item.html) {
        $items_list.appendChild(renderHtml(item.html))
        continue
      }
      if (item.render) {
        $items_list.appendChild(item.render())
        continue
      }
      const $item = renderHtml('<div class="item">' + item.label + "</div>")
      $item.addEventListener("click", item.callback!)
      $items_list.appendChild($item)
    }

    $btn.addEventListener("click", this.onclick)
    return root
  }
}
