type CSSObject = { [key: string]: string | number | CSSObject | null | false }
type CSSInput = CSSObject | Array<CSSObject | null | false>

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
