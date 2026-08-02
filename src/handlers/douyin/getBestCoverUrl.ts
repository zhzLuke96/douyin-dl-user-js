import { DouyinMedia } from "@/types"
// ================================================================
// 1. 定义封面容器类型（从 DouyinPlayerVideo 中摘取封面相关字段）
// ================================================================
type CoverContainer = Pick<DouyinMedia.DouyinPlayerVideo, "cover" | "coverUrlList" | "originCover" | "originCoverUrlList" | "dynamicCover" | "rawCover">

// ================================================================
// 2. 类型守卫：判断对象是否包含根级封面字段（用于图文场景）
//    因为 MediaRoot 类型定义中未声明这些字段，用守卫安全绕过 TS 检查
// ================================================================
function isRootCoverContainer(obj: unknown): obj is CoverContainer {
  if (!obj || typeof obj !== "object") return false
  const candidate = obj as Record<string, unknown>
  return !!(
    typeof candidate.cover === "string" ||
    Array.isArray(candidate.coverUrlList) ||
    Array.isArray(candidate.originCoverUrlList) ||
    typeof candidate.dynamicCover === "string" ||
    typeof candidate.rawCover === "string"
  )
}

// ================================================================
// 3. 核心提取逻辑：从任意 CoverContainer 中选出最高清封面
// ================================================================
function extractFromContainer(container: CoverContainer | null | undefined): string | null {
  if (!container) return null

  // 🥇 优先：dynamicCover 且包含 _large（大图标识）
  if (container.dynamicCover && container.dynamicCover.includes("_large")) {
    return container.dynamicCover
  }

  // 🥈 次选：rawCover（原始上传文件）
  if (container.rawCover) {
    return container.rawCover
  }

  // 🥉 第三：从封面列表中筛选“干净”的大图（剔除裁剪/压缩参数）
  const candidates = [...(container.originCoverUrlList || []), ...(container.coverUrlList || [])]

  const cleanCandidates = candidates.filter(
    (url): url is string => typeof url === "string" && !url.includes("cropcenter") && !url.includes("sh=") && !url.includes("360p") && !url.includes("720p"),
  )

  if (cleanCandidates.length > 0) {
    return cleanCandidates[0]
  }

  // 🛡️ 最终保底：单字段回退
  return container.originCover || container.cover || null
}

// ================================================================
// 4. 对外统一接口：根据 MediaRoot 自动识别类型并提取最高清封面
// ================================================================
export function getBestCoverUrl(media: DouyinMedia.MediaRoot): string | null {
  // 场景 A：视频类型 — 优先从 video 子对象中取
  if (media.video) {
    const fromVideo = extractFromContainer(media.video)
    if (fromVideo) return fromVideo
  }

  // 场景 B：图文/幻灯片类型 — 从根节点取封面字段
  // 使用类型守卫安全地“借用” CoverContainer 结构
  if (isRootCoverContainer(media)) {
    const fromRoot = extractFromContainer(media)
    if (fromRoot) return fromRoot
  }

  // 都没找到
  return null
}
