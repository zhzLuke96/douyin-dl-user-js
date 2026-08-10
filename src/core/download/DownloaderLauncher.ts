import { runInContext } from "../../utils/format"

interface LauncherConfig {
  idmList: Array<{ id: string; default?: boolean; [key: string]: any }>
  aria2List: Array<{ domain: string; port: string; path: string; token: string; dir: string; default?: boolean; [key: string]: any }>
  bitcometList: Array<{ domain: string; port: string; path: string; authName: string; authPass: string; dir: string; default?: boolean; [key: string]: any }>
  abdmList: Array<{ domain: string; port: string; dir: string; default?: boolean; [key: string]: any }>
  curlTerminal: string
}

/**
 * 下载器唤醒工具类
 * 支持：IDM、Aria2、BitComet、AB Download Manager
 */
export class DownloaderLauncher {
  private config: LauncherConfig
  private _idmSeq = 1

  constructor(config: Partial<LauncherConfig> = {}) {
    this.config = {
      idmList: config.idmList || [{ id: "1" }],
      aria2List: config.aria2List || [{ domain: "http://localhost", port: "6800", path: "/jsonrpc", token: "", dir: "" }],
      bitcometList: config.bitcometList || [{ domain: "http://localhost", port: "8080", path: "/panel/task_add_httpftp_result", authName: "", authPass: "", dir: "" }],
      abdmList: config.abdmList || [{ domain: "http://localhost", port: "15151", dir: "" }],
      curlTerminal: config.curlTerminal || "wc",
    }
  }

  // ==================== Dir Template ====================

  /**
   * 简化入口：解析下载目录模板
   */
  private _resolveDirTemplate(input: string, context: any, fallback = ""): string {
    if (typeof input !== "string" || !input.trim()) return fallback
    try {
      const resolved = runInContext(context, input)
      return typeof resolved === "string" && resolved.trim() ? resolved : fallback
    } catch {
      return fallback
    }
  }

  // ==================== invoke_download ====================

  /**
   * 简化入口：调用下载器下载
   */
  async invoke_download(
    url: string,
    dl_name: "idm" | "aria2" | "bc" | "abdm" = "abdm",
    dir_config?: { video?: string; image?: string; other?: string } | null,
    options: { filename_input?: string; media?: any; mediaType?: "video" | "image" } = {},
  ): Promise<boolean> {
    const input_filename = options.filename_input || (options.media ? "media_" + Date.now() : "download")
    const media = options.media

    const filename = input_filename
    const isVideo = filename.endsWith(".mp4") || filename.endsWith(".webm") || filename.endsWith(".ts")
    const isImage = filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".png") || filename.endsWith(".webp")

