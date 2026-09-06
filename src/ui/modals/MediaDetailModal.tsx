// 媒体详情 modal
import { useState, useEffect, useRef } from "preact/hooks"
import { createCSS } from "../../utils/css-in-js"
import { theme } from "../../utils/theme"
import { DownloaderLauncher } from "../../core/download/DownloaderLauncher"
import { getBestCoverUrl } from "@/handlers/douyin/getBestCoverUrl"
import { normalizeFilename } from "../../utils/string"

// --- 初始化 CSS-in-JS 工具 ---
const css = createCSS()
// --- 生成所有样式类名（静态 + 动态变体）---
const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    height: "80vh",
    overflow: "hidden",
    background: theme.colors.bgOverlay,
    backdropFilter: theme.backdropBlur,
    borderRadius: theme.borderRadius.lg,
    color: theme.colors.textPrimary,
  }),
  nav: css({ display: "flex", borderBottom: "1px solid " + theme.colors.borderLight, background: theme.colors.bgNav, flexShrink: 0 }),
  navBtnBase: css({
    padding: theme.spacing.md + " " + theme.spacing.xl,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    fontWeight: "normal",
    color: theme.colors.textSecondary,
    transition: "0.2s",
  }),
  navBtnActive: css({ background: "rgba(255,255,255,0.08)", borderBottomColor: theme.colors.primary, fontWeight: "bold", color: theme.colors.primary }),
  content: css({ flexGrow: 1, overflowY: "auto", padding: theme.spacing.xl }),
  fieldset: css({
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    background: theme.colors.bgFieldset,
  }),
  legend: css({
    fontWeight: "bold",
    padding: "0 " + theme.spacing.sm,
    color: "rgba(255,255,255,0.9)",
    background: "rgba(18,18,20,0.8)",
    borderRadius: theme.borderRadius.full,
    fontSize: theme.fontSize.sm,
  }),
  row: css({ display: "flex", padding: theme.spacing.sm + " 0", fontSize: theme.fontSize.sm, borderBottom: "1px solid rgba(255,255,255,0.08)", alignItems: "center" }),
  label: css({ width: "100px", flexShrink: 0, color: theme.colors.textMuted, fontWeight: 600 }),
  value: css({ flexGrow: 1, color: theme.colors.textSecondary, wordBreak: "break-all" }),
  btn: css({
    padding: theme.spacing.xs + " " + theme.spacing.md,
    fontSize: theme.fontSize.xs,
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.3)",
    background: "rgba(255,255,255,0.08)",
    color: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.full,
    marginLeft: theme.spacing.sm,
    transition: "0.2s",
  }),
  img: css({ maxWidth: "100px", maxHeight: "80px", objectFit: "cover", borderRadius: theme.borderRadius.sm, border: "1px solid " + theme.colors.borderInput }),
  table: css({ width: "100%", fontSize: theme.fontSize.xs, borderCollapse: "collapse", background: "rgba(0,0,0,0.2)", borderRadius: theme.borderRadius.sm, overflow: "hidden" }),
  th: css({ border: "1px solid " + theme.colors.borderLight, padding: theme.spacing.sm, background: "rgba(0,0,0,0.4)", textAlign: "left", color: "rgba(255,255,255,0.9)" }),
  td: css({ border: "1px solid " + theme.colors.borderLight, padding: theme.spacing.sm, color: theme.colors.textSecondary }),
  flexRow: css({ display: "flex", gap: "15px", alignItems: "center" }),
  flexWrap: css({ display: "flex", gap: "6px", flexWrap: "wrap" }),
  imgCover: css({ width: "120px", borderRadius: "4px" }),
  authorHeader: css({ display: "flex", gap: "15px", marginBottom: "20px", alignItems: "center" }),
  jsonPre: css({
    background: "rgba(0,0,0,0.3)",
    padding: "10px",
    overflow: "auto",
    maxHeight: "100%",
    fontSize: "12px",
    wordBreak: "break-all",
    whiteSpace: "pre-wrap",
    border: "1px solid " + theme.colors.borderInput,
    borderRadius: theme.borderRadius.sm,
    cursor: "text",
    color: "#ddd",
  }),
  danmakuContainer: css({ display: "flex", flexDirection: "column", gap: theme.spacing.md }),
  danmakuHeader: css({ display: "flex", justifyContent: "space-between", alignItems: "center" }),
  danmakuTitle: css({ margin: 0 }),
  danmakuButtonGroup: css({ display: "flex", gap: theme.spacing.sm }),
  danmakuEmpty: css({ textAlign: "center", padding: theme.spacing.xl, color: theme.colors.textDim }),
  danmakuTableWrapper: css({ maxHeight: "500px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "4px" }),
}

// 辅助函数：根据 active 状态返回导航按钮类名
const navBtnClass = (active: boolean) => (active ? styles.navBtnBase + " " + styles.navBtnActive : styles.navBtnBase)
// --- 辅助函数 ---
const fmt = {
  ts: (ts?: number) => (ts ? new Date(ts * 1000).toLocaleString() : "N/A"),
  num: (n?: number) => (n ? (n > 10000 ? (n / 10000).toFixed(1) + " 万" : n) : 0),
  size: (s?: number) => (s ? (s / 1024 / 1024).toFixed(2) + " MB" : "-"),
}
// ms 转 ASS 时间格式 (HH:MM:SS.mm)
const msToAssTime = (ms: number) => {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  return h.toString().padStart(2, "0") + ":" + m.toString().padStart(2, "0") + ":" + s.toString().padStart(2, "0") + "." + cs.toString().padStart(2, "0")
}

// 基础键值对
const KeyValue = ({ label, children }: { label: string; children?: any }) => (
  <div className={styles.row}>
    <strong className={styles.label}>{label}</strong>
    <span className={styles.value}>{children ?? "-"}</span>
  </div>
)

// 可复制的键值对
const Copyable = ({ label, value }: { label: string; value?: string }) => {
  const [c, sc] = useState(false)
  const h = () => {
    navigator.clipboard.writeText(value || "").then(() => {
      sc(true)
      setTimeout(() => sc(false), 2000)
    })
  }
  if (!value) return <KeyValue label={label} />
  return (
    <div className={styles.row}>
      <strong className={styles.label}>{label}</strong>
      <span className={styles.value}>{value}</span>
      <button className={styles.btn} onClick={h}>
        {c ? "已复制" : "复制"}
      </button>
    </div>
  )
}

// 表格组件
const Table = ({ headers, rows }: { headers: string[]; rows: any[][] }) => (
  <table className={styles.table}>
    <thead>
      <tr>
        {headers.map((h, i) => (
          <th key={i} className={styles.th}>
            {h}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={i}>
          {row.map((cell, j) => (
            <td key={j} className={styles.td}>
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)
// Launcher 配置
const launchers = [
  { key: "browser", label: "打开", buildUrl: (u: string) => u },
  {
    key: "copy",
    label: "复制",
    buildUrl: () => null,
    action: (u: string) => {
      navigator.clipboard.writeText(u)
      alert("复制成功")
    },
  },
  { key: "potplayer", label: "PotPlayer", buildUrl: (u: string) => "potplayer://" + u },
  {
    key: "abdm",
    label: "abdm",
    buildUrl: () => null,
    action: async (u: string) => {
      const l = new DownloaderLauncher()
      await l.invoke_download(u, "abdm")
    },
  },
  {
    key: "aria2",
    label: "aria2",
    buildUrl: () => null,
    action: async (u: string) => {
      const l = new DownloaderLauncher()
      await l.invoke_download(u, "aria2")
    },
  },
]
// 通用唤醒按钮组
const LaunchButtons = ({ url }: { url: string }) => (
  <div className={styles.flexWrap}>
    {launchers.map((l) => {
      const h = l.buildUrl?.(url)
      if (l.action)
        return (
          <button key={l.key} className={styles.btn} onClick={() => l.action!(url)}>
            {l.label}
          </button>
        )
      if (h)
        return (
          <a key={l.key} href={h} target="_blank">
            <button className={styles.btn}>{l.label}</button>
          </a>
        )
      return null
    })}
  </div>
)

// 视频部分
const VideoSection = ({ video, media, filenameBase }: { video: any; media: any; filenameBase: string }) => {
  if (!video?.bitRateList?.length) return null
  // TODO: 应该有个无封面占位图，但是一般情况不太可能没封面...
  const cu = getBestCoverUrl(media) || "#"
  return (
    <>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>视频封面</legend>
        <div className={styles.flexRow}>
          <img src={cu} className={styles.imgCover} />
          <div>
            <p>
              <strong>分辨率:</strong> {video.width}x{video.height}
            </p>
            <div style={{ marginTop: 10 }}>
              <a href={cu} target="_blank" className={styles.btn}>
                新标签打开
              </a>
              <a href={cu} download={normalizeFilename("cover_" + filenameBase + ".jpeg")} className={styles.btn}>
                下载封面
              </a>
            </div>
          </div>
        </div>
      </fieldset>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>视频源</legend>
        <Table
          headers={["清晰度", "分辨率", "编码", "FPS", "码率", "大小", "操作"]}
          rows={video.bitRateList.map((v: any) => [
            v.gearName,
            v.width + "x" + v.height,
            (v.isH265 ? "H.265" : "H.264") + (v.format === "dash" ? " dash" : ""),
            v.fps,
            (v.bitRate / 1000).toFixed(0),
            fmt.size(v.dataSize),
            v.playApi ? <LaunchButtons url={v.playApi} /> : "-",
          ])}
        />
      </fieldset>
    </>
  )
}

// 图片部分
const ImageSection = ({ images }: { images: any[] }) => {
  if (!images?.length) return null
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>图集 ({images.length}P)</legend>
      <Table
        headers={["#", "类型", "预览", "分辨率", "大小", "下载"]}
        rows={images.map((img: any, i: number) => {
          const iv = !!img.video
          const th = iv ? img.video.originCoverUrlList?.[0] : img.urlList?.[0]
          const dl = iv ? img.video.playAddr?.[0]?.src : img.urlList?.[0]
          return [
            i + 1,
            iv ? "视频" : "图片",
            <img src={th} className={styles.img} loading="lazy" />,
            iv ? img.video.width + "x" + img.video.height : img.width + "x" + img.height,
            iv ? fmt.size(img.video.dataSize) : "-",
            dl ? (
              <a href={dl} target="_blank">
                链接
              </a>
            ) : (
              "-"
            ),
          ]
        })}
      />
    </fieldset>
  )
}

// 音乐部分
const MusicSection = ({ music }: { music: any }) => {
  if (!music) return null
  const du = music.playUrl?.urlList?.[0] || ""
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>背景音乐</legend>
      <div className={styles.flexRow}>
        <img src={music.coverThumb?.urlList?.[0]} style={{ width: 60, height: 60, borderRadius: 4 }} loading="lazy" />
        <div style={{ flex: 1 }}>
          <KeyValue label="标题">{music.title}</KeyValue>
          <KeyValue label="作者">{music.author}</KeyValue>
          <KeyValue label="时长">{music.duration}秒</KeyValue>
          {du && (
            <a href={du} target="_blank" className={styles.btn}>
              下载
            </a>
          )}
          {du && (
            <audio controls preload="metadata" style={{ width: "100%" }}>
              <source src={du} />
            </audio>
          )}
        </div>
      </div>
    </fieldset>
  )
}

// --- Tab 内容组件 ---
const MediaTab = ({ media, filenameBase }: { media: any; filenameBase: string }) => {
  if (!media) return <div>无媒体信息</div>
  return (
    <div>
      <VideoSection media={media} video={media.video} filenameBase={filenameBase} />
      <ImageSection images={media.images} />
      <MusicSection music={media.music} />
    </div>
  )
}

const AuthorTab = ({ author }: { author: any }) => {
  if (!author) return <div>无作者信息</div>
  return (
    <>
      <div className={styles.authorHeader}>
        <img src={author.avatarThumb?.urlList?.[0]} style={{ width: 80, height: 80, borderRadius: "50%" }} />
        <div>
          <h3>{author.nickname}</h3>
          <a href={"https://www.douyin.com/user/" + author.secUid} target="_blank" className={styles.btn}>
            访问主页
          </a>
        </div>
      </div>
      <KeyValue label="认证">{author.customVerify || author.enterpriseVerifyReason}</KeyValue>
      <Copyable label="UID" value={author.uid} />
      <Copyable label="SecUID" value={author.secUid} />
      <KeyValue label="粉丝数">{fmt.num(author.followerCount)}</KeyValue>
      <KeyValue label="获赞数">{fmt.num(author.totalFavorited)}</KeyValue>
    </>
  )
}

const PostTab = ({ media }: { media: any }) => (
  <>
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>描述</legend>
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{media.desc || "无描述"}</div>
    </fieldset>
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>数据统计</legend>
      <KeyValue label="发布时间">{fmt.ts(media.createTime)}</KeyValue>
      <Copyable label="分享链接" value={media.shareInfo?.shareUrl} />
      <KeyValue label="点赞">{fmt.num(media.stats?.diggCount)}</KeyValue>
      <KeyValue label="评论">{fmt.num(media.stats?.commentCount)}</KeyValue>
      <KeyValue label="收藏">{fmt.num(media.stats?.collectCount)}</KeyValue>
      <KeyValue label="分享">{fmt.num(media.stats?.shareCount)}</KeyValue>
    </fieldset>
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>ID信息</legend>
      <Copyable label="Aweme ID" value={media.awemeId} />
      <Copyable label="Group ID" value={media.groupId} />
    </fieldset>
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>权限/状态</legend>
      <KeyValue label="允许评论">{media.awemeControl?.canComment ? "是" : "否"}</KeyValue>
      <KeyValue label="允许分享">{media.awemeControl?.canShare ? "是" : "否"}</KeyValue>
      <KeyValue label="允许下载">{media.download?.allowDownload ? "是" : "否"}</KeyValue>
      <KeyValue label="私密视频">{media.isPrivate ? "是" : "否"}</KeyValue>
    </fieldset>
  </>
)

const JsonTab = ({ data }: { data: any }) => {
  const ref = useRef<HTMLElement>(null)
  const sel = () => {
    const r = document.createRange()
    r.selectNodeContents(ref.current!)
    const s = window.getSelection()!
    s.removeAllRanges()
    s.addRange(r)
  }
  return (
    <fieldset style={{ overflow: "hidden", border: "1px solid #ddd", borderRadius: "4px", padding: 10, maxHeight: "100%" }}>
      <legend className={styles.legend}>
        原始数据
        <button onClick={sel} className={styles.btn}>
          全选
        </button>
        <button onClick={() => console.log(data)} className={styles.btn}>
          Console Log
        </button>
      </legend>
      <pre className={styles.jsonPre}>
        <code ref={ref}>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </fieldset>
  )
}

const DanmakuTab = () => {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const fetchDm = () => {
    try {
      setLoading(true)
      const p = (window as any).player
      if (!p?.danmaku?.main) {
        setList([])
        return
      }
      const raw = p.danmaku.main.data || []
      const f = raw.map((item: any, i: number) => ({ index: i + 1, startTimeStr: msToAssTime(item.start), text: item.text || "", uid: item.user_id || 0, score: item.score || 0 }))
      setList(f)
    } catch (e) {
      console.error(e)
      setList([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchDm()
  }, [])
  const copyAll = () => {
    navigator.clipboard.writeText(list.map((i: any) => i.text).join("\n"))
    alert("已复制" + list.length + "条")
  }
  return (
    <div className={styles.danmakuContainer}>
      <div className={styles.danmakuHeader}>
        <h4 className={styles.danmakuTitle}>弹幕列表({list.length}条)</h4>
        <div className={styles.danmakuButtonGroup}>
          <button className={styles.btn} onClick={fetchDm} disabled={loading}>
            刷新
          </button>
          <button className={styles.btn} onClick={copyAll} disabled={list.length === 0}>
            复制全部
          </button>
        </div>
      </div>
      {loading && <div className={styles.danmakuEmpty}>加载中...</div>}
      {!loading && list.length === 0 && <div className={styles.danmakuEmpty}>暂无弹幕</div>}
      {!loading && list.length > 0 && (
        <div className={styles.danmakuTableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>#</th>
                <th className={styles.th}>时间</th>
                <th className={styles.th}>UID</th>
                <th className={styles.th}>内容</th>
                <th className={styles.th}>评分</th>
                <th className={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item: any) => (
                <tr key={item.index}>
                  <td className={styles.td}>{item.index}</td>
                  <td className={styles.td}>{item.startTimeStr}</td>
                  <td className={styles.td}>{item.uid}</td>
                  <td className={styles.td}>{item.text}</td>
                  <td className={styles.td}>{item.score.toFixed(2)}</td>
                  <td className={styles.td}>
                    <button className={styles.btn} onClick={() => navigator.clipboard.writeText(item.text)}>
                      复制
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const tabs = [
  { id: "media", title: "媒体资源", Comp: MediaTab },
  { id: "author", title: "作者信息", Comp: AuthorTab },
  { id: "post", title: "作品信息", Comp: PostTab },
  { id: "danmaku", title: "弹幕列表", Comp: DanmakuTab },
  { id: "json", title: "JSON", Comp: JsonTab },
]

// --- 主入口组件 ---
export const MediaDetailModalApp = ({ media, filenameBase }: { media: any; filenameBase: string }) => {
  const [tab, setTab] = useState("media")
  const t = tabs.find((t) => t.id === tab)!
  const props = (id: string) => {
    switch (id) {
      case "author":
        return { author: media.authorInfo }
      case "json":
        return { data: media }
      default:
        return { media, filenameBase }
    }
  }
  const Comp = t.Comp as any
  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={navBtnClass(tab === t.id)}>
            {t.title}
          </button>
        ))}
      </nav>
      <div className={styles.content}>
        <Comp {...props(tab)} />
      </div>
    </div>
  )
}
