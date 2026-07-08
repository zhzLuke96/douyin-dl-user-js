import { XhrInterceptor } from "./XhrInterceptor"

export class AwemeHub {
  interceptor = new XhrInterceptor()

  constructor() {
    this._init_interceptor()
  }

  /**
   * 初始化拦截器
   */
  private _init_interceptor() {
    const pathname = (pn: string) => (url: string) => {
      try {
        return new URL(url).pathname === pn
      } catch {
        return false
      }
    }

    this.interceptor.on(pathname("/aweme/v1/web/aweme/post/"), (data: any, _resp: any) => {
      console.log("[dy-dl]", data)
    })

    this.interceptor.on(pathname("/aweme/v1/web/general/search/single/"), (_data: any, _resp: any) => {
      // placeholder
    })

    this.interceptor.start()
  }
}
