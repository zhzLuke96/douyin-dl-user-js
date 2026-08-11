import { Emitter } from "./Emitter"

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

const getPathValue = (obj: any, path: string): unknown => {
  return path.split(".").reduce<any>((acc, key) => (acc == null ? undefined : acc[key]), obj)
}

const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, index) => deepEqual(value, b[index]))
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])]
    return keys.every((key) => deepEqual(a[key], b[key]))
  }
  return false
}

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
  enable_download_shortcut: boolean
  download_shortcut: string
  enable_profile_downloader: boolean
}

// #region 配置管理
export class Config {
  static defaults = {
    filename_template: "`${nickname}_${short_id}_${tags}_${desc}`",
  }

  static default_features(): Features {
    return new Config(false).clone_features()
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
     * 仅浏览器下载流程生效；外部下载器不会执行图片转码。
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
     * 仅浏览器下载流程生效；外部下载器不会执行图片压缩。
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
     * 仅浏览器下载流程生效；外部下载器不会执行图片压缩。
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
     * 是否启用下载快捷键
     *
     * 默认开启
     */
    enable_download_shortcut: true,
    /**
     * 下载当前媒体的快捷键
     *
     * 支持 M、Ctrl+M、Alt+M、Shift+M、Ctrl+Shift+M 等组合
     */
    download_shortcut: "m",
    /**
     * 是否开启作者页面下载器
     *
     * 默认关闭
     */
    enable_profile_downloader: false,
  }

  private _key = "__douyin-dl-user-js__"
  private _base: Features = this.clone_features()
  private _storage_handler = (event: StorageEvent) => {
    if (event.key !== null && event.key !== this._key) return
    try {
      this.load()
      this.events.emit("config_change")
    } catch (error) {
      console.error(error)
    }
  }

  constructor(load = true) {
    if (!load) return
    try {
      this.load()
    } catch (error) {
      console.error(error)
    }
    if (typeof window !== "undefined") {
      window.addEventListener("storage", this._storage_handler)
    }
  }

  toJSON() {
    return { features: this.features }
  }

  private static deepMerge<T>(base: T, patch: unknown): T {
    if (patch === null || typeof patch !== "object" || Array.isArray(patch)) {
      return (patch === undefined ? base : patch) as T
    }
    const result: any = Array.isArray(base) ? [...base] : { ...(base as object) }
    for (const key of Object.keys(patch as Record<string, unknown>)) {
      result[key] = this.deepMerge((base as any)?.[key], (patch as any)[key])
    }
    return result
  }

  static diff_paths(base: any, next: any, prefix = ""): string[] {
    const result: string[] = []
    const baseKeys = isPlainObject(base) ? Object.keys(base) : []
    const nextKeys = isPlainObject(next) ? Object.keys(next) : []
    const keys = [...new Set([...baseKeys, ...nextKeys])]
    for (const key of keys) {
      const path = prefix ? `${prefix}.${key}` : key
      const oldValue = isPlainObject(base) ? base[key] : undefined
      const newValue = isPlainObject(next) ? next[key] : undefined
      if (deepEqual(oldValue, newValue)) continue
      if (isPlainObject(oldValue) && isPlainObject(newValue)) {
        result.push(...this.diff_paths(oldValue, newValue, path))
      } else {
        result.push(path)
      }
    }
    return result
  }

  static apply_paths(target: any, source: any, paths: string[]): any {
    const result = JSON.parse(JSON.stringify(target))
    for (const path of paths) {
      const parts = path.split(".")
      let current = result
      for (let i = 0; i < parts.length - 1; i++) {
        if (!isPlainObject(current[parts[i]])) current[parts[i]] = {}
        current = current[parts[i]]
      }
      current[parts[parts.length - 1]] = getPathValue(source, path)
    }
    return result
  }

  private read_stored_features(): Features {
    const raw = localStorage.getItem(this._key)
    if (!raw) return Config.default_features()
    const data = JSON.parse(raw)
    const savedFeatures = data.features || {}
    const features = Config.deepMerge(Config.default_features(), savedFeatures)
    // 兼容旧版本：之前用空字符串禁用快捷键
    if (typeof savedFeatures.download_shortcut === "string" && !savedFeatures.download_shortcut.trim() && typeof savedFeatures.enable_download_shortcut !== "boolean") {
      features.enable_download_shortcut = false
    }
    return features
  }

  load() {
    this.features = this.read_stored_features()
    this._base = this.clone_features()
  }

  save() {
    const latest = this.read_stored_features()
    const patch = Config.diff_paths(this._base, this.features)
    this.features = Config.apply_paths(latest, this.features, patch)
    localStorage.setItem(this._key, JSON.stringify(this.toJSON()))
    this._base = this.clone_features()
    this.events.emit("config_change")
  }

  clone_features(): Features {
    return JSON.parse(JSON.stringify(this.features))
  }
}
// #endregion
