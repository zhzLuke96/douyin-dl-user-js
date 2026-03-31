# douyin-dl-user-js

抖音 web 端下载拓展

- [greasyfork](https://greasyfork.org/zh-CN/scripts/522326-%E6%8A%96%E9%9F%B3%E4%B8%8B%E8%BD%BD)
- [github](https://github.com/zhzLuke96/douyin-dl-user-js)

## Change log

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

## Features

- [x] 无水印视频下载
- [x] 下载快捷键 [M]
- [x] 图集下载 (暂时没支持打包下载，所以会直接下载多个图片)
- [x] 评论区图片下载
- [x] 表情包下载
- [x] 封面下载
- [x] 视频截图
- [x] 媒体详情: 查看视频分辨率、查看视频音乐、查看图集数据、查看 JSON 数据
- [x] 支持弹幕下载
- [x] 下载历史
- [x] 自定义文件名
- [ ] 自定义保存文件夹
- [ ] ~~批量下载打包为 zip~~ (不支持)

## Usage

安装后，会在对应位置添加下载按钮。

### 视频下载按钮

> 视频播放器控制条中【插件>下载】按钮
> 快捷键： 按下 M 键将下载当前视频/图片

![image](https://github.com/user-attachments/assets/59af5d64-1669-4327-ace9-fec128a2d37b)

### 图片下载按钮

> (点开图片之后右下角【下载图片】)

![image](https://github.com/zhzLuke96/douyin-dl-user-js/raw/main/docs/image_btn.jpg)

### 表情包下载按钮

> 表情包右键菜单中

![sticker](https://github.com/zhzLuke96/douyin-dl-user-js/raw/main/docs/sticker_btn.jpg)

### 媒体详情

点击【插件>媒体详情】可以查看视频分辨率、图集列表、音乐、JSON

<img width="782" height="620" alt="image" src="https://github.com/user-attachments/assets/23c2a44f-ce35-472b-80df-1fa36cf60668" />

### 配置和历史

<img width="624" height="688" alt="image" src="https://github.com/user-attachments/assets/8dc1bbf7-a545-4d35-a9ff-c6a0f6be9aaa" />

#### 视频下载

支持设置分辨率偏好和编码偏好

- 分辨率偏好：最大、最小、或者 2k 1080p 960p 等等
- 编码偏好：可以选择 只下载 h265、只下载 h264、优先 h265、优先 h264

注意：这些偏好都有回退，即不满足的时候会退回默认下载地址

#### 图片处理

由 @Arrtourz 提出方法，之前只支持 webp 转 png，现在支持三种格式转换。

- 可以自由配置转为 png/jpg/webp 三种格式
- 并且可以设置图片尺寸压缩和质量压缩设置

#### 历史

简单存储下载历史，方便检查，会存下作品名和作品地址。

## LICENSE

MIT
