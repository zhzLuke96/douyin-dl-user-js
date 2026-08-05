// 配置弹窗组件
import { useState, useEffect, useMemo } from "preact/hooks"
import { createCSS } from "../../utils/css-in-js"
import { theme } from "../../utils/theme"
import { Modal } from "./Modal"
import { DownloadHistory } from "../../core/download/DownloadHistory"
import { runInContext, formatDate } from "../../utils/format"
import { Config } from "../../core/Config"

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
  header: cssFn({
    display: "flex",
    alignItems: "stretch",
    justifyContent: "space-between",
    borderBottom: "1px solid " + theme.colors.borderLight,
    background: theme.colors.bgNav,
    flexShrink: 0,
  }),
  nav: cssFn({ display: "flex", flexShrink: 0 }),
  actions: cssFn({ display: "flex", alignItems: "center", gap: theme.spacing.sm, padding: theme.spacing.sm + " " + theme.spacing.md }),
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
    padding: theme.spacing.sm + " " + theme.spacing.md,
    fontSize: theme.fontSize.sm,
    lineHeight: "20px",
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
  btnSave: cssFn({
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
  btnSaveDirty: cssFn({
    padding: theme.spacing.xs + " " + theme.spacing.md,
    fontSize: theme.fontSize.xs,
    cursor: "pointer",
    border: "2px solid " + theme.colors.primary,
    background: "rgba(64,150,255,0.2)",
    color: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    marginLeft: theme.spacing.sm,
    transition: "0.2s",
    whiteSpace: "nowrap",
    fontWeight: "bold",
  }),
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
  authorInfo: { nickname: "示例用户" },
  awemeId: "1234567890123456789",
  desc: "这是一个示例视频描述 #tag1 #tag2",
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

const previewDirPath = (template: string): string => {
  if (!template) return ""
  const {
    authorInfo: { nickname },
    awemeId,
    desc,
    authorUserId,
  } = mockMedia
  const uid = authorUserId
  const userDir = `${uid}_${nickname}`.replace(/[\\/:*?"<>|\x00-\x1f\x7f]/g, "_")
  const ctx: any = {
    user_dir: userDir,
    nickname,
    uid,
    aweme_id: awemeId,
    desc,
    filename: "example.mp4",
    filename_base: "example",
    media: mockMedia,
  }
  let resolved
  try {
    resolved = runInContext(ctx, template)
  } catch {
    resolved = "(无法解析)"
  }
  return typeof resolved === "string" ? resolved : String(resolved)
}

// ========== SettingsTab ==========
const SettingsTab = ({ cfg, onChange, onResetDefaults }: { cfg: any; onChange: () => void; onResetDefaults: () => void }) => {
  const filenamePreview = useMemo(() => previewFilename(cfg.filename_template, cfg.filename_max_length), [cfg.filename_template, cfg.filename_max_length])
  const update = (mutate: () => void) => {
    mutate()
    onChange()
  }
  return (
    <div>
      <fieldset className={c.fieldset}>
        <legend className={c.legend}>文件命名</legend>
        <div className={c.row}>
          <span className={c.label}>文件名模板</span>
          <input className={c.input} value={cfg.filename_template} onChange={(e) => update(() => (cfg.filename_template = (e.target as HTMLInputElement).value))} />
        </div>
        <div className={c.hintText}>
          可用变量：<span className={c.codeBlock}>nickname</span> <span className={c.codeBlock}>short_id</span> <span className={c.codeBlock}>tags</span>{" "}
          <span className={c.codeBlock}>desc</span> <span className={c.codeBlock}>aweme_id</span> <span className={c.codeBlock}>create_date_YYYYMMDD</span>{" "}
          <span className={c.codeBlock}>now_YYYYMMDD_HHmmss</span>
        </div>
        <div className={c.row}>
          <span className={c.label}>文件名长度</span>
          <input
            className={c.input}
            type="number"
            value={cfg.filename_max_length}
            onChange={(e) => update(() => (cfg.filename_max_length = Number((e.target as HTMLInputElement).value)))}
          />
        </div>
        <div className={c.row}>
          <span className={c.label}>预览</span>
          <span className={c.codeBlock}>{filenamePreview || "(无法预览)"}</span>
        </div>
      </fieldset>
      <fieldset className={c.fieldset}>
        <legend className={c.legend}>视频下载设置</legend>
        <div className={c.row}>
          <span className={c.label}>分辨率策略</span>
          <select className={c.select} value={cfg.download_video_mode} onChange={(e) => update(() => (cfg.download_video_mode = (e.target as HTMLSelectElement).value))}>
            <option value="default">默认</option>
            <option value="max">最高清晰度</option>
            <option value="min">最低清晰度</option>
            <option value="1080P">1080P</option>
            <option value="720P">720P</option>
            <option value="540P">540P</option>
            <option value="360P">360P</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
            <option value="max_file">最大文件</option>
            <option value="min_file">最小文件</option>
          </select>
        </div>
        <div className={c.row}>
          <span className={c.label}>编码偏好</span>
          <select className={c.select} value={cfg.video_download_codecs} onChange={(e) => update(() => (cfg.video_download_codecs = (e.target as HTMLSelectElement).value))}>
            <option value="default">默认</option>
            <option value="h264">H.264</option>
            <option value="h265">H.265</option>
            <option value="h264_prefer">优先H.264</option>
            <option value="h265_prefer">优先H.265</option>
          </select>
        </div>
        <div className={c.hintText}>注意：实际下载时根据可用地址匹配，并非所有视频都提供所有编码。</div>
      </fieldset>
      <fieldset className={c.fieldset}>
        <legend className={c.legend}>重置配置</legend>
        <div className={c.hintText}>重置会将当前表单所有配置恢复为默认值，保存后覆盖现有全部配置。</div>
        <button className={c.btnDanger} onClick={onResetDefaults}>
          重置配置为默认
        </button>
      </fieldset>
    </div>
  )
}

// ========== DownloaderConfigTab ==========
const DownloaderConfigTab = ({ cfg, onChange }: { cfg: any; onChange: () => void }) => {
  const [dlType, setDlType] = useState(cfg.using_downloader)
  const [, forceRender] = useState(0)
  useEffect(() => {
    setDlType(cfg.using_downloader)
  }, [cfg.using_downloader])
  const dc = cfg.downloader_config || {}
  const notify = () => {
    forceRender((v) => v + 1)
    onChange()
  }
  const setField = (path: string, val: string) => {
    val = val.replace(/\\/g, "/")
    const parts = path.split(".")
    let obj = dc[dlType]
    if (!obj) {
      obj = {}
      dc[dlType] = obj
    }
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof obj[parts[i]] !== "object") obj[parts[i]] = {}
      obj = obj[parts[i]]
    }
    obj[parts[parts.length - 1]] = val
    cfg.downloader_config = { ...dc }
    notify()
  }
  const rawDcfg = dc[dlType] || {}
  const downloaderDefaults = (Config.default_features().downloader_config as any)[dlType] || {}
  const dcfg = {
    ...downloaderDefaults,
    ...rawDcfg,
    dir: { ...(downloaderDefaults.dir || {}), ...(rawDcfg.dir || {}) },
  }

  // 图片转码/压缩只在浏览器下载流程中执行；外部下载器只能拿到原始图片 URL。
  const renderBrowserImageFields = () => (
    <>
      <div className={c.hintText}>以下图片转码/压缩配置仅在“浏览器下载”时生效。使用外部下载器时，脚本只能把原图地址交给下载器，无法自动转码或压缩。</div>
      <div className={c.row}>
        <span className={c.label}>转码格式</span>
        <select
          className={c.select}
          value={cfg.image_convert_codecs}
          onChange={(e) => {
            cfg.image_convert_codecs = (e.target as HTMLSelectElement).value
            notify()
          }}
        >
          <option value="default">默认</option>
          <option value="png">PNG</option>
          <option value="jpg">JPG</option>
          <option value="webp">WebP</option>
        </select>
      </div>
      <div className={c.row}>
        <span className={c.label}>尺寸限制</span>
        <select
          className={c.select}
          value={cfg.image_resize_codecs}
          onChange={(e) => {
            cfg.image_resize_codecs = (e.target as HTMLSelectElement).value
            notify()
          }}
        >
          <option value="default">默认</option>
          <option value="2k_max">2K(2048px)</option>
          <option value="1k_max">1K(1024px)</option>
          <option value="960_max">960px</option>
          <option value="640_max">640px</option>
          <option value="512_max">512px</option>
        </select>
      </div>
      <div className={c.flexBetween}>
        <span className={c.label}>图片质量</span>
        <span className={c.rangeValue}>{cfg.image_quality}%</span>
      </div>
      <input
        className={c.range}
        type="range"
        min="1"
        max="100"
        value={cfg.image_quality}
        onChange={(e) => {
          cfg.image_quality = Number((e.target as HTMLInputElement).value)
          notify()
        }}
      />
      <div className={c.hintText}>压缩率仅当转码或尺寸压缩开启时生效，推荐 60% 以上。</div>
    </>
  )

  const defaultDirs = downloaderDefaults.dir || {}
  const renderDirFields = () => (
    <>
      <div className={c.row}>
        <span className={c.label}>视频目录</span>
        <input className={c.input} value={dcfg.dir?.video || defaultDirs.video || ""} onChange={(e) => setField("dir.video", (e.target as HTMLInputElement).value)} />
      </div>
      <div className={c.row}>
        <span className={c.label}>图片目录</span>
        <input className={c.input} value={dcfg.dir?.image || defaultDirs.image || ""} onChange={(e) => setField("dir.image", (e.target as HTMLInputElement).value)} />
      </div>
      <div className={c.row}>
        <span className={c.label}>其他目录</span>
        <input className={c.input} value={dcfg.dir?.other || defaultDirs.other || ""} onChange={(e) => setField("dir.other", (e.target as HTMLInputElement).value)} />
      </div>
      <div className={c.hintText}>
        可用变量：<span className={c.codeBlock}>{"${user_dir}"}</span> <span className={c.codeBlock}>{"${nickname}"}</span> <span className={c.codeBlock}>{"${uid}"}</span>{" "}
        <span className={c.codeBlock}>{"${aweme_id}"}</span> <span className={c.codeBlock}>{"${desc}"}</span> <span className={c.codeBlock}>{"${filename}"}</span>{" "}
        <span className={c.codeBlock}>{"${filename_base}"}</span>
        <br />
        使用模板字符串语法，如：<span className={c.codeBlock}>{"`./douyin/${user_dir}/videos`"}</span>
      </div>
      <div className={c.hintText}>
        预览视频目录：<span className={c.codeBlock}>{previewDirPath(dcfg.dir?.video || defaultDirs.video || "")}</span>
        <br />
        预览图片目录：<span className={c.codeBlock}>{previewDirPath(dcfg.dir?.image || defaultDirs.image || "")}</span>
        <br />
        预览其他目录：<span className={c.codeBlock}>{previewDirPath(dcfg.dir?.other || defaultDirs.other || "")}</span>
      </div>
    </>
  )

  return (
    <div>
      <fieldset className={c.fieldset}>
        <legend className={c.legend}>下载器</legend>
        <div className={c.row}>
          <span className={c.label}>类型</span>
          <select
            className={c.select}
            value={dlType}
            onChange={(e) => {
              const next = (e.target as HTMLSelectElement).value
              setDlType(next)
              cfg.using_downloader = next
              notify()
            }}
          >
            <option value="browser">浏览器</option>
            <option value="idm">IDM</option>
            <option value="aria2">Aria2</option>
            <option value="bc">BitComet</option>
            <option value="abdm">AB Download Manager</option>
          </select>
        </div>
        <div className={c.hintText}>切换下载器会立即显示对应配置，保存后才会用于实际下载。使用外部下载器时，图片压缩转码不可用。</div>
      </fieldset>
      {dlType === "browser" && (
        <fieldset className={c.fieldset}>
          <legend className={c.legend}>浏览器下载（图片转码压缩）</legend>
          {renderBrowserImageFields()}
        </fieldset>
      )}
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
            <input className={c.input} value={dcfg.domain || "http://localhost"} onChange={(e) => setField("domain", (e.target as HTMLInputElement).value)} />
          </div>
          <div className={c.row}>
            <span className={c.label}>Port</span>
            <input className={c.input} value={dcfg.port || "6800"} onChange={(e) => setField("port", (e.target as HTMLInputElement).value)} />
          </div>
          <div className={c.row}>
            <span className={c.label}>Path</span>
            <input className={c.input} value={dcfg.path || "/jsonrpc"} onChange={(e) => setField("path", (e.target as HTMLInputElement).value)} />
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
            <input className={c.input} value={dcfg.id || "1"} onChange={(e) => setField("id", (e.target as HTMLInputElement).value)} />
          </div>
        </fieldset>
      )}
      {dlType === "bc" && (
        <fieldset className={c.fieldset}>
          <legend className={c.legend}>BitComet</legend>
          <div className={c.row}>
            <span className={c.label}>Domain</span>
            <input className={c.input} value={dcfg.domain || "http://localhost"} onChange={(e) => setField("domain", (e.target as HTMLInputElement).value)} />
          </div>
          <div className={c.row}>
            <span className={c.label}>Port</span>
            <input className={c.input} value={dcfg.port || "8080"} onChange={(e) => setField("port", (e.target as HTMLInputElement).value)} />
          </div>
          <div className={c.row}>
            <span className={c.label}>Path</span>
            <input className={c.input} value={dcfg.path || "/panel/task_add_httpftp_result"} onChange={(e) => setField("path", (e.target as HTMLInputElement).value)} />
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
      <div className={c.hintText}>选择下载器后填写对应配置；浏览器下载不需要额外连接配置，但可使用上面的图片转码/压缩设置。</div>
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
    if (!confirm("确认清空所有下载记录？")) return
    DownloadHistory.clear()
    setHist([])
  }
  return (
    <div>
      <div className={c.flexBetween} style={{ marginBottom: theme.spacing.md }}>
        <span style={{ fontWeight: "bold", fontSize: theme.fontSize.sm }}>下载记录（最多50条）</span>
        {hist.length > 0 && (
          <button className={c.btnDanger} onClick={clearHist}>
            清空
          </button>
        )}
      </div>
      {hist.length === 0 ? (
        <div style={{ textAlign: "center", padding: theme.spacing.xl, color: theme.colors.textDim }}>暂无下载记录</div>
      ) : (
        <table className={c.table}>
          <thead>
            <tr>
              <th className={c.th}>描述</th>
              <th className={c.th}>分享链接</th>
              <th className={c.th}>下载时间</th>
            </tr>
          </thead>
          <tbody>
            {hist.map((h, i) => (
              <tr key={i}>
                <td className={c.td}>{h.desc || "(无描述)"}</td>
                <td className={c.td}>
                  {h.shareUrl ? (
                    <a href={h.shareUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary }}>
                      链接
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
  { id: "settings", title: "基本设置", Comp: SettingsTab },
  { id: "downloader", title: "下载器配置", Comp: DownloaderConfigTab },
  { id: "history", title: "下载历史", Comp: HistoryTab },
]

export const ConfigModalApp = ({ config, modal }: { config: Config; modal?: Modal }) => {
  const [tab, setTab] = useState("settings")
  const [cfg, setCfg] = useState(() => config.clone_features())
  const [saveVersion, setSaveVersion] = useState(0)
  const originalRef = useMemo(() => JSON.stringify(config.clone_features()), [config, saveVersion])
  useEffect(() => {
    const cloned = config.clone_features()
    setCfg(cloned)
  }, [config])
  const dirty = useMemo(() => JSON.stringify(cfg) !== originalRef, [cfg, originalRef])

  useEffect(() => {
    if (modal) {
      modal.onBeforeClose = dirty ? () => confirm("有未保存的修改，确定放弃？") : undefined
    }
  }, [dirty, modal])

  const onSave = () => {
    config.features = cfg
    config.save()
    setSaveVersion((v) => v + 1)
    alert("配置已保存")
  }
  const onEdit = () => setCfg({ ...cfg })
  const onCancel = () => setCfg(config.clone_features())
  const onResetDefaults = () => {
    if (!confirm("确定重置为默认配置？此操作会覆盖当前所有配置，包括下载器、图片、文件命名等。")) return
    setCfg(Config.default_features())
  }
  const t = tabs.find((t) => t.id === tab)!
  const props = (id: string) => {
    if (id === "settings") return { cfg, onChange: onEdit, onResetDefaults }
    if (id === "downloader") return { cfg, onChange: onEdit }
    return {}
  }
  const Comp = t.Comp as any
  return (
    <div className={c.container}>
      <div className={c.header}>
        <nav className={c.nav}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={navCls(tab === t.id)}>
              {t.title}
            </button>
          ))}
        </nav>
        {dirty && (
          <div className={c.actions}>
            <button className={c.btnDanger} onClick={onCancel}>
              取消
            </button>
            <button className={c.btnSaveDirty} onClick={onSave}>
              保存
            </button>
          </div>
        )}
      </div>
      <div className={c.content}>
        <Comp {...props(tab)} />
      </div>
    </div>
  )
}