    const authorInfo = media?.authorInfo || {}
    const userId = authorInfo.uid || media?.authorUserId || authorInfo.secUid || "unknown"
    const nickname = authorInfo.nickname || "unknown"
    const userDir = (filename: string) => filename.replace(/[\\/:*?"<>|\x00-\x1f\x7f]/g, "_")
    const safeUserDir = userDir(`${userId}_${nickname}`)
    const mediaType = options.mediaType || (isVideo ? "video" : isImage ? "image" : "other")
    const defaultDir = mediaType === "video" ? `./douyin/${safeUserDir}/videos` : mediaType === "image" ? `./douyin/${safeUserDir}/images` : `./douyin/${safeUserDir}/others`
    const dirContext = {
      media,
      filename,
      filename_base: input_filename,
      user_dir: safeUserDir,
      author_info: authorInfo,
      uid: userId,
      nickname,
      aweme_id: media?.awemeId || "",
      desc: media?.desc || "",
    }
    const resolvedDir = this._resolveDirTemplate(dir_config?.[mediaType as keyof typeof dir_config] as string, dirContext, defaultDir)

    switch (dl_name) {
      case "idm":
        return this.launchIDM(url, filename, 0, {}, null)
      case "aria2":
        return this.launchAria2(url, filename, {}, { dir: resolvedDir })
      case "bc":
        return this.launchBitComet(url, filename, {}, { dir: resolvedDir })
      case "abdm":
        return this.launchABDM(url, filename, {}, { dir: resolvedDir })
      default:
        throw new Error(`Unknown download name: ${dl_name}`)
    }
  }

  // ==================== Config helpers ====================

  /**
   * 获取默认配置项
   */
  getDefaultConfig(type: "idm" | "aria2" | "bitcomet" | "abdm"): any {
    const listMap: Record<string, any[]> = {
      idm: this.config.idmList,
      aria2: this.config.aria2List,
      bitcomet: this.config.bitcometList,
      abdm: this.config.abdmList,
    }
    const list = listMap[type]
    if (!list) throw new Error(`Unknown type: ${type}`)
    return list.find((item) => item.default) || list[0]
  }

  // ==================== Static utilities ====================

  /**
   * 标准化请求头：转换为对象，添加常用默认头
   */
  static normalizeHeaders(headers: Record<string, any> | string = {}, addDefault = false): Record<string, string> {
    if (typeof headers === "string") {
      const raw: Record<string, string> = {}
      headers.split(/[\r\n]+/).forEach((line) => {
        if (!line.trim() || !line.includes(":")) return
        const [key, ...parts] = line.split(":")
        raw[key.trim().toLowerCase()] = parts.join(":").trim()
      })
      headers = raw
    }
    const newHeaders: Record<string, string> = {}
    for (const key in headers) {
      let value = headers[key]
      if (typeof value === "object") value = JSON.stringify(value)
      else value = String(value)
      const normalizedKey = key
        .toLowerCase()
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("-")
      newHeaders[normalizedKey] = value
    }
    if (addDefault) return newHeaders
    return {
      Dnt: "",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Expires: "0",
      Cookie: document.cookie,
      "User-Agent": navigator.userAgent,
      Origin: location.origin,
      Referer: `${location.origin}/`,
      ...newHeaders,
    }
  }

  /**
   * 可跨域 xmlhttpRequest 请求
   * 封装 GreaseMonkey-Compatible xmlhttpRequest 实现的跨域请求，支持回调和 await 两种用法
   */
  static xmlHttpRequest(option: any): any {
    const xhr = typeof GM_xmlhttpRequest === "function" ? GM_xmlhttpRequest : typeof GM?.xmlHttpRequest === "function" ? GM.xmlHttpRequest : null
    if (!xhr || typeof xhr !== "function") throw new Error("GreaseMonkey 兼容 XMLHttpRequest 不可用。")
    return xhr({ withCredentials: true, ...option })
  }

  /**
   * 发送HTTP请求，使用 gm-xmlhttpRequest 发起跨域请求
   */
  static request_cors(url: string, options: any = {}): Promise<{ status: number; data: any; headers: string }> {
    return new Promise((resolve, reject) => {
      const { method = "GET", headers = {}, body, timeout = 30000, responseType } = options
      DownloaderLauncher.xmlHttpRequest({
        method,
        url,
        headers,
        data: body,
        timeout,
        responseType,
        onload: (res: any) => {
          let data = res.response
          if (!responseType) {
            const ct = res.responseHeaders || ""
            if (ct.includes("application/json")) {
              try {
                data = JSON.parse(res.responseText)
              } catch {
                data = res.responseText
              }
            } else data = res.responseText
          }
          resolve({ status: res.status, data, headers: res.responseHeaders })
        },
        onerror: (err: any) => reject(err),
        ontimeout: () => reject(new Error("Request timeout")),
      })
    })
  }

  /**
   * 发送HTTP请求，默认用这个请求，不需要权限
   */
  static async request(url: string, options: any = {}): Promise<{ status: number; data: any }> {
    const response = await fetch(url, options)
    let data: any
    const ct = response.headers.get("content-type")
    if (ct && ct.includes("application/json")) data = await response.json()
    else data = await response.text()
    return { status: response.status, data }
  }

  /**
   * 格式化文件大小（用于调试）
   */
  static formatSize(bytes: number): string {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  /**
   * 生成cURL命令
   */
  static toCurlCommand(link: string, filename: string, headers: Record<string, string> = {}, terminal = "wc"): string {
    const curlCmd = terminal !== "wp" ? "curl" : "curl.exe"
    const headerArgs = Object.entries(headers)
      .map(([k, v]) => `-H "${k}: ${v}"`)
      .join(" ")
    const safeFilename = filename.replace(/[!?&|`"'*/:<>\\]/g, "_")
    return `${curlCmd} -L -C - "${link}" -o "${safeFilename}" ${headerArgs}`.trim()
  }

  /**
   * 生成BC链接（比特彗星专用）
   */
  static toBitCometLink(link: string, filename: string, headers: Record<string, string> = {}): string {
    const safeFilename = filename.replace(/[!?&|`"'*/:<>\\]/g, "_")
    const query = new URLSearchParams()
    query.append("url", link)
    for (const [k, v] of Object.entries(headers)) query.append(k, v)
    const bcData = `AA/${encodeURIComponent(safeFilename)}/?${query.toString()}ZZ`
    const base64Data = btoa(unescape(encodeURIComponent(bcData)))
    return `bc://http/${base64Data}`
  }

  // ==================== Launchers ====================

  /**
   * 发送到 IDM
   */
  async launchIDM(link: string, filename: string, filesize: number, headers: Record<string, any> = {}, idmConfig: any = null): Promise<boolean> {
    const config = { ...this.getDefaultConfig("idm"), ...idmConfig }
    const clientId = config.id || "1"
    if (!clientId) throw new Error("IDM client id missing")
    const seq = ++this._idmSeq
    const time = Date.now()
    const url = `http://127.0.0.1:1001/client/${clientId}?seq=${seq}`
    const ext = filename.split(".").pop()?.toUpperCase() || ""
    const normHeaders = DownloaderLauncher.normalizeHeaders(headers)
    const headersText =
      Object.entries(normHeaders)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n") + "\n"
    const fmt = (key: number, val: any) => {
      const s = String(val ?? "")
      return `${key}=${new Blob([s]).size}:${s}`
    }
    const fields = [fmt(4, ext), fmt(6, link), fmt(7, location.origin), fmt(11, headersText), fmt(100, filename), fmt(122, 4)]
    const data = `MSG#${seq}#13#1#10241:${seq + 1000}:0:${time}:0:1:2:${filesize}:0,${fields.join(",")};`
    try {
      const res = await DownloaderLauncher.request(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: data })
      return res.data === `${seq}:3;`
    } catch (e) {
      console.error("IDM launch failed", e)
      return false
    }
  }

  /**
   * 发送到 Aria2
   */
  async launchAria2(link: string, filename: string, headers: Record<string, any> = {}, aria2Config: any = null): Promise<boolean> {
    const config = { ...this.getDefaultConfig("aria2"), ...aria2Config }
    const url = `${config.domain}:${config.port}${config.path}`
    const headerList = Object.entries(DownloaderLauncher.normalizeHeaders(headers)).map(([k, v]) => `${k}: ${v}`)
    const params: any[] = [`token:${config.token}`, [link], { dir: config.dir || undefined, out: filename, header: headerList }]
    const rpcData = { id: Date.now(), jsonrpc: "2.0", method: "aria2.addUri", params }
    try {
      const res = await DownloaderLauncher.request_cors(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rpcData) })
      return !!res.data?.result
    } catch (e) {
      console.error("Aria2 launch failed", e)
      return false
    }
  }

  /**
   * 发送到比特彗星 (BitComet)
   */
  async launchBitComet(link: string, filename: string, headers: Record<string, any> = {}, bitcometConfig: any = null): Promise<boolean> {
    const config = { ...this.getDefaultConfig("bitcomet"), ...bitcometConfig }
    const url = `${config.domain}:${config.port}${config.path}`
    const formData = new URLSearchParams()
    formData.append("url", link)
    if (config.dir) formData.append("save_path", config.dir)
    formData.append("file_name", filename)
    formData.append("connection", "200")
    const normHeaders = DownloaderLauncher.normalizeHeaders(headers)
    for (const [k, v] of Object.entries(normHeaders)) formData.append(k, v)
    const auth = btoa(`${config.authName}:${config.authPass}`)
    try {
      const res = await DownloaderLauncher.request(url, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      })
      return !res.data.includes("Add task failed!")
    } catch (e) {
      console.warn("BitComet launch may have succeeded despite error", e)
      return true
    }
  }

