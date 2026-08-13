// 批量下载任务管理弹窗
import { useState, useEffect, useCallback, useMemo, useRef } from "preact/hooks"
import { createCSS } from "../../utils/css-in-js"
import { theme } from "../../utils/theme"
import type { DownloadType, JobLogEntry, ProfileDownloadManager } from "../../handlers/profile/ProfileDownloadManager"
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
    width: "960px",
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
  thBtn: css({
    background: "none",
    border: "none",
    padding: "0",
    color: "inherit",
    font: "inherit",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    whiteSpace: "nowrap",
  }),
  thArrow: css({ fontSize: "10px", opacity: 0.55 }),
  thArrowActive: css({ color: theme.colors.primary, opacity: 1 }),
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
  coverHidden: css({ opacity: 0, visibility: "hidden" }),
  desc: css({
    maxWidth: "180px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  idText: css({
    fontSize: "11px",
    color: "rgba(255,255,255,0.5)",
    wordBreak: "break-all",
    lineHeight: 1.4,
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
  statusGroup: css({
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
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
    flexWrap: "wrap",
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
  failTh: css({ padding: theme.spacing.sm, background: "rgba(255,255,255,0.06)", textAlign: "left", color: theme.colors.textMuted, fontWeight: 600, whiteSpace: "nowrap" }),
  failTd: css({ padding: theme.spacing.sm, borderBottom: "1px solid " + theme.colors.borderLight, color: theme.colors.textSecondary, verticalAlign: "top" }),
  failId: css({ wordBreak: "break-all", fontSize: "11px", color: theme.colors.textSecondary }),
  failDesc: css({ maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }),
  failMessage: css({ wordBreak: "break-all", color: "#ff9c9c" }),
  failEmpty: css({ padding: "24px", textAlign: "center", color: theme.colors.textDim, fontSize: "12px" }),
  progressBarContainer: css({
    height: "6px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "3px",
    overflow: "hidden",
  }),
  progressBarFill: css({
    height: "100%",
    background: theme.colors.primary,
    borderRadius: "3px",
    transition: "width 0.3s",
  }),
  squareContainer: css({
    display: "flex",
    flexWrap: "wrap",
    gap: "3px",
    maxHeight: "84px",
    overflowY: "auto",
    padding: "8px",
    marginTop: theme.spacing.sm,
    background: "rgba(0,0,0,0.28)",
    borderRadius: theme.borderRadius.sm,
  }),
  square: css({ width: "12px", height: "12px", borderRadius: "2px", flex: "0 0 12px" }),
  squarePending: css({ background: "#2a2a2a" }),
  squareRunning: css({ background: "#ffb74d" }),
  squareSuccess: css({ background: "#66bb6a" }),
  squareFailed: css({ background: "#ef5350" }),
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
  tabs: css({
    display: "flex",
    gap: "6px",
    padding: "0 " + theme.spacing.xl,
    borderBottom: "1px solid " + theme.colors.borderLight,
  }),
  tab: css({
    padding: "10px 14px",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    color: theme.colors.textMuted,
    fontSize: "13px",
    cursor: "pointer",
    "&:hover": { color: theme.colors.textPrimary },
  }),
  tabActive: css({
    color: theme.colors.textPrimary,
    fontWeight: 600,
    borderBottomColor: theme.colors.primary,
  }),
  jobContent: css({
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
  }),
  jobSummary: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md + " " + theme.spacing.xl,
    borderBottom: "1px solid " + theme.colors.borderLight,
    fontSize: "13px",
    color: theme.colors.textMuted,
    flexWrap: "wrap",
  }),
  progressSection: css({
    padding: theme.spacing.md + " " + theme.spacing.xl + " 0",
  }),
  progressLabel: css({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "6px",
    fontSize: "12px",
    color: theme.colors.textMuted,
  }),
  logContainer: css({
    flexGrow: 1,
    minHeight: 0,
    overflowY: "auto",
    margin: theme.spacing.md + " " + theme.spacing.xl,
    padding: theme.spacing.sm,
    background: "rgba(0,0,0,0.28)",
    border: "1px solid " + theme.colors.borderLight,
    borderRadius: theme.borderRadius.sm,
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(255,255,255,0.3) rgba(0,0,0,0.2)",
  }),
  logList: css({ margin: 0, padding: 0, listStyle: "none" }),
  logItem: css({
    display: "flex",
    gap: "8px",
    padding: "4px 8px",
    fontSize: "12px",
    lineHeight: 1.5,
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    alignItems: "baseline",
  }),
  logTime: css({ color: theme.colors.textDim, whiteSpace: "nowrap", fontFamily: "monospace" }),
  logType: css({ color: theme.colors.textSecondary, whiteSpace: "nowrap" }),
  logDesc: css({
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  logStatusInfo: css({ color: theme.colors.textMuted, whiteSpace: "nowrap" }),
  logStatusRunning: css({ color: "#ffb74d", whiteSpace: "nowrap" }),
  logStatusSuccess: css({ color: "#81c784", whiteSpace: "nowrap" }),
  logStatusFailed: css({ color: "#ef9a9a", whiteSpace: "nowrap" }),
  emptyLog: css({ padding: "24px", textAlign: "center", color: theme.colors.textDim, fontSize: "12px" }),
}

// ========== 组件 ==========
const clampConcurrency = (value: number): number => {
  const next = Number.isFinite(value) ? Math.floor(value) : 1
  return Math.min(Math.max(next, 1), 5)
}

const formatModalFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return "-"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / Math.pow(1024, index)
  return value.toFixed(index === 0 ? 0 : 1) + " " + units[index]
}

const formatModalDuration = (duration?: number): string => {
  if (!duration || duration <= 0) return "-"
  const totalSeconds = Math.max(1, Math.round(duration >= 1000 ? duration / 1000 : duration))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

type SortField = "time" | "size" | "duration" | "images"

const FAILURE_REASON_LABELS: Record<string, string> = {
  missing_media: "缺少媒体信息",
  no_valid_media: "未找到可下载的媒体资源",
  no_cover: "未找到封面地址",
  cover_download_failed: "封面下载失败",
  download_failed: "下载失败",
  cache_miss: "缓存中未找到作品",
  unexpected_error: "下载任务异常",
}

const LazyCover = ({ src }: { src?: string }) => {
  const ref = useRef<HTMLImageElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!("IntersectionObserver" in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "200px 0px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return <img ref={ref} src={visible ? src : undefined} className={s.cover + (visible ? "" : " " + s.coverHidden)} loading="lazy" decoding="async" alt="" />
}

export const ProfileJobModalApp = ({ downloadManager, onClose }: { downloadManager: ProfileDownloadManager; onClose: () => void }) => {
  const [snap, setSnap] = useState(() => downloadManager.getSnapshot())
  const [searchText, setSearchText] = useState("")
  const [typeFilter, setTypeFilter] = useState("all") // 'all' | 'video' | 'album'
  const [statusFilter, setStatusFilter] = useState("all") // 'all' | 'downloaded' | 'not_downloaded' | 'cover_downloaded' | 'cover_not_downloaded'
  const [sortMode, setSortMode] = useState("time_desc")
  const [activeTab, setActiveTab] = useState<"list" | "job" | "failed">("list")
  const toggleSort = (field: SortField) => {
    setSortMode((prev) => {
      const currentField = prev.replace(/_(asc|desc)$/, "") as SortField
      if (currentField === field) return prev.endsWith("_asc") ? `${field}_desc` : `${field}_asc`
      return `${field}_desc`
    })
  }
  const sortArrow = (field: SortField) => {
    const currentField = sortMode.replace(/_(asc|desc)$/, "") as SortField
    if (currentField !== field) return "↕"
    return sortMode.endsWith("_asc") ? "↑" : "↓"
  }
  const arrowClass = (field: SortField) => s.thArrow + (sortMode.startsWith(field) ? " " + s.thArrowActive : "")
  const [concurrency, setConcurrency] = useState(1)
  const logRef = useRef<HTMLDivElement>(null)

  const buildMediaList = useCallback(() => {
    const knownIds = downloadManager.jobState?.knownIds || []
    return knownIds
      .map((id) => {
        const media = downloadManager.dataService.feedMediaCache.get(id)
        if (!media) return null
        const downloaded = downloadManager.jobState?.downloadedIds?.includes(id) || false
        const failed = downloadManager.jobState?.failedItems?.[id]
        const coverDownloaded = downloadManager.jobState?.coverDownloadedIds?.includes(id) || false
        const coverFailed = downloadManager.jobState?.coverFailedItems?.[id]
        const bitRateList: Array<{ dataSize?: number }> = media.video?.bitRateList || []
        const maxSize = bitRateList.reduce((max: number, item) => Math.max(max, item.dataSize || 0), media.video?.dataSize || 0)
        const albumSize = (media.images || []).reduce((sum: number, img: any) => sum + (img.video?.dataSize || 0), 0)
        return {
          awemeId: id,
          media,
          downloaded,
          failed,
          coverDownloaded,
          coverFailed,
          selected: downloadManager.selectedIds.has(id),
          type: media.images && media.images.length > 0 ? "album" : "video",
          sortTime: media.createTime || 0,
          sortSize: Math.max(maxSize, albumSize),
          sortDuration: media.video?.duration || 0,
          sortImages: media.images?.length || 0,
        }
      })
      .filter(Boolean)
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
    const off3 = downloadManager.on("jobLog", refresh)
    const timer = setInterval(refresh, 2000)
    return () => {
      off1()
      off2()
      off3()
      clearInterval(timer)
    }
  }, [refresh])

  useEffect(() => {
    if (snap.jobRunning || snap.jobStatus === "running") setActiveTab("job")
  }, [snap.jobRunning, snap.jobStatus])

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [snap.jobLog.length])

  const filteredList = useMemo(() => {
    let list = rawMediaList
    if (typeFilter !== "all") list = list.filter((item) => item.type === typeFilter)
    if (statusFilter === "downloaded") list = list.filter((item) => item.downloaded)
    else if (statusFilter === "not_downloaded") list = list.filter((item) => !item.downloaded)
    else if (statusFilter === "cover_downloaded") list = list.filter((item) => item.coverDownloaded)
    else if (statusFilter === "cover_not_downloaded") list = list.filter((item) => !item.coverDownloaded)
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim()
      list = list.filter((item) => {
        const desc = (item.media.desc || "").toLowerCase()
        const shortId = MediaHandler.toShortId(item.awemeId).toLowerCase()
        return desc.includes(q) || item.awemeId.toLowerCase().includes(q) || shortId.includes(q)
      })
    }
    const sortKey = sortMode.replace(/_(asc|desc)$/, "") as "time" | "size" | "duration" | "images"
    const direction = sortMode.endsWith("_asc") ? 1 : -1
    const keyMap: Record<"time" | "size" | "duration" | "images", string> = { time: "sortTime", size: "sortSize", duration: "sortDuration", images: "sortImages" }
    const sortField = keyMap[sortKey]
    return [...list].sort((a, b) => ((a[sortField] || 0) - (b[sortField] || 0)) * direction)
  }, [rawMediaList, searchText, typeFilter, statusFilter, sortMode])

  const isFilteredAllSelected = filteredList.length > 0 && filteredList.every((item) => item.selected)

  const handleSelectAll = (checked: boolean) => {
    filteredList.forEach((item) => downloadManager.markSelect(item.awemeId, checked))
  }

  const handleSelectRow = (awemeId: string, checked: boolean) => {
    downloadManager.markSelect(awemeId, checked)
  }

  const startJob = async (downloadType: DownloadType = "content", runConcurrency = concurrency) => {
    try {
      await downloadManager.startJob(downloadType, runConcurrency)
    } catch (e: any) {
      alert(e.message || e)
    }
  }

  const updateConcurrency = (value: number) => {
    setConcurrency(clampConcurrency(value))
  }

  const resumeJob = async () => {
    try {
      await downloadManager.resumeJob()
    } catch (e: any) {
      alert(e.message || e)
    }
  }

  const isJobView = snap.jobRunning || snap.jobStatus === "running" || snap.jobStatus === "paused" || snap.jobStatus === "completed"
  const downloadType = snap.downloadType
  const progressCount = Object.values(snap.itemStatuses || {}).filter((status) => status === "success").length
  const progressTotal = Math.max(snap.counts.selected, 1)
  const failedSections = [
    { title: "内容失败详情", count: snap.counts.failed, items: downloadManager.jobState?.failedItems },
    { title: "封面失败详情", count: snap.counts.coverFailed, items: downloadManager.jobState?.coverFailedItems },
  ].filter((section) => section.count > 0)

  const logStatusClass = (status: JobLogEntry["status"]) => {
    if (status === "running") return s.logStatusRunning
    if (status === "success") return s.logStatusSuccess
    if (status === "failed") return s.logStatusFailed
    return s.logStatusInfo
  }

  const logStatusLabel = (status: JobLogEntry["status"]) => {
    if (status === "running") return "下载中"
    if (status === "success") return "成功"
    if (status === "failed") return "失败"
    return "信息"
  }

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <h3 className={s.title}>批量下载 - {snap.profileName}</h3>
          <div className={s.statusText}>状态: {snap.statusLabel || "待命"}</div>
          <button className={s.closeBtn} onClick={onClose}>
            x
          </button>
        </div>

        <div className={s.tabs}>
          <button className={s.tab + (activeTab === "list" ? " " + s.tabActive : "")} onClick={() => setActiveTab("list")}>
            作品列表
          </button>
          <button className={s.tab + (activeTab === "job" ? " " + s.tabActive : "")} onClick={() => setActiveTab("job")}>
            任务进度
          </button>
          <button className={s.tab + (activeTab === "failed" ? " " + s.tabActive : "")} onClick={() => setActiveTab("failed")}>
            失败详情 ({snap.counts.failed + snap.counts.coverFailed})
          </button>
        </div>

        {activeTab === "list" ? (
          <>
            <div className={s.statsBar}>
              <span>已发现: {snap.counts.known}</span>
              <span>内容已下载: {snap.counts.downloaded}</span>
              <span>内容失败: {snap.counts.failed}</span>
              <span>封面已下载: {snap.counts.coverDownloaded}</span>
              <span>封面失败: {snap.counts.coverFailed}</span>
              <span>已选: {snap.counts.selected}</span>
            </div>

            <div className={s.filterBar}>
              <input type="text" placeholder="搜索描述..." className={s.searchInput} value={searchText} onInput={(e) => setSearchText((e.target as HTMLInputElement).value)} />
            </div>

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
                    <th className={s.th} style={{ width: "110px" }}>
                      <select className={s.typeFilterSelect} value={typeFilter} onChange={(e) => setTypeFilter((e.target as HTMLSelectElement).value)}>
                        <option value="all">类型: 全部</option>
                        <option value="video">视频</option>
                        <option value="album">图集</option>
                      </select>
                    </th>
                    <th className={s.th} style={{ width: "150px" }}>
                      <select className={s.typeFilterSelect} value={statusFilter} onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value)}>
                        <option value="all">状态: 全部</option>
                        <option value="downloaded">内容已下载</option>
                        <option value="not_downloaded">内容未下载</option>
                        <option value="cover_downloaded">封面已下载</option>
                        <option value="cover_not_downloaded">封面未下载</option>
                      </select>
                    </th>
                    <th className={s.th} style={{ width: "90px" }}>
                      <button className={s.thBtn} onClick={() => toggleSort("size")}>
                        文件大小 <span className={arrowClass("size")}>{sortArrow("size")}</span>
                      </button>
                    </th>
                    <th className={s.th} style={{ width: "90px" }}>
                      <button className={s.thBtn} onClick={() => toggleSort("duration")}>
                        视频时长 <span className={arrowClass("duration")}>{sortArrow("duration")}</span>
                      </button>
                    </th>
                    <th className={s.th} style={{ width: "80px" }}>
                      <button className={s.thBtn} onClick={() => toggleSort("images")}>
                        图集数量 <span className={arrowClass("images")}>{sortArrow("images")}</span>
                      </button>
                    </th>
                    <th className={s.th} style={{ width: "100px" }}>
                      <button className={s.thBtn} onClick={() => toggleSort("time")}>
                        发布时间 <span className={arrowClass("time")}>{sortArrow("time")}</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => {
                    const media = item.media
                    const coverUrl = getBestCoverUrl(media) || ""
                    const desc = media.desc || "(无描述)"
                    const createDate = media.createTime ? new Date(media.createTime * 1000).toLocaleDateString() : "-"
                    const fileSizeText = formatModalFileSize(item.sortSize)
                    const durationText = formatModalDuration(item.sortDuration)
                    const imageCountText = item.type === "album" ? `${item.sortImages}张` : "-"
                    const typeLabel = item.type === "album" ? "图集" : "视频"
                    let contentStatusCls = s.statusPending
                    let contentStatusText = "内容 待下载"
                    if (item.downloaded) {
                      contentStatusCls = s.statusDownloaded
                      contentStatusText = "内容 已下载"
                    } else if (item.failed) {
                      contentStatusCls = s.statusFailed
                      contentStatusText = "内容 失败(" + item.failed.count + ")"
                    }
                    let coverStatusCls = s.statusPending
                    let coverStatusText = "封面 待下载"
                    if (item.coverDownloaded) {
                      coverStatusCls = s.statusDownloaded
                      coverStatusText = "封面 已下载"
                    } else if (item.coverFailed) {
                      coverStatusCls = s.statusFailed
                      coverStatusText = "封面 失败(" + item.coverFailed.count + ")"
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
                        <td className={s.td}>{coverUrl && <LazyCover src={coverUrl} />}</td>
                        <td className={s.td}>
                          <div className={s.desc} title={desc}>
                            {desc}
                          </div>
                          <div className={s.idText}>ID: {item.awemeId}</div>
                        </td>
                        <td className={s.td}>
                          <span className={s.typeBadge}>{typeLabel}</span>
                        </td>
                        <td className={s.td}>
                          <div className={s.statusGroup}>
                            <span className={s.statusBadge + " " + contentStatusCls}>{contentStatusText}</span>
                            <span className={s.statusBadge + " " + coverStatusCls}>{coverStatusText}</span>
                          </div>
                        </td>
                        <td className={s.td}>{fileSizeText}</td>
                        <td className={s.td}>{durationText}</td>
                        <td className={s.td}>{imageCountText}</td>
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
            </div>

            <div className={s.footer}>提示：勾选作品后点击“开始下载”下载内容，点击“下载封面”下载封面。使用类型筛选快速定位内容。</div>

            <div className={s.actionBar}>
              <button className={s.btn} onClick={() => handleSelectAll(!isFilteredAllSelected)} disabled={filteredList.length === 0}>
                {isFilteredAllSelected ? "取消全选" : "全选"}
              </button>
              <select className={s.typeFilterSelect} value={concurrency} onChange={(e) => updateConcurrency(Number((e.target as HTMLSelectElement).value))}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    并发 {n}
                  </option>
                ))}
              </select>
              <button className={s.btnPrimary} onClick={() => startJob("content", concurrency)} disabled={snap.counts.selected === 0}>
                开始下载
              </button>
              <button className={s.btn} onClick={() => startJob("cover", concurrency)} disabled={snap.counts.selected === 0}>
                下载封面
              </button>
              <button
                className={s.btn}
                onClick={() => {
                  if (confirm("确定重置当前作者的下载记录吗？这将清除已下载和失败记录。")) downloadManager.resetState()
                }}
              >
                重置
              </button>
              <button className={s.btn} onClick={() => downloadManager.mediaHandler.open_config_modal()}>
                设置
              </button>
              <button className={s.btn} onClick={onClose}>
                关闭
              </button>
            </div>
          </>
        ) : activeTab === "job" ? (
          isJobView ? (
            <div className={s.jobContent}>
              <div className={s.jobSummary}>
                <span>下载类型: {downloadType === "cover" ? "封面" : "内容"}</span>
                <span>并发: {snap.concurrency || concurrency}</span>
                <span>已选: {snap.counts.selected}</span>
                <span>成功: {progressCount}</span>
                <span>失败: {downloadType === "cover" ? snap.counts.coverFailed : snap.counts.failed}</span>
              </div>

              <div className={s.progressSection}>
                <div className={s.progressLabel}>
                  <span>下载进度</span>
                  <span>
                    {progressCount}/{progressTotal}
                  </span>
                </div>
                <div className={s.progressBarContainer}>
                  <div className={s.progressBarFill} style={{ width: (progressCount / progressTotal) * 100 + "%" }} />
                </div>
                <div className={s.squareContainer}>
                  {Object.entries(snap.itemStatuses || {}).map(([id, status]) => (
                    <div
                      key={id}
                      className={
                        s.square +
                        (status === "success"
                          ? " " + s.squareSuccess
                          : status === "failed"
                            ? " " + s.squareFailed
                            : status === "running"
                              ? " " + s.squareRunning
                              : " " + s.squarePending)
                      }
                      title={id}
                    />
                  ))}
                </div>
                <div className={s.progressLabel}>
                  <span>黑=等待 黄=下载中 绿=成功 红=失败</span>
                </div>
              </div>

              <div className={s.logContainer} ref={logRef}>
                {snap.jobLog.length === 0 ? (
                  <div className={s.emptyLog}>暂无日志</div>
                ) : (
                  <ul className={s.logList}>
                    {snap.jobLog.map((log, index) => (
                      <li key={index} className={s.logItem}>
                        <span className={s.logTime}>{new Date(log.time).toLocaleTimeString()}</span>
                        <span className={s.logType}>{log.type === "cover" ? "封面" : "内容"}</span>
                        <span className={s.logDesc}>{log.desc || log.awemeId || log.message}</span>
                        <span className={logStatusClass(log.status)}>{logStatusLabel(log.status)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={s.actionBar}>
                {snap.jobRunning ? (
                  <>
                    <button className={s.btn} onClick={() => downloadManager.pauseJob()} disabled={snap.jobStopRequested}>
                      暂停
                    </button>
                    <button className={s.btn} onClick={() => downloadManager.endJob()}>
                      结束
                    </button>
                  </>
                ) : snap.jobStatus === "paused" ? (
                  <>
                    <button className={s.btnPrimary} onClick={resumeJob}>
                      继续
                    </button>
                    <button className={s.btn} onClick={() => downloadManager.endJob()}>
                      结束
                    </button>
                  </>
                ) : (
                  <>
                    <button className={s.btn} onClick={() => downloadManager.endJob()}>
                      结束
                    </button>
                    <button className={s.btn} onClick={onClose}>
                      关闭
                    </button>
                  </>
                )}
              </div>
              <div className={s.footer}>关闭弹窗不会中断后台下载；结束后可回到选择阶段。</div>
            </div>
          ) : (
            <div className={s.emptyLog} style={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              暂无任务进度
            </div>
          )
        ) : (
          <div className={s.tableContainer}>
            {failedSections.length === 0 ? (
              <div className={s.failEmpty}>暂无失败记录</div>
            ) : (
              failedSections.map((section) => (
                <div className={s.failSection} key={section.title}>
                  <h4 className={s.failTitle}>{section.title}</h4>
                  <table className={s.failTable}>
                    <thead>
                      <tr>
                        <th className={s.failTh}>类型</th>
                        <th className={s.failTh}>ID</th>
                        <th className={s.failTh}>描述</th>
                        <th className={s.failTh}>原因</th>
                        <th className={s.failTh}>错误信息</th>
                        <th className={s.failTh}>次数</th>
                        <th className={s.failTh}>时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(section.items || {})
                        .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
                        .map(([id, info]) => (
                          <tr key={id}>
                            <td className={s.failTd}>{section.title.includes("封面") ? "封面" : "内容"}</td>
                            <td className={s.failTd}>
                              <div className={s.failId}>{id}</div>
                            </td>
                            <td className={s.failTd}>
                              <div className={s.failDesc} title={info.desc}>
                                {info.desc || "-"}
                              </div>
                            </td>
                            <td className={s.failTd}>{info.reason ? FAILURE_REASON_LABELS[info.reason] || info.reason : "-"}</td>
                            <td className={s.failTd}>
                              <div className={s.failMessage}>{info.message || info.reason || "-"}</div>
                            </td>
                            <td className={s.failTd}>{info.count}</td>
                            <td className={s.failTd}>{info.updatedAt ? new Date(info.updatedAt).toLocaleString() : "-"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
            <div className={s.actionBar}>
              <button className={s.btn} onClick={onClose}>
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
