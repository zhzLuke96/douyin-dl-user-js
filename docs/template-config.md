# 配置模板与变量

文件名模板和外部下载器的“视频目录 / 图片目录 / 其他目录”都支持模板字符串。配置弹窗里会实时预览解析结果。

## 基本语法

模板是**受限的变量插值**，不是 JavaScript 表达式。变量写在 `${}` 里：

```text
`${nickname}_${short_id}_${desc}`
```

反引号可省略，下面两种写法等价：

```text
${nickname}_${short_id}
`${nickname}_${short_id}`
```

外部下载器目录的写法相同：

```text
`./douyin/${user_dir}/videos`
D:\douyin\${user_dir}\videos
```

规则：

- 只支持 `${变量}` 与 `${变量.属性.属性}` 两种形态，例如 `${media.video.width}`
- 不支持任何运算、函数调用或三元表达式：`${a + b}`、`${x()}`、`${x ? y : z}` 一律渲染为空串
- `null`、`undefined`、对象、数组渲染为空串（旧版本会渲染成 `[object Object]`）
- 反斜杠按普通字符处理，Windows 路径可直接写
- 无法解析的变量不会报错，配置弹窗预览里会显示为空

## 文件名模板变量

| 变量 | 说明 |
| --- | --- |
| `${nickname}` | 作者昵称 |
| `${short_id}` | 作品短 ID |
| `${aweme_id}` | 完整作品 ID |
| `${uid}` | 作者 uid |
| `${tags}` | 话题标签，多个标签用 `_` 连接，标签带 `#` |
| `${desc}` | 作品描述，已移除话题标签并清理文件名字符 |
| `${music_name}` | 音乐名，没有音乐时为空 |
| `${create_date_YYYYMMDD}` | 发布时间，格式 `20260803` |
| `${create_date_YYYYMMDD_HHmmss}` | 发布时间，格式 `20260803_142530` |
| `${now_YYYYMMDD}` | 下载时间，格式 `20260803` |
| `${now_YYYYMMDD_HHmmss}` | 下载时间，格式 `20260803_142530` |
| `${media}` | 完整媒体对象，高级用法 |
| `${author_info}` | 作者信息对象，高级用法 |

常用示例：

```text
`${nickname}_${short_id}_${create_date_YYYYMMDD}`
```

```text
`${nickname}_${tags}_${desc}`
```

## 外部下载器路径变量

适用于 aria2 / bitcomet / abdm 的目录配置，也使用模板字符串语法：

| 变量 | 说明 |
| --- | --- |
| `${user_dir}` | 安全作者目录，格式 `${uid}_${nickname}`，已清理非法字符 |
| `${nickname}` | 作者昵称 |
| `${uid}` | 作者 uid |
| `${aweme_id}` | 完整作品 ID |
| `${desc}` | 作品描述，未清理路径非法字符 |
| `${filename}` | 完整文件名，包含扩展名 |
| `${filename_base}` | 文件名基础名，不含扩展名 |
| `${media}` | 完整媒体对象，高级用法 |
| `${author_info}` | 作者信息对象，高级用法 |

常用示例：

```text
`D:/抖音/${user_dir}/videos`
```

```text
`/downloads/${nickname}/${aweme_id}`
```

## 注意事项

- 路径建议使用 `/` 分隔；`user_dir` 已经做过安全处理，推荐用它隔离不同作者。
- `${desc}` 在路径模板中不会清理非法字符，直接用于路径可能失败。
- 模板解析失败时会回退到默认目录或默认文件名。
- 配置弹窗内有预览，保存前可确认解析结果。