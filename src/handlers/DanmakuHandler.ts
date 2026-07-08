interface DanmakuItem {
  content?: string
  time?: number
  [key: string]: any
}

interface AssOptions {
  title?: string
  playResX?: number
  playResY?: number
}

export class DanmakuHandler {
  getDanmakuList(player: any): DanmakuItem[] {
    return player?.danmaku?.main?.data || []
  }

  getMediaSize(player: any): { width: number; height: number } {
    return { width: player?.sizeInfo?.width || 1920, height: player?.sizeInfo?.height || 1080 }
  }

  msToAssTime(ms: number): string {
    const totalSec = ms / 1000
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    return `${h}:${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`.replace(/^0:/, "")
  }

  hexToAssColor(hex: string): string {
    if (!hex || hex === "transparent") return "&H00FFFFFF"
    const c = hex.replace("#", "")
    if (c.length === 6) return "&H00" + c.slice(4, 6) + c.slice(2, 4) + c.slice(0, 2)
    return "&H00FFFFFF"
  }

  convertDanmakuToAss(list: DanmakuItem[], options: AssOptions = {}): string {
    const { title = "", playResX = 1920, playResY = 1080 } = options
    const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${playResX}
PlayResY: ${playResY}
Title: ${title}
Collisions: Normal

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`
    const events = list
      .map((d) => {
        const time = d.time ?? 0
        const content = d.content ?? ""
        const start = this.msToAssTime(time)
        const end = this.msToAssTime(time + 3000)
        return `Dialogue: 0,${start},${end},Default,,0,0,0,,${content}`
      })
      .join("\n")
    return header + "\n" + events
  }

  getDanmakuAssFileContent(player: any): string | undefined {
    const list = this.getDanmakuList(player)
    if (!list || list.length === 0) {
      alert("当前视频弹幕为空，或者未加载完成")
      return
    }
    const size = this.getMediaSize(player)
    return this.convertDanmakuToAss(list, {
      title: "download from https://github.com/zhzLuke96/douyin-dl-user-js",
      playResX: size.width,
      playResY: size.height,
    })
  }
}
