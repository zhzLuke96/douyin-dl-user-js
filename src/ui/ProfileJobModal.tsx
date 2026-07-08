import { useState, useEffect } from "preact/hooks"
import { createCSS } from "../utils/css-in-js"
import { theme } from "../utils/theme"
import type { ProfileDownloadManager } from "../handlers/ProfileDownloadManager"

const css = createCSS()
const s = {
  overlay: css({
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999999,
  }),
  modal: css({
    display: "flex",
    flexDirection: "column",
    height: "75vh",
    width: "850px",
    maxWidth: "95vw",
    overflow: "hidden",
    fontFamily: "sans-serif",
    background: theme.colors.bgOverlay,
    backdropFilter: theme.backdropBlur,
    borderRadius: theme.borderRadius.lg,
    color: theme.colors.textPrimary,
  }),
  header: css({ display: "flex", justifyContent: "space-between", alignItems: "center", padding: theme.spacing.lg, borderBottom: "1px solid " + theme.colors.borderLight }),
  title: css({ margin: 0, fontSize: "16px", fontWeight: 600 }),
  closeBtn: css({ background: "none", border: "none", color: theme.colors.textSecondary, fontSize: "20px", cursor: "pointer" }),
  body: css({ flexGrow: 1, overflowY: "auto", padding: theme.spacing.xl }),
  footer: css({ display: "flex", justifyContent: "flex-end", gap: theme.spacing.sm, padding: theme.spacing.lg, borderTop: "1px solid " + theme.colors.borderLight }),
  btn: css({
    padding: theme.spacing.sm + " " + theme.spacing.lg,
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px",
    transition: "0.2s",
  }),
  btnPrimary: css({
    padding: theme.spacing.sm + " " + theme.spacing.lg,
    border: "none",
    borderRadius: "20px",
    background: theme.colors.primary,
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px",
    transition: "0.2s",
  }),
  statRow: css({ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "13px" }),
  statLabel: css({ color: theme.colors.textMuted }),
  statValue: css({ color: theme.colors.textPrimary, fontWeight: 500 }),
  table: css({ width: "100%", fontSize: "12px", borderCollapse: "collapse", borderRadius: theme.borderRadius.sm, overflow: "hidden" }),
  th: css({ padding: theme.spacing.sm, background: "rgba(255,255,255,0.06)", textAlign: "left", color: theme.colors.textMuted, fontWeight: 600 }),
  td: css({ padding: theme.spacing.sm, borderBottom: "1px solid " + theme.colors.borderLight, color: theme.colors.textSecondary }),
}

export const ProfileJobModalApp = ({ downloadManager, onClose }: { downloadManager: ProfileDownloadManager; onClose: () => void }) => {
  const [snap, setSnap] = useState(() => downloadManager.getSnapshot())
  useEffect(() => {
    const off = downloadManager.on("stateChanged", () => setSnap(downloadManager.getSnapshot()))
    const off2 = downloadManager.on("countsUpdated", () => setSnap(downloadManager.getSnapshot()))
    return () => {
      off()
      off2()
    }
  }, [])
  const startJob = async () => {
    try {
      await downloadManager.startJob()
    } catch (e: any) {
      alert(e.message || e)
    }
  }
  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <h3 className={s.title}>批量下载 - {snap.profileName}</h3>
          <button className={s.closeBtn} onClick={onClose}>
            x
          </button>
        </div>
        <div className={s.body}>
          <div className={s.statRow}>
            <span className={s.statLabel}>状态</span>
            <span className={s.statValue}>{snap.statusLabel}</span>
          </div>
          <div className={s.statRow}>
            <span className={s.statLabel}>已发现</span>
            <span className={s.statValue}>{snap.counts.known}</span>
          </div>
          <div className={s.statRow}>
            <span className={s.statLabel}>已选中</span>
            <span className={s.statValue}>{snap.counts.selected}</span>
          </div>
          <div className={s.statRow}>
            <span className={s.statLabel}>已下载</span>
            <span className={s.statValue}>{snap.counts.downloaded}</span>
          </div>
          <div className={s.statRow}>
            <span className={s.statLabel}>失败</span>
            <span className={s.statValue}>{snap.counts.failed}</span>
          </div>
          {snap.counts.failed > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "14px", color: "#ff6b6b" }}>失败详情</h4>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th className={s.th}>ID</th>
                    <th className={s.th}>原因</th>
                    <th className={s.th}>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {downloadManager.jobState?.failedItems &&
                    Object.entries(downloadManager.jobState.failedItems)
                      .slice(0, 50)
                      .map(([id, info]) => (
                        <tr key={id}>
                          <td className={s.td}>{id.slice(0, 12)}...</td>
                          <td className={s.td}>{info.reason || ""}</td>
                          <td className={s.td}>{info.updatedAt ? new Date(info.updatedAt).toLocaleTimeString() : ""}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className={s.footer}>
          <button className={s.btn} onClick={() => downloadManager.resetState()}>
            重置
          </button>
          <button className={s.btn} onClick={onClose}>
            关闭
          </button>
          {!snap.jobRunning ? (
            <button className={s.btnPrimary} onClick={startJob} disabled={snap.counts.selected === 0}>
              开始下载
            </button>
          ) : (
            <button className={s.btn} onClick={() => downloadManager.stopJob()}>
              停止
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
