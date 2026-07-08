/**
 * XHR 拦截器工具类
 */
export class XhrInterceptor {
  /** 获取真实的 window 对象 */
  private win: Window & typeof globalThis
  private originalXhrOpen: any
  private originalXhrSend: any
  /** 存储注册的回调函数 */
  private listeners: Array<{ rule: RegExp | string | ((url: string) => boolean); callback: Function }> = []
  private isHooked = false

  constructor() {
    this.win = typeof unsafeWindow !== "undefined" ? (unsafeWindow as Window & typeof globalThis) : window
    this.originalXhrOpen = this.win.XMLHttpRequest.prototype.open
    this.originalXhrSend = this.win.XMLHttpRequest.prototype.send
  }

  /**
   * 启动拦截
   */
  start() {
    if (this.isHooked) return
    const _this = this
    const XHR = this.win.XMLHttpRequest

    // 1. 劫持 open 方法，获取 URL 和 Method
    XHR.prototype.open = function (this: any, method: any, url: any, ...args: any[]) {
      // 将 url 挂载到实例上，供 send 阶段使用
      // 处理 url 可能是相对路径的情况，尽量保存原始字符串
      this._interceptor_url = url
      this._interceptor_method = method
      return _this.originalXhrOpen.apply(this, [method, url, ...args])
    } as any

    // 2. 劫持 send 方法，监听 load 事件
    XHR.prototype.send = function (this: any, ...args: any[]) {
      this.addEventListener("load", function (this: any) {
        const url = this._interceptor_url as string | undefined
        if (!url) return
        // 触发匹配的监听器
        _this.listeners.forEach((listener: any) => {
          if (_this._matchUrl(url!, listener.rule)) {
            // 尝试解析 JSON
            let parsedData = null
            try {
              if (this.responseType === "" || this.responseType === "text") {
                parsedData = JSON.parse(this.responseText)
              } else if (this.responseType === "json") {
                parsedData = this.response
              }
            } catch {
              // 非 JSON 数据，保持 null
            }
            // 回调：(解析后的数据, 原始XHR对象, 请求参数)
            listener.callback(parsedData, this.response, this, args)
          }
        })
      })
      return _this.originalXhrSend.apply(this, args)
    } as any

    this.isHooked = true
  }

  /**
   * 注册拦截规则
   */
  on(rule: RegExp | string | ((url: string) => boolean), callback: Function) {
    this.listeners.push({ rule, callback })
  }

  /**
   * 内部方法：匹配 URL
   */
  private _matchUrl(url: string, rule: RegExp | string | ((url: string) => boolean)): boolean {
    if (typeof rule === "function") return rule(url)
    if (rule instanceof RegExp) return rule.test(url)
    return url.includes(rule)
  }
}
