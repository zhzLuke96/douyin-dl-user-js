type CSSObject = { [key: string]: string | number | CSSObject | null | false }
type CSSInput = CSSObject | Array<CSSObject | null | false>

/**
 * 创建一个极简 CSS-in-JS 工具
 *
 * 说明：
 * - key: CSS 属性（camelCase）或选择器（如 'span', '&:hover', '.item', '> div'）
 * - value:
 *    - string | number → 样式值
 *    - CSSObject → 嵌套样式
 *    - null | false → 忽略（用于条件控制）
 *
 * 特性：
 * - 支持嵌套选择器（子元素 / 伪类 / &）
 * - 支持数组合并（条件样式）
 * - 自动生成 className（hash）
 * - 自动去重（相同样式只插入一次）
 *
 * @example
 * const css = createCSS()
 *
 * const cls = css({
 *   color: 'red',
 *   fontSize: '14px'
 * })
 *
 * el.className = cls
 */
export function createCSS(): (input: CSSInput) => string {
  const style = document.createElement("style")
  document.head.appendChild(style)
  const sheet = style.sheet!
  const cache = new Map<string, string>()

  const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())

  const hash = (s: string): string => {
    let h = 0,
      i = s.length
    while (i) h = (h * 31 + s.charCodeAt(--i)) | 0
    return "c" + (h >>> 0).toString(36)
  }

  const merge = (input: CSSInput): CSSObject =>
    Array.isArray(input)
      ? (input.filter(Boolean) as CSSObject[]).reduce<CSSObject>((a, b) => {
          return Object.assign(a, merge(b))
        }, {})
      : ((input || {}) as CSSObject)

  function build(selector: string, obj: CSSObject): void {
    let body = ""
    for (const k in obj) {
      const v = obj[k]
      if (v == null || v === false) continue
      if (typeof v === "object") {
        const sel = k.includes("&") ? k.replace(/&/g, selector) : `${selector} ${k}`
        build(sel, v as CSSObject)
      } else {
        body += `${kebab(k)}:${v};`
      }
    }
    if (body) {
      sheet.insertRule(`${selector}{${body}}`, sheet.cssRules.length)
    }
  }

  return function css(input: CSSInput): string {
    const obj = merge(input)
    const key = JSON.stringify(obj)
    if (cache.has(key)) return cache.get(key)!
    const className = hash(key)
    build(`.${className}`, obj)
    cache.set(key, className)
    return className
  }
}
