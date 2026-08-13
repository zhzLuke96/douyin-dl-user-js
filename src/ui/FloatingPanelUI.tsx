import { useState, useEffect } from "preact/hooks"
import { createCSS } from "../utils/css-in-js"
import { Config } from "../core/Config"
import { theme } from "../utils/theme"
import { ProfileJobModalApp } from "./modals/ProfileJobModal"
// 创建 CSS-in-JS 实例
const css = createCSS()
const s = {
  panelClosed: css({ position: "fixed", right: "24px", bottom: "80px", zIndex: 999999, display: "flex", flexDirection: "column", gap: theme.spacing.md }),
  panelOpen: css({ position: "fixed", right: "24px", bottom: "80px", zIndex: 999999, display: "flex", flexDirection: "column", gap: theme.spacing.md, minWidth: "240px" }),
  fab: css({
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "none",
    background: theme.colors.primary,
    color: "#fff",
    fontSize: "12px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(254,44,85,0.4)",
    alignSelf: "flex-end",
    transition: "0.2s",
  }),
  card: css({
    background: "rgba(18,18,20,0.94)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "16px",
    color: "#fff",
    fontSize: "13px",
    fontFamily: "sans-serif",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    maxWidth: "300px",
  }),
  title: css({ margin: "0 0 12px", fontSize: "15px", fontWeight: 600 }),
  row: css({ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }),
  label: css({ color: "rgba(255,255,255,0.6)" }),
  value: css({ color: "#fff", fontWeight: 500 }),
  stats: css({
    display: "flex",
    flexWrap: "wrap",
    gap: "4px 10px",
    marginTop: "8px",
    fontSize: "11px",
    lineHeight: 1.4,
    color: "rgba(255,255,255,0.55)",
  }),
  progressSection: css({ marginTop: "10px" }),
  progressHeader: css({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "6px",
    fontSize: "11px",
    color: "rgba(255,255,255,0.6)",
  }),
  progressBar: css({
    height: "6px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "3px",
    overflow: "hidden",
  }),
  progressFill: css({
    height: "100%",
    background: theme.colors.primary,
    borderRadius: "3px",
    transition: "width 0.3s",
  }),
  select: css({
    padding: "7px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: "12px",
    cursor: "pointer",
    outline: "none",
    minWidth: "74px",
    "& option": { background: "#2c2c2e", color: "#fff" },
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  }),
  btnGroup: css({ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }),
  btn: css({
    flex: 1,
    padding: "8px 12px",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px",
    textAlign: "center",
    transition: "0.2s",
    minWidth: "60px",
    wordBreak: "keep-all",
    whiteSpace: "nowrap",
  }),
  btnPrimary: css({
    flex: 1,
    padding: "8px 12px",
    border: "none",
    borderRadius: "20px",
    background: theme.colors.primary,
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px",
    textAlign: "center",
    transition: "0.2s",
    minWidth: "60px",
    wordBreak: "keep-all",
    whiteSpace: "nowrap",
  }),
  btnDanger: css({
    flex: 1,
    padding: "8px 12px",
    border: "1px solid rgba(255,77,79,0.5)",
    borderRadius: "20px",
    background: "rgba(255,77,79,0.15)",
    color: "#ff6b6b",
    cursor: "pointer",
    fontSize: "12px",
    textAlign: "center",
    transition: "0.2s",
    minWidth: "60px",
    wordBreak: "keep-all",
    whiteSpace: "nowrap",
  }),
}
import type { ProfileDownloadManager, DownloadType } from "../handlers/profile/ProfileDownloadManager"
import type { ProfileDataService } from "../handlers/profile/ProfileDataService"

const PANEL_OPEN_KEY = "__douyin-dl-profile-panel-open__"

const readPanelOpen = (): boolean => {
  try {
    const saved = localStorage.getItem(PANEL_OPEN_KEY)
    if (saved !== null) return saved === "1"
  } catch {}
  return Config.global.features.enable_profile_downloader
}

const writePanelOpen = (open: boolean) => {
  try {
    localStorage.setItem(PANEL_OPEN_KEY, open ? "1" : "0")
  } catch {}
  Config.global.features.enable_profile_downloader = open
  Config.global.save()
}

