// 批量下载任务管理弹窗
import { useState, useEffect, useCallback, useMemo } from "preact/hooks"
import { createCSS } from "../../utils/css-in-js"
import { theme } from "../../utils/theme"
import type { ProfileDownloadManager } from "../../handlers/profile/ProfileDownloadManager"
import { MediaHandler } from "../../handlers/MediaHandler"
import { getBestCoverUrl } from "@/handlers/douyin/getBestCoverUrl"

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
    boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
  }),
  header: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottom: "1px solid " + theme.colors.borderLight,
  }),
  title: css({ margin: 0, fontSize: "16px", fontWeight: 600 }),
  closeBtn: css({ background: "none", border: "none", color: theme.colors.textSecondary, fontSize: "20px", cursor: "pointer" }),
  statsBar: css({
    display: "flex",
    gap: "24px",
    padding: "0 " + theme.spacing.xl + " " + theme.spacing.md,
    fontSize: "13px",
    color: theme.colors.textMuted,
    borderBottom: "1px solid " + theme.colors.borderLight,
  }),
  filterBar: css({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md + " " + theme.spacing.xl,
    borderBottom: "1px solid " + theme.colors.borderLight,
    background: theme.colors.bgNav,
  }),
  searchInput: css({
    flex: 1,
    padding: "6px 14px",
    borderRadius: theme.borderRadius.full,
    border: "1px solid " + theme.colors.borderInput,
    background: "rgba(255,255,255,0.08)",
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    outline: "none",
    "&:focus": { borderColor: theme.colors.primary },
  }),
  typeFilterSelect: css({
    padding: "4px 10px",
    borderRadius: theme.borderRadius.full,
    border: "1px solid " + theme.colors.borderInput,
    background: "rgba(255,255,255,0.08)",
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    outline: "none",
    cursor: "pointer",
    "& option": { background: "#2c2c2e", color: theme.colors.textPrimary },
  }),
  tableContainer: css({
    flexGrow: 1,
    overflowY: "auto",
    padding: "0 " + theme.spacing.xl + " 20px",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(255,255,255,0.3) rgba(0,0,0,0.2)",
  }),
  table: css({
    width: "100%",
    fontSize: "12px",
    borderCollapse: "collapse",
    color: theme.colors.textPrimary,
  }),
  th: css({
    position: "sticky",
    top: 0,
    background: "rgba(18,18,20,0.98)",
    backdropFilter: "blur(5px)",
    padding: "10px 8px",
    textAlign: "left",
    borderBottom: "1px solid " + theme.colors.borderMedium,
    fontWeight: 600,
    color: theme.colors.textSecondary,
    whiteSpace: "nowrap",
  }),
  td: css({
    padding: "10px 8px",
    borderBottom: "1px solid " + theme.colors.borderLight,
    verticalAlign: "middle",
  }),
  checkbox: css({
    width: "18px",
    height: "18px",
    cursor: "pointer",
    accentColor: theme.colors.primary,
  }),
  cover: css({
    width: "48px",
    height: "64px",
    objectFit: "cover",
    borderRadius: theme.borderRadius.sm,
    background: "rgba(255,255,255,0.05)",
    display: "block",
  }),
  desc: css({
    maxWidth: "180px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  typeBadge: css({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: theme.borderRadius.full,
    fontSize: "11px",
    background: "rgba(255,255,255,0.1)",
    color: theme.colors.textPrimary,
  }),
  statusBadge: css({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: theme.borderRadius.full,
    fontSize: "11px",
  }),
  statusDownloaded: css({
    background: "rgba(46,125,50,0.25)",
    color: "#81c784",
    border: "1px solid rgba(46,125,50,0.5)",
  }),
  statusFailed: css({
    background: "rgba(198,40,40,0.25)",
    color: "#ef9a9a",
    border: "1px solid rgba(198,40,40,0.5)",
  }),
  statusPending: css({
    background: "rgba(254,44,85,0.15)",
    color: "#ff8a80",
    border: "1px solid rgba(254,44,85,0.4)",
  }),
  actionBar: css({
    display: "flex",
    gap: "10px",
    padding: theme.spacing.md + " " + theme.spacing.xl,
    borderTop: "1px solid " + theme.colors.borderLight,
  }),
  btn: css({
    padding: "7px 18px",
    borderRadius: theme.borderRadius.full,
    border: "1px solid " + theme.colors.borderInput,
    background: "transparent",
    color: "rgba(255,255,255,0.9)",
    fontSize: "12px",
    cursor: "pointer",
    transition: "0.2s",
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  }),
  btnPrimary: css({
    padding: "7px 18px",
    borderRadius: theme.borderRadius.full,
    border: "none",
    background: theme.colors.primary,
    color: "#fff",
    fontSize: "12px",
    cursor: "pointer",
    transition: "0.2s",
    fontWeight: 500,
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  }),
  failSection: css({ marginTop: theme.spacing.lg }),
  failTitle: css({ margin: "0 0 8px", fontSize: "14px", color: "#ff6b6b" }),
  statRow: css({
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontSize: "13px",
  }),
  statLabel: css({ color: theme.colors.textMuted }),
  statValue: css({ color: theme.colors.textPrimary, fontWeight: 500 }),
  failTable: css({ width: "100%", fontSize: "12px", borderCollapse: "collapse", borderRadius: theme.borderRadius.sm, overflow: "hidden" }),
  failTh: css({ padding: theme.spacing.sm, background: "rgba(255,255,255,0.06)", textAlign: "left", color: theme.colors.textMuted, fontWeight: 600 }),
  failTd: css({ padding: theme.spacing.sm, borderBottom: "1px solid " + theme.colors.borderLight, color: theme.colors.textSecondary }),
  progressBarContainer: css({
    height: "6px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "3px",
    margin: "0 32px",
    overflow: "hidden",
  }),
  progressBarFill: css({
    height: "100%",
    background: theme.colors.primary,
    borderRadius: "3px",
    transition: "width 0.3s",
  }),
  footer: css({
    padding: "8px 32px",
    fontSize: "11px",
    color: theme.colors.textDim,
    borderTop: "1px solid " + theme.colors.borderLight,
  }),
  statusText: css({
    fontSize: "12px",
    color: theme.colors.textMuted,
    margin: "0 32px 6px",
  }),
}

