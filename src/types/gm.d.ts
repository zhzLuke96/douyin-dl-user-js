// GM_xmlhttpRequest 类型声明
// 兼容 Greasemonkey / Tampermonkey / Violentmonkey

interface GMXHRRequest {
  method?: "GET" | "POST" | "HEAD" | "DELETE" | "PUT"
  url: string
  headers?: Record<string, string>
  data?: string | FormData | Blob
  cookie?: string
  binary?: boolean
  timeout?: number
  responseType?: "text" | "json" | "blob" | "arraybuffer" | "document"
  overrideMimeType?: string
  anonymous?: boolean
  fetch?: boolean
  user?: string
  password?: string
  onload?: (response: GMXHRResponse) => void
  onerror?: (response: GMXHRResponse) => void
  onprogress?: (response: GMXHRProgress) => void
  onreadystatechange?: (response: GMXHRResponse) => void
  ontimeout?: () => void
  onabort?: () => void
}

interface GMXHRResponse {
  finalUrl: string
  readyState: number
  status: number
  statusText: string
  responseHeaders: string
  response: any
  responseText: string
  responseXML: Document | null
}

interface GMXHRProgress {
  lengthComputable: boolean
  loaded: number
  total: number
}

declare function GM_xmlhttpRequest(details: GMXHRRequest): { abort(): void }

declare var GM: { xmlHttpRequest: (details: GMXHRRequest) => { abort(): void } } | undefined

declare var unsafeWindow: Window & typeof globalThis