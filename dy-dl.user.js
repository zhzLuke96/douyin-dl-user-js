// ==UserScript==
// @name            抖音下载
// @namespace       https://github.com/zhzLuke96/douyin-dl-user-js
// @version         1.2.2
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
     *
     * @param {(root: HTMLElement) => any} callback
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
        callback(this.root);
      }
    }

    close() {
      this.overlay.remove();
    }
  }

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
      const { video, images = [], music } = this.current_media;
      // 第一个是压缩的，所以用第二个
      const thumb = video.coverUrlList[1];
      const filename_base = this._build_filename(this.current_media);
      this.downloader.download_file(thumb, `thumb_${filename_base}`);
    }

    // 显示媒体详情
    async show_media_details() {
      if (!this.current_media) {
        alert("[dy-dl]无当前媒体信息，请尝试播放视频或等待加载。");
        return;
      }
      // 点击后打开一个 modal 框，显示媒体详情，并提供下载链接
      const modal = new Modal();
      const { current_media } = this;
      const { video, images, music } = current_media;

      const is_video = video.bitRateList.length > 0;
      const is_images = images.length > 0;

      const video_details = `
<fieldset>
  <legend>视频</legend>
  <table border="1" cellspacing="0" cellpadding="4" style="width: 100%; font-size: 12px;">
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
          (item) => `
        <tr>
          <td>${item.gearName}</td>
          <td>${item.width}×${item.height}</td>
          <td>${item.format}</td>
          <td>${item.fps}</td>
          <td>${(item.bitRate / 1000).toFixed(1)}</td>
          <td>${
            item.dataSize
              ? (item.dataSize / 1024 / 1024).toFixed(2) + " MB"
              : "-"
          }</td>
          <td>
            ${
              item.playApi
                ? `<a href="${item.playApi}" target="_blank">播放</a>`
                : "-"
            }
          </td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
</fieldset>      
`;

      const images_details_html = `
<fieldset>
  <legend>图集</legend>
  <table border="1" cellspacing="0" cellpadding="4" style="width: 100%; font-size: 12px;">
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
            ? img.video.coverUrlList?.[0] || ""
            : img.urlList?.[0] || "";
          const downloadUrl = isVideo
            ? img.video.playAddr?.[0]?.src || ""
            : img.downloadUrlList?.[0] || "";
          const resolution = isVideo
            ? `${img.video.width}×${img.video.height}`
            : `${img.width}×${img.height}`;
          const sizeMB = isVideo
            ? img.video.dataSize
              ? (img.video.dataSize / 1024 / 1024).toFixed(2) + " MB"
              : "-"
            : "-";
          return `
        <tr>
          <td>${idx + 1}</td>
          <td>${isVideo ? "视频" : "图片"}</td>
          <td>${resolution}</td>
          <td>${sizeMB}</td>
          <td><img src="${thumbUrl}" style="max-width: 100px; max-height: 60px;" /></td>
          <td>
            ${
              downloadUrl
                ? `<a href="${downloadUrl}" target="_blank">下载</a>`
                : "-"
            }
          </td>
        </tr>`;
        })
        .join("")}
    </tbody>
  </table>
</fieldset>
`;

      const music_details_html = `
<fieldset>
  <legend>音乐</legend>
  <div style="display: flex; align-items: center; gap: 1rem;">
    <img src="${
      music?.coverThumb?.urlList?.[0] || ""
    }" alt="cover" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px;" />
    <div style="flex: 1; font-size: 14px;">
      <div><strong>标题：</strong>${music.title}</div>
      <div><strong>作者：</strong>${music.author}</div>
      <div><strong>专辑：</strong>${music.album}</div>
      <div><strong>时长：</strong>${(music.duration / 1000).toFixed(1)} 秒</div>
      <div>
        <strong>播放：</strong>
        ${
          music.playUrl?.urlList?.[0]
            ? `<a href="${music.playUrl.urlList[0]}" target="_blank">试听</a>`
            : "-"
        }
      </div>
    </div>
  </div>
</fieldset>
`;

      const details = DOMPatcher.render_html(`
<div style="
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  padding: 1rem;
  box-sizing: border-box;
">
  ${is_video ? video_details : ""}
  ${is_images ? images_details_html : ""}
  ${music ? music_details_html : ""}
  <fieldset>
  <legend>JSON <button id="json_select">选中</button> <button id="json_console">console</button></legend>
  <pre style="max-height:20rem;overflow: auto;word-break: break-all;white-space: pre-wrap;"><code>${JSON.stringify(
    this.current_media,
    null,
    2
  )}</code></pre>
  </fieldset>
</div>
`);
      const $json_select = details.querySelector("#json_select");
      $json_select.addEventListener("click", () => {
        const $code = details.querySelector("code");
        const selection = window.getSelection();
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents($code);
        selection.addRange(range);
      });
      const $json_console = details.querySelector("#json_console");
      $json_console.addEventListener("click", () => {
        console.log(JSON.parse(JSON.stringify(this.current_media)));
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
    static _html_base = (that) => `
<xg-icon
  class="xgplayer-playclarity-setting dy-dl-video-btn"
  data-state="normal"
  data-index="11"
>
  <div class="gear isSmoothSwitchClarityLogin">
    <div class="virtual">
  </div>
  <div
    class="btn"
    tabindex="0"
  >
    ${that.label}
  </div>
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
    handler;
    /** @type {MutationObserver} */
    observer;

    /**
     * @param {Downloader} downloader
     * @param {MediaHandler} handler
     */
    constructor(downloader, handler) {
      this.downloader = downloader;
      this.handler = handler;
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
              this.handler.show_media_details();
            },
          },
          {
            label: "下载封面",
            callback: () => {
              this.handler.download_thumb();
            },
          },
          {
            label: "下载",
            callback: () => {
              this.handler.download_current_media();
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

  // ========== Main Script Logic =============

  const downloader = new Downloader();
  const mediaHandler = new MediaHandler(downloader);
  // Pass the already bound method from mediaHandler instance
  const domPatcher = new DOMPatcher(downloader, mediaHandler);
  const hotkeyManager = new HotkeyManager();

  mediaHandler.init(); // Starts player detection
  domPatcher.startObserving(); // Starts DOM observation and initial scan

  // Pass the already bound method from mediaHandler instance for the hotkey
  hotkeyManager.addHotkey("m", mediaHandler.download_current_media);

  console.log("[dy-dl]已启动");
})();
