// ==UserScript==
// @name            抖音下载
// @namespace       https://github.com/zhzLuke96/douyin-dl-user-js
// @version         1.3.0
// @description     为web版抖音增加下载按钮
// @author          zhzluke96
// @match           https://*.douyin.com/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=douyin.com
// @grant           none
// @license         MIT
// @supportURL      https://github.com/zhzLuke96/douyin-dl-user-js/issues
// @downloadURL https://update.greasyfork.org/scripts/522326/%E6%8A%96%E9%9F%B3%E4%B8%8B%E8%BD%BD.user.js
// @updateURL https://update.greasyfork.org/scripts/522326/%E6%8A%96%E9%9F%B3%E4%B8%8B%E8%BD%BD.meta.js
// @require         https://cdn.jsdelivr.net/npm/htm@3/preact/standalone.umd.js
// ==/UserScript==

const requires = this;

(function () {
  "use strict";

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

  // #region 配置管理
  class Config {
    static defaults = {
      filename_template: "`${nickname}_${short_id}_${tags}_${desc}`",
    };
    static global = new Config();

    features = {
      /**
       * 是否开启图片转码
       */
      convert_webp_to_png: true,
      /**
       * 下载视频分辨率策略
       * 可以选默认，最高清晰度，最小清晰度，和一些其他预设分辨率
       *
       * @type {"default" | "max" | "min" | "1080P" | "720P" | "360P" | "2K"}
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

    /**
     * 预下载文件
     *
     * PS: 这一步其实没有下载，而是通过浏览器的缓存读取了
     * PSS: 并且如果浏览器没有缓存，似乎会报错，因为server那边会校验cookie，我们没带上（现在不知道要带上什么...在js里也没法重放请求...）
     *
     * @param imgSrc {string}
     * @param filename_input {string} 输入的文件名，如果有就用这个，没有就从请求体里面找
     * @returns {Promise<{ok: boolean, blob?: Blob, filename?: string, isImage?: boolean, isWebP?: boolean, pngBlob?: Blob | null, fileExt?: string, error?: string}>}
     */
    async prepare_download_file(imgSrc, filename_input = "") {
      if (imgSrc.startsWith("//")) {
        const protocol = window.location.protocol;
        imgSrc = `${protocol}${imgSrc}`;
      }
      const url = new URL(imgSrc);
      const response = await fetch(imgSrc);
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
      // Ensure filename ends with the determined extension
      const currentExtPattern = new RegExp(`\\.${determinedFileExt}$`, "i");
      if (!currentExtPattern.test(filename)) {
        // Remove any existing extension before appending the new one
        filename = filename.replace(/\.[^/.]+$/, "");
        filename += `.${determinedFileExt}`;
      }

      const blob = await response.blob();
      let pngBlob = null;

      if (isImage && isWebP && Config.global.features.convert_webp_to_png) {
        try {
          pngBlob = await this.convertWebPToPNG(blob);
        } catch (error) {
          console.error("[dy-dl]WebP转PNG失败", error);
          // If conversion fails, pngBlob remains null, original blob will be used
        }
      }

      return {
        blob,
        filename,
        isImage,
        isWebP,
        pngBlob,
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
     * 下载文件流程:
     *
     * 1. 预下载为 blob ，读取元信息
     * 2. 如果是 webp 图片，尝试转为 png 图片
     * 3. 下载 blob
     *
     * @param source {string}
     * @param filename_input {string} 输入的文件名，如果有就用这个，没有就从请求体里面找
     * @param fallback_src {string[]} 比如其他分辨率
     */
    async download_file(source, filename_input = "", fallback_src = []) {
      let url_sources = [source, ...fallback_src].filter(
        (x) => typeof x === "string" && x.length > 0
      );
      url_sources = Array.from(new Set(url_sources));

      let firstAttemptFailedMessage = "";

      for (const [index, url] of url_sources.entries()) {
        let blob, pngBlob, filename;
        try {
          const result = await this.prepare_download_file(url, filename_input);
          if (!result.ok) {
            const errorMessage = `[dy-dl]预下载失败 (${
              result.error || "Unknown error"
            })，将重试其他地址: ${url}`;
            console.error(errorMessage);
            if (index === 0) {
              // Store message from first attempt
              firstAttemptFailedMessage = result.error?.includes(
                "Failed to fetch"
              )
                ? "Failed to fetch the file"
                : "";
            }
            continue;
          }
          blob = result.blob;
          pngBlob = result.pngBlob; // This will be the converted PNG if successful, or null
          filename = result.filename;
        } catch (error) {
          console.error(`[dy-dl]预下载异常，将重试其他地址: ${url}`, error);
          if (index === 0) {
            // Store message from first attempt
            firstAttemptFailedMessage =
              "Failed to fetch the file due to an exception";
          }
          continue;
        }

        // Prefer PNG blob if available (i.e., WebP was converted)
        if (pngBlob) {
          try {
            await this.download_blob(pngBlob, filename);
            return;
          } catch (error) {
            console.error(
              `[dy-dl]下载转换后的PNG失败，回退原始版本: ${filename}`,
              error
            );
            // Fall through to try downloading the original blob
          }
        }

        // Download original blob (or if PNG download failed)
        if (blob) {
          try {
            await this.download_blob(blob, filename);
            return;
          } catch (error) {
            console.error(
              `[dy-dl]下载blob失败，尝试其他版本: ${filename}`,
              error
            );
            continue;
          }
        }
      }

      // If all downloads failed, show an alert.
      // If the first attempt failed with a "Failed to fetch" style error, replicate original alert.
      if (firstAttemptFailedMessage && url_sources.length === 1) {
        alert(firstAttemptFailedMessage);
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

  // #region UI related code

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

    const MediaTab = ({ media, filenameBase }) => {
      const { video, images, music } = media;

      // 视频部分
      const VideoSection = () => {
        if (!video?.bitRateList?.length) return null;
        const coverUrl =
          video.originCoverUrlList?.[1] || video.originCoverUrlList?.[0];

        return html`
          <fieldset style=${styles.fieldset}>
            <legend style=${styles.legend}>视频封面</legend>
            <div style="display: flex; gap: 15px;">
              <img src=${coverUrl} style="width: 120px; border-radius: 4px;" />
              <div>
                <p><strong>分辨率:</strong> ${video.width} × ${video.height}</p>
                <div style="margin-top: 10px;">
                  <a href=${coverUrl} target="_blank" style=${styles.btn}
                    >新标签打开</a
                  >
                  <a
                    href=${coverUrl}
                    download="cover_${filenameBase}.jpeg"
                    style=${styles.btn}
                    >下载封面</a
                  >
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
                "FPS",
                "码率(kbps)",
                "大小",
                "操作",
              ]}
              rows=${video.bitRateList.map((v) => [
                v.gearName,
                `${v.width}×${v.height}`,
                v.fps,
                (v.bitRate / 1000).toFixed(0),
                fmt.size(v.dataSize),
                v.playApi
                  ? html`<a href=${v.playApi} target="_blank">播放</a>`
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

      return html`<div>
        <${VideoSection} /><${ImageSection} /><${MusicSection} />
      </div>`;
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

  // 配置 config modal
  const ConfigModalComponents = (() => {
    /**
     * @type {import('preact/hooks')}
     */
    const { useState, useRef, useEffect } = requires?.htmPreact;
    /**
     * @type {import('preact').h}
     */
    const html = requires?.htmPreact?.html;
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
    _build_filename(media) {
      const {
        authorInfo: { nickname },
        awemeId,
        desc,
        textExtra,
      } = media;
      const {
        filename_template = Config.defaults.filename_template,
        filename_max_length = 64,
      } = Config.global.features;

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
        create_date: new Date(media.createTime),
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
        console.error(`[dy-dl] Error rendering filename template:`);
        console.error(error);
        baseName = runInContext(context, Config.defaults.filename_template);
      }
      if (baseName.length > filename_max_length) {
        baseName = baseName.slice(0, filename_max_length);
      }
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
        const currentPlayer = window.player;
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
     * 从 video 对象上取得所有 url
     *
     * TODO: 这里其实还有编码 256 没有取
     * TODO: 不同 url 代表不同分辨率，现在我们也还没区分
     *
     * @param {import("./types").DouyinMedia.DouyinPlayerVideo | null | undefined} video_obj
     */
    _get_video_urls(video_obj) {
      if (video_obj === null || video_obj === undefined) {
        return [];
      }
      const sources = [];
      if (video_obj.playApi) {
        sources.push(video_obj.playApi);
      }
      if (Array.isArray(video_obj.playAddr)) {
        sources.push(...video_obj.playAddr.map((x) => x.src));
      }
      if (video_obj.bitRateList) {
        video_obj.bitRateList.forEach((x) => {
          if (x.playApi) sources.push(x.playApi);
        });
      }
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

      if (Array.isArray(images) && images.length !== 0) {
        // 下载图集
        // TODO 要是能支持 zip 打包会更好一点
        let downloadedCount = 0;
        for (let idx = 0; idx < images.length; idx++) {
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
        if (downloadedCount === 0 && images.length > 0) {
          alert("[dy-dl]图集下载失败，未找到有效媒体链接。");
        }
        return;
      } else {
        // 单视频或单图片（老版本可能直接在video字段放图片信息，但新版通常是images）
        const video_urls = this._get_video_urls(video);
        if (video_urls.length !== 0) {
          await this.downloader.download_file(
            video_urls[0],
            filename_base,
            video_urls
          );
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

    // 打开 配置 modal
    async open_config_modal() {
      // TODO
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
            render: () => {
              const encode_to_png_switch = DOMPatcher.render_html(
                `<div class="item"><label><input type="checkbox"/> WebP转码PNG</label></item>`
              );
              const $input = encode_to_png_switch.querySelector("input");
              $input.checked = Config.global.features.convert_webp_to_png;
              $input.addEventListener("click", () => {
                Config.global.features.convert_webp_to_png = $input.checked;
                Config.global.save();
              });
              return encode_to_png_switch;
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
      document.addEventListener("keydown", (ev) => {
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
      });
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

  // Pass the already bound method from mediaHandler instance for the hotkey
  hotkeyManager.addHotkey("m", mediaHandler.download_current_media);
  // #endregion
  console.log("[dy-dl]已启动");
})();
