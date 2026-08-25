# douyin-dl-user-js 架构文档

> 最后更新: 2026-07-09
> 项目: 抖音视频/图片下载油猴脚本

---

## 目录

1. [项目概述](#1-项目概述)
2. [目录结构](#2-目录结构)
3. [模块依赖图](#3-模块依赖图)
4. [启动流程](#4-启动流程)
5. [核心模块详解](#5-核心模块详解)
6. [数据流](#6-数据流)
7. [构建流水线](#7-构建流水线)
8. [关键设计决策](#8-关键设计决策)
9. [扩展指南](#9-扩展指南)
10. [编码规范](#10-编码规范)

---

## 1. 项目概述

抖音下载油猴脚本，为 web 版抖音 (douyin.com) 添加下载按钮和相关工具。

- 语言: TypeScript + TSX (Preact)
- 构建: esbuild 打包为单 IIFE 油猴脚本
- UI: Preact (内联打包，无 CDN)
- 样式: 运行时 CSS-in-JS (createCSS)
- 设计模式: 构造注入 DI，无全局变量

### 主要功能

- 视频/图集下载 (浏览器或第三方下载器)
- 作者页批量下载
- 弹幕导出 (ASS 格式)
- 视频帧捕获
- 图片转码/压缩
- IDM/Aria2/BitComet/ABDM 唤醒

---

## 2. 目录结构

```
douyin-dl-user-js/
├── dist/dy-dl.user.js         # 构建产物 (油猴脚本)
├── build.mjs                  # esbuild 构建脚本
├── tsconfig.json              # TS 编译配置
├── eslint.config.mjs          # ESLint flat config
├── .prettierrc                # Prettier 配置
├── .editorconfig              # 编辑器配置
├── types.ts                   # 原始类型定义 (参考)
│
└── src/
    ├── index.ts               # 入口: DI 启动
    ├── types/                 # 类型声明
    ├── utils/                 # 零依赖工具函数
    ├── core/                  # 核心基础设施
    ├── handlers/              # 业务处理器
    └── ui/                    # Preact UI 组件
```

### 2.1 分层职责

| 层 | 职责 | 可测试性 | 依赖 |
|----|------|---------|------|
| `utils/` | 纯函数, DOM 操作, 格式化 | 高 | 无 |
| `core/` | 全局状态, 事件系统, 下载引擎 | 中 | utils |
| `handlers/` | 业务编排, 页面数据采集 | 低 | core |
| `ui/` | Preact 渲染, 用户交互 | 低 | handlers + core |

### 2.2 文件清单

**入口:**
- `src/index.ts` (26 行) — 实例化所有类, 调用 init/startObserving/mount_ui

**类型:**
- `src/types/lite.ts` (82 行) — 轻量类型 PlayerInstanceLite, MediaLite (代码实际使用)
- `src/types/gm.d.ts` (41 行) — GM_xmlhttpRequest, unsafeWindow 声明
- `src/types/douyin.ts` (3840 行) — 完整 Douyin API 类型 (引用保留, 代码未直接使用)
- `src/types/index.ts` (2 行) — re-export

**工具函数 (utils/):**

| 文件 | 行数 | 导出 |
|------|------|------|
| `css-in-js.ts` | 46 | createCSS() |
| `dom.ts` | 64 | createToast |
| `format.ts` | 18 | runInContext, formatDate |
| `performance.ts` | 19 | debounce, throttle |
| `string.ts` | 35 | normalizeFilename, isProfilePagePath |
| `theme.ts` | 34 | theme 对象 |

**核心模块 (core/):**

| 文件 | 行数 | 职责 |
|------|------|------|
| `Emitter.ts` | 52 | 泛型事件发射器 (on/off/emit/once/useEvent) |
| `Config.ts` | 90 | 全局配置, localStorage 持久化 |
| `Downloader.ts` | 195 | 核心下载引擎 (URL 解析, Blob 下载, 分发) |
| `DownloaderLauncher.ts` | 288 | 第三方下载器唤醒 (IDM/Aria2/BitComet/ABDM) |
| `DOMPatcher.ts` | 212 | MutationObserver DOM 注入编排 |
| `ImageProcessor.ts` | 92 | Canvas 图片转码/缩放 |
| `XhrInterceptor.ts` | 51 | XHR 劫持 |
| `AwemeHub.ts` | 23 | API 数据收集 (当前无消费者) |
| `DownloadHistory.ts` | 35 | 下载历史 CRUD |
| `ProfileDownloadState.ts` | 69 | 批量下载进度持久化 |
| `HotkeyManager.ts` | 18 | 键盘快捷键 |

**业务处理器 (handlers/):**

| 文件 | 行数 | 职责 |
|------|------|------|
| `MediaHandler.tsx` | 278 | 播放器检测, 文件命名, 下载流程控制 |
| `ProfileDataService.ts` | 89 | 作者页数据采集 (React Fiber + DOM) |
| `ProfileDownloadManager.ts` | 221 | 批量下载队列和状态管理 |
| `ProfilePageHandler.ts` | 18 | 作者页入口组合器 |
| `VideoHandler.ts` | 68 | 视频帧捕获/复制/下载 |
| `DanmakuHandler.ts` | 68 | 弹幕解析 + ASS 转换 |

**UI 组件 (ui/):**

| 文件 | 行数 | 职责 |
|------|------|------|
| `Modal.ts` | 38 | 通用模态框 |
| `FloatingPanel.tsx` | 27 | 浮动面板容器 |
| `TooltipsButton.ts` | 57 | 播放器悬浮菜单按钮 |
| `ConfigModal.tsx` | 303 | 配置编辑器 (设置/下载器/历史) |
| `MediaDetailModal.tsx` | 498 | 媒体详情 (视频/作者/弹幕/JSON) |
| `FloatingPanelUI.tsx` | 153 | 批量下载状态面板 |
| `ProfileJobModal.tsx` | 158 | 批量下载任务管理器 |

---

## 3. 模块依赖图

```
                    ┌──────────┐
                    │ index.ts │  (DI 启动)
                    └────┬─────┘
                         │
          ┌──────────────┼──────────────┬──────────────┐
          │              │              │              │
    ┌─────▼─────┐ ┌─────▼─────┐ ┌──────▼──────┐ ┌─────▼──────┐
    │ DOMPatcher│ │MediaHandler│ │ProfilePage  │ │HotkeyManager│
    │ (core)    │ │ (handlers) │ │Handler      │ │ (core)      │
    └─────┬─────┘ └─────┬─────┘ │ (handlers)  │ └────────────┘
          │             │       └──────┬──────┘
          │             │              │
          │       ┌─────▼─────┐  ┌─────▼──────────┐
          │       │ Downloader│  │ProfileDownload │
          │       │ (core)    │  │Manager         │
          │       └─────┬─────┘  │ (handlers)     │
          │             │        └─────┬──────────┘
          │       ┌─────▼─────┐        │
          │       │Downloader │  ┌──────▼──────────┐
          │       │Launcher   │  │ProfileData      │
          │       │ (core)    │  │Service          │
          │       └───────────┘  │ (handlers)      │
          │                      └─────────────────┘
    ┌─────▼──────┐
    │ VideoHndlr │  DanmakuHndlr   TooltipsButton
    │ (handlers) │  (handlers)     (ui)
    └────────────┘

    依赖方向: 从上到下, Config 和 Emitter 被几乎所有模块依赖
               UI 组件通过 import() 懒加载
```

### 核心依赖

- **Config** 和 **Emitter** — 被几乎所有模块依赖
- **Modal** 和 **FloatingPanel** — 纯容器, 依赖 Preact render
- **UI 组件** — 通过 `import()` 懒加载, 不阻塞启动

---

## 4. 启动流程

```
index.ts
│
├── new Downloader()
├── new MediaHandler(downloader)
│   └── mediaHandler.init()
│       └── _start_detect_player_change()
│           └── 每 1s 轮询 window.player
│               └── 检测到变化 → _bind_player_events()
│                   └── 监听 play/seeked 事件
│
├── new VideoHandler()
├── new DanmakuHandler()
├── new ProfilePageHandler({ mediaHandler })
│   └── 内部创建 ProfileDataService + ProfileDownloadManager
│
├── new DOMPatcher({ downloader, mediaHandler, videoHandler, danmakuHandler, profilePageHandler })
│   └── domPatcher.startObserving()
│       └── MutationObserver → _handleMutations()
│           ├── xg-controls → _handleXgControl() → TooltipsButton 注入
│           ├── feed cards → _handleProfileCard() → 批量下载选择框
│           ├── modal window → _handleModal() → 图片下载按钮
│           └── tooltip → _handleTooltip() → 表情包下载
│
├── profilePageHandler.mount_ui()
│   └── FloatingPanel.mount() → render(<FloatingPanelApp />)
│
└── hotkeyManager.addHotkey("m", mediaHandler.download_current_media)
```

### 关键观察

1. **无阻塞启动** — DOM 检测和 UI 注入全部异步
2. **MutationObserver 驱动** — 新 DOM 出现时自动注入按钮
3. **播放器轮询** — 通过 1s 间隔检测 `window.player`
4. **懒加载 UI** — ConfigModal/MediaDetailModal 通过 `import()` 在点击时加载

---

## 5. 核心模块详解

### 5.1 Emitter (泛型事件发射器)

```typescript
class Emitter<Events extends Record<string, any[]>> {
  on<K extends keyof Events>(event: K, handler: (...args: Events[K]) => void): () => void
  emit<K extends keyof Events>(event: K, ...args: Events[K]): void
  once<K extends keyof Events>(event: K, handler: (...args: Events[K]) => void): () => void
  useEvent<K, T>(event: K, getter?: (...args: Events[K]) => T): T | null  // Preact hook
}
```

- 类型安全: 事件名和参数类型通过泛型关联
- `useEvent()` 是 Preact hook 版本, 用于组件内订阅

### 5.2 Config (全局配置)

- 单例模式: `Config.global`
- 存储: localStorage key `__douyin-dl-user-js__`
- 特性对象: `Config.features` (10+ 配置项)
- 变更通知: 调用 `config.save()` 后 emit `config_change` 事件
- `clone_features()` 返回深拷贝, 用于 UI 编辑器

### 5.3 Downloader (下载引擎)

```
download_file(source, filename, fallback_src, options)
  └─ download_one_url(url, filename)
       ├─ using_downloader === "browser"
       │    └─ prepare_download_file → download_blob
       │         └─ download_postprocess → ImageProcessor
       │
       ├─ "idm"     → DownloaderLauncher.launchIDM()
       ├─ "aria2"   → DownloaderLauncher.launchAria2()
       ├─ "bc"      → DownloaderLauncher.launchBitComet()
       └─ "abdm"    → DownloaderLauncher.launchABDM()
```

- 多 URL fallback: 主源失败时自动尝试后备源
- 图片后处理: WebP → PNG 转换 + 尺寸缩放 + 质量压缩

### 5.4 DOMPatcher (DOM 注入编排)

MutationObserver 监听 `document.body` 子节点变化, 处理:

| 节点 | 处理方式 | 功能 |
|------|---------|------|
| `xg-controls` | 插入 TooltipsButton | 下载/弹幕/帧捕获按钮 |
| feed card | 插入 checkbox badge | 批量下载选择 |
| modal div | 插入下载按钮 | 图片下载 |
| semi-portal tooltip | 插入下载按钮 | 表情包下载 |

### 5.5 MediaHandler (播放器交互)

- 轮询检测 `window.player` (Douyin 播放器实例)
- 绑定 `play`/`seeked` 事件 → 更新 `current_media`
- 文件名模板: `${nickname}_${short_id}_${tags}_${desc}`
- 视频 URL 选择: 根据分辨率策略和编码偏好过滤 bitRateList
- 下载锁: `_lock_download()` 防重复下载

### 5.6 ProfileDownloadManager (批量下载)

状态机:
```
idle → running → [completed | paused]
  ↑        ↓
  └────────┘ (resume)
```

- 事件驱动: stateChanged/countsUpdated/jobStarted/jobStopped/jobCompleted
- 持久化: IndexedDB (knownIds, downloadedIds, failedItems)；旧 localStorage 启动时迁移清理（updatedAt 对比，中断不会用旧数据覆盖新状态），IDB 最多保留最近 30 条且超过 90 天未更新的状态会被清理
- 滚动采集: throttle 1s, 监听 wheel 事件

---

## 6. 数据流

### 单视频下载

```
用户点击下载按钮
  → TooltipsButton callback
  → MediaHandler.download_current_media()
  → 检查 _downloading 锁
  → _get_video_urls(video_obj) 按策略筛选
  → Downloader.download_file(url, filename)
  → DownloaderLauncher 或 浏览器下载
  → DownloadHistory.add(media)
```

### 作者页批量下载

```
滚动采集
  → ProfileDataService.collectCurrentFeedMedia()
  → React Fiber 提取 awemeInfo
  → ProfileDownloadManager.mergeMediaIntoState()
  → emit countsUpdated
  → FloatingPanelUI 更新

批量下载
  → ProfileDownloadManager.startJob()
  → 遍历 selectedIds
  → MediaHandler._download_media_logic(media)
  → markDownloaded / markFailed
  → emit stateChanged / countsUpdated
```

---

## 7. 构建流水线

### 构建命令

| 命令 | 操作 |
|------|------|
| `pnpm build` | 构建输出 dist/dy-dl.user.js |
| `pnpm build:minify` | 构建 + 压缩 |
| `pnpm dev` | watch 模式 |
| `pnpm typecheck` | tsc 类型检查 |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier 自动格式化 |

### 构建产物结构

```
// ==UserScript==
// @name  抖音下载
// @grant GM_xmlhttpRequest
// ==/UserScript==

(() => {
  // esbuild bundle:
  //   1. preact (内联)
  //   2. src/utils/* 的纯函数
  //   3. src/core/* 的类
  //   4. src/handlers/* 的业务逻辑
  //   5. src/ui/* 的 Preact 组件
  //   6. src/index.ts 的 DI 启动
})();
```

### 关键技术选型

| 层面 | 选择 | 理由 |
|------|------|------|
| 语言 | TypeScript 6.x | 类型安全 |
| 构建 | esbuild 0.28 | 极快, 原生 TS, banner 注入 |
| UI | Preact 10 | 轻量, React 兼容 |
| 样式 | createCSS() | 零依赖, 运行时, 按需注入 |
| 打包 | 全内联 | 无需外部 CDN |

---

## 8. 关键设计决策

### 8.1 DI 模式而非全局变量

所有类通过构造函数传入依赖, 无全局变量:

```typescript
const downloader = new Downloader()
const mediaHandler = new MediaHandler(downloader)
const domPatcher = new DOMPatcher({ downloader, mediaHandler, ... })
```

优点: 可测试, 依赖清晰, 无隐式耦合。

### 8.2 运行时 CSS-in-JS

`createCSS()` 每次调用创建独立的 `<style>` 标签 + `CSSStyleSheet`:

```typescript
const css = createCSS()
const cls = css({ display: "flex", "&:hover": { opacity: 0.8 } })
// → 注入 .cXXXXX { display: flex; }
// → 注入 .cXXXXX:hover { opacity: 0.8 }
```

- 驼峰自动转 kebab-case
- 嵌套选择器 (通过 `&` 前缀)
- 数组合并
- 去重缓存

不采用 CSS Modules 或 CSS-in-JS 库的原因是: 减少打包体积, 无运行时依赖。

### 8.3 播放器检测策略

抖音使用自研播放器 (西瓜播放器 xgplayer), 实例挂载在 `window.player`:

```
轮询 window.player (1s) → 绑定 play/seeked
  → player.config.awemeInfo 更新
  → player.danmaku.main.data (弹幕)
  → player.video (HTMLVideoElement)
```

类型为宽松的 `PlayerInstanceLite` (src/types/lite.ts), 仅定义实际使用的字段。

### 8.4 PlayerInstanceLite

替代了原始的 `DouyinPlayer.PlayerInstance` (1877 行) 为精简接口 (15 行):

```typescript
interface PlayerInstanceLite {
  config?: { awemeInfo?: any }
  danmaku?: { main?: { data?: Array<{...}> } }
  sizeInfo?: { width?: number; height?: number }
  video?: HTMLVideoElement
  on?(event: string, handler: Function): void
}
```

### 8.5 懒加载 UI 组件

ConfigModal 和 MediaDetailModal 通过动态 `import()` 加载:

```typescript
async show_media_details() {
  const { MediaDetailModalApp } = await import("../ui/MediaDetailModal")
  render(<MediaDetailModalApp ... />, modal.root)
}
```

- 减少初始包体积
- 按需加载, 不影响首屏

### 8.6 事件命名约定

- `stateChanged` — ProfileDownloadManager 完整状态变更
- `countsUpdated` — 仅计数变更 (高频)
- `jobStarted/Stopped/Completed` — 作业生命周期
- `config_change` — Config 持久化

---

## 9. 扩展指南

### 添加新的配置项

1. 在 `src/core/Config.ts` 的 `Features` interface 添加字段
2. 在 `features` 默认值中添加
3. 在 `src/ui/ConfigModal.tsx` 的 `featuresMeta` 数组添加配置描述
4. 在业务代码中使用 `Config.global.features.your_field`

### 添加新的下载器

1. 在 `src/core/DownloaderLauncher.ts` 添加 `launchXXX()` 方法
2. 在 `invoke_download()` 的 switch 中添加 case
3. 在 `Config.ts` 的 downloader_config 和 using_downloader 类型中添加
4. 在 `src/core/Downloader.ts` 的 `download_one_url` 中添加 case
5. 在 `src/ui/ConfigModal.tsx` 的下载器选项中添加

### 添加新的 UI 组件

1. 在 `src/ui/` 下创建 `.tsx` 文件
2. 使用 `createCSS()` 生成样式
3. 使用 Preact hooks: `useState`, `useEffect`
4. 通过 `Modal` 容器或 `FloatingPanel` 挂载
5. 通过 `import()` 懒加载

### GM_xmlhttpRequest 使用

```typescript
import { DownloaderLauncher } from "../core/DownloaderLauncher"

const res = await DownloaderLauncher.request_cors(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
})
```

---

## 10. 编码规范

### 命名

- 类: PascalCase
- 方法/变量: camelCase
- 私有方法: `_` 前缀 (约定, 非 TS 强制)
- 常量: UPPER_SNAKE_CASE
- 类型: PascalCase 或 描述性名称

### 文件组织

- 每个文件一个主要导出 (class 或 function)
- index.ts 仅做 re-export
- 组件文件: `.tsx` 扩展名
- 类型文件: `.d.ts` 或 `.ts`

### 样式

- 组件内: `createCSS()` 实例化 + 样式对象
- 类名: 驼峰命名 `{ container, btn, header }`
- 不要用 style 属性, 用 className

### 事件

- Emitter 事件名: camelCase
- 在 Events interface 中声明类型
- `off()` 返回值用于取消订阅

### 错误处理

- 用户可感知的错误: `alert("[dy-dl]消息")`
- 开发调试: `console.error("[dy-dl]详情", error)`
- 非关键错误: 静默捕获 + log

---

## 附: 原始脚本对照

原始单文件 `dy-dl.user.js` 已从仓库移除，当前以 `src/` 为唯一源码；下表保留迁移对照供参考。

| 原始 #region | 迁移至 |
|-------------|--------|
| tools function | src/utils/* |
| 主题样式 | src/utils/theme.ts |
| 配置管理 | src/core/Config.ts |
| 事件 | src/core/Emitter.ts |
| 下载历史管理 | src/core/DownloadHistory.ts |
| ProfileDownloadState | src/core/ProfileDownloadState.ts |
| 图片转码压缩 | src/core/ImageProcessor.ts |
| API 拦截 | src/core/XhrInterceptor.ts |
| 下载器 | src/core/Downloader.ts |
| Modal | src/ui/Modal.ts |
| 下载器唤醒 | src/core/DownloaderLauncher.ts |
| Media Detail Modal | src/ui/MediaDetailModal.tsx |
| Config Modal | src/ui/ConfigModal.tsx |
| Floating Action Panel | src/ui/FloatingPanel.tsx + FloatingPanelUI.tsx |
| 主入口组件 | src/handlers/MediaHandler.tsx |
| TooltipsButton | src/ui/TooltipsButton.ts |
| Profile Page Handler | src/handlers/ProfileDataService.ts + ProfileDownloadManager.ts + ProfilePageHandler.ts |
| DOM Patcher | src/core/DOMPatcher.ts |
| HotkeyManager | src/core/HotkeyManager.ts |
| 视频管理 | src/handlers/VideoHandler.ts |
| 弹幕相关 | src/handlers/DanmakuHandler.ts |
| 启动 | src/index.ts |