// ==UserScript==
// @name            抖音下载
// @namespace       https://github.com/zhzLuke96/douyin-dl-user-js
// @version         1.2.8
// @description     为web版抖音增加下载按钮
// @author          zhzluke96
// @match           https://*.douyin.com/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=douyin.com
// @grant           none
// @license         MIT
// @supportURL      https://github.com/zhzLuke96/douyin-dl-user-js/issues
// @downloadURL https://update.greasyfork.org/scripts/522326/%E6%8A%96%E9%9F%B3%E4%B8%8B%E8%BD%BD.user.js
// @updateURL https://update.greasyfork.org/scripts/522326/%E6%8A%96%E9%9F%B3%E4%B8%8B%E8%BD%BD.meta.js
// ==/UserScript==

(function () {
  "use strict";

  /**
   * 模板字符串函数
   * 用于占位标记用来触发编辑器高亮和格式化，没有实际作用
   *
   * @type {function(strings: TemplateStringsArray, ...values: any[]): string}}
   */
  const html = (strings, ...values) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] || ""), "");

  class Config {
    static global = new Config();

    features = {
      convert_webp_to_png: true,
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

  class Downloader {
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
     * @param filename_input {string}
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
     * @param filename_input {string}
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
      const short_id = MediaHandler.toShortId(awemeId);
      const tag_list =
        textExtra?.map((x) => x.hashtagName).filter(Boolean) || [];
      const tags = tag_list.map((x) => "#" + x).join("_");
      let rawDesc = desc || "";
      tag_list.forEach((t) => {
        rawDesc = rawDesc.replace(new RegExp(`#${t}\\s*`, "g"), "");
      });
      rawDesc = rawDesc.trim().replace(/[#/\?<>\\:\*\|":]/g, ""); // Sanitize illegal characters

      const baseName = `${nickname}_${short_id}_${tags}_${rawDesc}`;
      return baseName.length > 64 ? baseName.slice(0, 64) : baseName;
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

      // 假设 current_media 的类型是 DouyinMedia.MediaRoot
      const current_media = this.current_media;

      // 点击后打开一个 modal 框，显示媒体详情，并提供下载链接
      const modal = new Modal((root, overlay) => {
        // issues #18 https://github.com/zhzLuke96/douyin-dl-user-js/issues/18
        overlay.style.zIndex = 999999;
        // 需要放在 slidelist 里，不然全屏之后看不见
        const $fullscreenElement = document.fullscreenElement;
        if ($fullscreenElement) {
          // FIXME: 这里有个问题，滚轮事件有可能被 parent 捕获了...没想到什么好办法解决...
          $fullscreenElement.appendChild(overlay);
        }
      });

      // --- 1. 辅助函数 (Helpers for rendering) ---
      const render_helpers = {
        formatTimestamp: (ts) =>
          ts ? new Date(ts * 1000).toLocaleString() : "N/A",
        formatCount: (num) => {
          if (num === undefined || num === null) return "N/A";
          if (num > 10000) return (num / 10000).toFixed(1) + " 万";
          return num.toString();
        },
        renderKeyValue: (label, value) => html`
          <div
            style="display: flex; padding: 4px 0; font-size: 14px; border-bottom: 1px solid #f0f0f0;"
          >
            <strong style="width: 100px; flex-shrink: 0; color: #555;"
              >${label}</strong
            >
            <span style="flex-grow: 1; color: #333; word-break: break-all;"
              >${value || "-"}</span
            >
          </div>
        `,
        renderCopyableValue: (label, value) => {
          if (!value) return render_helpers.renderKeyValue(label, value);
          return html`
            <div
              style="display: flex; padding: 4px 0; font-size: 14px; align-items: center; border-bottom: 1px solid #f0f0f0;"
            >
              <strong style="width: 100px; flex-shrink: 0; color: #555;"
                >${label}</strong
              >
              <span
                style="flex-grow: 1; color: #333; word-break: break-all; margin-right: 8px;"
                >${value}</span
              >
              <button
                class="dy-dl-copy-btn"
                data-copy-text="${value}"
                style="padding: 2px 6px; font-size: 12px; cursor: pointer;"
              >
                复制
              </button>
            </div>
          `;
        },
      };

      // --- 2. 准备每个 Tab 的内容 ---
      const {
        video,
        images,
        music,
        authorInfo,
        stats,
        desc,
        createTime,
        awemeId,
        shareInfo,
        awemeControl,
      } = current_media;
      const tabs = {};

      // Tab 1: 媒体资源
      const is_video = video && video.bitRateList.length > 0;
      const is_images = images && images.length > 0;

      const cover_details_html = (() => {
        if (
          !video ||
          !video.originCoverUrlList ||
          video.originCoverUrlList.length === 0
        ) {
          return "";
        }
        // 优先使用索引为 1 的高清封面，如果不存在则回退到索引 0
        const cover_url =
          video.originCoverUrlList[1] || video.originCoverUrlList[0];
        const filename_base = this._build_filename(current_media);
        const cover_filename = `cover_${filename_base}.jpeg`;

        return html`
          <fieldset>
            <legend>视频封面</legend>
            <div style="display: flex; gap: 1rem; align-items: flex-start;">
              <img
                src="${cover_url}"
                alt="Video Cover"
                style="width: 120px; max-height: 180px; object-fit: cover; border-radius: 4px; border: 1px solid #ccc;"
              />
              <div
                style="font-size: 14px; display: flex; flex-direction: column; gap: 0.5rem;"
              >
                <p style="margin: 0;">
                  <strong>分辨率:</strong> ${video.width} × ${video.height}
                </p>
                <div style="display: flex; gap: 0.5rem; margin-top: 8px;">
                  <a
                    href="${cover_url}"
                    target="_blank"
                    style="padding: 4px 10px; background: #6c757d; color: white; text-decoration: none; border-radius: 4px;"
                    >新标签打开</a
                  >
                  <a
                    href="${cover_url}"
                    download="${cover_filename}"
                    style="padding: 4px 10px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;"
                    >下载封面</a
                  >
                </div>
              </div>
            </div>
          </fieldset>
        `;
      })();

      const video_details_html = is_video
        ? html` <fieldset>
            <legend>视频</legend>
            <table
              border="1"
              cellspacing="0"
              cellpadding="4"
              style="width: 100%; font-size: 12px;"
            >
              <thead>
                <tr>
                  <th>清晰度</th>
                  <th>分辨率</th>
                  <th>格式</th>
                  <th>FPS</th>
                  <th>Bitrate (kbps)</th>
                  <th>大小</th>
                  <th>播放链接</th>
                </tr>
              </thead>
              <tbody>
                ${video.bitRateList
                  .map(
                    (item) => html` <tr>
                      <td>${item.gearName}</td>
                      <td>${item.width}×${item.height}</td>
                      <td>${item.format}</td>
                      <td>${item.fps}</td>
                      <td>${(item.bitRate / 1000).toFixed(1)}</td>
                      <td>
                        ${item.dataSize
                          ? (item.dataSize / 1024 / 1024).toFixed(2) + " MB"
                          : "-"}
                      </td>
                      <td>
                        ${item.playApi
                          ? `<a href="${item.playApi}" target="_blank">播放</a>`
                          : "-"}
                      </td>
                    </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </fieldset>`
        : "";

      const images_details_html = is_images
        ? html` <fieldset>
            <legend>图集</legend>
            <table
              border="1"
              cellspacing="0"
              cellpadding="4"
              style="width: 100%; font-size: 12px;"
            >
              <thead>
                <tr>
                  <th>序号</th>
                  <th>类型</th>
                  <th>分辨率</th>
                  <th>大小</th>
                  <th>预览</th>
                  <th>下载</th>
                </tr>
              </thead>
              <tbody>
                ${images
                  .map((img, idx) => {
                    const isVideo = !!img.video;
                    const thumbUrl = isVideo
                      ? img.video.originCoverUrlList?.[0] || ""
                      : img.urlList?.[0] || "";
                    const downloadUrl = isVideo
                      ? img.video.playAddr?.[0]?.src || ""
                      : img.downloadUrlList?.[0] || "";
                    const resolution = isVideo
                      ? `${img.video.width}×${img.video.height}`
                      : `${img.width}×${img.height}`;
                    const sizeMB =
                      isVideo && img.video.dataSize
                        ? (img.video.dataSize / 1024 / 1024).toFixed(2) + " MB"
                        : "-";
                    return html` <tr>
                      <td>${idx + 1}</td>
                      <td>${isVideo ? "视频" : "图片"}</td>
                      <td>${resolution}</td>
                      <td>${sizeMB}</td>
                      <td>
                        <img
                          src="${thumbUrl}"
                          style="max-width: 100px; max-height: 60px;"
                        />
                      </td>
                      <td>
                        ${downloadUrl
                          ? `<a href="${downloadUrl}" target="_blank">下载</a>`
                          : "-"}
                      </td>
                    </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </fieldset>`
        : "";

      // NOTE: music.duration 的单位就是秒
      const music_details_html = music
        ? html` <fieldset>
            <legend>音乐</legend>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <img
                src="${music?.coverThumb?.urlList?.[0] || ""}"
                alt="cover"
                style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px;"
              />
              <div style="flex: 1; font-size: 14px;">
                <div><strong>标题：</strong>${music.title}</div>
                <div><strong>作者：</strong>${music.author}</div>
                <div><strong>时长：</strong>${music.duration} 秒</div>
                <div>
                  <strong>播放：</strong>${music.playUrl?.urlList?.[0]
                    ? `<a href="${music.playUrl.urlList[0]}" target="_blank">试听</a>`
                    : "-"}
                </div>
              </div>
            </div>
          </fieldset>`
        : "";

      tabs.media = {
        title: "媒体资源",
        content: `<div style="display: flex; flex-direction: column; gap: 1rem;">${cover_details_html}${video_details_html}${images_details_html}${music_details_html}</div>`,
      };

      // Tab 2: 作者信息
      if (authorInfo) {
        tabs.author = {
          title: "作者信息",
          content: html`
            <div
              style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;"
            >
              <img
                src="${authorInfo.avatarThumb.urlList[0]}"
                style="width: 80px; height: 80px; border-radius: 50%;"
              />
              <div style="flex-grow: 1;">
                <h3 style="margin: 0 0 8px 0;">${authorInfo.nickname}</h3>
                <a
                  href="https://www.douyin.com/user/${authorInfo.secUid}"
                  target="_blank"
                  style="display: inline-block; padding: 4px 12px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;"
                  >访问主页</a
                >
              </div>
            </div>
            <div>
              ${render_helpers.renderKeyValue(
                "认证信息",
                authorInfo.customVerify || authorInfo.enterpriseVerifyReason
              )}
              ${render_helpers.renderCopyableValue("UID", authorInfo.uid)}
              ${render_helpers.renderCopyableValue("SecUID", authorInfo.secUid)}
              ${render_helpers.renderKeyValue(
                "粉丝数",
                render_helpers.formatCount(authorInfo.followerCount)
              )}
              ${render_helpers.renderKeyValue(
                "获赞数",
                render_helpers.formatCount(authorInfo.totalFavorited)
              )}
            </div>
          `,
        };
      }

      // Tab 3: 作品信息
      tabs.post = {
        title: "作品信息",
        content: html`
          <fieldset>
            <legend>描述</legend>
            <p
              style="font-size: 14px; white-space: pre-wrap; line-height: 1.6;"
            >
              ${desc || "无"}
            </p>
          </fieldset>
          <fieldset>
            <legend>详情</legend>
            ${render_helpers.renderKeyValue(
              "发布时间",
              render_helpers.formatTimestamp(createTime)
            )}
            ${render_helpers.renderCopyableValue(
              "分享链接",
              shareInfo.shareUrl
            )}
            ${render_helpers.renderKeyValue(
              "点赞数",
              render_helpers.formatCount(stats.diggCount)
            )}
            ${render_helpers.renderKeyValue(
              "评论数",
              render_helpers.formatCount(stats.commentCount)
            )}
            ${render_helpers.renderKeyValue(
              "收藏数",
              render_helpers.formatCount(stats.collectCount)
            )}
            ${render_helpers.renderKeyValue(
              "分享数",
              render_helpers.formatCount(stats.shareCount)
            )}
          </fieldset>
        `,
      };

      // Tab 4: 高级信息
      tabs.advanced = {
        title: "高级信息",
        content: html`
          <fieldset>
            <legend>ID</legend>
            ${render_helpers.renderCopyableValue("Aweme ID", awemeId)}
            ${render_helpers.renderCopyableValue(
              "Group ID",
              current_media.groupId
            )}
          </fieldset>
          <fieldset>
            <legend>权限控制</legend>
            ${render_helpers.renderKeyValue(
              "允许评论",
              awemeControl?.canComment ? "是" : "否"
            )}
            ${render_helpers.renderKeyValue(
              "允许分享",
              awemeControl?.canShare ? "是" : "否"
            )}
            ${render_helpers.renderKeyValue(
              "允许下载",
              current_media.download?.allowDownload ? "是" : "否"
            )}
            ${render_helpers.renderKeyValue(
              "是否私密",
              current_media.isPrivate ? "是" : "否"
            )}
          </fieldset>
        `,
      };

      // Tab 5: 完整 JSON
      tabs.json = {
        title: "完整 JSON",
        content: html` <fieldset>
          <legend>
            JSON <button id="json_select">选中</button>
            <button id="json_console">console</button>
          </legend>
          <pre
            style="max-height: 20rem; overflow: auto; word-break: break-all; white-space: pre-wrap;"
          ><code>${JSON.stringify(current_media, null, 2)}</code></pre>
        </fieldset>`,
      };

      // --- 3. 构建最终的 UI ---
      const tabKeys = Object.keys(tabs);
      const details = DOMPatcher.render_html(html`
        <div class="dy-dl-modal-container">
          <style>
            .dy-dl-modal-container {
              display: flex;
              flex-direction: column;
              max-width: 90vw;
              max-height: 90vh;
              width: 800px;
              padding: 1rem;
              box-sizing: border-box;
              background: #fff;
            }
            .dy-dl-nav {
              display: flex;
              border-bottom: 1px solid #ccc;
              margin-bottom: 1rem;
              flex-shrink: 0;
            }
            .dy-dl-nav-button {
              padding: 0.5rem 1rem;
              border: none;
              background: transparent;
              cursor: pointer;
              font-size: 14px;
              border-bottom: 2px solid transparent;
              margin-bottom: -1px;
            }
            .dy-dl-nav-button.active {
              color: #007bff;
              border-bottom-color: #007bff;
              font-weight: bold;
            }
            .dy-dl-tab-content {
              flex-grow: 1;
              overflow-y: auto;
              padding-right: 10px;
            }
            .dy-dl-tab-panel {
              display: none;
            }
            .dy-dl-tab-panel.active {
              display: block;
            }
            .dy-dl-tab-panel fieldset {
              border: 1px solid #ddd;
              border-radius: 4px;
              margin-bottom: 1rem;
              padding: 0.5rem 1rem;
            }
            .dy-dl-tab-panel legend {
              font-weight: bold;
              color: #333;
            }
          </style>
          <nav class="dy-dl-nav">
            ${tabKeys
              .map(
                (key) =>
                  `<button class="dy-dl-nav-button" data-tab-id="${key}">${tabs[key].title}</button>`
              )
              .join("")}
          </nav>
          <div class="dy-dl-tab-content">
            ${tabKeys
              .map(
                (key) =>
                  `<div class="dy-dl-tab-panel" data-tab-id="${key}">${tabs[key].content}</div>`
              )
              .join("")}
          </div>
        </div>
      `);

      // --- 4. 添加交互逻辑 ---
      const navButtons = details.querySelectorAll(".dy-dl-nav-button");
      const tabPanels = details.querySelectorAll(".dy-dl-tab-panel");

      function switchTab(tabId) {
        navButtons.forEach((btn) =>
          btn.classList.toggle("active", btn.dataset.tabId === tabId)
        );
        tabPanels.forEach((panel) =>
          panel.classList.toggle("active", panel.dataset.tabId === tabId)
        );
      }

      navButtons.forEach((button) => {
        button.addEventListener("click", () => switchTab(button.dataset.tabId));
      });

      if (tabKeys.length > 0) {
        switchTab(tabKeys[0]);
      }

      const $json_select = details.querySelector("#json_select");
      if ($json_select) {
        $json_select.addEventListener("click", () => {
          const $code = details.querySelector("code");
          if (!$code) return;
          window.getSelection().selectAllChildren($code);
        });
      }

      const $json_console = details.querySelector("#json_console");
      if ($json_console) {
        $json_console.addEventListener("click", () => {
          console.log(JSON.parse(JSON.stringify(this.current_media)));
        });
      }

      details.querySelectorAll(".dy-dl-copy-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
          const textToCopy = e.target.dataset.copyText;
          navigator.clipboard
            .writeText(textToCopy)
            .then(() => {
              e.target.textContent = "已复制!";
              setTimeout(() => {
                e.target.textContent = "复制";
              }, 2000);
            })
            .catch((err) => {
              console.error("复制失败: ", err);
              alert("复制失败!");
            });
        });
      });

      modal.root.appendChild(details);
    }

    init() {
      this._start_detect_player_change();
    }
  }

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

  console.log("[dy-dl]已启动");
})();
