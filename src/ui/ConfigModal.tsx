// 配置弹窗组件
import { useState, useEffect, useMemo } from "preact/hooks"
import { createCSS } from "../utils/css-in-js"
import { theme } from "../utils/theme"
import { DownloadHistory } from "../core/DownloadHistory"
import { runInContext, formatDate } from "../utils/format"
import type { Config } from "../core/Config"

const cssFn = createCSS()
const c = {
  container: cssFn({
    display: "flex",
    flexDirection: "column",
    height: "70vh",
    width: "600px",
    overflow: "hidden",
    background: theme.colors.bgOverlay,
    backdropFilter: theme.backdropBlur,
    color: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.lg,
  }),
  nav: cssFn({ display: "flex", borderBottom: "1px solid " + theme.colors.borderLight, background: theme.colors.bgNav, flexShrink: 0 }),
  navBtnBase: cssFn({
    padding: theme.spacing.md + " " + theme.spacing.xl,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    fontWeight: "normal",
    color: theme.colors.textSecondary,
    transition: "0.2s",
    "&:hover": { background: "rgba(255,255,255,0.05)" },
  }),
  navBtnActive: cssFn({ background: "rgba(255,255,255,0.08)", borderBottomColor: theme.colors.primary, fontWeight: "bold", color: theme.colors.primary }),
  content: cssFn({ flexGrow: 1, overflowY: "auto", padding: theme.spacing.xl }),
  fieldset: cssFn({
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    background: theme.colors.bgFieldset,
  }),
  legend: cssFn({
    fontWeight: "bold",
    padding: "0 " + theme.spacing.sm,
    color: "rgba(255,255,255,0.9)",
    background: "rgba(18,18,20,0.8)",
    borderRadius: theme.borderRadius.full,
    fontSize: theme.fontSize.sm,
  }),
  row: cssFn({ display: "flex", padding: theme.spacing.sm + " 0", fontSize: theme.fontSize.sm, borderBottom: "1px solid rgba(255,255,255,0.08)", alignItems: "center" }),
  label: cssFn({ width: "120px", flexShrink: 0, color: theme.colors.textMuted, fontWeight: 600 }),
  value: cssFn({ flexGrow: 1, color: theme.colors.textSecondary, wordBreak: "break-all" }),
  btn: cssFn({
    padding: theme.spacing.xs + " " + theme.spacing.md,
    fontSize: theme.fontSize.xs,
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.3)",
    background: "rgba(255,255,255,0.08)",
    color: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.full,
    marginLeft: theme.spacing.sm,
    transition: "0.2s",
    whiteSpace: "nowrap",
  }),
  btnDanger: cssFn({
    padding: theme.spacing.xs + " " + theme.spacing.md,
    fontSize: theme.fontSize.xs,
    cursor: "pointer",
    border: "1px solid #ff4d4f",
    background: "rgba(255,77,79,0.15)",
    color: "#ff4d4f",
    borderRadius: theme.borderRadius.full,
    marginLeft: theme.spacing.sm,
    transition: "0.2s",
  }),
  select: cssFn({
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.xs + " " + theme.spacing.sm,
    fontSize: theme.fontSize.xs,
    "& option": {
      background: "#2c2c2e",
      color: theme.colors.textPrimary,
      padding: theme.spacing.sm,
    },
  }),
  input: cssFn({
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.xs + " " + theme.spacing.sm,
    fontSize: theme.fontSize.xs,
    flexGrow: 1,
    minWidth: 0,
    "&:focus": { borderColor: theme.colors.primary },
  }),
  table: cssFn({ width: "100%", borderCollapse: "collapse", fontSize: theme.fontSize.xs }),
  th: cssFn({ textAlign: "left", padding: theme.spacing.sm, borderBottom: "1px solid " + theme.colors.borderMedium, color: theme.colors.textMuted, fontWeight: 600 }),
  td: cssFn({ padding: theme.spacing.sm, borderBottom: "1px solid " + theme.colors.borderLight, verticalAlign: "top" }),
  range: cssFn({ flexGrow: 1, accentColor: theme.colors.primary, cursor: "pointer" }),
  rangeValue: cssFn({ minWidth: "32px", textAlign: "right", fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }),
  flexBetween: cssFn({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.sm }),
  hintText: cssFn({ fontSize: "11px", color: theme.colors.textDim, marginTop: theme.spacing.xs, padding: theme.spacing.xs + " 0", lineHeight: 1.5 }),
  codeBlock: cssFn({
    background: "rgba(0,0,0,0.3)",
    borderRadius: theme.borderRadius.sm,
    padding: "4px " + theme.spacing.sm,
    fontSize: "11px",
    color: theme.colors.textSecondary,
    fontFamily: "monospace",
    wordBreak: "break-all",
  }),
  hr: cssFn({ border: "none", borderTop: "1px solid " + theme.colors.borderLight, margin: theme.spacing.sm + " 0" }),
}
const navCls = (a: boolean) => (a ? c.navBtnBase + " " + c.navBtnActive : c.navBtnBase)

