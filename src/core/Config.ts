import { Emitter } from "./Emitter"

interface Features {
  convert_webp_to_png: boolean
  download_video_mode: "default" | "max" | "min" | "1080P" | "720P" | "360P" | "2K" | "4K" | "max_file" | "min_file"
  filename_template: string
  filename_max_length: number
  video_download_codecs: "default" | "h264" | "h265" | "h264_prefer" | "h265_prefer"
  image_convert_codecs: "default" | "png" | "jpg" | "webp"
  image_resize_codecs: "default" | "2k_max" | "1k_max" | "960_max" | "640_max" | "512_max"
  image_quality: number
  using_downloader: "browser" | "idm" | "aria2" | "bc" | "abdm"
  downloader_config: {
    browser: Record<string, never>
    idm: { id: string }
    aria2: { dir: { video: string; image: string; other: string }; domain: string; port: string; path: string; token: string }
    bc: { dir: { video: string; image: string; other: string }; domain: string; port: string; path: string; authName: string; authPass: string }
    abdm: { dir: { video: string; image: string; other: string }; domain: string; port: string }
  }
  enable_profile_downloader: boolean
}

// #region 配置管理
export class Config {
  static defaults = {
    filename_template: "`${nickname}_${short_id}_${tags}_${desc}`",
  }

  static global = new Config()

  events = new Emitter<{
    config_change: []
  }>()

  features: Features = {
    /**
     * 是否开启图片转码
     *
     * @deprecated 已经废弃使用 image_convert_codecs 代替
     */
    convert_webp_to_png: true,
    /**
     * 下载视频分辨率策略
     * 可以选默认，最高清晰度，最小清晰度，和一些其他预设分辨率
     */
    download_video_mode: "default",
    /**
     * 文件名模板
     */
    filename_template: Config.defaults.filename_template,
    /**
     * 最大文件名长度
     */
    filename_max_length: 64,
    /**
     * 视频下载编码偏好
     *
     * 1. 默认，无偏好 "default"
     * 2. 只下载 h264 "h264"
     * 3. 只下载 h265 "h265"
     * 4. 优先 h264 "h264_prefer"
     * 5. 优先 h265 "h265_prefer"
     */
    video_download_codecs: "default",
    /**
     * 图片转码编码偏好
     *
     * 1. 默认，无偏好 "default"
     * 2. 转码为 png "png"
     * 3. 转码为 jpg "jpg"
     * 4. 转码为 webp "webp"
     */
    image_convert_codecs: "default",
    /**
     * 图片尺寸压缩偏好
     *
     * 1. 默认，无偏好 "default"
     * 2. 最大边小于 2k "2k_max"
     * 3. 最大边小于 1k "1k_max"
     * 4. 最大边小于 960 "960_max"
     * 5. 最大边小于 640 "640_max"
     * 5. 最大边小于 512 "512_max"
     */
    image_resize_codecs: "default",
    /**
     * 图片压缩率 必须开启转码或者尺寸压缩才有用
     *
     * 默认 80
     * 推荐 60 以上
     */
    image_quality: 80,
    /**
     * 使用什么下载器 默认为使用浏览器下载，可以配置其他下载
     */
    using_downloader: "browser",
    /**
     * 下载器配置
     *
     * 不同下载器有不同的配置
     */
    downloader_config: {
      browser: {
        // 没有配置
      },
      idm: { id: "1" },
      aria2: {
        // 不同类型的下载地址
        dir: { video: "`./douyin/${user_dir}/videos`", image: "`./douyin/${user_dir}/images`", other: "`./douyin/${user_dir}/others`" },
        domain: "http://localhost",
        port: "6800",
        path: "/jsonrpc",
        token: "",
      },
      bc: {
        dir: { video: "`./douyin/${user_dir}/videos`", image: "`./douyin/${user_dir}/images`", other: "`./douyin/${user_dir}/others`" },
        domain: "http://localhost",
        port: "8080",
        path: "/panel/task_add_httpftp_result",
        authName: "",
        authPass: "",
      },
      abdm: {
        // 不同类型的下载地址
        dir: { video: "`./douyin/${user_dir}/videos`", image: "`./douyin/${user_dir}/images`", other: "`./douyin/${user_dir}/others`" },
        domain: "http://localhost",
        port: "15151",
      },
    },
    /**
     * 是否开启作者页面下载器
     *
     * 默认关闭
     */
    enable_profile_downloader: false,
  }

  private _key = "__douyin-dl-user-js__"

  constructor() {
    try {
      this.load()
    } catch (error) {
      console.error(error)
    }
  }

  toJSON() {
    return { features: this.features }
  }

  load() {
    const raw = localStorage.getItem(this._key)
    if (raw) {
      const data = JSON.parse(raw)
      this.features = { ...this.features, ...data.features }
    }
  }

  save() {
    localStorage.setItem(this._key, JSON.stringify(this.toJSON()))
    this.events.emit("config_change")
  }

  clone_features(): Features {
    return JSON.parse(JSON.stringify(this.features))
  }
}
// #endregion