// 浮动操作面板主组件
export const FloatingPanelApp = ({
  dataService,
  downloadManager,
  onOpenSettings,
}: {
  dataService: ProfileDataService
  downloadManager: ProfileDownloadManager
  onOpenSettings?: () => void
}) => {
  const [exp, setExp] = useState(readPanelOpen)
  const [snap, setSnap] = useState(() => downloadManager.getSnapshot())
  const [showJob, setShowJob] = useState(false)
  const [concurrency, setConcurrency] = useState(snap.concurrency || 1)
  useEffect(() => {
    const off = downloadManager.on("stateChanged", () => setSnap(downloadManager.getSnapshot()))
    const off2 = downloadManager.on("countsUpdated", () => setSnap(downloadManager.getSnapshot()))
    return () => {
      off()
      off2()
    }
  }, [])
  useEffect(() => {
    setConcurrency(snap.concurrency || 1)
  }, [snap.concurrency])
  if (!dataService.isProfilePage()) return null
  const progressType = snap.downloadType
  const progressCount = Object.values(snap.itemStatuses || {}).filter((status) => status === "success").length
  const progressTotal = Math.max(snap.counts.selected, 1)
  const progressPercent = Math.min(100, Math.round((progressCount / progressTotal) * 100))
  const startJob = async (downloadType: DownloadType = "content") => {
    try {
      await downloadManager.startJob(downloadType, concurrency)
    } catch (e: any) {
      alert(e.message || e)
    }
  }
  return (
    <div className={exp ? s.panelOpen : s.panelClosed}>
      <button
        className={s.fab}
        onClick={() => {
          const next = !exp
          setExp(next)
          writePanelOpen(next)
        }}
      >
        {exp ? "❌" : "插件"}
      </button>
      {exp && (
        <div className={s.card}>
          <h4 className={s.title}>{snap.profileName || "作者主页"}</h4>
          <div className={s.row}>
            <span className={s.label}>状态</span>
            <span className={s.value}>{snap.statusLabel}</span>
          </div>
          <div className={s.stats}>
            <span>发现 {snap.counts.known}</span>
            <span>已选 {snap.counts.selected}</span>
            <span>内容 {snap.counts.downloaded}</span>
            <span>封面 {snap.counts.coverDownloaded}</span>
            <span>失败 {snap.counts.failed + snap.counts.coverFailed}</span>
          </div>
          <div className={s.progressSection}>
            <div className={s.progressHeader}>
              <span>{progressType === "cover" ? "封面进度" : "内容进度"}</span>
              <span>
                {progressCount}/{progressTotal}
              </span>
            </div>
            <div className={s.progressBar}>
              <div className={s.progressFill} style={{ width: progressPercent + "%" }} />
            </div>
          </div>
          <div className={s.btnGroup}>
            <select className={s.select} value={concurrency} disabled={snap.jobRunning} onChange={(e) => setConcurrency(Number((e.target as HTMLSelectElement).value))}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  并发 {n}
                </option>
              ))}
            </select>
            <button className={s.btn} onClick={() => downloadManager.markSelectAll(!downloadManager.isSelectAll())}>
              {downloadManager.isSelectAll() ? "取消全选" : "全选"}
            </button>
            <button className={s.btn} onClick={() => onOpenSettings?.()}>
              设置
            </button>
            <button className={s.btn} onClick={() => setShowJob(true)}>
              查看详情
            </button>
            {!snap.jobRunning ? (
              <>
                <button className={s.btnPrimary} onClick={() => startJob("content")} disabled={snap.counts.selected === 0}>
                  开始下载
                </button>
                <button className={s.btn} onClick={() => startJob("cover")} disabled={snap.counts.selected === 0}>
                  下载封面
                </button>
              </>
            ) : (
              <button className={s.btnDanger} onClick={() => downloadManager.pauseJob()}>
                暂停
              </button>
            )}
          </div>
        </div>
      )}
      {showJob && <ProfileJobModalApp downloadManager={downloadManager} onClose={() => setShowJob(false)} />}
    </div>
  )
}
