// 配置弹窗组件
import { useState, useEffect } from "preact/hooks"
import { createCSS } from "../utils/css-in-js"
import { theme } from "../utils/theme"
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
  }),
}
const navCls = (a: boolean) => (a ? c.navBtnBase + " " + c.navBtnActive : c.navBtnBase)

const featuresMeta: { key: string; label: string; type: "select" | "input" | "number"; options?: { label: string; value: string }[] }[] = [
  {
    key: "using_downloader",
    label: "下载器",
    type: "select",
    options: [
      { label: "浏览器", value: "browser" },
      { label: "IDM", value: "idm" },
      { label: "Aria2", value: "aria2" },
      { label: "BitComet", value: "bc" },
      { label: "AB Download Manager", value: "abdm" },
    ],
  },
  {
    key: "download_video_mode",
    label: "下载视频分辨率策略",
    type: "select",
    options: [
      { label: "默认", value: "default" },
      { label: "最高清晰度", value: "max" },
      { label: "最低清晰度", value: "min" },
      { label: "1080P", value: "1080P" },
      { label: "720P", value: "720P" },
      { label: "540P", value: "540P" },
      { label: "360P", value: "360P" },
      { label: "2K", value: "2K" },
      { label: "4K", value: "4K" },
      { label: "最大文件", value: "max_file" },
      { label: "最小文件", value: "min_file" },
    ],
  },
  {
    key: "video_download_codecs",
    label: "视频编码偏好",
    type: "select",
    options: [
      { label: "默认", value: "default" },
      { label: "H.264", value: "h264" },
      { label: "H.265", value: "h265" },
      { label: "优先H.264", value: "h264_prefer" },
      { label: "优先H.265", value: "h265_prefer" },
    ],
  },
  {
    key: "image_convert_codecs",
    label: "图片转码格式",
    type: "select",
    options: [
      { label: "默认", value: "default" },
      { label: "PNG", value: "png" },
      { label: "JPG", value: "jpg" },
      { label: "WebP", value: "webp" },
    ],
  },
  {
    key: "image_resize_codecs",
    label: "图片尺寸限制",
    type: "select",
    options: [
      { label: "默认", value: "default" },
      { label: "2K(2048px)", value: "2k_max" },
      { label: "1K(1024px)", value: "1k_max" },
      { label: "960px", value: "960_max" },
      { label: "640px", value: "640_max" },
      { label: "512px", value: "512_max" },
    ],
  },
  { key: "image_quality", label: "图片质量(1-100)", type: "number" },
  { key: "filename_template", label: "文件名模板", type: "input" },
  { key: "filename_max_length", label: "最大文件名长度", type: "number" },
  {
    key: "enable_profile_downloader",
    label: "开启作者页下载器",
    type: "select",
    options: [
      { label: "关闭", value: "false" },
      { label: "开启", value: "true" },
    ],
  },
]

const FeatureRow = ({ cfg, meta }: { cfg: any; meta: (typeof featuresMeta)[0] }) => {
  const val = cfg[meta.key]
  const renderInput = () => {
    if (meta.type === "select")
      return (
        <select
          className={c.select}
          value={String(val)}
          onChange={(e) =>
            (cfg[meta.key] =
              (e.target as HTMLSelectElement).value === "true" ? true : (e.target as HTMLSelectElement).value === "false" ? false : (e.target as HTMLSelectElement).value)
          }
        >
          {meta.options!.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
    if (meta.type === "number") return <input className={c.input} type="number" value={val} onChange={(e) => (cfg[meta.key] = Number((e.target as HTMLInputElement).value))} />
    return <input className={c.input} value={val} onChange={(e) => (cfg[meta.key] = (e.target as HTMLInputElement).value)} />
  }
  return (
    <div className={c.row}>
      <span className={c.label}>{meta.label}</span>
      <div style={{ flexGrow: 1 }}>{renderInput()}</div>
    </div>
  )
}

// 基本设置页
const SettingsTab = ({ cfg, onSave }: { cfg: any; onSave: () => void }) => (
  <div>
    {featuresMeta.map((m) => (
      <FeatureRow key={m.key} cfg={cfg} meta={m} />
    ))}
    <div style={{ textAlign: "right", marginTop: theme.spacing.lg, paddingTop: theme.spacing.md, borderTop: "1px solid " + theme.colors.borderLight }}>
      <button className={c.btn} onClick={onSave}>
        保存配置
      </button>
    </div>
  </div>
)

// 下载历史页
const HistoryTab = () => {
  const [hist, setHist] = useState<any[]>([])
  useEffect(() => {
    try {
      const d = localStorage.getItem("__douyin-dl-history__")
      setHist(d ? JSON.parse(d) : [])
    } catch {
      setHist([])
    }
  }, [])
  return hist.length === 0 ? (
    <div style={{ textAlign: "center", padding: theme.spacing.xl, color: theme.colors.textDim }}>暂无下载历史</div>
  ) : (
    <div>
      {hist.map((h, i) => (
        <div key={i} className={c.row}>
          <span className={c.value}>{h.desc || "无描述"}</span>
          <span className={c.value}>{new Date(h.downloadTime).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ========== 下载器配置 Tab ==========
const DownloaderConfigTab = ({ cfg }: { cfg: any }) => {
  const dc = cfg.downloader_config
  const dlType = cfg.using_downloader
  if (dlType === "browser") return <div>浏览器下载无需额外配置</div>
  const dcfg = dc[dlType]
  if (!dcfg) return <div>未知下载器</div>
  return (
    <div>
      {Object.entries(dcfg).map(([k, v]: [string, any]) => (
        <div key={k} className={c.row}>
          <span className={c.label}>{k}</span>
          <div style={{ flexGrow: 1 }}>
            {typeof v === "object" ? (
              <pre className={c.value} style={{ fontSize: "11px" }}>
                {JSON.stringify(v, null, 2)}
              </pre>
            ) : (
              <input
                className={c.input}
                value={String(v)}
                onChange={(e) => {
                  dcfg[k] = (e.target as HTMLInputElement).value
                  cfg.downloader_config = { ...dc }
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

const tabs = [
  { id: "settings", title: "基本设置", Comp: SettingsTab },
  { id: "downloader", title: "下载器配置", Comp: DownloaderConfigTab },
  { id: "history", title: "下载历史", Comp: HistoryTab },
]

// 主组件
export const ConfigModalApp = ({ config }: { config: Config }) => {
  const [tab, setTab] = useState("settings")
  const [cfg, setCfg] = useState(() => config.clone_features())
  useEffect(() => setCfg(config.clone_features()), [config])
  const onSave = () => {
    config.features = cfg
    config.save()
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
