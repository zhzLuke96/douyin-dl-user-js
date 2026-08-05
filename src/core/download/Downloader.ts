import { ImageProcessor } from "./ImageProcessor"
import { Config } from "../Config"
import { DownloaderLauncher } from "./DownloaderLauncher"

interface DownloadResult {
  ok: boolean
  error_msg?: string
  blob?: Blob
  filename?: string
  filename_base?: string
  isImage?: boolean
  isWebP?: boolean
  content_type?: string
  fileExt?: string
}

interface PrepareFilenameResult {
  filename: string
  ext: string
  isImage: boolean
  isVideo: boolean
  isWebP: boolean
  headers: Headers
  content_length: string
  content_type: string
  filename_base: string
}

export class Downloader {
  /**
   * 将 WebP 图片转换为 PNG 格式
   */
  async convertWebPToPNG(blob: Blob): Promise<Blob | null> {
    const img = new Image()
    img.src = URL.createObjectURL(blob)
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
    })
    const canvas = document.createElement("canvas")
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, 0, 0)
    URL.revokeObjectURL(img.src)
    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png")
    })
  }

  /**
   * 获取请求头
   */
  async get_headers(url: string): Promise<Headers> {
    const response = await fetch(url, { method: "HEAD" })
    return response.headers
  }

  /**
   * 根据请求头猜测完整文件名
   */
  async prepare_filename(dl_url: string, filename_input = ""): Promise<PrepareFilenameResult> {
    let url = dl_url
    if (url.startsWith("//")) {
      url = window.location.protocol + url
    }
    const headers = await this.get_headers(url)
    const content_disposition = headers.get("content-disposition") || ""
    const content_type = headers.get("content-type") || ""
    const content_length = headers.get("content-length") || ""
    // NOTE: 这是新文件头
    const imagex_fmt = headers.get("Imagex-Fmt") || ""

    const isImage = !!imagex_fmt || content_type.startsWith("image/")
    const isWebP = imagex_fmt.includes("2webp") || url.includes(".webp") || content_type.includes("webp")
    const isVideo = content_type.startsWith("video/")

    let fileExtGuess = content_type.split("/")[1]?.toLowerCase()
    if (!fileExtGuess && isImage) fileExtGuess = "jpg"
    else if (!fileExtGuess) fileExtGuess = "bin"

    let determinedFileExt = fileExtGuess
    if (content_disposition) {
      const m = content_disposition.match(/filename="(.+)"$/i)
      if (m) {
        const fe = m[1].split(".").pop()?.toLowerCase()
        if (fe) determinedFileExt = fe
      }
    }

    let filename = filename_input || new URL(url).pathname.split("/").pop() || "download"
    if (filename.endsWith(".image")) filename = filename.slice(0, -".image".length)
    const filename_base = filename.replace(/\.[^/.]+$/, "")
    const re = new RegExp("\\." + determinedFileExt + "$", "i")
    if (!re.test(filename)) filename = filename_base + "." + determinedFileExt

    return { filename, ext: determinedFileExt, isImage, isVideo, isWebP, headers, content_length, content_type, filename_base }
  }

  /**
   * 预下载文件
   *
   * PS: 这一步其实没有下载，而是通过浏览器的缓存读取了
   * PSS: 并且如果浏览器没有缓存，似乎会报错，因为server那边会校验cookie，我们没带上
   */
  async prepare_download_file(dl_url: string, filename_input = ""): Promise<DownloadResult> {
    const meta = await this.prepare_filename(dl_url, filename_input)
    const response = await fetch(dl_url)
    if (!response.ok) {
      return { ok: false, error_msg: "Failed to fetch the file: " + response.status }
    }
    const blob = await response.blob()
    return {
      blob,
      filename: meta.filename,
      filename_base: meta.filename_base,
      isImage: meta.isImage,
      isWebP: meta.isWebP,
      content_type: meta.content_type,
      fileExt: meta.ext,
      ok: true,
    }
  }

  /**
   * 使用浏览器下载 Blob
   */
  async download_blob(blob: Blob, filename: string) {
    const link = document.createElement("a")
    link.style.display = "none"
    link.download = filename
    link.href = URL.createObjectURL(blob)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  /**
   * 下载后处理：转码、压缩图片
   */
  async download_postprocess(blob: Blob, content_type: string): Promise<{ blob: Blob; output_type?: string }> {
    if (content_type.startsWith("image/")) {
      const processor = new ImageProcessor(Config.global.clone_features())
      return processor.process(blob)
    }
    return { blob }
  }

  /**
   * 使用浏览器下载数据
   *
   * 下载文件流程:
   * 1. 预下载为 blob，读取元信息
   * 2. 如果是 webp 图片，尝试转为 png 图片
   * 3. 下载 blob
   */
  async download_using_browser(url: string, filename_input: string): Promise<{ ok: boolean; error_msg: string }> {
    let blob: Blob | undefined
    let filename: string | undefined
    try {
      const result = await this.prepare_download_file(url, filename_input)
      if (!result.ok) return { ok: false, error_msg: result.error_msg || "预下载失败" }
      filename = result.filename
      blob = result.blob
      // 压缩图片
      const { blob: new_blob, output_type } = await this.download_postprocess(blob!, result.content_type ?? "")
      blob = new_blob
      // 修改图片文件名后缀
      if (output_type === "image/png") filename = result.filename_base + ".png"
      else if (output_type === "image/jpeg") filename = result.filename_base + ".jpeg"
      else if (output_type === "image/webp") filename = result.filename_base + ".webp"
    } catch (error) {
      console.error("[dy-dl]预下载异常", error)
      return { ok: false, error_msg: "预下载异常" }
    }
    if (blob && filename) {
      try {
        // 下载处理后的 blob
        await this.download_blob(blob, filename)
        return { ok: true, error_msg: "" }
      } catch (error) {
        console.error("[dy-dl]下载blob失败", error)
        return { ok: false, error_msg: "下载失败" }
      }
    }
    return { ok: false, error_msg: "下载失败" }
  }

  /**
   * 根据配置使用不同的下载器
   */
  async download_one_url(url: string, filename_input: string, options: { media?: any } = {}): Promise<{ ok: boolean; error_msg: string }> {
    const { using_downloader, downloader_config } = Config.global.features
    switch (using_downloader) {
      case "browser":
        return this.download_using_browser(url, filename_input)
      case "idm":
      case "aria2":
      case "bc":
      case "abdm": {
        let resolvedFilename = filename_input
        try {
          const meta = await this.prepare_filename(url, filename_input)
          resolvedFilename = meta.filename
        } catch (e) {
          console.warn("[dy-dl] prepare_filename failed, using input filename", e)
        }
        const launcher = new DownloaderLauncher({
          idmList: [{ id: downloader_config.idm?.id || "1" }],
          aria2List: [
            {
              domain: downloader_config.aria2?.domain || "http://localhost",
              port: downloader_config.aria2?.port || "6800",
              path: downloader_config.aria2?.path || "/jsonrpc",
              token: downloader_config.aria2?.token ?? "",
              dir: "",
            },
          ],
          bitcometList: [
            {
              domain: downloader_config.bc?.domain || "http://localhost",
              port: downloader_config.bc?.port || "8080",
              path: downloader_config.bc?.path || "/panel/task_add_httpftp_result",
              authName: downloader_config.bc?.authName ?? "",
              authPass: downloader_config.bc?.authPass ?? "",
              dir: "",
            },
          ],
          abdmList: [{ domain: downloader_config.abdm?.domain || "http://localhost", port: downloader_config.abdm?.port || "15151", dir: "" }],
        })
        const ok = await launcher.invoke_download(url, using_downloader, (downloader_config as any)[using_downloader]?.dir, {
          filename_input: resolvedFilename,
          media: options.media,
        })
        return { ok: !!ok, error_msg: "" }
      }
      default:
        return { ok: false, error_msg: "未知下载器" }
    }
  }

  /**
   * 下载文件，根据所有 url 逐一尝试下载
   */
  async download_file(source: string, filename_input = "", fallback_src: string[] = [], options: { silent?: boolean; media?: any } = {}): Promise<boolean> {
    let url_sources = [source, ...fallback_src].filter((x) => typeof x === "string" && x.length > 0)
    url_sources = Array.from(new Set(url_sources))
    let error_msg = ""
    for (const url of url_sources) {
      const r = await this.download_one_url(url, filename_input, options)
      error_msg = error_msg || r.error_msg
      if (r.ok) return true
    }
    // 所有尝试都失败时弹出提示
    if (!options.silent) {
      alert(error_msg && url_sources.length === 1 ? error_msg : "[dy-dl]所有尝试下载都失败，请刷新重试")
    }
    return false
  }
}