// ========== helper ==========
const toShortId = (bigintStr: string): string => {
  try {
    return BigInt(bigintStr).toString(36)
  } catch {
    return bigintStr
  }
}

const mockMedia = {
  authorInfo: { nickname: "\u793a\u4f8b\u7528\u6237" },
  awemeId: "1234567890123456789",
  desc: "\u8fd9\u662f\u4e00\u4e2a\u793a\u4f8b\u89c6\u9891\u63cf\u8ff0 #tag1 #tag2",
  textExtra: [{ hashtagName: "tag1" }, { hashtagName: "tag2" }],
  authorUserId: "12345",
  createTime: Date.now() / 1000,
}

const previewFilename = (template: string, maxLen: number): string => {
  const {
    authorInfo: { nickname },
    awemeId,
    desc,
    textExtra,
  } = mockMedia
  const short_id = toShortId(awemeId)
  const tag_list = textExtra?.map((x: any) => x.hashtagName).filter(Boolean) || []
  const tags = tag_list.map((x: string) => "#" + x).join("_")
  let rawDesc = desc || ""
  tag_list.forEach((t: string) => {
    rawDesc = rawDesc.replace(new RegExp("#" + t + "\\s*", "g"), "")
  })
  rawDesc = rawDesc.trim().replace(/[#/?<>\\:*|":]/g, "")
  const now_date = new Date()
  const create_date = new Date(Number(mockMedia.createTime) * 1000)
  const ctx: any = {
    nickname,
    short_id,
    tags,
    desc: rawDesc,
    aweme_id: awemeId,
    media: mockMedia,
    author_info: mockMedia.authorInfo,
    uid: mockMedia.authorUserId,
    music_name: "",
    now_date,
    create_date,
    now_YYYYMMDD: formatDate(now_date, "YYYYMMDD"),
    now_YYYYMMDD_HHmmss: formatDate(now_date, "YYYYMMDD_HHmmss"),
    create_date_YYYYMMDD: formatDate(create_date, "YYYYMMDD"),
    create_date_YYYYMMDD_HHmmss: formatDate(create_date, "YYYYMMDD_HHmmss"),
  }
  let base
  try {
    base = runInContext(ctx, template)
  } catch {
    base = runInContext(ctx, "`${nickname}_${short_id}_${tags}_${desc}`")
  }
  if (base.length > maxLen) base = base.slice(0, maxLen)
  return base.replace(/\./g, "_")
}

// ========== SettingsTab ==========
const SettingsTab = ({ cfg, onSave }: { cfg: any; onSave: () => void }) => {
  const filenamePreview = useMemo(() => previewFilename(cfg.filename_template, cfg.filename_max_length), [cfg.filename_template, cfg.filename_max_length])
  return (
    <div>
      <div style={{ textAlign: "right", marginBottom: theme.spacing.md }}>
        <button className={c.btn} onClick={onSave}>
          \u4fdd\u5b58\u8bbe\u7f6e
        </button>
      </div>
      <fieldset className={c.fieldset}>
        <legend className={c.legend}>\u4e0b\u8f7d\u5668\u914d\u7f6e</legend>
        <div className={c.row}>
          <span className={c.label}>\u4e0b\u8f7d\u5668</span>
          <select className={c.select} value={cfg.using_downloader} onChange={(e) => (cfg.using_downloader = (e.target as HTMLSelectElement).value)}>
            <option value="browser">\u6d4f\u89c8\u5668</option>
            <option value="idm">IDM</option>
            <option value="aria2">Aria2</option>
            <option value="bc">BitComet</option>
            <option value="abdm">AB Download Manager</option>
          </select>
        </div>
        <div className={c.hintText}>
          \u5982\u679c\u9009\u62e9\u975e\u6d4f\u89c8\u5668\u4e0b\u8f7d\uff0c\u4e4b\u540e\u7684\u4e0b\u8f7d\u5c06\u4f1a\u53d1\u8d77rpc\u8c03\u7528\u4f60\u90e8\u7f72\u7684\u5916\u90e8\u4e0b\u8f7d\u5668\u3002\u6ce8\u610f\uff1a\u4f7f\u7528\u5916\u90e8\u4e0b\u8f7d\u5668\u65f6\uff0c\u56fe\u7247\u538b\u7f29\u8f6c\u7801\u529f\u80fd\u4e0d\u53ef\u7528\u3002
        </div>
      </fieldset>
      <fieldset className={c.fieldset}>
        <legend className={c.legend}>\u6587\u4ef6\u547d\u540d</legend>
        <div className={c.row}>
          <span className={c.label}>\u6587\u4ef6\u540d\u6a21\u677f</span>
          <input className={c.input} value={cfg.filename_template} onChange={(e) => (cfg.filename_template = (e.target as HTMLInputElement).value)} />
        </div>
        <div className={c.hintText}>
          \u53ef\u7528\u53d8\u91cf\uff1a<span className={c.codeBlock}>nickname</span> <span className={c.codeBlock}>short_id</span> <span className={c.codeBlock}>tags</span>{" "}
          <span className={c.codeBlock}>desc</span> <span className={c.codeBlock}>aweme_id</span> <span className={c.codeBlock}>create_date_YYYYMMDD</span>{" "}
          <span className={c.codeBlock}>now_YYYYMMDD_HHmmss</span>
        </div>
        <div className={c.row}>
          <span className={c.label}>\u6587\u4ef6\u540d\u957f\u5ea6</span>
          <input className={c.input} type="number" value={cfg.filename_max_length} onChange={(e) => (cfg.filename_max_length = Number((e.target as HTMLInputElement).value))} />
        </div>
        <div className={c.row}>
          <span className={c.label}>\u9884\u89c8</span>
          <span className={c.codeBlock}>{filenamePreview || "(\u65e0\u6cd5\u9884\u89c8)"}</span>
        </div>
      </fieldset>
      <fieldset className={c.fieldset}>
        <legend className={c.legend}>\u89c6\u9891\u4e0b\u8f7d\u8bbe\u7f6e</legend>
        <div className={c.row}>
          <span className={c.label}>\u5206\u8fa8\u7387\u7b56\u7565</span>
          <select className={c.select} value={cfg.download_video_mode} onChange={(e) => (cfg.download_video_mode = (e.target as HTMLSelectElement).value)}>
            <option value="default">\u9ed8\u8ba4</option>
            <option value="max">\u6700\u9ad8\u6e05\u6670\u5ea6</option>
            <option value="min">\u6700\u4f4e\u6e05\u6670\u5ea6</option>
            <option value="1080P">1080P</option>
            <option value="720P">720P</option>
            <option value="540P">540P</option>
            <option value="360P">360P</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
            <option value="max_file">\u6700\u5927\u6587\u4ef6</option>
            <option value="min_file">\u6700\u5c0f\u6587\u4ef6</option>
          </select>
        </div>
        <div className={c.row}>
          <span className={c.label}>\u7f16\u7801\u504f\u597d</span>
          <select className={c.select} value={cfg.video_download_codecs} onChange={(e) => (cfg.video_download_codecs = (e.target as HTMLSelectElement).value)}>
            <option value="default">\u9ed8\u8ba4</option>
            <option value="h264">H.264</option>
            <option value="h265">H.265</option>
            <option value="h264_prefer">\u4f18\u5148H.264</option>
            <option value="h265_prefer">\u4f18\u5148H.265</option>
          </select>
        </div>
        <div className={c.hintText}>
          \u6ce8\u610f\uff1a\u5b9e\u9645\u4e0b\u8f7d\u65f6\u6839\u636e\u53ef\u7528\u5730\u5740\u5339\u914d\uff0c\u5e76\u975e\u6240\u6709\u89c6\u9891\u90fd\u63d0\u4f9b\u6240\u6709\u7f16\u7801\u3002
        </div>
      </fieldset>
      <fieldset className={c.fieldset}>
        <legend className={c.legend}>\u56fe\u7247\u4e0b\u8f7d\u8bbe\u7f6e</legend>
        <div className={c.row}>
          <span className={c.label}>\u8f6c\u7801\u683c\u5f0f</span>
          <select className={c.select} value={cfg.image_convert_codecs} onChange={(e) => (cfg.image_convert_codecs = (e.target as HTMLSelectElement).value)}>
            <option value="default">\u9ed8\u8ba4</option>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="webp">WebP</option>
          </select>
        </div>
        <div className={c.row}>
          <span className={c.label}>\u5c3a\u5bf8\u9650\u5236</span>
          <select className={c.select} value={cfg.image_resize_codecs} onChange={(e) => (cfg.image_resize_codecs = (e.target as HTMLSelectElement).value)}>
            <option value="default">\u9ed8\u8ba4</option>
            <option value="2k_max">2K(2048px)</option>
            <option value="1k_max">1K(1024px)</option>
            <option value="960_max">960px</option>
            <option value="640_max">640px</option>
            <option value="512_max">512px</option>
          </select>
        </div>
        <div className={c.flexBetween}>
          <span className={c.label}>\u56fe\u7247\u8d28\u91cf</span>
          <span className={c.rangeValue}>{cfg.image_quality}%</span>
        </div>
        <input className={c.range} type="range" min="1" max="100" value={cfg.image_quality} onChange={(e) => (cfg.image_quality = Number((e.target as HTMLInputElement).value))} />
        <div className={c.hintText}>
          \u6ce8\u610f\uff1a\u538b\u7f29\u7387\u4ec5\u5f53\u8f6c\u7801\u6216\u5c3a\u5bf8\u538b\u7f29\u5f00\u542f\u65f6\u751f\u6548\uff0c\u63a8\u8350 60% \u4ee5\u4e0a\u3002
        </div>
      </fieldset>
      <div style={{ textAlign: "right", marginTop: theme.spacing.lg, paddingTop: theme.spacing.md, borderTop: "1px solid " + theme.colors.borderLight }}>
        <button className={c.btn} onClick={onSave}>
          \u4fdd\u5b58\u914d\u7f6e
        </button>
      </div>
    </div>
  )
}

// ========== DownloaderConfigTab ==========
const DownloaderConfigTab = ({ cfg }: { cfg: any }) => {
  const dlType = cfg.using_downloader
  const dc = cfg.downloader_config
  if (dlType === "browser") return <div>\u6d4f\u89c8\u5668\u4e0b\u8f7d\u65e0\u9700\u989d\u5916\u914d\u7f6e</div>
  const setField = (path: string, val: string) => {
    const parts = path.split(".")
    let obj = dc[dlType]
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof obj[parts[i]] !== "object") obj[parts[i]] = {}
      obj = obj[parts[i]]
    }
    obj[parts[parts.length - 1]] = val
    cfg.downloader_config = { ...dc }
  }
  const resetDefaults = () => {
    if (!confirm("\u91cd\u7f6e\u4e3a\u9ed8\u8ba4\u914d\u7f6e\uff1f")) return
    cfg.downloader_config = JSON.parse(
      JSON.stringify({
        browser: {},
        idm: { id: "1" },
        aria2: {
          dir: { video: "\u0060./douyin/${user_dir}/videos\u0060", image: "\u0060./douyin/${user_dir}/images\u0060", other: "\u0060./douyin/${user_dir}/others\u0060" },
          domain: "http://localhost",
          port: "6800",
          path: "/jsonrpc",
          token: "",
        },
        bc: {
          dir: { video: "\u0060./douyin/${user_dir}/videos\u0060", image: "\u0060./douyin/${user_dir}/images\u0060", other: "\u0060./douyin/${user_dir}/others\u0060" },
          domain: "http://localhost",
          port: "8080",
          path: "/panel/task_add_httpftp_result",
          authName: "",
          authPass: "",
        },
        abdm: {
          dir: { video: "\u0060./douyin/${user_dir}/videos\u0060", image: "\u0060./douyin/${user_dir}/images\u0060", other: "\u0060./douyin/${user_dir}/others\u0060" },
          domain: "http://localhost",
          port: "15151",
        },
      }),
    )
  }
  const dcfg = dc[dlType]
  if (!dcfg) return <div>\u672a\u77e5\u4e0b\u8f7d\u5668</div>

  const renderDirFields = () => (
    <>
      <div className={c.row}>
        <span className={c.label}>\u89c6\u9891\u76ee\u5f55</span>
        <input className={c.input} value={dcfg.dir?.video || ""} onChange={(e) => setField("dir.video", (e.target as HTMLInputElement).value)} />
      </div>
      <div className={c.row}>
        <span className={c.label}>\u56fe\u7247\u76ee\u5f55</span>
        <input className={c.input} value={dcfg.dir?.image || ""} onChange={(e) => setField("dir.image", (e.target as HTMLInputElement).value)} />
      </div>
      <div className={c.row}>
        <span className={c.label}>\u5176\u4ed6\u76ee\u5f55</span>
        <input className={c.input} value={dcfg.dir?.other || ""} onChange={(e) => setField("dir.other", (e.target as HTMLInputElement).value)} />
      </div>
    </>
  )

  return (
    <div>
      {dlType === "abdm" && (
        <fieldset className={c.fieldset}>
          <legend className={c.legend}>AB Download Manager</legend>
          <div className={c.row}>
            <span className={c.label}>Domain</span>
            <input className={c.input} value={dcfg.domain || ""} onChange={(e) => setField("domain", (e.target as HTMLInputElement).value)} />
          </div>
          <div className={c.row}>
            <span className={c.label}>Port</span>
            <input className={c.input} value={dcfg.port || ""} onChange={(e) => setField("port", (e.target as HTMLInputElement).value)} />
          </div>
          {renderDirFields()}
        </fieldset>
      )}
      {dlType === "aria2" && (
        <fieldset className={c.fieldset}>
          <legend className={c.legend}>Aria2</legend>
          <div className={c.row}>
            <span className={c.label}>Domain</span>
            <input className={c.input} value={dcfg.domain || ""} onChange={(e) => setField("domain", (e.target as HTMLInputElement).value)} />
          </div>
          <div className={c.row}>
            <span className={c.label}>Port</span>
            <input className={c.input} value={dcfg.port || ""} onChange={(e) => setField("port", (e.target as HTMLInputElement).value)} />
          </div>
          <div className={c.row}>
            <span className={c.label}>Path</span>
            <input className={c.input} value={dcfg.path || ""} onChange={(e) => setField("path", (e.target as HTMLInputElement).value)} />
          </div>
          <div className={c.row}>
            <span className={c.label}>Token</span>
            <input className={c.input} value={dcfg.token || ""} onChange={(e) => setField("token", (e.target as HTMLInputElement).value)} />
          </div>
          {renderDirFields()}
        </fieldset>
      )}
      {dlType === "idm" && (
        <fieldset className={c.fieldset}>
          <legend className={c.legend}>IDM</legend>
          <div className={c.row}>
            <span className={c.label}>ID</span>
            <input className={c.input} value={dcfg.id || ""} onChange={(e) => setField("id", (e.target as HTMLInputElement).value)} />
          </div>
        </fieldset>
      )}
      {dlType === "bc" && (
        <fieldset className={c.fieldset}>
          <legend className={c.legend}>BitComet</legend>
          <div className={c.row}>
            <span className={c.label}>Domain</span>
            <input className={c.input} value={dcfg.domain || ""} onChange={(e) => setField("domain", (e.target as HTMLInputElement).value)} />
          </div>
          <div className={c.row}>
            <span className={c.label}>Port</span>
            <input className={c.input} value={dcfg.port || ""} onChange={(e) => setField("port", (e.target as HTMLInputElement).value)} />
          </div>
          <div className={c.row}>
            <span className={c.label}>Path</span>
            <input className={c.input} value={dcfg.path || ""} onChange={(e) => setField("path", (e.target as HTMLInputElement).value)} />
          </div>
          <div className={c.row}>
            <span className={c.label}>Auth Name</span>
            <input className={c.input} value={dcfg.authName || ""} onChange={(e) => setField("authName", (e.target as HTMLInputElement).value)} />
          </div>
          <div className={c.row}>
            <span className={c.label}>Auth Pass</span>
            <input className={c.input} type="password" value={dcfg.authPass || ""} onChange={(e) => setField("authPass", (e.target as HTMLInputElement).value)} />
          </div>
          {renderDirFields()}
        </fieldset>
      )}
      <div className={c.hintText}>
        \u6ce8\u610f\uff1a\u9700\u8981\u5728\u57fa\u672c\u8bbe\u7f6e\u4e2d\u9009\u62e9\u5bf9\u5e94\u7684\u4e0b\u8f7d\u5668\u540e\uff0c\u6b64\u5904\u914d\u7f6e\u624d\u4f1a\u751f\u6548\u3002
      </div>
      <div style={{ display: "flex", gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <button className={c.btn} onClick={() => alert("\u914d\u7f6e\u5df2\u4fdd\u5b58")}>
          \u4fdd\u5b58
        </button>
        <button className={c.btnDanger} onClick={resetDefaults}>
          \u91cd\u7f6e\u9ed8\u8ba4
        </button>
      </div>
    </div>
  )
}

// ========== HistoryTab ==========
const HistoryTab = () => {
  const [hist, setHist] = useState<any[]>([])
  useEffect(() => {
    setHist(DownloadHistory.get())
  }, [])
  const clearHist = () => {
    if (!confirm("\u786e\u8ba4\u6e05\u7a7a\u6240\u6709\u4e0b\u8f7d\u8bb0\u5f55\uff1f")) return
    DownloadHistory.clear()
    setHist([])
  }
  return (
    <div>
      <div className={c.flexBetween} style={{ marginBottom: theme.spacing.md }}>
        <span style={{ fontWeight: "bold", fontSize: theme.fontSize.sm }}>\u4e0b\u8f7d\u8bb0\u5f55\uff08\u6700\u591a50\u6761\uff09</span>
        {hist.length > 0 && (
          <button className={c.btnDanger} onClick={clearHist}>
            \u6e05\u7a7a
          </button>
        )}
      </div>
      {hist.length === 0 ? (
        <div style={{ textAlign: "center", padding: theme.spacing.xl, color: theme.colors.textDim }}>\u6682\u65e0\u4e0b\u8f7d\u8bb0\u5f55</div>
      ) : (
        <table className={c.table}>
          <thead>
            <tr>
              <th className={c.th}>\u63cf\u8ff0</th>
              <th className={c.th}>\u5206\u4eab\u94fe\u63a5</th>
              <th className={c.th}>\u4e0b\u8f7d\u65f6\u95f4</th>
            </tr>
          </thead>
          <tbody>
            {hist.map((h, i) => (
              <tr key={i}>
                <td className={c.td}>{h.desc || "(\u65e0\u63cf\u8ff0)"}</td>
                <td className={c.td}>
                  {h.shareUrl ? (
                    <a href={h.shareUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary }}>
                      \u94fe\u63a5
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className={c.td}>{h.downloadTime ? new Date(h.downloadTime).toLocaleString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ========== Tabs ==========
const tabs = [
  { id: "settings", title: "\u57fa\u672c\u8bbe\u7f6e", Comp: SettingsTab },
  { id: "downloader", title: "\u4e0b\u8f7d\u5668\u914d\u7f6e", Comp: DownloaderConfigTab },
  { id: "history", title: "\u4e0b\u8f7d\u5386\u53f2", Comp: HistoryTab },
]

export const ConfigModalApp = ({ config }: { config: Config }) => {
  const [tab, setTab] = useState("settings")
  const [cfg, setCfg] = useState(() => config.clone_features())
  useEffect(() => setCfg(config.clone_features()), [config])
  const onSave = () => {
    config.features = cfg
    config.save()
    alert("\u914d\u7f6e\u5df2\u4fdd\u5b58")
  }
  const t = tabs.find((t) => t.id === tab)!
  const props = (id: string) => {
    if (id === "settings") return { cfg, onSave }
    if (id === "downloader") return { cfg }
    return {}
  }
  const Comp = t.Comp as any
  return (
    <div className={c.container}>
      <nav className={c.nav}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={navCls(tab === t.id)}>
            {t.title}
          </button>
        ))}
      </nav>
      <div className={c.content}>
        <Comp {...props(tab)} />
      </div>
    </div>
  )
}
