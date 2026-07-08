export class VideoHandler {
  private _frameBlob: Blob | null = null

  private getVideoElement(): HTMLVideoElement | null {
    const player = (window as any).player || (typeof unsafeWindow !== "undefined" && (unsafeWindow as any).player)
    return player?.video || document.querySelector("video")
  }

  getCurrentFrame(): { blob: Blob; url: string } | null {
    const video = this.getVideoElement()
    if (!video) return null
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(video, 0, 0)
    const url = canvas.toDataURL("image/png")
    canvas.toBlob((blob) => {
      if (blob) this._frameBlob = blob
    })
    return { blob: this._frameBlob!, url }
  }

  async copy_current_frame() {
    const video = this.getVideoElement()
    if (!video) {
      alert("未找到视频元素")
      return
    }
    try {
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(video, 0, 0)
      const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/png"))
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
    } catch (e) {
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(video, 0, 0)
      const url = canvas.toDataURL("image/png")
      const img = new Image()
      img.src = url
      document.body.appendChild(img)
      Object.assign(img.style, { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 999999, maxWidth: "90vw", maxHeight: "90vh" })
      img.onclick = () => img.remove()
      console.error("复制帧失败(已显示图像):", e)
    }
  }

  async download_current_frame() {
    const video = this.getVideoElement()
    if (!video) {
      alert("未找到视频元素")
      return
    }
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(video, 0, 0)
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/png"))
    const link = document.createElement("a")
    link.download = "frame_" + Date.now() + ".png"
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }
}
