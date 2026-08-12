# douyin-dl-user-js

抖音 web 端下载拓展

- [greasyfork](https://greasyfork.org/zh-CN/scripts/522326-%E6%8A%96%E9%9F%B3%E4%B8%8B%E8%BD%BD)
- [github](https://github.com/zhzLuke96/douyin-dl-user-js)
- [👉点击安装👈](https://github.com/zhzLuke96/douyin-dl-user-js/releases/latest/download/dy-dl.user.js)

## Features

- [x] 无水印视频下载
- [x] 可配置下载快捷键（默认 M）
- [x] 图集下载（支持图片和视频项，未支持打包 zip，会逐项下载）
- [x] 评论区图片下载
- [x] 表情包下载
- [x] 封面下载
- [x] 视频帧截图（复制/下载）
- [x] 媒体详情: 视频源/封面、作者信息、作品数据、音乐、弹幕、JSON
- [x] 支持弹幕下载（ASS）
- [x] 下载历史
- [x] 自定义文件名
- [x] 作者主页批量下载：内容/封面、断点续传、暂停/继续/结束、后台继续、并发下载、方块进度
- [x] 支持配置外部下载器
- [x] 自定义保存路径（外部下载器可配置，如 abdm/aria2/BitComet）
- [ ] ~~批量下载打包为 zip~~ (不支持)

## Change log

- 260813 1.5.10 修复抖音 CDN 不支持 HEAD 请求导致视频下载失败的问题
- 260812 1.5.9 修复作者主页跳转到搜索/其他页面后悬浮框任务状态未同步的问题
- 260812 1.5.8 修复多标签页配置不同步、保存时可能覆盖其他标签页已修改配置的问题

<details>
<summary>历史版本</summary>

- 260811 1.5.7 修复作者主页悬浮窗打开/关闭状态未持久化的问题
- 260811 1.5.6 修复视频下载被错误保存为 xml 后缀的问题
- 260809 1.5.5 支持自定义下载快捷键，可在配置中设置组合键并启用/禁用 (#21)
- 260809 1.5.4 修复 Content-Type 带 charset 参数导致图片扩展名异常 (#60)
- 260807 1.5.3 修复图片转码后文件后缀未同步更新的问题
- 260807 1.5.2 修复设置转码 PNG 时部分 WebP 图片仍下载为 webp 的问题
- 260806 1.5.1 作者主页批量下载支持并发下载（仅本次任务，不写入全局配置），进度改为方块状态（黑等待/黄下载中/绿成功/红失败）
- 260803 1.5.0 批量下载弹窗拆分选择/下载阶段，支持封面下载、暂停/继续/结束、后台继续、日志；支持 GitHub Release 自动发布
- 260412 1.4.2 ui 优化
- 260411 1.4.1
  - 作者主页支持批量下载、暂停继续、按已下载记录补漏、筛选选择
- 260404 1.3.8
  - 支持切换下载器（默认为通过浏览器下载）
  - 支持 abdm / aria 下载器
  - 修复分辨率偏好逻辑
  - 增加下载偏好：最大文件、最小文件
- 260402 1.3.5 初步支持链接外部播放器、下载器
  - 可唤醒 potplayer 预览视频
  - 使用 abdm 下载会将文件分级放在 `./douyin/[用户名]/videos` `./douyin/[用户名]/images` 中
- 260331 1.3.4
  - 增加下载偏好设置
  - 增加图片处理配置
  - 增加下载进度提醒气泡
- 260316 1.3.2 修复增强文件命名
- 260318 1.3.1
  - 配置窗口：增加配置窗口
  - 可配置文件名格式
  - 可配置默认下载视频清晰度
  - 下载历史：增加下载历史，在配置页面中，可以查看历史下载记录（保存 50 条）
- 260318 1.3.0 增强 ui 引入 preact
- 251224 1.2.8 修复封面下载地址
- 250929 1.2.7 支持下载视频弹幕 （初版） [#24](https://github.com/zhzLuke96/douyin-dl-user-js/issues/24)
- 250914 1.2.6 增加截图功能 （复制视频帧，下载视频帧）
- 250827 1.2.4 增强媒体详情 ui / 修复已知问题
- 250710 1.2.2 fix 详情 modal 样式
- 250710 1.2.0 增加媒体详情/插件控制/转码控制/下载封面/查看音乐/查看分辨率等功能
- 250602 1.1.1 修复下载按钮失效
- 250530 1.1.0 OOP 重构 / 无功能变化
- 250519 1.0.5 增加 webp 转 png 功能 #5 / 增强错误处理
- 250326 1.0.4 增加下载快捷键 [M] / 增加重复下载拦截
- 250114 1.0.3 优化文件名适配性/增加类型
- 241231 1.0.2 支持包含视频的图集

</details>

## Usage

安装后，会在对应位置添加下载按钮。

### 视频下载按钮

> 视频播放器控制条中【插件>下载】按钮
> 快捷键： 默认按下 M 键将下载当前视频/图片，可在设置中自定义

![image](https://github.com/user-attachments/assets/59af5d64-1669-4327-ace9-fec128a2d37b)

### 插件菜单

视频播放器控制条中的【插件】菜单包含：

- 下载：下载当前视频/图片
- 媒体详情：查看媒体资源、作者、作品、弹幕、JSON
- 下载弹幕：导出当前弹幕为 ASS 文件
- 复制视频帧 / 下载视频帧
- 设置
- 需求/反馈：跳转 GitHub Issues

### 图片下载按钮

> 点开评论区或图集图片后，右下角会出现【下载图片】

![image](https://github.com/zhzLuke96/douyin-dl-user-js/raw/main/docs/image_btn.jpg)

### 表情包下载按钮

> 表情包右键菜单中

![sticker](https://github.com/zhzLuke96/douyin-dl-user-js/raw/main/docs/sticker_btn.jpg)

### 媒体详情

点击【插件>媒体详情】可以查看：

- 媒体资源：视频源清晰度/编码/大小、封面、图集、音乐，可打开、复制、唤起 PotPlayer 或发送到下载器
- 作者信息：UID、SecUID、粉丝数、获赞数
- 作品信息：描述、数据统计、分享链接、ID、权限状态
- 弹幕列表：查看、刷新、复制弹幕
- JSON：原始作品数据

<img width="729" height="764" alt="image" src="https://github.com/user-attachments/assets/0d067b13-bbee-460f-a9a3-e0c47010603f" />

### 配置和历史

- [配置模板与变量教程](docs/template-config.md)
- 基本设置里可以一键重置所有配置为默认

<img width="578" height="656" alt="image" src="https://github.com/user-attachments/assets/5b1d6b53-ad86-4380-9a44-b4b8288dc2ec" />

#### 文件命名

支持模板字符串和最大文件名长度，配置弹窗内会实时预览解析结果。模板变量见 [配置模板与变量教程](docs/template-config.md)。

#### 快捷键

- 支持单键或组合键，例如 `M`、`Ctrl+M`、`Alt+M`、`Shift+M`、`Ctrl+Shift+M`
- 输入框聚焦时快捷键不会触发

#### 视频下载

支持设置分辨率偏好和编码偏好

- 分辨率偏好：默认、最高、最低、1080P、720P、540P、360P、2K、4K、最大文件、最小文件
- 编码偏好：默认、只下载 H.264、只下载 H.265、优先 H.264、优先 H.265

注意：这些偏好都有回退，即不满足的时候会退回默认下载地址

#### 图片处理

由 @Arrtourz 提出方法，之前只支持 webp 转 png，现在支持三种格式转换。

- 可以自由配置转为 png/jpg/webp 三种格式
- 可以设置图片尺寸压缩（2K/1K/960/640/512）和质量压缩

注意：图片转码和压缩只在“浏览器下载”时生效，使用外部下载器时不会执行。

### 下载器

<img width="555" height="142" alt="image" src="https://github.com/user-attachments/assets/dc0458af-82db-4f8b-94fd-bf02fda118d5" />

#### 下载器配置

支持使用外部下载器下载文件，方便归档整理。

默认使用浏览器下载，也可以切换为外部下载器。

目前支持：

- [abdm](https://github.com/amir1376/ab-download-manager)
- [aria2](https://github.com/aria2/aria2)
- [IDM](https://www.internetdownloadmanager.com/)
- [BitComet](https://www.bitcomet.com/)

<img width="575" height="553" alt="image" src="https://github.com/user-attachments/assets/85f572e5-6c2c-4be2-a6a6-a7543635203d" />

#### 关于保存路径

浏览器下载由浏览器默认保存位置决定，无法在插件内自定义。

使用外部下载器（aria2 / BitComet / abdm）时，可以在下载器配置中自定义保存路径：

- 视频: `./douyin/${user_dir}/videos`
- 图片: `./douyin/${user_dir}/images`
- 其他: `./douyin/${user_dir}/others`

`user_dir` 为 `${uid}_${nickname}`，路径支持模板变量，详见 [配置模板与变量教程](docs/template-config.md)。

#### 历史

最多保存 50 条下载历史，可在配置页查看分享链接或清空记录。

### 批量下载

在用户主页支持批量下载功能。右下角会出现【插件】悬浮按钮，点击即可展开批量下载过程。

<img width="440" height="428" alt="image" src="https://github.com/user-attachments/assets/05aa7ad2-70cb-4d25-87b2-711065a72ac2" />

- 开始下载：下载已选中的视频/图集
- 下载封面：只下载已选中作品的封面
- 并发数：开始下载按钮旁可选 1-5，仅本次任务生效，不写入全局配置
- 方块进度：黑色等待、黄色下载中、绿色成功、红色失败
- 断点续传：已下载记录自动跳过，失败项可重新补下
- 全选：点击全选当前可见视频
- 管理/查看详情：打开批量下载管理器
- 作品上的选择：点击可单选或取消作品

#### 批量下载管理器

点击【管理】按钮打开管理器。选择阶段支持按描述/完整 ID/短 ID 搜索，以及按视频/图集类型筛选；开始下载后切换为进度和日志视图，可暂停/继续/结束，关闭弹窗后后台继续。还可以重置当前作者的下载记录。

<img width="834" height="711" alt="image" src="https://github.com/user-attachments/assets/5e41ea1d-0725-4ca3-8696-5180f680c7a0" />

## LICENSE

MIT
