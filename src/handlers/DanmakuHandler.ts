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

/**
 * 弹幕相关处理
 */
export class DanmakuHandler {
  /** 获取弹幕列表 */
  getDanmakuList(player: any): DanmakuItem[] {
    // TODO: 从player上取到的只是渲染数据，如果是长视频只包含一部分
    // 需要监听 aweme/v1/web/danmaku/get_v2 重放该请求，但鉴权复杂目前未实现
    return player?.danmaku?.main?.data || []
  }

  /** 获取视频宽高 */
  getMediaSize(player: any): { width: number; height: number } {
    // NOTE: 这里主要是获取比例
    return { width: player?.sizeInfo?.width || 1920, height: player?.sizeInfo?.height || 1080 }
  }

  /** 毫秒转 ASS 时间格式 */
  msToAssTime(ms: number): string {
    const totalSec = ms / 1000
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    return `${h}:${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`.replace(/^0:/, "")
  }

  /** 十六进制颜色转 ASS 颜色格式 */
  hexToAssColor(hex: string): string {
    if (!hex || hex === "transparent") return "&H00FFFFFF"
    const c = hex.replace("#", "")
    if (c.length === 6) return "&H00" + c.slice(4, 6) + c.slice(2, 4) + c.slice(0, 2)
    return "&H00FFFFFF"
  }

  /**
   * 将弹幕数据转换为 ASS 文件内容
   */
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

  /**
   * 获取弹幕 ASS 文件内容
   */
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
