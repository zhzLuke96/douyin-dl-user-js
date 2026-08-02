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
  summary: css({ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "8px", lineHeight: 1.4, whiteSpace: "pre-line" }),
}
import type { ProfileDownloadManager } from "../handlers/profile/ProfileDownloadManager"
import type { ProfileDataService } from "../handlers/profile/ProfileDataService"

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
  const [exp, setExp] = useState(() => Config.global.features.enable_profile_downloader)
  const [snap, setSnap] = useState(() => downloadManager.getSnapshot())
  const [showJob, setShowJob] = useState(false)
  useEffect(() => {
    const off = downloadManager.on("stateChanged", () => setSnap(downloadManager.getSnapshot()))
    const off2 = downloadManager.on("countsUpdated", () => setSnap(downloadManager.getSnapshot()))
    return () => {
      off()
      off2()
    }
  }, [])
  if (!dataService.isProfilePage()) return null
  const startJob = async () => {
    try {
      await downloadManager.startJob()
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
          Config.global.features.enable_profile_downloader = next
          Config.global.save()
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
          <div className={s.row}>
            <span className={s.label}>已发现</span>
            <span className={s.value}>{snap.counts.known}</span>
          </div>
          <div className={s.row}>
            <span className={s.label}>已选中</span>
            <span className={s.value}>{snap.counts.selected}</span>
          </div>
          <div className={s.row}>
            <span className={s.label}>已下载</span>
            <span className={s.value}>{snap.counts.downloaded}</span>
          </div>
          <div className={s.row}>
            <span className={s.label}>失败</span>
            <span className={s.value}>{snap.counts.failed}</span>
          </div>
          <div className={s.btnGroup}>
            <button className={s.btn} onClick={() => downloadManager.markSelectAll(!downloadManager.isSelectAll())}>
              {downloadManager.isSelectAll() ? "取消全选" : "全选"}
            </button>
            <button className={s.btn} onClick={() => onOpenSettings?.()}>
              设置
            </button>
            <button className={s.btn} onClick={() => setShowJob(true)}>
              查看详情
            </button>
            <br />
            {!snap.jobRunning ? (
              <button className={s.btnPrimary} onClick={startJob} disabled={snap.counts.selected === 0}>
                开始下载
              </button>
            ) : (
              <button className={s.btnDanger} onClick={() => downloadManager.pauseJob()}>
                暂停
              </button>
            )}
          </div>
          <div className={s.summary}>{snap.summary}</div>
        </div>
      )}
      {showJob && <ProfileJobModalApp downloadManager={downloadManager} onClose={() => setShowJob(false)} />}
    </div>
  )
}
