// ==UserScript==
// @name            抖音下载
// @namespace       https://github.com/zhzLuke96/douyin-dl-user-js
// @version         1.3.9
// @description     为web版抖音增加下载按钮
// @author          zhzluke96
// @match           https://*.douyin.com/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=douyin.com
// @license         MIT
// @supportURL      https://github.com/zhzLuke96/douyin-dl-user-js/issues
// @downloadURL     https://update.greasyfork.org/scripts/522326/%E6%8A%96%E9%9F%B3%E4%B8%8B%E8%BD%BD.user.js
// @updateURL       https://update.greasyfork.org/scripts/522326/%E6%8A%96%E9%9F%B3%E4%B8%8B%E8%BD%BD.meta.js
// @require         https://cdn.jsdelivr.net/npm/htm@3/preact/standalone.umd.js
// @grant           GM_xmlhttpRequest
// @connect         *
// ==/UserScript==

const requires = this;

(function () {
  "use strict";

  // #region tools function
  /*
   * 模板字符串函数
   * 用于占位标记用来触发编辑器高亮和格式化，没有实际作用
   *
   * @type {function(strings: TemplateStringsArray, ...values: any[]): string}}
   *
   * NOTE: 虽然都叫 HTML 但是和 htm 里面的不一样
   */
  const html = (strings, ...values) => String.raw(strings, ...values);

  /**
   * 在context下执行代码
   *
   * @type {(context: Record<any,any>, code: string) => any}
   */
  const runInContext = (context, code) => {
    const keys = Object.keys(context);
    const head = `const {${keys.join(", ")}} = __CTX__; `;
    const body = code.trim();
    const fn = new Function("__CTX__", `${head}\nreturn (${body})`);
    return fn(context);
  };
  /**
   * 日期格式化函数
   *
   * @type {(date: Date, format?: string) => string}
   */
  const formatDate = (date, format = "YYYY-MM-DD HH:mm:ss") => {
    const o = {
      YYYY: date.getFullYear(),
      MM: ("0" + (date.getMonth() + 1)).slice(-2),
      DD: ("0" + date.getDate()).slice(-2),
      HH: ("0" + date.getHours()).slice(-2),
      mm: ("0" + date.getMinutes()).slice(-2),
      ss: ("0" + date.getSeconds()).slice(-2),
    };
    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (m) => o[m]);
  };

  /**
   * 创建可定位的 Toast
   * @param {HTMLElement|string} [target] - 目标元素或选择器，用于将 Toast 定位在其正上方；若未提供则显示在右下角
   * @param {number} [defaultDuration=2000] - 默认自动消失时间（毫秒），设为 0 则不自动消失
   * @returns {{ update: (message: string, duration?: number) => void, close: () => void }}
   */
  function createToast(target, defaultDuration = 2000) {
    let toastEl = null;
    let timeoutId = null;

    // 解析目标元素（支持选择器字符串）
    const getTargetElement = () => {
      if (!target) return null;
      if (typeof target === "string") return document.querySelector(target);
      return target.nodeType === Node.ELEMENT_NODE ? target : null;
    };

    const updatePosition = () => {
      if (!toastEl) return;
      const targetEl = getTargetElement();
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const top = rect.top - toastEl.offsetHeight - 5; // 向上偏移5px
        const left = rect.left + (rect.width - toastEl.offsetWidth) / 2;
        toastEl.style.top = `${top}px`;
        toastEl.style.left = `${left}px`;
        toastEl.style.right = "auto";
        toastEl.style.bottom = "auto";
      } else {
        // 默认右下角
        toastEl.style.bottom = "20px";
        toastEl.style.right = "20px";
        toastEl.style.top = "auto";
        toastEl.style.left = "auto";
      }
    };

    const close = () => {
      if (toastEl) {
        toastEl.remove();
        toastEl = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const update = (message, duration = defaultDuration) => {
      if (!toastEl) {
        toastEl = document.createElement("div");
        toastEl.className = "dy-dl-toast";
        Object.assign(toastEl.style, {
          position: "fixed",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          zIndex: 999999,
          pointerEvents: "none",
          transition: "opacity 0.3s",
          fontFamily: "sans-serif",
          whiteSpace: "nowrap",
        });
        document.body.appendChild(toastEl);
      }
      toastEl.textContent = message;
      updatePosition();

      if (timeoutId) clearTimeout(timeoutId);
      if (duration > 0) {
        timeoutId = setTimeout(close, duration);
      }
    };

    return { update, close };
  }
  /**
   * 规范化文件名，移除非法字符，处理保留名称，限制长度
   * @param {string} name - 原始文件名（不包含路径）
   * @param {Object} [options] - 可选配置
   * @param {string} [options.replacementChar='_'] - 替换非法字符的字符
   * @param {number} [options.maxLength=255] - 最大文件名长度（不含扩展名的部分会优先截断）
   * @returns {string} 规范化后的文件名
   */
  function normalizeFilename(name, options = {}) {
    const { replacementChar = "_", maxLength = 255 } = options;

    if (typeof name !== "string") return "";

    // 1. 分离基本名和扩展名（最后一个点之后的部分）
    const lastDotIndex = name.lastIndexOf(".");
    let baseName = name;
    let extension = "";

    if (lastDotIndex > 0 && lastDotIndex < name.length - 1) {
      baseName = name.slice(0, lastDotIndex);
      extension = name.slice(lastDotIndex);
    }

    // 2. 替换非法字符：Windows 保留字符 + 路径分隔符 + 控制字符
    const illegalChars = /[\\/:*?"<>|\x00-\x1f\x7f]/g;
    let cleanBase = baseName.replace(illegalChars, replacementChar);

    // 3. 处理 Windows 保留设备名（如 CON, PRN, AUX, NUL, COM1 等）
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(\..*)?$/i;
    if (reservedNames.test(cleanBase)) {
      cleanBase = replacementChar + cleanBase;
    }

    // 4. 去除首尾空格和点号（某些文件系统不允许结尾点）
    cleanBase = cleanBase.trim().replace(/^\.+/, "").replace(/\.+$/, "");

    // 5. 防止空字符串
    if (cleanBase.length === 0) {
      cleanBase = "file";
    }

    // 6. 合并连续的 replacementChar 为单个（可选，视觉更干净）
    const multiReplacement = new RegExp(`${replacementChar}{2,}`, "g");
    cleanBase = cleanBase.replace(multiReplacement, replacementChar);

    // 7. 长度限制（优先保留扩展名）
    const maxBaseLength = maxLength - extension.length;
    if (maxBaseLength > 0 && cleanBase.length > maxBaseLength) {
      cleanBase = cleanBase.slice(0, maxBaseLength);
    }

    // 8. 重新组合
    let result = cleanBase + extension;

    // 最后再次确保结果不为空（极端情况）
    if (result.length === 0) {
      result = "file";
    }

    return result;
  }
  // #endregion

  // #region 配置管理
  class Config {
    static defaults = {
      filename_template: "`${nickname}_${short_id}_${tags}_${desc}`",
    };
    static global = new Config();

    features = {
      /**
       * 是否开启图片转码
       *
       * @deprecated 已经废弃使用 image_convert_codecs 代替
       */
      convert_webp_to_png: true,
      /**
       * 下载视频分辨率策略
       * 可以选默认，最高清晰度，最小清晰度，和一些其他预设分辨率
       *
       * @type {"default" | "max" | "min" | "1080P" | "720P" | "360P" | "2K" | "4K" | "max_file" | "min_file"}
       */
      download_video_mode: "default",
      /**
       * 文件名模板
       *
       *
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
       *
       * @type {"browser" | "abdm" | "aria2"}
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
        abdm: {
          dir: {
            // 不同类型的下载地址
            video: "`./douyin/${user_dir}/videos`",
            image: "`./douyin/${user_dir}/images`",
            other: "`./douyin/${user_dir}/others`",
          },
          domain: "http://localhost",
          port: "15151",
        },
        aria2: {
          dir: {
            // 不同类型的下载地址
            video: "`./douyin/${user_dir}/videos`",
            image: "`./douyin/${user_dir}/images`",
            other: "`./douyin/${user_dir}/others`",
          },
          domain: "http://localhost",
          port: "6800",
          path: "/jsonrpc",
          token: "",
        },
      },
    };

    _key = "__douyin-dl-user-js__";

    constructor() {
      try {
        this.load();
      } catch (error) {
        console.error(error);
      }
    }

    toJSON() {
      return {
        features: this.features,
      };
    }

    load() {
      if (localStorage.getItem(this._key)) {
        const data = JSON.parse(localStorage.getItem(this._key));
        this.features = {
          ...this.features,
          ...data.features,
        };
      }
    }

    save() {
      localStorage.setItem(this._key, JSON.stringify(this.toJSON()));
    }

    clone_features() {
      return JSON.parse(JSON.stringify(this.features));
    }
  }
  // #endregion

  // #region 下载历史管理
  class DownloadHistory {
    static STORAGE_KEY = "__douyin-dl-history__";
    static MAX_ITEMS = 50; // 最多保存50条记录

    static get() {
      try {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    }

    static add(media, downloadTime = Date.now()) {
      const history = this.get();
      const record = {
        id: media.awemeId || `hist_${Date.now()}_${Math.random()}`,
        desc: media.desc || "(无描述)",
        shareUrl: media.shareInfo?.shareUrl || "",
        downloadTime,
        media: {
          // 只保存必要字段，避免存储过大
          awemeId: media.awemeId,
          desc: media.desc,
          shareUrl: media.shareInfo?.shareUrl,
          authorNickname: media.authorInfo?.nickname,
          // 可额外保存封面等，但注意localStorage容量限制
        },
      };
      history.unshift(record); // 最新在前
      if (history.length > this.MAX_ITEMS) history.pop();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
      return record;
    }

    static clear() {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
  // #endregion

  // #region 图片转码压缩
  /**
   * @typedef {"default"|"png"|"jpg"|"webp"} ImageConvertCodecs
   * @typedef {"default"|"2k_max"|"1k_max"|"960_max"|"640_max"|"512_max"} ImageResizeCodecs
   *
   * @typedef {Object} ImageConfig
   * @property {ImageConvertCodecs} image_convert_codecs
   * @property {ImageResizeCodecs} image_resize_codecs
   * @property {number} image_quality
   */

  class ImageProcessor {
    /**
     * @param {Partial<ImageConfig>} config
     */
    constructor(config = {}) {
      /** @type {ImageConfig} */
      this.config = Object.assign(
        {
          image_convert_codecs: "default",
          image_resize_codecs: "default",
          image_quality: 80,
        },
        config
      );

      this.resizeMap = {
        "2k_max": 2048,
        "1k_max": 1024,
        "960_max": 960,
        "640_max": 640,
        "512_max": 512,
      };
    }

    /**
     * 根据配置判断是否需要压缩转码
     * @param {number} width
     * @param {number} height
     * @returns {boolean}
     */
    is_need_convert(width, height) {
      const { image_convert_codecs, image_resize_codecs } = this.config;
      const need_format = image_convert_codecs !== "default";
      const resize_target = this.resizeMap[image_resize_codecs] ?? Infinity;
      const need_resize = width > resize_target || height > resize_target;
      return need_format || need_resize;
    }

    /**
     * 主入口
     * @param {File|Blob} file
     * @returns {Promise<{blob:Blob,outputType:string}>}
     */
    async process(file) {
      const bitmap = await createImageBitmap(file);

      let { width, height } = bitmap;

      if (!this.is_need_convert(width, height)) {
        return { blob: file };
      }

      // 1. resize
      ({ width, height } = this._resize(width, height));

      const canvas = this._createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const outputType = this._getOutputType(file.type);

      // 2. 透明背景处理
      if (outputType === "image/jpeg") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(bitmap, 0, 0, width, height);

      // 3. encode
      const blob = await this._toBlob(canvas, outputType);

      return { blob, outputType };
    }

    /**
     * resize 逻辑
     * @private
     */
    _resize(width, height) {
      const mode = this.config.image_resize_codecs;
      const maxEdge = this.resizeMap[mode];

      if (!maxEdge) return { width, height };

      const scale = Math.min(1, maxEdge / Math.max(width, height));

      return {
        width: Math.round(width * scale),
        height: Math.round(height * scale),
      };
    }

    /**
     * canvas 创建（兼容 fallback）
     * @private
     */
    _createCanvas(width, height) {
      if (typeof OffscreenCanvas !== "undefined") {
        return new OffscreenCanvas(width, height);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }

    /**
     * 输出格式决策
     * @private
     */
    _getOutputType(inputType) {
      const codec = this.config.image_convert_codecs;

      if (codec === "png") return "image/png";
      if (codec === "jpg") return "image/jpeg";
      if (codec === "webp") return "image/webp";

      // default 策略
      if (inputType === "image/png") return "image/png";
      if (inputType === "image/webp") return "image/webp";

      return "image/jpeg";
    }

    /**
     * 质量归一化
     * @private
     */
    _normalizeQuality() {
      const q = this.config.image_quality;
      if (!q) return 0.8;
      return Math.min(1, Math.max(0.1, q / 100));
    }

    /**
     * toBlob 封装（兼容 HTMLCanvas）
     * @private
     */
    _toBlob(canvas, type) {
      const quality = this._normalizeQuality();

      // OffscreenCanvas
      if (canvas.convertToBlob) {
        return canvas.convertToBlob({ type, quality });
      }

      // HTMLCanvas fallback
      return new Promise((resolve) => {
        canvas.toBlob(resolve, type, quality);
      });
    }
  }
  // #endregion

  // #region API 拦截
  /**
   * XHR 拦截器工具类
   */
  class XhrInterceptor {
    constructor() {
      /**
       * 获取真实的 window 对象
       *
       * @type {Window & typeof globalThis}
       */
      this.win = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
      /**
       * @type {Function}
       */
      this.originalXhrOpen = this.win.XMLHttpRequest.prototype.open;
      /**
       * @type {Function}
       */
      this.originalXhrSend = this.win.XMLHttpRequest.prototype.send;
      /**
       * 存储注册的回调函数
       *
       * @type {{rule:RegExp|string|Function,callback:Function}[]}
       */
      this.listeners = [];
      this.isHooked = false;
    }

    /**
     * 启动拦截
     */
    start() {
      if (this.isHooked) return;
      const _this = this;
      const XHR = this.win.XMLHttpRequest;

      // 1. 劫持 open 方法，获取 URL 和 Method
      XHR.prototype.open = function (method, url, ...args) {
        // 将 url 挂载到实例上，供 send 阶段使用
        // 处理 url 可能是相对路径的情况，尽量保存原始字符串
        this._interceptor_url = url;
        this._interceptor_method = method;
        return _this.originalXhrOpen.apply(this, [method, url, ...args]);
      };

      // 2. 劫持 send 方法，监听 load 事件
      XHR.prototype.send = function (...args) {
        this.addEventListener("load", function () {
          const url = this._interceptor_url;
          if (!url) return;

          // 触发匹配的监听器
          _this.listeners.forEach((listener) => {
            if (_this._matchUrl(url, listener.rule)) {
              // 尝试解析 JSON
              let parsedData = null;
              try {
                if (this.responseType === "" || this.responseType === "text") {
                  parsedData = JSON.parse(this.responseText);
                } else if (this.responseType === "json") {
                  parsedData = this.response;
                }
              } catch (e) {
                // 非 JSON 数据，保持 null
              }

              // 回调：(解析后的数据, 原始XHR对象, 请求参数)
              listener.callback(parsedData, this.response, this, args);
            }
          });
        });

        return _this.originalXhrSend.apply(this, args);
      };

      this.isHooked = true;
      // console.log("[XhrInterceptor] 拦截器已启动");
    }

    /**
     * 注册拦截规则
     * @param {RegExp|string|Function} rule - URL 匹配规则 (字符串包含 或 正则表达式)
     * @param {Function} callback - 回调函数 (data, xhr, postData) => {}
     */
    on(rule, callback) {
      this.listeners.push({ rule, callback });
    }

    /**
     * 内部方法：匹配 URL
     *
     * @param {string} url
     * @param {RegExp|string|Function} rule
     */
    _matchUrl(url, rule) {
      if (typeof rule === "function") {
        return rule(url);
      }
      if (rule instanceof RegExp) {
        return rule.test(url);
      }
      return url.includes(rule);
    }
  }

  class AwemeHub {
    interceptor = new XhrInterceptor();

    constructor() {
      this._init_interceptor();
    }

    /**
     * 初始化拦截器
     */
    _init_interceptor() {
      const pathname = (pn) => (url) => {
        try {
          return new URL(url).pathname === pn;
        } catch (error) {
          return false;
        }
      };
      this.interceptor.on(
        pathname("/aweme/v1/web/aweme/post/"),
        /**
         *
         * @param {import("./types").DouyinResponses.GET_aweme_post} data
         * @param {*} resp
         */
        (data, resp) => {
          console.log("[dy-dl]", data);
        }
      );
      this.interceptor.on(
        pathname("/aweme/v1/web/general/search/single/"),
        /**
         *
         * @param {import("./types").DouyinResponses.GET_search_single} data
         * @param {*} resp
         */
        (data, resp) => {}
      );

      this.interceptor.start();
    }
  }
  // #endregion

  // #region 下载器
  class Downloader {
    // 暂时不用，因为收益不高，并且测试不完整
    // aweme_hub = new AwemeHub();

    constructor() {}

    /**
     * @param {Blob} blob
     */
    async convertWebPToPNG(blob) {
      // 创建一个图像对象来加载WebP
      const img = new Image();
      img.src = URL.createObjectURL(blob);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 创建canvas来转换图像
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      // 将图像绘制到canvas
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // 释放原始Blob URL
      URL.revokeObjectURL(img.src);

      return new Promise((resolve) => {
        // 将canvas转换为PNG Blob
        canvas.toBlob((pngBlob) => {
          resolve(pngBlob);
        }, "image/png");
        canvas.onerror = (e) => {
          console.error("WebP转PNG失败，回退到原格式:", e);
          resolve(blob); // Fallback to original blob
        };
      });
    }

    async get_headers(url) {
      const response = await fetch(url, {
        method: "HEAD",
      });
      return response.headers;
    }

    /**
     * 根据请求头猜测完整文件名
     *
     * @param dl_url {string}
     * @param filename_input {string} 输入的文件名，如果有就用这个，没有就从请求体里面找
     * @returns
     */
    async prepare_filename(dl_url, filename_input = "") {
      if (dl_url.startsWith("//")) {
        const protocol = window.location.protocol;
        dl_url = `${protocol}${dl_url}`;
      }

      const headers = await this.get_headers(dl_url);
      const content_disposition = headers.get("content-disposition");
      const content_type = headers.get("content-type");
      const content_length = headers.get("content-length");
      // const content_encoding = headers.get("content-encoding");
      // const content_range = headers.get("content-range");
      // const last_modified = headers.get("last-modified");
      // const expires = headers.get("expires");
      // const cache_control = headers.get("cache-control");
      // const etag = headers.get("etag");

      const isImage = content_type.startsWith("image/");
      const isWebP = content_type.includes("webp");
      const isVideo = content_type.startsWith("video/");

      let fileExtGuess = content_type.split("/")[1]?.toLowerCase();
      if (!fileExtGuess && isImage)
        fileExtGuess = "jpg"; // fallback for image/*
      else if (!fileExtGuess) fileExtGuess = "bin"; // fallback for unknown

      let determinedFileExt = isImage
        ? isWebP
          ? "png" // Target extension for WebP after conversion
          : fileExtGuess
        : fileExtGuess;

      // 如果有 content-disposition 且包含 filename 使用其中的后缀名
      if (content_disposition) {
        const contentDispositionMatch =
          content_disposition.match(/filename="(.+)"$/i);
        if (contentDispositionMatch) {
          const filename = contentDispositionMatch[1];
          const fileExt = filename.split(".").pop().toLowerCase();
          if (fileExt) determinedFileExt = fileExt;
        }
      }

      let filename =
        filename_input || url.pathname.split("/").pop() || "download";
      if (filename.endsWith(".image")) {
        filename = filename.slice(0, -".image".length);
      }
      // Remove any existing extension before appending the new one
      const filename_base = filename.replace(/\.[^/.]+$/, "");
      // Ensure filename ends with the determined extension
      const currentExtPattern = new RegExp(`\\.${determinedFileExt}$`, "i");
      if (!currentExtPattern.test(filename)) {
        filename = `${filename_base}.${determinedFileExt}`;
      }

      return {
        filename,
        ext: determinedFileExt,
        isImage,
        isVideo,
        headers,
        content_length,
      };
    }

    /**
     * 预下载文件
     *
     * PS: 这一步其实没有下载，而是通过浏览器的缓存读取了
     * PSS: 并且如果浏览器没有缓存，似乎会报错，因为server那边会校验cookie，我们没带上（现在不知道要带上什么...在js里也没法重放请求...）
     *
     * @param dl_url {string}
     * @param filename_input {string} 输入的文件名，如果有就用这个，没有就从请求体里面找
     * @returns {Promise<{ok: boolean, blob?: Blob, filename?: string, isImage?: boolean, isWebP?: boolean, pngBlob?: Blob | null, fileExt?: string, error?: string, contentType?: string, filename_base?: string}>}
     */
    async prepare_download_file(dl_url, filename_input = "") {
      if (dl_url.startsWith("//")) {
        const protocol = window.location.protocol;
        dl_url = `${protocol}${dl_url}`;
      }
      const url = new URL(dl_url);
      const response = await fetch(dl_url);
      if (!response.ok) {
        // Original script had: alert("Failed to fetch the file");
        // We now return an error status for the caller to decide.
        return {
          ok: false,
          error: `Failed to fetch the file: ${response.status} ${response.statusText}`,
        };
      }
      const contentType = response.headers.get("content-type");
      if (!contentType) {
        return { ok: false, error: "Content-Type header missing" };
      }
      const isImage = contentType.startsWith("image/");
      const isWebP = contentType.includes("webp");

      let fileExtGuess = contentType.split("/")[1]?.toLowerCase();
      if (!fileExtGuess && isImage)
        fileExtGuess = "jpg"; // fallback for image/*
      else if (!fileExtGuess) fileExtGuess = "bin"; // fallback for unknown

      const determinedFileExt = isImage
        ? isWebP
          ? "png" // Target extension for WebP after conversion
          : fileExtGuess
        : fileExtGuess;

      let filename =
        filename_input || url.pathname.split("/").pop() || "download";
      if (filename.endsWith(".image")) {
        filename = filename.slice(0, -".image".length);
      }
      // Remove any existing extension before appending the new one
      const filename_base = filename.replace(/\.[^/.]+$/, "");
      // Ensure filename ends with the determined extension
      const currentExtPattern = new RegExp(`\\.${determinedFileExt}$`, "i");
      if (!currentExtPattern.test(filename)) {
        filename = `${filename_base}.${determinedFileExt}`;
      }

      const blob = await response.blob();

      return {
        blob,
        filename,
        filename_base,
        isImage,
        isWebP,
        contentType,
        fileExt: determinedFileExt,
        ok: true,
      };
    }

    /**
     * @param {Blob} blob
     * @param {string} filename
     */
    async download_blob(blob, filename) {
      const link = document.createElement("a");
      link.style.display = "none";
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }

    /**
     * 下载后处理
     *
     * 1. 转码、压缩图片
     *
     * @param {Blob} blob
     * @param {string} content_type
     */
    async download_postprocess(blob, content_type) {
      if (content_type.startsWith("image/")) {
        // 图片走压缩
        const processor = new ImageProcessor(Config.global.clone_features());
        const { blob: new_blob, outputType } = await processor.process(blob);
        return { blob: new_blob, output_type: outputType };
      }
      return { blob, output_type: content_type };
    }

    /**
     * 使用浏览器下载数据
     *
     * 下载文件流程:
     *
     * 1. 预下载为 blob ，读取元信息
     * 2. 如果是 webp 图片，尝试转为 png 图片
     * 3. 下载 blob
     *
     * @param source {string}
     * @param filename_input {string} 输入的文件名，如果有就用这个，没有就从请求体里面找
     */
    async download_using_browser(url, filename_input) {
      let blob, filename;
      try {
        const result = await this.prepare_download_file(url, filename_input);
        if (!result.ok) {
          const error_msg = `[dy-dl]预下载失败 (${
            result.error || "Unknown error"
          })，将重试其他地址: ${url}`;
          return { ok: false, error_msg };
        }
        filename = result.filename;
        blob = result.blob;

        // 压缩图片
        const { blob: new_blob, output_type } = await this.download_postprocess(
          blob,
          result.contentType ?? ""
        );
        blob = new_blob;
        // 修改图片文件名后缀
        switch (output_type) {
          case "image/png": {
            filename = result.filename_base + ".png";
            break;
          }
          case "image/jpeg": {
            filename = result.filename_base + ".jpeg";
            break;
          }
          case "image/webp": {
            filename = result.filename_base + ".webp";
            break;
          }
          default: {
            break;
          }
        }
      } catch (error) {
        console.error(`[dy-dl]预下载异常，将重试其他地址: ${url}`, error);
        const error_msg = "Failed to fetch the file due to an exception";
        return { ok: false, error_msg };
      }

      // Download original blob (or if PNG download failed)
      if (blob) {
        try {
          await this.download_blob(blob, filename);
          return { ok: true, error_msg: "" };
        } catch (error) {
          console.error(
            `[dy-dl]下载blob失败，尝试其他版本: ${filename}`,
            error
          );
          return {
            ok: false,
            error_msg: "Failed to download the file due to an exception",
          };
        }
      }
      return {
        ok: false,
        error_msg: "Failed to download the file due to an exception",
      };
    }

    /**
     * 根据配置使用不同的下载器
     * @param {string} url
     * @param {string} filename_input
     */
    async download_one_url(url, filename_input) {
      const { using_downloader, downloader_config } = Config.global.features;
      switch (using_downloader) {
        case "browser":
          return this.download_using_browser(url, filename_input);
        case "aria2":
        case "abdm":
          return new DownloaderLauncher({
            abdmList: [
              {
                domain: downloader_config.abdm?.domain ?? "http://localhost",
                port: downloader_config.abdm?.port ?? "15151",
                dir: "",
              },
            ],
            aria2List: [
              {
                domain: downloader_config.aria2?.domain ?? "http://localhost",
                port: downloader_config.aria2?.port ?? "6800",
                path: downloader_config.aria2?.path ?? "/jsonrpc",
                token: downloader_config.aria2?.token ?? "",
                dir: "",
              },
            ],
          })
            .invoke_download(
              url,
              using_downloader,
              downloader_config[using_downloader].dir
            )
            .then((x) => ({ ok: x, error_msg: "" }));
        default: {
          throw new Error(`[dy-dl]未知下载器: ${using_downloader}`);
          break;
        }
      }
    }

    /**
     * 下载文件 根据所有url逐一尝试下载
     */
    async download_file(source, filename_input = "", fallback_src = []) {
      let url_sources = [source, ...fallback_src].filter(
        (x) => typeof x === "string" && x.length > 0
      );
      url_sources = Array.from(new Set(url_sources));

      let error_msg = "";

      for (const url of url_sources.values()) {
        const { ok, error_msg: emsg } = await this.download_one_url(
          url,
          filename_input
        );
        error_msg = error_msg || emsg;
        if (ok) {
          return;
        }
      }

      // If all downloads failed, show an alert.
      // If the first attempt failed with a "Failed to fetch" style error, replicate original alert.
      if (error_msg && url_sources.length === 1) {
        alert(error_msg);
      } else {
        alert(`[dy-dl]所有尝试下载都失败，请刷新重试`);
      }
    }
  }
  // #endregion

  // #region Modal
  class Modal {
    /**
     * callback会在创建element之后调用
     * @param {(root: HTMLElement, overlay: Element) => any} callback
     */
    constructor(callback) {
      this.overlay = document.createElement("div");
      Object.assign(this.overlay.style, {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      });

      this.root = document.createElement("div");
      Object.assign(this.root.style, {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        minWidth: "300px",
        minHeight: "150px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      });

      // 阻止事件冒泡，防止点击 root 也触发关闭
      this.root.addEventListener("click", (e) => e.stopPropagation());

      this.overlay.addEventListener("click", () => this.close());

      this.overlay.appendChild(this.root);
      document.body.appendChild(this.overlay);

      if (typeof callback === "function") {
        callback(this.root, this.overlay);
      }
    }

    close() {
      this.overlay.remove();
    }
  }
  // #endregion

  // #region 下载器唤醒
  /**
   * 下载器唤醒工具类
   * 支持：IDM、Aria2、BitComet、AB Download Manager
   */
  class DownloaderLauncher {
    /**
     * @param {Object} config 全局配置（可选，也可在调用方法时传入具体配置）
     * @param {Array} config.idmList IDM配置列表，默认 [{ id: "1", default: true }]
     * @param {Array} config.aria2List Aria2配置列表
     * @param {Array} config.bitcometList BitComet配置列表
     * @param {Array} config.abdmList ABDM配置列表
     * @param {string} config.curlTerminal 终端类型，默认 "wc" (Windows CMD)
     */
    constructor(config = {}) {
      this.config = {
        idmList: config.idmList || [{ id: "1" }],
        aria2List: config.aria2List || [
          {
            domain: "http://localhost",
            port: "6800",
            path: "/jsonrpc",
            token: "",
            dir: "",
          },
        ],
        bitcometList: config.bitcometList || [
          {
            domain: "http://localhost",
            port: "8080",
            path: "/panel/task_add_httpftp_result",
            authName: "",
            authPass: "",
            dir: "",
          },
        ],
        abdmList: config.abdmList || [
          {
            domain: "http://localhost",
            port: "15151",
            dir: "",
          },
        ],
        curlTerminal: config.curlTerminal || "wc", // wc, wp, lt, ls, mt
      };
    }

    // ==================== 简化入口 ====================
    /**
     * 简化入口
     * @param {string} url
     * @param {"idm" | "aria2" | "bc" | "abdm"} dl_name 下载器名称
     * @param {void | null | {video: string, image: string, other: string}} dir_config 下载文件夹配置
     */
    async invoke_download(url, dl_name = "abdm", dir_config) {
      const input_filename = await mediaHandler._build_filename();
      const { filename, isVideo, isImage } =
        await mediaHandler.downloader.prepare_filename(
          url,
          normalizeFilename(input_filename)
        );
      const user_dir = normalizeFilename(
        `${mediaHandler.current_media.authorInfo.uid}_${mediaHandler.current_media.authorInfo.nickname}`
      );
      // TODO: 下载文件夹位置暂时不支持配置
      switch (dl_name) {
        case "abdm": {
          return this.launchABDM(
            url,
            filename,
            {},
            {
              dir: isVideo
                ? `./douyin/${user_dir}/videos`
                : isImage
                ? `./douyin/${user_dir}/images`
                : `./douyin/${user_dir}/others`,
            }
          );
        }
        case "aria2": {
          return this.launchAria2(
            url,
            filename,
            {},
            {
              dir: isVideo
                ? `./douyin/${user_dir}/videos`
                : isImage
                ? `./douyin/${user_dir}/images`
                : `./douyin/${user_dir}/others`,
            }
          );
        }
        default: {
          throw new Error(`Unknown download name: ${dl_name}`);
        }
      }
    }

    // ==================== 辅助方法 ====================
    /**
     * 获取默认配置项
     * @param {string} type idm | aria2 | bitcomet | abdm
     * @returns {Object} 默认配置对象
     */
    getDefaultConfig(type) {
      const listMap = {
        idm: this.config.idmList,
        aria2: this.config.aria2List,
        bitcomet: this.config.bitcometList,
        abdm: this.config.abdmList,
      };
      const list = listMap[type];
      if (!list) throw new Error(`Unknown type: ${type}`);
      const defaultItem = list.find((item) => item.default) || list[0];
      return defaultItem;
    }

    /**
     * 标准化请求头：转换为对象，添加常用默认头
     * @param {Object|string} headers 原始头
     * @param {boolean} addDefault 是否添加默认头（DNT, Cache-Control等）
     * @returns {Object}
     */
    static normalizeHeaders(headers = {}, addDefault = false) {
      if (typeof headers === "string") {
        const raw = {};
        headers.split(/[\r\n]+/).forEach((line) => {
          if (!line.trim() || !line.includes(":")) return;
          const [key, ...parts] = line.split(":");
          raw[key.trim().toLowerCase()] = parts.join(":").trim();
        });
        headers = raw;
      }
      const newHeaders = {};
      for (let key in headers) {
        let value = headers[key];
        if (typeof value === "object") value = JSON.stringify(value);
        else value = String(value);
        const normalizedKey = key
          .toLowerCase()
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join("-");
        newHeaders[normalizedKey] = value;
      }
      if (addDefault) return newHeaders;
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
      };
    }

    /**
     * 可跨域 xmlhttpRequest 请求
     * @author hmjz100
     * @description 封装 `GreaseMonkey-Compatible_xmlhttpRequest` 实现的跨域请求，与原始函数参数相同，支持回调和 await 两种用法
     * @param {Object} option - 请求配置对象
     * @returns {XMLHttpRequest|Promise} 请求对象实例或 Promise
     */
    static xmlHttpRequest(option) {
      let xmlHttpRequest =
        typeof GM_xmlhttpRequest === "function"
          ? GM_xmlhttpRequest
          : typeof GM?.xmlHttpRequest === "function"
          ? GM.xmlHttpRequest
          : null;
      if (!xmlHttpRequest || typeof xmlHttpRequest !== "function")
        throw new Error("GreaseMonkey 兼容 XMLHttpRequest 不可用。");

      return xmlHttpRequest({ withCredentials: true, ...option });
    }

    /**
     * 发送HTTP请求 使用 gm-xmlhttpRequest 发起跨域请求 aria2 需要这个不然没法请求
     * @param {string} url
     * @param {Object} options fetch选项
     * @returns {Promise<Object>}
     */
    static request_cors(url, options = {}) {
      return new Promise((resolve, reject) => {
        const {
          method = "GET",
          headers = {},
          body,
          timeout = 30000,
          responseType,
        } = options;

        this.xmlHttpRequest({
          method,
          url,
          headers,
          data: body,
          timeout,
          responseType, // 可选：'json' / 'blob' / 'arraybuffer'

          onload: (res) => {
            let data = res.response;

            // fallback 解析（当没指定 responseType 时）
            if (!responseType) {
              const contentType = res.responseHeaders || "";

              if (contentType.includes("application/json")) {
                try {
                  data = JSON.parse(res.responseText);
                } catch (e) {
                  data = res.responseText;
                }
              } else {
                data = res.responseText;
              }
            }

            resolve({
              status: res.status,
              data,
              headers: res.responseHeaders,
            });
          },

          onerror: (err) => {
            reject(err);
          },

          ontimeout: () => {
            reject(new Error("Request timeout"));
          },
        });
      });
    }

    /**
     * 发送HTTP请求 默认用这个请求，不需要权限
     * @param {string} url
     * @param {Object} options fetch选项
     * @returns {Promise<Object>}
     */
    static async request(url, options = {}) {
      const response = await fetch(url, options);
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      return { status: response.status, data };
    }

    /**
     * 格式化文件大小（用于调试）
     * @param {number} bytes
     * @returns {string}
     */
    static formatSize(bytes) {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    /**
     * 生成cURL命令
     * @param {string} link
     * @param {string} filename
     * @param {Object} headers 额外请求头
     * @param {string} terminal 终端类型 wc|wp|lt|ls|mt
     * @returns {string}
     */
    static toCurlCommand(link, filename, headers = {}, terminal = "wc") {
      const curlCmd = terminal !== "wp" ? "curl" : "curl.exe";
      const headerArgs = Object.entries(headers)
        .map(([k, v]) => `-H "${k}: ${v}"`)
        .join(" ");
      const safeFilename = filename.replace(/[!?&|`"'*\/:<>\\]/g, "_");
      return `${curlCmd} -L -C - "${link}" -o "${safeFilename}" ${headerArgs}`.trim();
    }

    /**
     * 生成BC链接（比特彗星专用）
     * @param {string} link
     * @param {string} filename
     * @param {Object} headers 额外请求头（将被编码进协议）
     * @returns {string}
     */
    static toBitCometLink(link, filename, headers = {}) {
      const safeFilename = filename.replace(/[!?&|`"'*\/:<>\\]/g, "_");
      const query = new URLSearchParams();
      query.append("url", link);
      for (const [k, v] of Object.entries(headers)) {
        query.append(k, v);
      }
      const queryStr = query.toString();
      const bcData = `AA/${encodeURIComponent(safeFilename)}/?${queryStr}ZZ`;
      const base64Data = btoa(unescape(encodeURIComponent(bcData)));
      return `bc://http/${base64Data}`;
    }

    // ==================== 唤醒方法 ====================

    /**
     * 发送到 IDM
     * @param {string} link 下载链接
     * @param {string} filename 文件名
     * @param {number} filesize 文件大小（字节）
     * @param {Object} headers 请求头（可选）
     * @param {Object} idmConfig 可选，覆盖默认配置
     * @returns {Promise<boolean>} 是否成功
     */
    async launchIDM(link, filename, filesize, headers = {}, idmConfig = null) {
      const config = { ...this.getDefaultConfig("idm"), ...idmConfig };
      const clientId = config.id;
      if (!clientId) throw new Error("IDM client id missing");

      const seq = (this._idmSeq = (this._idmSeq || 1) + 1);
      const time = Date.now();
      const url = `http://127.0.0.1:1001/client/${clientId}?seq=${seq}`;
      const ext = filename.split(".").pop().toUpperCase();

      const normHeaders = DownloaderLauncher.normalizeHeaders(headers);
      let headersText =
        Object.entries(normHeaders)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n") + "\n";

      const format = (key, val) => {
        if (val === undefined || val === null) return "";
        const strVal = String(val);
        const len = new Blob([strVal]).size;
        return `${key}=${len}:${strVal}`;
      };

      const fields = [
        format(4, ext),
        format(6, link),
        format(7, location.origin),
        format(11, headersText),
        format(100, filename),
        format(122, 4),
      ];
      const data = `MSG#${seq}#13#1#10241:${
        seq + 1000
      }:0:${time}:0:1:2:${filesize}:0,${fields.join(",")};`;

      try {
        const res = await DownloaderLauncher.request(url, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: data,
        });
        return res.data === `${seq}:3;`;
      } catch (e) {
        console.error("IDM launch failed", e);
        return false;
      }
    }

    /**
     * 发送到 Aria2
     * @param {string} link
     * @param {string} filename
     * @param {Object} headers 请求头（将转为 --header 数组）
     * @param {Object} aria2Config 可选，覆盖默认配置
     * @returns {Promise<boolean>}
     */
    async launchAria2(link, filename, headers = {}, aria2Config = null) {
      const config = { ...this.getDefaultConfig("aria2"), ...aria2Config };
      const url = `${config.domain}:${config.port}${config.path}`;
      const headerList = Object.entries(
        DownloaderLauncher.normalizeHeaders(headers)
      ).map(([k, v]) => `${k}: ${v}`);
      const rpcData = {
        id: Date.now(),
        jsonrpc: "2.0",
        method: "aria2.addUri",
        params: [
          `token:${config.token}`,
          [link],
          {
            dir: config.dir || undefined,
            out: filename,
            header: headerList,
          },
        ],
      };
      try {
        const res = await DownloaderLauncher.request_cors(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rpcData),
        });
        return !!res.data?.result;
      } catch (e) {
        console.error("Aria2 launch failed", e);
        return false;
      }
    }

    /**
     * 发送到比特彗星 (BitComet)
     * @param {string} link
     * @param {string} filename
     * @param {Object} headers 请求头（将转为表单字段）
     * @param {Object} bitcometConfig 可选，覆盖默认配置
     * @returns {Promise<boolean>}
     */
    async launchBitComet(link, filename, headers = {}, bitcometConfig = null) {
      const config = {
        ...this.getDefaultConfig("bitcomet"),
        ...bitcometConfig,
      };
      const url = `${config.domain}:${config.port}${config.path}`;
      const formData = new URLSearchParams();
      formData.append("url", link);
      if (config.dir) formData.append("save_path", config.dir);
      formData.append("file_name", filename);
      formData.append("connection", "200");
      const normHeaders = DownloaderLauncher.normalizeHeaders(headers);
      for (const [k, v] of Object.entries(normHeaders)) {
        formData.append(k, v);
      }
      const auth = btoa(`${config.authName}:${config.authPass}`);
      try {
        const res = await DownloaderLauncher.request(url, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        });
        // 比特彗星成功时返回空或特定字符串；失败包含 "Add task failed!"
        return !res.data.includes("Add task failed!");
      } catch (e) {
        // 某些版本即使成功也会报网络错误，这里视为成功（实际需根据经验调整）
        console.warn("BitComet launch may have succeeded despite error", e);
        return true;
      }
    }

    /**
     * 发送到 AB Download Manager
     * @param {string} link
     * @param {string} filename
     * @param {Object} headers 请求头
     * @param {Object} abdmConfig 可选，覆盖默认配置
     * @returns {Promise<boolean>}
     */
    async launchABDM(link, filename, headers = {}, abdmConfig = null) {
      const config = { ...this.getDefaultConfig("abdm"), ...abdmConfig };
      const url = `${config.domain}:${config.port}/start-headless-download`;
      const normHeaders = DownloaderLauncher.normalizeHeaders(headers);
      const payload = {
        downloadSource: {
          link: link,
          headers: normHeaders,
          downloadPage: normHeaders["Referer"] || location.href,
        },
        name: filename,
      };
      if (config.dir) payload.folder = config.dir;
      try {
        const res = await DownloaderLauncher.request(url, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify(payload),
        });
        return res.data === "OK";
      } catch (e) {
        console.error("ABDM launch failed", e);
        return false;
      }
    }

    // 以下是同步命令生成方法（不实际唤醒）
    getCurlCommand(link, filename, headers = {}) {
      return DownloaderLauncher.toCurlCommand(
        link,
        filename,
        headers,
        this.config.curlTerminal
      );
    }

    getBitCometLink(link, filename, headers = {}) {
      return DownloaderLauncher.toBitCometLink(link, filename, headers);
    }

    getAria2Command(link, filename, headers = {}) {
      const headerArgs = Object.entries(headers)
        .map(([k, v]) => `--header "${k}: ${v}"`)
        .join(" ");
      const safeFilename = filename.replace(/[!?&|`"'*\/:<>\\]/g, "_");
      return `aria2c "${link}" --out "${safeFilename}" ${headerArgs}`.trim();
    }
  }

  // #endregion

  // #region Media Detail Model

  // 媒体详情 modal
  const MediaModalComponents = (() => {
    /**
     * @type {import('preact/hooks')}
     */
    const { useState, useRef, useEffect } = requires?.htmPreact;
    /**
     * @type {import('preact').h}
     */
    const html = requires?.htmPreact?.html;

    // --- 样式常量 (CSS-in-JS) ---
    const styles = {
      container:
        "display: flex; flex-direction: column; height: 80vh; overflow: hidden;",
      nav: "display: flex; border-bottom: 1px solid #ccc; flex-shrink: 0; background: #f9f9f9;",
      navBtn: (active) =>
        `padding: 10px 15px; border: none; background: ${
          active ? "#fff" : "transparent"
        }; cursor: pointer; border-bottom: 2px solid ${
          active ? "#007bff" : "transparent"
        }; font-weight: ${active ? "bold" : "normal"}; color: ${
          active ? "#007bff" : "#333"
        }; outline: none; transition: all 0.2s;`,
      content: "flex-grow: 1; overflow-y: auto; padding: 15px;",
      fieldset:
        "border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px; padding: 10px;",
      legend: "font-weight: bold; padding: 0 5px; color: #555;",
      row: "display: flex; padding: 6px 0; font-size: 14px; border-bottom: 1px solid #f5f5f5; align-items: center;",
      label: "width: 100px; flex-shrink: 0; color: #666; font-weight: 600;",
      value: "flex-grow: 1; color: #333; word-break: break-all;",
      btn: "padding: 2px 8px; font-size: 12px; cursor: pointer; border: 1px solid #ccc; background: #fff; border-radius: 3px; margin-left: 5px;",
      img: "max-width: 100px; max-height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;",
      table:
        "width: 100%; font-size: 12px; border-collapse: collapse; text-align: left;",
      th: "border: 1px solid #ddd; padding: 6px; background: #f5f5f5;",
      td: "border: 1px solid #ddd; padding: 6px;",
    };

    // --- 辅助函数 ---
    const fmt = {
      ts: (ts) => (ts ? new Date(ts * 1000).toLocaleString() : "N/A"),
      num: (n) => (n > 10000 ? (n / 10000).toFixed(1) + " 万" : n || 0),
      size: (s) => (s ? (s / 1024 / 1024).toFixed(2) + " MB" : "-"),
    };

    // --- 原子组件 ---

    // 基础键值对
    const KeyValue = ({ label, children }) => html`
      <div style=${styles.row}>
        <strong style=${styles.label}>${label}</strong>
        <span style=${styles.value}>${children || "-"}</span>
      </div>
    `;

    // 可复制的键值对
    const Copyable = ({ label, value }) => {
      const [copied, setCopied] = useState(false);
      const handleCopy = () => {
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      };
      if (!value) return html`<${KeyValue} label=${label} />`;
      return html`
        <div style=${styles.row}>
          <strong style=${styles.label}>${label}</strong>
          <span style=${styles.value}>${value}</span>
          <button style=${styles.btn} onClick=${handleCopy}>
            ${copied ? "已复制" : "复制"}
          </button>
        </div>
      `;
    };

    // 表格组件
    const Table = ({ headers, rows }) => html`
      <table style=${styles.table}>
        <thead>
          <tr>
            ${headers.map((h) => html`<th style=${styles.th}>${h}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${rows.map(
            (row) =>
              html`<tr>
                ${row.map((cell) => html`<td style=${styles.td}>${cell}</td>`)}
              </tr>`
          )}
        </tbody>
      </table>
    `;

    // --- Tab 内容组件 ---
    /**
     * Launcher 配置
     */
    const launchers = [
      {
        key: "browser",
        label: "打开",
        buildUrl: (url) => url,
      },
      {
        key: "copy",
        label: "复制",
        buildUrl: () => null,
        action: (url) => {
          navigator.clipboard.writeText(url);
          alert("复制成功");
        },
      },
      {
        key: "potplayer",
        label: "PotPlayer",
        buildUrl: (url) => "potplayer://" + url,
      },
      // {
      //   key: "baiduyunguanjia",
      //   label: "百度盘",
      //   buildUrl: (url, { filename }) =>
      //     `baiduyunguanjia://${encodeURIComponent(url)}`,
      // },
      // {
      //   key: "qkclouddrive",
      //   label: "夸克盘",
      //   buildUrl: (url, { filename }) =>
      //     `qkclouddrive://${encodeURIComponent(url)}`,
      // },
      // {
      //   key: "fdm",
      //   label: "fdm",
      //   buildUrl: (url, { filename }) => `fdm://${encodeURIComponent(url)}`,
      // },
      // {
      //   key: "idm",
      //   label: "idm",
      //   buildUrl: () => null,
      //   action: async (url) => {
      //     const input_filename = await mediaHandler._build_filename();
      //     const { filename, isVideo, isImage, content_length } =
      //       await mediaHandler.downloader.prepare_filename(url, input_filename);
      //     const luncher = new DownloaderLauncher();
      //     luncher.launchIDM(
      //       url,
      //       filename,
      //       Number(content_length || ""),
      //       {},
      //       {
      //         // TODO 增加配置
      //       }
      //     );
      //   },
      // },
      {
        key: "abdm",
        label: "abdm",
        buildUrl: () => null,
        action: async (url, {}) => {
          const launcher = new DownloaderLauncher();
          await launcher.invoke_download(url, "abdm");
        },
      },
      {
        key: "aria2",
        label: "aria2",
        buildUrl: () => null,
        action: async (url) => {
          const launcher = new DownloaderLauncher();
          await launcher.invoke_download(url, "aria2");
        },
      },
    ];

    /**
     * 通用唤醒按钮组
     */
    const LaunchButtons = ({ url, launchers }) => {
      return html`
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${launchers.map((l) => {
            const href = l.buildUrl?.(url, {});

            if (l.action) {
              return html`
                <button onClick=${() => l.action(url, {})}>${l.label}</button>
              `;
            }

            if (href) {
              return html`
                <a href=${href} target="_blank">
                  <button>${l.label}</button>
                </a>
              `;
            }

            return null;
          })}
        </div>
      `;
    };

    /**
     * @type {((_:{media: import("./types").DouyinMedia.MediaRoot | null, filenameBase: string})) => any}
     */
    const MediaTab = ({ media, filenameBase }) => {
      if (!media) return "无媒体信息";
      const { video, images, music } = media;

      /**
       * 视频部分
       */
      const VideoSection = () => {
        if (!video?.bitRateList?.length) return null;

        const coverUrl =
          video.originCoverUrlList?.[1] || video.originCoverUrlList?.[0];

        // 可以按需裁剪 launcher（例如视频才有 potplayer）
        const videoLaunchers = launchers;

        return html`
          <fieldset style=${styles.fieldset}>
            <legend style=${styles.legend}>视频封面</legend>
            <div style="display: flex; gap: 15px;">
              <img src=${coverUrl} style="width: 120px; border-radius: 4px;" />
              <div>
                <p><strong>分辨率:</strong> ${video.width} × ${video.height}</p>
                <div style="margin-top: 10px;">
                  <a href=${coverUrl} target="_blank" style=${styles.btn}>
                    新标签打开
                  </a>
                  <a
                    href=${coverUrl}
                    download=${`cover_${filenameBase}.jpeg`}
                    style=${styles.btn}
                  >
                    下载封面
                  </a>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset style=${styles.fieldset}>
            <legend style=${styles.legend}>视频源</legend>
            <${Table}
              headers=${[
                "清晰度",
                "分辨率",
                "编码",
                "FPS",
                "码率(kbps)",
                "大小",
                "操作",
              ]}
              rows=${video.bitRateList.map((v) => [
                v.gearName,
                `${v.width}×${v.height}`,
                v.isH265 ? "H.265" : "H.264",
                v.fps,
                (v.bitRate / 1000).toFixed(0),
                fmt.size(v.dataSize),
                v.playApi
                  ? html`
                      <${LaunchButtons}
                        url=${v.playApi}
                        launchers=${videoLaunchers}
                      />
                    `
                  : "-",
              ])}
            />
          </fieldset>
        `;
      };

      // 图片部分
      const ImageSection = () => {
        if (!images?.length) return null;
        return html`
          <fieldset style=${styles.fieldset}>
            <legend style=${styles.legend}>图集 (${images.length}P)</legend>
            <${Table}
              headers=${["#", "类型", "预览", "分辨率", "大小", "下载"]}
              rows=${images.map((img, i) => {
                const isVid = !!img.video;
                const thumb = isVid
                  ? img.video.originCoverUrlList?.[0]
                  : img.urlList?.[0];
                const dl = isVid
                  ? img.video.playAddr?.[0]?.src
                  : img.downloadUrlList?.[0];
                return [
                  i + 1,
                  isVid ? "视频" : "图片",
                  html`<img src=${thumb} style=${styles.img} />`,
                  isVid
                    ? `${img.video.width}×${img.video.height}`
                    : `${img.width}×${img.height}`,
                  fmt.size(isVid ? img.video.dataSize : null),
                  dl ? html`<a href=${dl} target="_blank">链接</a>` : "-",
                ];
              })}
            />
          </fieldset>
        `;
      };

      // 音乐部分
      const MusicSection = () => {
        if (!music) return null;
        return html`
              <fieldset style=${styles.fieldset}>
                  <legend style=${styles.legend}>背景音乐</legend>
                  <div style="display: flex; gap: 15px; align-items: center;">
                      <img src=${
                        music.coverThumb?.urlList?.[0]
                      } style="width:60px; height:60px; border-radius:4px;" />
                      <div style="flex:1">
                          <${KeyValue} label="标题">${music.title}</${KeyValue}>
                          <${KeyValue} label="作者">${
          music.author
        }</${KeyValue}>
                          <${KeyValue} label="时长">${
          music.duration
        } 秒</${KeyValue}>
                          ${
                            music.playUrl?.urlList?.[0] &&
                            html`<a
                              href=${music.playUrl.urlList[0]}
                              target="_blank"
                              style=${styles.btn}
                              >试听</a
                            >`
                          }
                      </div>
                  </div>
              </fieldset>
          `;
      };

      return html`
        <div>
          <${VideoSection} />
          <${ImageSection} />
          <${MusicSection} />
        </div>
      `;
    };

    const AuthorTab = ({ author }) => {
      if (!author) return html`<div>无作者信息</div>`;
      return html`
          <div style="display: flex; gap: 15px; margin-bottom: 20px; align-items: center;">
              <img src=${
                author.avatarThumb?.urlList?.[0]
              } style="width: 80px; height: 80px; border-radius: 50%;" />
              <div>
                  <h3>${author.nickname}</h3>
                  <a href="https://www.douyin.com/user/${
                    author.secUid
                  }" target="_blank" style=${styles.btn}>访问主页</a>
              </div>
          </div>
          <${KeyValue} label="认证">${
        author.customVerify || author.enterpriseVerifyReason
      }</${KeyValue}>
          <${Copyable} label="UID" value=${author.uid} />
          <${Copyable} label="SecUID" value=${author.secUid} />
          <${KeyValue} label="粉丝数">${fmt.num(
        author.followerCount
      )}</${KeyValue}>
          <${KeyValue} label="获赞数">${fmt.num(
        author.totalFavorited
      )}</${KeyValue}>
        `;
    };

    const PostTab = ({ media }) => html`
      <fieldset style=${styles.fieldset}>
          <legend style=${styles.legend}>描述</legend>
          <div style="white-space: pre-wrap; line-height: 1.5;">${
            media.desc || "无描述"
          }</div>
      </fieldset>
      <fieldset style=${styles.fieldset}>
          <legend style=${styles.legend}>数据统计</legend>
          <${KeyValue} label="发布时间">${fmt.ts(
      media.createTime
    )}</${KeyValue}>
          <${Copyable} label="分享链接" value=${media.shareInfo?.shareUrl} />
          <${KeyValue} label="点赞">${fmt.num(
      media.stats?.diggCount
    )}</${KeyValue}>
          <${KeyValue} label="评论">${fmt.num(
      media.stats?.commentCount
    )}</${KeyValue}>
          <${KeyValue} label="收藏">${fmt.num(
      media.stats?.collectCount
    )}</${KeyValue}>
          <${KeyValue} label="分享">${fmt.num(
      media.stats?.shareCount
    )}</${KeyValue}>
      </fieldset>
    `;

    const AdvancedTab = ({ media }) => html`
      <fieldset style=${styles.fieldset}>
          <legend style=${styles.legend}>ID 信息</legend>
          <${Copyable} label="Aweme ID" value=${media.awemeId} />
          <${Copyable} label="Group ID" value=${media.groupId} />
      </fieldset>
      <fieldset style=${styles.fieldset}>
          <legend style=${styles.legend}>权限 / 状态</legend>
          <${KeyValue} label="允许评论">${
      media.awemeControl?.canComment ? "是" : "否"
    }</${KeyValue}>
          <${KeyValue} label="允许分享">${
      media.awemeControl?.canShare ? "是" : "否"
    }</${KeyValue}>
          <${KeyValue} label="允许下载">${
      media.download?.allowDownload ? "是" : "否"
    }</${KeyValue}>
          <${KeyValue} label="私密视频">${
      media.isPrivate ? "是" : "否"
    }</${KeyValue}>
      </fieldset>
    `;

    const JsonTab = ({ data }) => {
      const codeRef = useRef(null);
      const selectAll = () => {
        const range = document.createRange();
        range.selectNodeContents(codeRef.current);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      };

      return html`
        <fieldset
          style=${{
            overflow: "hidden",
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "10px",
            maxHeight: "100%",
          }}
        >
          <legend style=${styles.legend}>
            原始数据
            <button onClick=${selectAll} style=${styles.btn}>全选</button>
            <button onClick=${() => console.log(data)} style=${styles.btn}>
              Console Log
            </button>
          </legend>
          <pre
            style="background:#f4f4f4; padding:10px; overflow:auto; max-height: 100%; font-size: 12px; word-break: break-all; white-space: pre-wrap; border: 1px solid #ddd; border-radius: 4px; cursor: text;"
          >
                  <code ref=${codeRef}>${JSON.stringify(data, null, 2)}</code>
              </pre>
        </fieldset>
      `;
    };

    // --- 主入口组件 ---
    const App = ({ media, filenameBase }) => {
      const [activeTab, setActiveTab] = useState("media");

      const tabs = [
        { id: "media", title: "媒体资源", Comp: MediaTab },
        { id: "author", title: "作者信息", Comp: AuthorTab },
        { id: "post", title: "作品信息", Comp: PostTab },
        { id: "advanced", title: "高级信息", Comp: AdvancedTab },
        { id: "json", title: "JSON", Comp: JsonTab },
      ];

      // 映射当前组件需要的数据
      const getProps = (id) => {
        switch (id) {
          case "author":
            return { author: media.authorInfo };
          case "json":
            return { data: media };
          default:
            return { media, filenameBase };
        }
      };

      const ActiveComp = tabs.find((t) => t.id === activeTab).Comp;

      return html`
        <div style=${styles.container}>
          <nav style=${styles.nav}>
            ${tabs.map(
              (t) => html`
                <button
                  onClick=${() => setActiveTab(t.id)}
                  style=${styles.navBtn(activeTab === t.id)}
                >
                  ${t.title}
                </button>
              `
            )}
          </nav>
          <div style=${styles.content}>
            <${ActiveComp} ...${getProps(activeTab)} />
          </div>
        </div>
      `;
    };

    return { App };
  })();
  // #endregion

  // 配置 config modal
  // #region Config Modal Components
  const ConfigModalComponents = (() => {
    const { useState, useEffect, useMemo } = requires?.htmPreact;
    const { html } = requires?.htmPreact;

    // 样式常量
    const styles = {
      container:
        "display: flex; flex-direction: column; height: 70vh; width: 600px; overflow: hidden;",
      nav: "display: flex; border-bottom: 1px solid #ccc; background: #f9f9f9;",
      navBtn: (active) => `
      padding: 10px 20px;
      border: none;
      background: ${active ? "#fff" : "transparent"};
      cursor: pointer;
      border-bottom: 2px solid ${active ? "#007bff" : "transparent"};
      font-weight: ${active ? "bold" : "normal"};
      color: ${active ? "#007bff" : "#333"};
    `,
      content: "flex-grow: 1; overflow-y: auto; padding: 20px;",
      fieldset:
        "border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px; padding: 15px;",
      legend: "font-weight: bold; padding: 0 5px; color: #555;",
      row: "display: flex; align-items: center; margin-bottom: 12px;",
      label: "width: 120px; flex-shrink: 0; color: #333;",
      input:
        "flex: 1; padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px;",
      select:
        "flex: 1; padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; background: #fff;",
      checkbox: "margin-right: 8px;",
      btn: "padding: 6px 12px; background: #007bff; color: #fff; border: none; border-radius: 4px; cursor: pointer;",
      btnDanger:
        "padding: 6px 12px; background: #dc3545; color: #fff; border: none; border-radius: 4px; cursor: pointer;",
      table: "width: 100%; font-size: 13px; border-collapse: collapse;",
      th: "border: 1px solid #ddd; padding: 8px; background: #f5f5f5; text-align: left;",
      td: "border: 1px solid #ddd; padding: 8px; word-break: break-all;",
      range: "flex: 1; margin-right: 10px;",
      rangeValue: "width: 40px; text-align: center;",
    };

    /**
     * 基本设置页
     * @param {{config: Config, onConfigChange: Function}} param0
     * @returns
     */
    const SettingsTab = ({ config, onConfigChange }) => {
      const [filenameTemplate, setFilenameTemplate] = useState(
        config.features.filename_template
      );
      const [filename_len, set_filename_len] = useState(
        config.features.filename_max_length
      );
      const [videoMode, setVideoMode] = useState(
        config.features.download_video_mode
      );
      // NOTE: 这个不用了
      const [convertWebP, setConvertWebP] = useState(
        config.features.convert_webp_to_png
      );
      const [videoCodec, setVideoCodec] = useState(
        config.features.video_download_codecs || "default"
      );
      const [imageConvertCodec, setImageConvertCodec] = useState(
        config.features.image_convert_codecs || "default"
      );
      const [imageResize, setImageResize] = useState(
        config.features.image_resize_codecs || "default"
      );
      const [imageQuality, setImageQuality] = useState(
        config.features.image_quality !== undefined
          ? config.features.image_quality
          : 80
      );
      const [using_downloader, set_UsingDownloader] = useState(
        config.features.using_downloader || "browser"
      );

      // filename 实时刷新测试
      const filename_test = useMemo(() => {
        try {
          return mediaHandler._build_filename(
            mediaHandler.current_media,
            filenameTemplate,
            filename_len,
            true
          );
        } catch (error) {
          console.error(error);
          return `ERROR: ${error.message}`;
        }
      }, [filenameTemplate, filename_len]);

      const handleSave = () => {
        config.features.filename_template = filenameTemplate;
        config.features.filename_max_length = filename_len;
        config.features.download_video_mode = videoMode;
        config.features.convert_webp_to_png = convertWebP;
        // 保存新增配置项
        config.features.video_download_codecs = videoCodec;
        config.features.image_convert_codecs = imageConvertCodec;
        config.features.image_resize_codecs = imageResize;
        config.features.image_quality = imageQuality;
        config.features.using_downloader = using_downloader;
        config.save();
        alert("配置已保存");
      };

      return html`
        <div>
          <div style="text-align: right;">
            <button style=${styles.btn} onClick=${handleSave}>保存设置</button>
          </div>

          <fieldset style=${styles.fieldset}>
            <legend style=${styles.legend}>下载器配置</legend>
            <div style=${styles.row}>
              <label style=${styles.label}>下载器：</label>
              <select
                style=${styles.select}
                value=${using_downloader}
                onChange=${(e) => set_UsingDownloader(e.target.value)}
              >
                <option value="browser">默认（浏览器）</option>
                <option value="abdm">AB Download Manager</option>
                <option value="arai2">Arai2</option>
              </select>
            </div>
            <div style="font-size: 12px; color: #666;">
              如果选择非浏览器下载，之后的下载将会发起rpc调用你部署的外部下载器。
              <br />注意：使用外部下载器时，图片压缩转码功能不可用。
            </div>
          </fieldset>

          <fieldset style=${styles.fieldset}>
            <legend style=${styles.legend}>文件命名</legend>
            <div style=${styles.row}>
              <label style=${styles.label}>模板：</label>
              <input
                type="text"
                style=${styles.input}
                value=${filenameTemplate}
                onInput=${(e) => setFilenameTemplate(e.target.value)}
                placeholder=${`例：\${nickname}_\${short_id}`}
              />
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
              可用变量：<code>nickname</code>, <code>short_id</code>,
              <code>tags</code>, <code>desc</code>, <code>aweme_id</code>,
              <code>create_date_YYYYMMDD</code>,
              <code>now_YYYYMMDD_HHmmss</code> 等。
            </div>
            <div style=${styles.row}>
              <label style=${styles.label}>文件名长度：</label>
              <input
                type="number"
                max=${128}
                min=${12}
                style=${styles.input}
                value=${filename_len}
                onInput=${(e) => set_filename_len(e.target.value)}
              />
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
              <hr />
              当前文件名：<code>${filename_test}</code>
            </div>
          </fieldset>

          <fieldset style=${styles.fieldset}>
            <legend style=${styles.legend}>视频下载设置</legend>
            <div style=${styles.row}>
              <label style=${styles.label}>分辨率策略：</label>
              <select
                style=${styles.select}
                value=${videoMode}
                onChange=${(e) => setVideoMode(e.target.value)}
              >
                <option value="default">默认（智能选择）</option>
                <option value="max">最高清晰度</option>
                <option value="min">最低清晰度</option>
                <option value="max_file">最大文件</option>
                <option value="min_file">最小文件</option>
                <option value="1080P">1080P</option>
                <option value="720P">720P</option>
                <option value="540P">540P</option>
                <option value="360P">360P</option>
                <option value="2K">2K</option>
                <option value="4K">4K</option>
              </select>
            </div>
            <div style=${styles.row}>
              <label style=${styles.label}>编码偏好：</label>
              <select
                style=${styles.select}
                value=${videoCodec}
                onChange=${(e) => setVideoCodec(e.target.value)}
              >
                <option value="default">默认（无偏好）</option>
                <option value="h264">只下载 H264</option>
                <option value="h265">只下载 H265</option>
                <option value="h264_prefer">优先 H264</option>
                <option value="h265_prefer">优先 H265</option>
              </select>
            </div>
            <div style="font-size: 12px; color: #666;">
              注意：实际下载时根据可用地址匹配，若不支持所选编码或分辨率则回退。
            </div>
          </fieldset>

          <fieldset style=${styles.fieldset}>
            <legend style=${styles.legend}>图片下载设置</legend>
            <div style=${styles.row}>
              <label style=${styles.label}>转码编码偏好：</label>
              <select
                style=${styles.select}
                value=${imageConvertCodec}
                onChange=${(e) => setImageConvertCodec(e.target.value)}
              >
                <option value="default">默认（保持原格式）</option>
                <option value="png">转码为 PNG</option>
                <option value="jpg">转码为 JPG</option>
                <option value="webp">转码为 WebP</option>
              </select>
            </div>
            <div style=${styles.row}>
              <label style=${styles.label}>尺寸压缩偏好：</label>
              <select
                style=${styles.select}
                value=${imageResize}
                onChange=${(e) => setImageResize(e.target.value)}
              >
                <option value="default">默认（无压缩）</option>
                <option value="2k_max">最大边小于 2K</option>
                <option value="1k_max">最大边小于 1K</option>
                <option value="960_max">最大边小于 960</option>
                <option value="640_max">最大边小于 640</option>
                <option value="512_max">最大边小于 512</option>
              </select>
            </div>
            <div style=${styles.row}>
              <label style=${styles.label}>压缩率：</label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value=${imageQuality}
                style=${styles.range}
                onInput=${(e) => setImageQuality(parseInt(e.target.value, 10))}
              />
              <span style=${styles.rangeValue}>${imageQuality}%</span>
            </div>
            <div style="font-size: 12px; color: #666;">
              注意：压缩率仅当转码或尺寸压缩开启时生效，推荐 60% 以上。
            </div>
          </fieldset>
        </div>
      `;
    };

    // 下载历史页
    const HistoryTab = () => {
      const [history, setHistory] = useState([]);

      useEffect(() => {
        loadHistory();
      }, []);

      const loadHistory = () => {
        setHistory(DownloadHistory.get());
      };

      const clearHistory = () => {
        if (confirm("确定清空所有下载历史吗？")) {
          DownloadHistory.clear();
          setHistory([]);
        }
      };

      const formatTime = (ts) => new Date(ts).toLocaleString();

      return html`
        <div>
          <div
            style="display: flex; justify-content: space-between; margin-bottom: 15px;"
          >
            <h3 style="margin: 0;">下载记录（最多50条）</h3>
            <button style=${styles.btnDanger} onClick=${clearHistory}>
              清空历史
            </button>
          </div>
          ${history.length === 0
            ? html`<p style="color: #999; text-align: center;">暂无下载记录</p>`
            : html`
                <table style=${styles.table}>
                  <thead>
                    <tr>
                      <th style=${styles.th}>描述</th>
                      <th style=${styles.th}>分享链接</th>
                      <th style=${styles.th}>下载时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${history.map(
                      (item) => html`
                        <tr>
                          <td style=${styles.td}>${item.desc || "-"}</td>
                          <td style=${styles.td}>
                            <a
                              href=${item.shareUrl}
                              target="_blank"
                              rel="noopener"
                              >链接</a
                            >
                          </td>
                          <td style=${styles.td}>
                            ${formatTime(item.downloadTime)}
                          </td>
                        </tr>
                      `
                    )}
                  </tbody>
                </table>
              `}
        </div>
      `;
    };

    // ========== 下载器配置 Tab（与 SettingsTab 风格一致） ==========
    const DownloaderConfigTab = ({ config, onConfigChange }) => {
      // 获取当前配置（深拷贝防止直接修改）
      const downloaderConfig = config.features.downloader_config || {
        browser: {},
        abdm: {
          dir: {
            video: "`./douyin/${user_dir}/videos`",
            image: "`./douyin/${user_dir}/images`",
            other: "`./douyin/${user_dir}/others`",
          },
          domain: "http://localhost",
          port: "15151",
        },
        aria2: {
          dir: {
            video: "`./douyin/${user_dir}/videos`",
            image: "`./douyin/${user_dir}/images`",
            other: "`./douyin/${user_dir}/others`",
          },
          domain: "http://localhost",
          port: "6800",
          path: "/jsonrpc",
          token: "",
        },
      };

      // ABDM 配置状态
      const [abdmDomain, setAbdmDomain] = useState(
        downloaderConfig.abdm?.domain || "http://localhost"
      );
      const [abdmPort, setAbdmPort] = useState(
        downloaderConfig.abdm?.port || "15151"
      );
      const [abdmDirVideo, setAbdmDirVideo] = useState(
        downloaderConfig.abdm?.dir?.video || "`./douyin/${user_dir}/videos`"
      );
      const [abdmDirImage, setAbdmDirImage] = useState(
        downloaderConfig.abdm?.dir?.image || "`./douyin/${user_dir}/images`"
      );
      const [abdmDirOther, setAbdmDirOther] = useState(
        downloaderConfig.abdm?.dir?.other || "`./douyin/${user_dir}/others`"
      );

      // Aria2 配置状态
      const [aria2Domain, setAria2Domain] = useState(
        downloaderConfig.aria2?.domain || "http://localhost"
      );
      const [aria2Port, setAria2Port] = useState(
        downloaderConfig.aria2?.port || "6800"
      );
      const [aria2Path, setAria2Path] = useState(
        downloaderConfig.aria2?.path || "/jsonrpc"
      );
      const [aria2Token, setAria2Token] = useState(
        downloaderConfig.aria2?.token || ""
      );
      const [aria2DirVideo, setAria2DirVideo] = useState(
        downloaderConfig.aria2?.dir?.video || "`./douyin/${user_dir}/videos`"
      );
      const [aria2DirImage, setAria2DirImage] = useState(
        downloaderConfig.aria2?.dir?.image || "`./douyin/${user_dir}/images`"
      );
      const [aria2DirOther, setAria2DirOther] = useState(
        downloaderConfig.aria2?.dir?.other || "`./douyin/${user_dir}/others`"
      );

      // 保存配置
      const handleSave = () => {
        if (!config.features.downloader_config) {
          config.features.downloader_config = {};
        }
        config.features.downloader_config.abdm = {
          domain: abdmDomain,
          port: abdmPort,
          dir: {
            video: abdmDirVideo,
            image: abdmDirImage,
            other: abdmDirOther,
          },
        };
        config.features.downloader_config.aria2 = {
          domain: aria2Domain,
          port: aria2Port,
          path: aria2Path,
          token: aria2Token,
          dir: {
            video: aria2DirVideo,
            image: aria2DirImage,
            other: aria2DirOther,
          },
        };
        config.save();
        alert("下载器配置已保存");
        if (onConfigChange) onConfigChange();
      };

      // 重置为默认值
      const handleReset = () => {
        if (confirm("重置所有下载器配置到默认值？")) {
          setAbdmDomain("http://localhost");
          setAbdmPort("15151");
          setAbdmDirVideo("`./douyin/${user_dir}/videos`");
          setAbdmDirImage("`./douyin/${user_dir}/images`");
          setAbdmDirOther("`./douyin/${user_dir}/others`");
          setAria2Domain("http://localhost");
          setAria2Port("6800");
          setAria2Path("/jsonrpc");
          setAria2Token("");
          setAria2DirVideo("`./douyin/${user_dir}/videos`");
          setAria2DirImage("`./douyin/${user_dir}/images`");
          setAria2DirOther("`./douyin/${user_dir}/others`");
        }
      };

      return html`
        <div>
          <!-- 顶部操作栏，与 SettingsTab 保持一致 -->
          <div style="text-align: right; margin-bottom: 15px;">
            <button style=${styles.btn} onClick=${handleSave}>保存设置</button>
            <button
              style=${styles.btnDanger}
              onClick=${handleReset}
              style="margin-left: 8px;"
            >
              重置默认
            </button>
          </div>

          <!-- ABDM 配置区块 -->
          <fieldset style=${styles.fieldset}>
            <legend style=${styles.legend}>AB Download Manager (ABDM)</legend>
            <div style=${styles.row}>
              <label style=${styles.label}>服务地址：</label>
              <input
                type="text"
                style=${styles.input}
                value=${abdmDomain}
                onInput=${(e) => setAbdmDomain(e.target.value)}
                placeholder="http://localhost"
              />
            </div>
            <div style=${styles.row}>
              <label style=${styles.label}>端口：</label>
              <input
                type="text"
                style=${styles.input}
                value=${abdmPort}
                onInput=${(e) => setAbdmPort(e.target.value)}
                placeholder="15151"
              />
            </div>
          </fieldset>

          <!-- Aria2 配置区块 -->
          <fieldset style=${styles.fieldset}>
            <legend style=${styles.legend}>Aria2 RPC</legend>
            <div style=${styles.row}>
              <label style=${styles.label}>服务地址：</label>
              <input
                type="text"
                style=${styles.input}
                value=${aria2Domain}
                onInput=${(e) => setAria2Domain(e.target.value)}
                placeholder="http://localhost"
              />
            </div>
            <div style=${styles.row}>
              <label style=${styles.label}>端口：</label>
              <input
                type="text"
                style=${styles.input}
                value=${aria2Port}
                onInput=${(e) => setAria2Port(e.target.value)}
                placeholder="6800"
              />
            </div>
            <div style=${styles.row}>
              <label style=${styles.label}>路径：</label>
              <input
                type="text"
                style=${styles.input}
                value=${aria2Path}
                onInput=${(e) => setAria2Path(e.target.value)}
                placeholder="/jsonrpc"
              />
            </div>
            <div style=${styles.row}>
              <label style=${styles.label}>Token：</label>
              <input
                type="text"
                style=${styles.input}
                value=${aria2Token}
                onInput=${(e) => setAria2Token(e.target.value)}
                placeholder="可选"
              />
            </div>
          </fieldset>

          <div
            style="font-size: 12px; color: #666; background: #f9f9f9; padding: 8px; border-radius: 4px;"
          >
            💡
            注意：需要在“基本设置”中选择对应的下载器（browser/abdm/aria2）后，此处配置才会生效。
          </div>
        </div>
      `;
    };

    // 主组件
    const App = ({ config, onClose }) => {
      const [activeTab, setActiveTab] = useState("settings");

      const tabs = [
        { id: "settings", title: "基本设置" },
        { id: "downloader", title: "下载器配置" },
        { id: "history", title: "下载历史" },
      ];
      const current_tab = {
        settings: html`<${SettingsTab}
          config=${config}
          onConfigChange=${() => {}}
        />`,
        history: html`<${HistoryTab} />`,
        downloader: html`<${DownloaderConfigTab}
          config=${config}
          onConfigChange=${() => {}}
        />`,
      }[activeTab];

      return html`
        <div style=${styles.container}>
          <nav style=${styles.nav}>
            ${tabs.map(
              (tab) => html`
                <button
                  style=${styles.navBtn(activeTab === tab.id)}
                  onClick=${() => setActiveTab(tab.id)}
                >
                  ${tab.title}
                </button>
              `
            )}
          </nav>
          <div style=${styles.content}>${current_tab}</div>
        </div>
      `;
    };

    return { App };
  })();
  // #endregion

  // #region 主入口组件 ---
  /**
   * 这个类是主要逻辑
   *
   * 包含如何解析操作、解析从player里提取的media对象
   */
  class MediaHandler {
    /** @type {import("./types").DouyinPlayer.PlayerInstance | null} */
    player = null;
    /** @type {import("./types").DouyinMedia.MediaRoot | null} */
    current_media = null;
    downloading = false;
    /** @type {Downloader} */
    downloader;
    /** @type {HTMLElement | null} */
    $btn = null; // Corresponds to downloader_status.$btn from original, not actively used for UI updates by original logic

    /**
     * @param {Downloader} downloader
     */
    constructor(downloader) {
      this.downloader = downloader;
      this.download_current_media = this._lock_download(
        this._download_current_media_logic.bind(this)
      );
    }

    /**
     * @param {string} bigintStr
     */
    static toShortId(bigintStr) {
      try {
        return BigInt(bigintStr).toString(36);
      } catch (error) {
        return bigintStr;
      }
    }

    /**
     * 文件名
     *
     * [nickname] + [short_id] + [tags] + [desc]
     * max length: 64
     *
     * @param {import("./types").DouyinMedia.MediaRoot} media
     */
    _build_filename(
      media = this.current_media,
      filename_template = Config.global.features.filename_template ||
        Config.defaults.filename_template,
      filename_max_length = Config.global.features.filename_max_length || 64,
      throw_err = false
    ) {
      const {
        authorInfo: { nickname },
        awemeId,
        desc,
        textExtra,
      } = media;

      const short_id = MediaHandler.toShortId(awemeId);
      const tag_list =
        textExtra?.map((x) => x.hashtagName).filter(Boolean) || [];
      const tags = tag_list.map((x) => "#" + x).join("_");
      let rawDesc = desc || "";
      tag_list.forEach((t) => {
        rawDesc = rawDesc.replace(new RegExp(`#${t}\\s*`, "g"), "");
      });
      rawDesc = rawDesc.trim().replace(/[#/\?<>\\:\*\|":]/g, ""); // Sanitize illegal characters

      // 渲染文件名用的上下文
      const context = {
        nickname,
        short_id,
        tags,
        desc: rawDesc,
        aweme_id: awemeId,
        media,
        author_info: media.authorInfo,
        uid: media.authorUserId,
        music_ame: media.music.musicName,
        now_date: new Date(),
        create_date: new Date(media.createTime * 1000),
      };
      // 添加格式化之后的时间
      context.now_YYYYMMDD = formatDate(context.now_date, "YYYYMMDD");
      context.now_YYYYMMDD_HHmmss = formatDate(
        context.now_date,
        "YYYYMMDD_HHmmss"
      );
      context.create_date_YYYYMMDD = formatDate(
        context.create_date,
        "YYYYMMDD"
      );
      context.create_date_YYYYMMDD_HHmmss = formatDate(
        context.create_date,
        "YYYYMMDD_HHmmss"
      );

      let baseName = "";
      try {
        baseName = runInContext(context, filename_template);
      } catch (error) {
        if (throw_err) throw error;
        console.error(`[dy-dl] Error rendering filename template:`);
        console.error(error);
        baseName = runInContext(context, Config.defaults.filename_template);
      }
      if (baseName.length > filename_max_length) {
        baseName = baseName.slice(0, filename_max_length);
      }

      // NOTE: 文件名截断问题，如果包含 "." 可能导致浏览器误判后缀名 #41
      baseName = baseName.replace(/\./g, "_");

      return baseName;
    }

    _bind_player_events() {
      if (!this.player) return;
      const update = () => {
        if (this.player?.config?.awemeInfo) {
          this.current_media = this.player.config.awemeInfo;
        }
      };
      update(); // Initial update
      this.player.on("play", update);
      this.player.on("seeked", update);
      // Potentially listen to other events like 'pause' or 'videochange' if available and needed
    }

    /**
     * !!!
     * 此为核心逻辑
     * !!!
     *
     * NOTE: 有可能在某次抖音更新之后就不可用，依赖于 xg-video 对全局状态注入
     */
    async _start_detect_player_change() {
      while (1) {
        // @ts-ignore // window.player is not typed here
        const currentPlayer = window.player || unsafeWindow.player;
        if (this.player !== currentPlayer) {
          this.player = currentPlayer;
          if (this.player) {
            this._bind_player_events();
          }
          // console.log(`[dy-dl] player changed: ${this.player}`);
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    _flag_start_download() {
      this.downloading = true;
      // const { $btn } = this; // Original script had $btn in status but didn't use it for UI updates.
      // if ($btn) {
      //   // TODO: progress
      // }
      return () => {
        this.downloading = false;
        // if ($btn) {
        //   // TODO: progress
        // }
      };
    }

    _lock_download(download_fn) {
      return async (...args) => {
        if (this.downloading) {
          alert("[dy-dl]正在下载中...请稍等或刷新页面");
          return;
        }
        const releaseLock = this._flag_start_download();
        try {
          await download_fn(...args);
        } finally {
          // Small delay before releasing lock, as in original script
          await new Promise((r) => setTimeout(r, 300));
          releaseLock();
        }
      };
    }

    /**
     * 从 video 对象上取得所有 url，支持分辨率策略 + 编码偏好
     * 先按 codec 筛选，再按分辨率模式筛选
     *
     * @param {import("./types").DouyinMedia.DouyinPlayerVideo | null | undefined} video_obj
     * @returns {string[]} 视频播放地址数组
     */
    _get_video_urls(video_obj) {
      if (video_obj === null || video_obj === undefined) {
        return [];
      }

      const mode = Config.global.features.download_video_mode || "default";
      const codecPref =
        Config.global.features.video_download_codecs || "default";

      // ====================== 辅助函数 ======================
      const extractUrlsFromBitRate = (bitRate) => {
        const urls = [];
        if (bitRate.playApi) urls.push(bitRate.playApi);
        if (Array.isArray(bitRate.playAddr)) {
          urls.push(...bitRate.playAddr.map((addr) => addr.src));
        }
        return urls.filter(Boolean);
      };

      const isH265 = (bitRate) => {
        return (
          bitRate.isH265 === 1 ||
          (bitRate.gearName || "").toLowerCase().includes("h265") ||
          (bitRate.videoFormat || "").toLowerCase().includes("h265") ||
          (bitRate.format || "").toLowerCase().includes("h265")
        );
      };

      // 如果 bitRateList 为空，直接回退默认逻辑
      if (!video_obj.bitRateList || video_obj.bitRateList.length === 0) {
        console.warn("[dy-dl] bitRateList 为空，使用默认地址");
        return this._get_video_urls_default(video_obj);
      }

      // ====================== 第一步：按 codec 偏好筛选 ======================
      let candidates = [...video_obj.bitRateList];

      if (codecPref !== "default") {
        const isPrefer = codecPref.endsWith("_prefer");
        const wantH265 = codecPref.includes("h265");

        const codecMatches = candidates.filter((bitRate) => {
          return isH265(bitRate) === wantH265;
        });

        if (codecMatches.length > 0) {
          candidates = codecMatches; // 找到对应编码，使用它
        } else if (!isPrefer) {
          // 严格模式（非 prefer）但没找到 → 直接回退
          console.warn(
            `[dy-dl] 未找到 ${
              wantH265 ? "H265" : "H264"
            } 编码的视频，使用默认地址`
          );
          return this._get_video_urls_default(video_obj);
        }
        // prefer 模式下没找到就继续使用全部 candidates
      }

      // ====================== 第二步：按分辨率模式筛选 ======================
      if (mode !== "default" && candidates.length > 1) {
        /**
         *
         * @param {import("./types").DouyinMedia.FluffyBitRateList} a
         */
        const vsizeof = (a) => (a?.width || 0) * (a?.height || 0);
        /**
         *
         * @param {import("./types").DouyinMedia.FluffyBitRateList} a
         */
        const vfilesizeof = (a) => a.dataSize || 0;

        // 通用方法：根据比较函数排序，并过滤出与第一个元素值相同的项
        const sortAndFilter = (getValue, compare) => {
          candidates.sort(compare);
          const target = getValue(candidates[0]);
          candidates = candidates.filter((item) => getValue(item) === target);
        };

        switch (mode) {
          case "max":
            // 按分辨率面积降序，取最大尺寸
            sortAndFilter(vsizeof, (a, b) => vsizeof(b) - vsizeof(a));
            break;

          case "min":
            // 按分辨率面积升序，取最小尺寸
            sortAndFilter(vsizeof, (a, b) => vsizeof(a) - vsizeof(b));
            break;

          case "max_file":
            // 按文件大小降序，取最大文件
            sortAndFilter(
              vfilesizeof,
              (a, b) => vfilesizeof(b) - vfilesizeof(a)
            );
            break;

          case "min_file":
            // 按文件大小升序，取最小文件
            sortAndFilter(
              vfilesizeof,
              (a, b) => vfilesizeof(a) - vfilesizeof(b)
            );
            break;

          default:
            // 按清晰度关键字匹配（1080P、720P 等）
            const keywordMap = {
              "1080P": ["1080"],
              "720P": ["720"],
              "540P": ["540"],
              "360P": ["360"],
              "2K": ["2k", "2048"],
              "4K": ["4K", "4096"],
            };
            const keywords = keywordMap[mode] || [];
            if (keywords.length > 0) {
              const matched = candidates.filter((bitRate) => {
                const gearName = (bitRate.gearName || "").toLowerCase();
                return keywords.some((kw) =>
                  gearName.includes(kw.toLowerCase())
                );
              });
              if (matched.length > 0) candidates = matched;
            }
            break;
        }
      }

      // ====================== 提取最终 URL ======================
      const allUrls = [];
      candidates.forEach((bitRate) => {
        allUrls.push(...extractUrlsFromBitRate(bitRate));
      });

      // 补充顶层 playApi / playApiH265（兜底）
      if (codecPref === "default" || codecPref.includes("h264")) {
        if (video_obj.playApi) allUrls.push(video_obj.playApi);
      }
      if (codecPref === "default" || codecPref.includes("h265")) {
        if (video_obj.playApiH265) allUrls.push(video_obj.playApiH265);
      }

      const result = Array.from(new Set(allUrls.filter(Boolean)));

      if (result.length === 0) {
        console.warn("[dy-dl] 未能提取到有效视频地址，回退默认模式");
        return this._get_video_urls_default(video_obj);
      }

      return result;
    }

    /**
     * 默认的 URL 提取逻辑（保持原有行为）
     */
    _get_video_urls_default(video_obj) {
      const sources = [];
      if (video_obj.playApi) sources.push(video_obj.playApi);
      if (Array.isArray(video_obj.playAddr)) {
        sources.push(...video_obj.playAddr.map((x) => x.src));
      }
      if (video_obj.bitRateList) {
        video_obj.bitRateList.forEach((x) => {
          if (x.playApi) sources.push(x.playApi);
        });
      }
      if (video_obj.playApiH265) sources.push(video_obj.playApiH265);

      return Array.from(new Set(sources.filter(Boolean)));
    }

    /**
     * 抖音作品有两种形式：
     * 1. 单图、单视频
     * 2. 图集
     *
     * 如果是图集形式，必须从 images 这个数组里面取字段，其他字段都有可能是 fallback 值
     */
    async _download_current_media_logic() {
      if (!this.current_media) {
        alert("[dy-dl]无当前媒体信息，请尝试播放视频或等待加载。");
        return;
      }
      const { video, images } = this.current_media;
      const filename_base = this._build_filename(this.current_media);

      // 判断是否为图集
      const isAlbum = Array.isArray(images) && images.length > 0;
      const total = isAlbum ? images.length : 1;

      const toast = createToast(
        document.querySelector(".dy-dl-video-btn"),
        5 * 1000
      );

      if (isAlbum) {
        // 下载图集
        // TODO 要是能支持 zip 打包会更好一点
        let downloadedCount = 0;
        for (let idx = 0; idx < images.length; idx++) {
          toast.update(`下载图集 (${idx + 1}/${total})`);

          const imageItem = images[idx];
          const item_filename = `${filename_base}_${idx + 1}`; // 1-based index for files

          const image_video = imageItem?.video;
          if (image_video) {
            // 包含视频的图集项
            const video_urls = this._get_video_urls(image_video);
            if (video_urls.length > 0) {
              await this.downloader.download_file(
                video_urls[0],
                item_filename,
                video_urls
              );
              downloadedCount++;
            } else {
              console.warn("[dy-dl]图集内视频无有效URL，跳过下载", image_video);
            }
            continue;
          }

          // 单纯的图片图集项
          const img_urls = imageItem?.urlList?.filter(Boolean);
          if (img_urls && img_urls.length > 0) {
            await this.downloader.download_file(
              img_urls[0],
              item_filename,
              img_urls
            );
            downloadedCount++;
          } else {
            console.warn("[dy-dl]图集内图片无有效URL，跳过下载", imageItem);
          }
        }
        toast.update(`图集下载完成`);
        if (downloadedCount === 0 && images.length > 0) {
          alert("[dy-dl]图集下载失败，未找到有效媒体链接。");
        }
        if (downloadedCount) {
          DownloadHistory.add(this.current_media);
        }
        return;
      } else {
        toast.update("正在下载...");
        // 单视频或单图片（老版本可能直接在video字段放图片信息，但新版通常是images）
        const video_urls = this._get_video_urls(video);
        if (video_urls.length !== 0) {
          await this.downloader.download_file(
            video_urls[0],
            filename_base,
            video_urls
          );
          DownloadHistory.add(this.current_media);
          toast.update("下载完成");
          return;
        }
      }
      alert("[dy-dl]无法下载当前媒体，尝试刷新、暂停、播放等操作后重试。");
    }

    // 下载封面
    async download_thumb() {
      if (!this.current_media) {
        alert("[dy-dl]无当前媒体信息，请尝试播放视频或等待加载。");
        return;
      }
      const { video } = this.current_media;
      // 第一个是压缩的，所以用第二个
      const thumb = video.originCoverUrlList[1] || video.originCoverUrlList[0];
      const filename_base = this._build_filename(this.current_media);
      this.downloader.download_file(thumb, `thumb_${filename_base}`);
    }

    // 显示媒体详情
    async show_media_details() {
      if (!this.current_media) {
        alert("[dy-dl]无当前媒体信息，请尝试播放视频或等待加载。");
        return;
      }

      // 1. 创建 Modal
      const modal = new Modal((root, overlay) => {
        // issues #18 fix z-index
        overlay.style.zIndex = 999999;
        // 全屏兼容
        const $fullscreenElement = document.fullscreenElement;
        if ($fullscreenElement) {
          $fullscreenElement.appendChild(overlay);
        }
      });

      // 2. 准备数据
      const filenameBase = this._build_filename(this.current_media);
      const { App } = MediaModalComponents;

      // 3. 挂载 UI (使用 Preact render)
      // 注意：需要确保容器有尺寸，或者 Modal 类本身处理了 root 的基础样式
      // 这里简单加一个 inline style 确保 root 撑开
      modal.root.style.width = "800px";
      modal.root.style.maxWidth = "90vw";
      modal.root.style.background = "#fff";
      modal.root.style.borderRadius = "8px";
      modal.root.style.overflow = "hidden";

      const { html, render } = requires.htmPreact;
      render(
        html`<${App}
          media=${this.current_media}
          filenameBase=${filenameBase}
        />`,
        modal.root
      );
    }
    async open_config_modal() {
      // 创建模态框
      const modal = new Modal((root, overlay) => {
        overlay.style.zIndex = 999999;
        const $fullscreenElement = document.fullscreenElement;
        if ($fullscreenElement) {
          $fullscreenElement.appendChild(overlay);
        }
      });
      modal.root.style.width = "650px";
      modal.root.style.maxWidth = "90vw";
      modal.root.style.background = "#fff";
      modal.root.style.borderRadius = "8px";
      modal.root.style.overflow = "hidden";

      const { html, render } = requires.htmPreact;
      render(
        html`<${ConfigModalComponents.App} config=${Config.global} />`,
        modal.root
      );
    }

    init() {
      this._start_detect_player_change();
    }
  }
  // #endregion

  // #region TooltipsButton
  class TooltipsButton {
    /**
     * 带有 hover 的按钮
     *
     * NOTE: dy-dl-video-btn 是用于标记是否注入用的
     *
     * @param {TooltipsButton} that
     * @returns {string}
     */
    static _html_base = (that) => html`
      <xg-icon
        class="xgplayer-playclarity-setting dy-dl-video-btn"
        data-state="normal"
        data-index="11"
      >
        <div class="gear isSmoothSwitchClarityLogin">
          <div class="virtual"></div>
          <div class="btn" tabindex="0">${that.label}</div>
        </div>
      </xg-icon>
    `;

    /**
     *
     * @param {string} label
     * @param {{label?: string, callback?: Function, html?: string, render?: Function}[]} items
     * @param {Function} onclick
     */
    constructor(label, items, onclick) {
      this.label = label;
      this.items = items;
      this.onclick = onclick;
    }

    render() {
      const root = DOMPatcher.render_html(TooltipsButton._html_base(this));
      /**
       * @type {HTMLElement}
       */
      const $gear = root.querySelector(".gear");
      const $items_list = root.querySelector(".virtual");
      const $btn = root.querySelector(".btn");

      // 绑定 hover
      $gear.addEventListener("mouseenter", () => $gear.classList.add("hover"));
      $gear.addEventListener("mouseleave", () =>
        $gear.classList.remove("hover")
      );

      // 渲染 items
      for (const item of this.items) {
        if (item.html) {
          $items_list.appendChild(DOMPatcher.render_html(item.html));
          continue;
        }
        if (item.render) {
          $items_list.appendChild(item.render());
          continue;
        }
        const $item = DOMPatcher.render_html(
          `<div class="item">${item.label}</div>`
        );
        $item.addEventListener("click", item.callback);
        $items_list.appendChild($item);
      }

      $btn.addEventListener("click", this.onclick);

      return root;
    }
  }
  // #endregion

  // #region DOM Patcher
  class DOMPatcher {
    /** @type {Downloader} */
    downloader;
    /** @type {MediaHandler} */
    mediaHandler;
    /** @type {VideoHandler} */
    videoHandler;
    /** @type {DanmakuHandler} */
    danmakuHandler;
    /** @type {MutationObserver} */
    observer;

    /**
     * @param {{downloader: Downloader, mediaHandler: MediaHandler, videoHandler: VideoHandler, danmakuHandler: DanmakuHandler}} options
     */
    constructor(options) {
      const { downloader, mediaHandler, videoHandler, danmakuHandler } =
        options;
      this.downloader = downloader;
      this.mediaHandler = mediaHandler;
      this.videoHandler = videoHandler;
      this.danmakuHandler = danmakuHandler;
      this.observer = new MutationObserver(this._handleMutations.bind(this));
    }

    /**
     *
     * @param node {HTMLElement}
     * @returns {HTMLImageElement | null}
     */
    static findImage(node) {
      let img;
      let current = node;
      while (current) {
        img = current.querySelector("img");
        if (img) return img;
        current =
          current.parentNode instanceof HTMLElement ? current.parentNode : null;
      }
      return null;
    }

    /**
     *
     * @param html {string}
     * @returns {HTMLElement}
     */
    static render_html(html) {
      const div = document.createElement("div");
      div.innerHTML = html.trim();
      return /** @type {HTMLElement} */ (div.children[0]);
    }

    /**
     * @param {MutationRecord[]} mutations
     */
    _handleMutations(mutations) {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((/** @type {Node} */ node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
          }
          const elementNode = /** @type {HTMLElement} */ (node);

          // Tooltip for emoticons
          if (elementNode.classList.contains("semi-portal")) {
            const tooltipNode = elementNode.querySelector(
              ".semi-tooltip-wrapper"
            );
            if (tooltipNode) {
              setTimeout(() => {
                // Delay to ensure content is populated
                this._handleTooltip(/** @type {HTMLElement} */ (tooltipNode));
              });
              return;
            }
          }
          // Fullscreen image modal
          // Heuristic: direct body child, no classes, contains an img
          if (
            elementNode.parentElement === document.body &&
            elementNode.classList.length === 0
          ) {
            setTimeout(() => {
              // Delay for modal rendering
              this._handleModal(elementNode);
            });
            return;
          }
          // Video player controls
          if (
            elementNode.localName === "xg-controls" ||
            elementNode.querySelector("xg-controls")
          ) {
            // FIXME: 这里有个问题，feed里面还有直播流，直播画面不应该有下载按钮，因为没用（不过有也没什么，不点就行了...）
            this._handleXgControl(/** @type {HTMLElement} */ (elementNode));
            return;
          }
        });
      });
    }

    /**
     * @param {HTMLElement} modalNode
     */
    _handleModal(modalNode) {
      const close_icon = modalNode.querySelector("#svg_icon_ic_close");
      const img = modalNode.querySelector("img");
      // Modals often have a specific container for the image, let's try to find it.
      // This might be fragile. The original used img.parentElement.
      const container =
        img?.closest('div[style*="transform: scale(1)"] > div') ||
        img?.parentElement;

      if (!close_icon || !img || !container) return;
      if (container.querySelector(".dy-dl-modal-btn")) return; // Button already exists

      const downloadButton = document.createElement("div");
      downloadButton.textContent = "下载图片";
      downloadButton.className = "LV01TNDE dy-dl-modal-btn"; // Added a specific class for checking
      downloadButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent modal from closing
        const imgSrc = img.src;
        this.downloader.download_file(imgSrc, "douyin_image");
      });
      // Styling from original script
      downloadButton.style.position = "absolute";
      downloadButton.style.bottom = "35px";
      downloadButton.style.right = "35px";
      downloadButton.style.color = "#fff";
      downloadButton.style.backgroundColor = "rgba(0,0,0,0.5)";
      downloadButton.style.padding = "5px 10px";
      downloadButton.style.borderRadius = "4px";
      downloadButton.style.fontSize = "16px";
      downloadButton.style.zIndex = "999999"; // Ensure it's on top of other modal elements
      downloadButton.style.cursor = "pointer";
      container.appendChild(downloadButton);
    }

    /**
     * @param {HTMLElement} tooltipNode
     */
    _handleTooltip(tooltipNode) {
      const tooltipContent = tooltipNode.querySelector(".semi-tooltip-content");
      if (!tooltipContent) return;

      if (!tooltipContent.textContent?.includes("添加到表情")) return;

      const imgNode = DOMPatcher.findImage(tooltipNode); // Search upwards from tooltip wrapper
      if (!imgNode?.src) return;

      if (tooltipContent.querySelector(".download-button")) return; // Button already exists

      const downloadButton = document.createElement("div");
      downloadButton.textContent = "下载表情包";
      downloadButton.className = "LV01TNDE download-button"; // Class from original

      downloadButton.style.cursor = "pointer"; // Make it look clickable
      downloadButton.style.paddingTop = "4px"; // Add some spacing

      downloadButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent other tooltip actions
        const imgSrc = imgNode.src;
        this.downloader.download_file(imgSrc, "douyin_emoticon");
      });

      tooltipContent.appendChild(downloadButton);
    }

    /**
     * @param {HTMLElement} xg_control_node
     */
    _handleXgControl(xg_control_node) {
      const right_grid = xg_control_node.querySelector(".xg-right-grid");
      if (!right_grid) return;
      if (right_grid.querySelector(".dy-dl-video-btn")) return; // Button already exists

      const btn = new TooltipsButton(
        "插件",
        [
          {
            html: `<div class="xgTips item"><span>快捷键：</span><span class="shortcutKey">M</span>`,
          },
          {
            label: "需求/反馈",
            callback: () => {
              window.open(
                "https://github.com/zhzLuke96/douyin-dl-user-js/issues",
                "_blank",
                "noopener,noreferrer"
              );
            },
          },
          {
            label: "设置",
            callback: () => {
              this.mediaHandler.open_config_modal();
            },
          },
          {
            label: "媒体详情",
            callback: () => {
              this.mediaHandler.show_media_details();
            },
          },
          {
            label: "下载弹幕",
            callback: () => {
              if (!this.mediaHandler.player) {
                alert("当前没有播放器实例，无法下载弹幕。");
                return;
              }
              if (!this.mediaHandler.current_media) {
                alert("当前没有媒体实例，无法下载弹幕。");
                return;
              }
              const content = this.danmakuHandler.getDanmakuAssFileContent(
                this.mediaHandler.player
              );
              const filename = this.mediaHandler._build_filename(
                this.mediaHandler.current_media
              );
              const blob = new Blob([content], { type: "text/plain" });
              this.downloader.download_blob(blob, `${filename}.ass`);
            },
          },
          {
            label: "复制视频帧",
            callback: () => {
              this.videoHandler.copy_current_frame();
            },
          },
          {
            label: "下载视频帧",
            callback: () => {
              this.videoHandler.download_current_frame();
            },
          },
          {
            label: "下载",
            callback: () => {
              this.mediaHandler.download_current_media();
            },
          },
        ],
        (e) => {
          // TODO: 没用... 会被劫持，所以移动到上面的 item 中去了
          // e.stopPropagation();
          // this.downloadCurrentMediaFn();
        }
      );
      const downloadButton = btn.render();

      // Try to insert before volume or settings for better placement
      const qualitySwitch = right_grid.querySelector(
        ".xgplayer-quality-setting"
      );
      const volumeControl = right_grid.querySelector(".xgplayer-volume");
      if (qualitySwitch) {
        right_grid.insertBefore(downloadButton, qualitySwitch);
      } else if (volumeControl) {
        right_grid.insertBefore(downloadButton, volumeControl);
      } else {
        right_grid.appendChild(downloadButton); // Fallback
      }
    }

    startObserving() {
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      // Initial scan for already existing elements
      document
        .querySelectorAll("xg-controls")
        .forEach((controls) =>
          this._handleXgControl(/** @type {HTMLElement} */ (controls))
        );
    }
  }
  // #endregion

  // #region HotkeyManager
  class HotkeyManager {
    constructor() {}
    /**
     * @param {string} key
     * @param {Function} fn
     */
    addHotkey(key, fn) {
      const callback = (ev) => {
        if (ev.key.toLowerCase() !== key.toLowerCase()) return;

        const activeElement = /** @type {HTMLElement} */ (
          document.activeElement
        );
        if (activeElement) {
          // Check if activeElement is not null
          const tagName = activeElement.tagName;
          const isInputElement =
            tagName === "INPUT" ||
            tagName === "TEXTAREA" ||
            activeElement.isContentEditable;
          if (isInputElement) return;
        }

        ev.preventDefault();
        fn();
      };
      document.addEventListener("keydown", callback);
      const dispose = () => document.removeEventListener("keydown", callback);
      return { dispose };
    }
  }
  // #endregion

  // #region 视频管理
  /**
   * 和视频相关的操作
   *
   * 比如 截图当前视频帧
   */
  class VideoHandler {
    get $video() {
      // 因为是虚拟列表所以存在三个（也可能更多） video 元素
      const videos = document.querySelectorAll("xg-video-container video");
      // 我们找到可见的，并且最大的那个
      let maxVideo = null;
      let maxArea = 0;

      videos.forEach((video) => {
        const rect = video.getBoundingClientRect();
        const isVisible =
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < window.innerHeight &&
          rect.left < window.innerWidth;

        if (isVisible) {
          const area = rect.width * rect.height;
          if (area > maxArea) {
            maxArea = area;
            maxVideo = video;
          }
        }
      });

      return maxVideo;
    }
    /**
     * 截取当前视频帧，返回 Blob
     */
    async capture_current_frame(video = this.$video) {
      if (!video) {
        alert(
          "没有找到可见的视频元素。注：截屏功能只能截图视频作品，如果你确定是视频作品并且仍然报错，请尝试刷新页面。"
        );
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // TODO: 这里可能也转码一下？
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png");
      });
    }

    /**
     * 复制当前视频帧到剪贴板
     */
    async copy_current_frame(video = this.$video) {
      const blob = await this.capture_current_frame(video);
      if (!blob) return;

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        alert("视频帧已复制到剪贴板");
      } catch (err) {
        console.error("复制失败：", err);
        alert("复制失败，请确保您有权限访问剪贴板。");
      }
    }

    /**
     * 下载当前视频帧
     */
    async download_current_frame(video = this.$video) {
      const blob = await this.capture_current_frame(video);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // TODO: 这里下载名字其实可以用视频标题之类的 但是，这个功能可能用复制的多，下载的情况估计不多
      a.download = "video-frame.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }
  // #endregion

  /**
   * 将毫秒时间戳转换为 ASS 格式的时间字符串 (H:MM:SS.ss)
   */
  function msToAssTime(ms) {
    if (ms < 0) ms = 0;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.round((ms % 1000) / 10);
    const pad = (num, length = 2) => num.toString().padStart(length, "0");
    return `${hours}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  }

  /**
   * 将 HEX 颜色 (#RRGGBB) 转换为 ASS 格式的颜色字符串 (&HBBGGRR&)
   */
  function hexToAssColor(hex) {
    if (!hex || !hex.startsWith("#")) return "&H00FFFFFF";
    const r = hex.substring(1, 3);
    const g = hex.substring(3, 5);
    const b = hex.substring(5, 7);
    return `&H${b}${g}${r}&`;
  }

  // #region 弹幕相关
  /**
   * 弹幕相关
   */
  class DanmakuHandler {
    /**
     * 将弹幕 JSON 数据转换为 ASS 文件，优化视觉表现
     * @param {Array<Object>} danmakuData - 弹幕数据数组
     * @param {Object} [options] - 可选配置项
     * @param {string} [options.title="Danmaku"] - ASS 文件标题
     * @param {number} [options.playResX=1920] - 视频宽度
     * @param {number} [options.playResY=1080] - 视频高度
     * @param {string} [options.font="Microsoft YaHei"] - 默认字体
     * @param {number} [options.baseFontSize=20] - JSON中的基准字号，用于布局计算
     * @param {number} [options.fontSizeMultiplier=2.5] - 字体大小缩放倍率，将JSON中的字号放大
     * @param {number} [options.lineHeightRatio=1.2] - 行高与字号的比例，用于计算轨道高度
     * @param {number} [options.topMargin=10] - 弹幕区域距离屏幕顶部的边距
     * @param {number} [options.maxTracks=15] - 最大轨道数
     * @returns {string} - 生成的 ASS 文件内容字符串
     */
    convertDanmakuToAss(danmakuData, options = {}) {
      // --- 1. 设置默认配置 ---
      const config = {
        title: "Danmaku",
        playResX: 1920,
        playResY: 1080,
        font: "Microsoft YaHei",
        baseFontSize: 20, // 假设JSON中大部分字体大小是20px
        fontSizeMultiplier: 2.5, // 将20px放大到50，在1080p下是合适的尺寸
        lineHeightRatio: 1.2, // 1.2倍行高，间距更紧凑
        topMargin: 10,
        maxTracks: 15,
        ...options,
      };

      // --- 2. 动态计算布局参数 ---
      // 计算用于布局的基准字体大小和轨道高度
      const layoutFontSize = config.baseFontSize * config.fontSizeMultiplier;
      const trackHeight = layoutFontSize * config.lineHeightRatio;

      // --- 3. 构建 ASS 文件头部 ---
      const header = `[Script Info]
; Script generated by JavaScript Danmaku Converter V3
Title: ${config.title}
ScriptType: v4.00+
PlayResX: ${config.playResX}
PlayResY: ${config.playResY}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${config.font},${layoutFontSize},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,1,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

      // --- 4. 轨道管理与弹幕生成 ---
      const tracks = new Array(config.maxTracks).fill(0);
      const sortedData = [...danmakuData].sort((a, b) => a.start - b.start);

      const events = sortedData
        .map((dm) => {
          if (!dm.start || !dm.text || !dm.duration || !dm.style) {
            return null;
          }

          // 计算这条弹幕实际渲染的字体大小
          const actualFontSize =
            (parseInt(dm.style.fontSize) || config.baseFontSize) *
            config.fontSizeMultiplier;

          // 估算弹幕文本的像素宽度（使用0.6作为中文字符宽高比的近似值）
          const textWidth = dm.text.length * actualFontSize * 0.6;

          const speed = (config.playResX + textWidth) / dm.duration;
          if (speed <= 0) return null;

          const timeToClearRightEdge = textWidth / speed;

          let trackIndex = -1;
          for (let i = 0; i < config.maxTracks; i++) {
            if (tracks[i] <= dm.start) {
              trackIndex = i;
              break;
            }
          }
          if (trackIndex === -1) {
            let earliestFreeTime = Infinity;
            for (let i = 0; i < config.maxTracks; i++) {
              if (tracks[i] < earliestFreeTime) {
                earliestFreeTime = tracks[i];
                trackIndex = i;
              }
            }
          }

          tracks[trackIndex] = dm.start + timeToClearRightEdge;

          // 计算正确的Y坐标
          // yPos应该是文本的垂直中心点在其轨道内的位置
          // 轨道中心点 = 顶部边距 + 已占用的轨道高度 + 当前轨道高度的一半
          const yPos =
            config.topMargin + trackIndex * trackHeight + trackHeight / 2;

          const startTime = msToAssTime(dm.start);
          const endTime = msToAssTime(dm.start + dm.duration);
          const assColor = hexToAssColor(dm.style.color);

          const startX = config.playResX + textWidth / 2;
          const endX = -textWidth / 2;

          const assText = `{\\move(${startX}, ${yPos}, ${endX}, ${yPos})}{\\c${assColor}\\fs${actualFontSize}}${dm.text}`;

          return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${assText}`;
        })
        .filter(Boolean)
        .join("\n");

      return header + events;
    }

    /**
     *
     * @param {import("./types").DouyinPlayer.PlayerInstance} player
     */
    getDanmakuList(player) {
      return player?.danmaku?.main?.data || [];
    }

    /**
     * 获取视频宽高
     *
     * NOTE： 这里主要是获取比例
     *
     * @param {import("./types").DouyinPlayer.PlayerInstance} player
     */
    getMediaSize(player) {
      const {
        sizeInfo: { width, height },
      } = player;
      return { width, height };
    }

    /**
     * 获取弹幕 ass 文件
     *
     * @param {import("./types").DouyinPlayer.PlayerInstance} player
     */
    getDanmakuAssFileContent(player) {
      const list = this.getDanmakuList(player);
      if (!list || list.length === 0) {
        alert("当前视频弹幕为空，或者未加载完成");
        return;
      }
      const size = this.getMediaSize(player);
      return this.convertDanmakuToAss(list, {
        // TODO: 这里可以写入一些视频元数据，暂时占位写个链接
        title: "download from https://github.com/zhzLuke96/douyin-dl-user-js",
        playResX: size.width,
        playResY: size.height,
      });
    }
  }
  // #endregion

  // #region 启动
  // ========== Main Script Logic =============

  const downloader = new Downloader();
  const mediaHandler = new MediaHandler(downloader);
  const videoHandler = new VideoHandler();
  const danmakuHandler = new DanmakuHandler();
  // Pass the already bound method from mediaHandler instance
  const domPatcher = new DOMPatcher({
    downloader,
    mediaHandler,
    videoHandler,
    danmakuHandler,
  });
  const hotkeyManager = new HotkeyManager();

  mediaHandler.init(); // Starts player detection
  domPatcher.startObserving(); // Starts DOM observation and initial scan

  // TODO: 支持自定义快捷键，没太想好怎么搞好点...
  hotkeyManager.addHotkey("m", () => mediaHandler.download_current_media());
  // #endregion
  console.log("[dy-dl]已启动");
})();