// ========== 组件 ==========
export const ProfileJobModalApp = ({ downloadManager, onClose }: { downloadManager: ProfileDownloadManager; onClose: () => void }) => {
  const [snap, setSnap] = useState(() => downloadManager.getSnapshot())
  const [searchText, setSearchText] = useState("")
  const [typeFilter, setTypeFilter] = useState("all") // 'all' | 'video' | 'album'

  const buildMediaList = useCallback(() => {
    const knownIds = downloadManager.jobState?.knownIds || []
    return knownIds
      .map((id) => {
        const media = downloadManager.dataService.feedMediaCache.get(id)
        if (!media) return null
        const downloaded = downloadManager.jobState?.downloadedIds?.includes(id) || false
        const failed = downloadManager.jobState?.failedItems?.[id]
        return {
          awemeId: id,
          media,
          downloaded,
          failed,
          selected: downloadManager.selectedIds.has(id),
          type: media.images && media.images.length > 0 ? "album" : "video",
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b!.media.createTime || 0) - (a!.media.createTime || 0))
  }, [downloadManager])

  const refresh = useCallback(() => {
    setSnap(downloadManager.getSnapshot())
    setRawMediaList(buildMediaList())
  }, [buildMediaList, downloadManager])

  const [rawMediaList, setRawMediaList] = useState<any[]>([])

  useEffect(() => {
    refresh()
    const off1 = downloadManager.on("stateChanged", refresh)
    const off2 = downloadManager.on("countsUpdated", refresh)
    const timer = setInterval(refresh, 2000)
    return () => {
      off1()
      off2()
      clearInterval(timer)
    }
  }, [refresh])

  const filteredList = useMemo(() => {
    let list = rawMediaList
    if (typeFilter !== "all") list = list.filter((item) => item.type === typeFilter)
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim()
      list = list.filter((item) => {
        const desc = (item.media.desc || "").toLowerCase()
        const shortId = MediaHandler.toShortId(item.awemeId).toLowerCase()
        return desc.includes(q) || item.awemeId.toLowerCase().includes(q) || shortId.includes(q)
      })
    }
    return list
  }, [rawMediaList, searchText, typeFilter])

  const isFilteredAllSelected = filteredList.length > 0 && filteredList.every((item) => item.selected)

  const handleSelectAll = (checked: boolean) => {
    filteredList.forEach((item) => downloadManager.markSelect(item.awemeId, checked))
  }

  const handleSelectRow = (awemeId: string, checked: boolean) => {
    downloadManager.markSelect(awemeId, checked)
  }

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
          <div className={s.statusText}>⚡ 状态: {snap.jobRunning ? "运行中" : snap.statusLabel || "待命"}</div>
          <button className={s.closeBtn} onClick={onClose}>
            x
          </button>
        </div>

        {/* 统计栏 */}
        <div className={s.statsBar}>
          <span>📊 已发现: {snap.counts.known}</span>
          <span>✅ 已下载: {snap.counts.downloaded}</span>
          <span>❌ 失败: {snap.counts.failed}</span>
          <span>☑️ 已选: {snap.counts.selected}</span>
        </div>

        {/* 进度条 */}
        <div className={s.progressBarContainer}>
          <div className={s.progressBarFill} style={{ width: (snap.counts.known ? (snap.counts.downloaded / snap.counts.known) * 100 : 0) + "%" }} />
        </div>

        {/* 筛选栏 */}
        <div className={s.filterBar}>
          <input type="text" placeholder="搜索描述..." className={s.searchInput} value={searchText} onInput={(e) => setSearchText((e.target as HTMLInputElement).value)} />
          <select className={s.typeFilterSelect} value={typeFilter} onChange={(e) => setTypeFilter((e.target as HTMLSelectElement).value)}>
            <option value="all">全部</option>
            <option value="video">视频</option>
            <option value="album">图集</option>
          </select>
        </div>

        {/* 表格 */}
        <div className={s.tableContainer}>
          <table className={s.table}>
            <thead>
              <tr>
                <th className={s.th} style={{ width: "40px" }}>
                  <input type="checkbox" className={s.checkbox} checked={isFilteredAllSelected} onChange={(e) => handleSelectAll((e.target as HTMLInputElement).checked)} />
                </th>
                <th className={s.th} style={{ width: "60px" }}>
                  封面
                </th>
                <th className={s.th}>描述</th>
                <th className={s.th} style={{ width: "90px" }}>
                  类型
                </th>
                <th className={s.th} style={{ width: "100px" }}>
                  状态
                </th>
                <th className={s.th} style={{ width: "110px" }}>
                  发布时间
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => {
                const media = item.media
                const coverUrl = getBestCoverUrl(media) || ""
                const desc = media.desc || "(无描述)"
                const createDate = media.createTime ? new Date(media.createTime * 1000).toLocaleDateString() : "-"
                const typeLabel = item.type === "album" ? "图集" : "视频"
                let statusCls = s.statusPending
                let statusText = "⏳ 待下载"
                if (item.downloaded) {
                  statusCls = s.statusDownloaded
                  statusText = "✅ 已下载"
                } else if (item.failed) {
                  statusCls = s.statusFailed
                  statusText = "⚠️ 失败(" + item.failed.count + ")"
                }
                return (
                  <tr key={item.awemeId}>
                    <td className={s.td}>
                      <input
                        type="checkbox"
                        className={s.checkbox}
                        checked={item.selected}
                        onChange={(e) => handleSelectRow(item.awemeId, (e.target as HTMLInputElement).checked)}
                      />
                    </td>
                    <td className={s.td}>{coverUrl && <img src={coverUrl} className={s.cover} alt="" />}</td>
                    <td className={s.td}>
                      <div className={s.desc} title={desc}>
                        {desc}
                      </div>
                      <div style="font-size:11px;color:rgba(255,255,255,0.5);">
                        ID: {MediaHandler.toShortId ? "…" + MediaHandler.toShortId(item.awemeId).slice(-6) : item.awemeId.slice(0, 8) + "…"}
                      </div>
                    </td>
                    <td className={s.td}>
                      <span className={s.typeBadge}>{typeLabel}</span>
                    </td>
                    <td className={s.td}>
                      <span className={s.statusBadge + " " + statusCls}>{statusText}</span>
                    </td>
                    <td className={s.td}>{createDate}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredList.length === 0 && (
            <div style="text-align:center;padding:40px;color:rgba(255,255,255,0.5);">
              {rawMediaList.length === 0 ? "暂无作品数据，请先滚动主页加载作品。" : "没有匹配的搜索结果。"}
            </div>
          )}

          {/* 失败详情 */}
          {snap.counts.failed > 0 && (
            <div className={s.failSection}>
              <h4 className={s.failTitle}>失败详情</h4>
              <table className={s.failTable}>
                <thead>
                  <tr>
                    <th className={s.failTh}>ID</th>
                    <th className={s.failTh}>原因</th>
                    <th className={s.failTh}>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {downloadManager.jobState?.failedItems &&
                    Object.entries(downloadManager.jobState.failedItems)
                      .slice(0, 50)
                      .map(([id, info]) => (
                        <tr key={id}>
                          <td className={s.failTd}>{id.slice(0, 12)}...</td>
                          <td className={s.failTd}>{info.reason || ""}</td>
                          <td className={s.failTd}>{info.updatedAt ? new Date(info.updatedAt).toLocaleTimeString() : ""}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className={s.footer}>提示：勾选作品后点击"开始下载"将按顺序下载选中作品。使用类型筛选快速定位内容。</div>

        {/* 底部操作栏 */}
        <div className={s.actionBar}>
          <button className={s.btn} onClick={() => handleSelectAll(!isFilteredAllSelected)} disabled={filteredList.length === 0}>
            {isFilteredAllSelected ? "取消全选" : "全选"}
          </button>
          {!snap.jobRunning ? (
            <button className={s.btnPrimary} onClick={startJob} disabled={snap.counts.selected === 0}>
              开始下载
            </button>
          ) : (
            <button className={s.btn} onClick={() => downloadManager.stopJob()}>
              暂停
            </button>
          )}
          <button
            className={s.btn}
            onClick={() => {
              if (confirm("确定重置当前作者的下载记录吗？这将清除已下载和失败记录。")) downloadManager.resetState()
            }}
          >
            重置
          </button>
          <button className={s.btn} onClick={() => downloadManager.mediaHandler.open_config_modal()}>
            ⚙️ 设置
          </button>
          <button className={s.btn} onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
