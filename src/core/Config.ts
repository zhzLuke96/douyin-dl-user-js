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

export class Config {
  static defaults = {
    filename_template: "`${nickname}_${short_id}_${tags}_${desc}`",
  }

  static global = new Config()

  events = new Emitter<{
    config_change: []
  }>()

  features: Features = {
    convert_webp_to_png: true,
    download_video_mode: "default",
    filename_template: Config.defaults.filename_template,
    filename_max_length: 64,
    video_download_codecs: "default",
    image_convert_codecs: "default",
    image_resize_codecs: "default",
    image_quality: 80,
    using_downloader: "browser",
    downloader_config: {
      browser: {},
      idm: { id: "1" },
      aria2: {
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
        dir: { video: "`./douyin/${user_dir}/videos`", image: "`./douyin/${user_dir}/images`", other: "`./douyin/${user_dir}/others`" },
        domain: "http://localhost",
        port: "15151",
      },
    },
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
