export class XhrInterceptor {
  private win: Window & typeof globalThis
  private originalXhrOpen: any
  private originalXhrSend: any
  private listeners: Array<{ rule: RegExp | string | ((url: string) => boolean); callback: Function }> = []
  private isHooked = false

  constructor() {
    this.win = typeof unsafeWindow !== "undefined" ? (unsafeWindow as Window & typeof globalThis) : window
    this.originalXhrOpen = this.win.XMLHttpRequest.prototype.open
    this.originalXhrSend = this.win.XMLHttpRequest.prototype.send
  }

  start() {
    if (this.isHooked) return
    const _this = this
    const XHR = this.win.XMLHttpRequest

    XHR.prototype.open = function (this: any, method: any, url: any, ...args: any[]) {
      this._interceptor_url = url
      this._interceptor_method = method
      return _this.originalXhrOpen.apply(this, [method, url, ...args])
    } as any

    XHR.prototype.send = function (this: any, ...args: any[]) {
      this.addEventListener("load", function (this: any) {
        const url = this._interceptor_url as string | undefined
        if (!url) return
        _this.listeners.forEach((listener: any) => {
          if (_this._matchUrl(url!, listener.rule)) {
            let parsedData = null
            try {
              if (this.responseType === "" || this.responseType === "text") {
                parsedData = JSON.parse(this.responseText)
              } else if (this.responseType === "json") {
                parsedData = this.response
              }
            } catch {}
            listener.callback(parsedData, this.response, this, args)
          }
        })
      })
      return _this.originalXhrSend.apply(this, args)
    } as any

    this.isHooked = true
  }

  on(rule: RegExp | string | ((url: string) => boolean), callback: Function) {
    this.listeners.push({ rule, callback })
  }

  private _matchUrl(url: string, rule: RegExp | string | ((url: string) => boolean)): boolean {
    if (typeof rule === "function") return rule(url)
    if (rule instanceof RegExp) return rule.test(url)
    return url.includes(rule)
  }
}
