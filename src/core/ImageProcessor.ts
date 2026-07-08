type ImageConvertCodecs = "default" | "png" | "jpg" | "webp"
type ImageResizeCodecs = "default" | "2k_max" | "1k_max" | "960_max" | "640_max" | "512_max"

interface ImageConfig {
  image_convert_codecs: ImageConvertCodecs
  image_resize_codecs: ImageResizeCodecs
  image_quality: number
}

export class ImageProcessor {
  private config: ImageConfig
  private resizeMap: Record<string, number> = {
    "2k_max": 2048,
    "1k_max": 1024,
    "960_max": 960,
    "640_max": 640,
    "512_max": 512,
  }

  constructor(config: Partial<ImageConfig> = {}) {
    this.config = {
      image_convert_codecs: "default",
      image_resize_codecs: "default",
      image_quality: 80,
      ...config,
    }
  }

  is_need_convert(width: number, height: number): boolean {
    const { image_convert_codecs, image_resize_codecs } = this.config
    const need_format = image_convert_codecs !== "default"
    const resize_target = this.resizeMap[image_resize_codecs] ?? Infinity
    const need_resize = width > resize_target || height > resize_target
    return need_format || need_resize
  }

  async process(file: File | Blob): Promise<{ blob: Blob; outputType?: string }> {
    const bitmap = await createImageBitmap(file)
    let { width, height } = bitmap

    if (!this.is_need_convert(width, height)) {
      return { blob: file }
    }

    ;({ width, height } = this._resize(width, height))

    const canvas = this._createCanvas(width, height)
    const ctx = canvas.getContext("2d")!

    const outputType = this._getOutputType(file.type)

    if (outputType === "image/jpeg") {
      ctx.fillStyle = "#fff"
      ctx.fillRect(0, 0, width, height)
    }

    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await this._toBlob(canvas, outputType)
    return { blob, outputType }
  }

  private _resize(width: number, height: number) {
    const mode = this.config.image_resize_codecs
    const maxEdge = this.resizeMap[mode]
    if (!maxEdge) return { width, height }
    const scale = Math.min(1, maxEdge / Math.max(width, height))
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    }
  }

  private _createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
    if (typeof OffscreenCanvas !== "undefined") {
      return new OffscreenCanvas(width, height)
    }
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    return canvas
  }

  private _getOutputType(inputType: string): string {
    const codec = this.config.image_convert_codecs
    if (codec === "png") return "image/png"
    if (codec === "jpg") return "image/jpeg"
    if (codec === "webp") return "image/webp"
    if (inputType === "image/png") return "image/png"
    if (inputType === "image/webp") return "image/webp"
    return "image/jpeg"
  }

  private _normalizeQuality(): number {
    const q = this.config.image_quality
    if (!q) return 0.8
    return Math.min(1, Math.max(0.1, q / 100))
  }

  private _toBlob(canvas: HTMLCanvasElement | OffscreenCanvas, type: string): Promise<Blob> {
    const quality = this._normalizeQuality()
    if ((canvas as OffscreenCanvas).convertToBlob) {
      return (canvas as OffscreenCanvas).convertToBlob({ type, quality })
    }
    return new Promise((resolve) => {
      ;(canvas as HTMLCanvasElement).toBlob((b) => resolve(b!), type, quality)
    })
  }
}