  /**
   * 发送到 AB Download Manager
   */
  async launchABDM(link: string, filename: string, headers: Record<string, any> = {}, abdmConfig: any = null): Promise<boolean> {
    const config = { ...this.getDefaultConfig("abdm"), ...abdmConfig }
    const url = `${config.domain}:${config.port}/start-headless-download`
    const normHeaders = DownloaderLauncher.normalizeHeaders(headers)
    const payload: any = { downloadSource: { link, headers: normHeaders, downloadPage: normHeaders["Referer"] || location.href }, name: filename }
    if (config.dir) payload.folder = config.dir
    try {
      const res = await DownloaderLauncher.request_cors(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: JSON.stringify(payload) })
      return res.data === "OK"
    } catch (e) {
      console.error("ABDM launch failed", e)
      return false
    }
  }

  // ==================== 以下是同步命令生成方法（不实际唤醒）====================

  getCurlCommand(link: string, filename: string, headers: Record<string, string> = {}): string {
    return DownloaderLauncher.toCurlCommand(link, filename, headers, this.config.curlTerminal)
  }

  getBitCometLink(link: string, filename: string, headers: Record<string, string> = {}): string {
    return DownloaderLauncher.toBitCometLink(link, filename, headers)
  }

  getAria2Command(link: string, filename: string, headers: Record<string, string> = {}): string {
    const headerArgs = Object.entries(headers)
      .map(([k, v]) => `--header "${k}: ${v}"`)
      .join(" ")
    const safeFilename = filename.replace(/[!?&|`"'*/:<>\\]/g, "_")
    return `aria2c "${link}" --out "${safeFilename}" ${headerArgs}`.trim()
  }
}
