/**
 * 受限模板渲染器。
 *
 * 只支持 `${a.b.c}` 形式的变量取值，**不执行任何代码**。
 *
 * 为什么不用 `new Function`：模板字符串来自 `localStorage`
 * （`__douyin-dl-user-js__`），同源的页面脚本、XSS 或其他用户脚本都能写入它；
 * 而渲染发生在拥有 `GM_xmlhttpRequest` / `unsafeWindow` 的用户脚本沙箱内，
 * 一旦用 eval 求值，页面级代码执行就会被放大成脚本沙箱内的任意代码执行。
 *
 * 语法：
 * - 外层反引号可有可无，`${var}` 与 `` `...${var}...` `` 等价（与旧实现兼容）
 * - `${var}` / `${var.path}`：取值；null / undefined / 对象 / 函数 渲染为空串
 * - 反斜杠按普通字符处理，因此 `D:\douyin\${user_dir}` 能正常工作
 *   （旧实现走模板字面量，`\${` 会被当成转义而吞掉变量）
 * - 不支持在模板里书写字面量 `${`；表达式（`${a + b}`、`${f()}`）也不再支持，
 *   一律按未知变量处理并渲染为空串
 */

export interface TemplateContext {
  [key: string]: unknown
}

export interface RenderTemplateOptions {
  /** 变量无法渲染（不存在 / 对象 / 表达式）时回调，用于 UI 提示 */
  onMissing?: (path: string) => void
}

/** 只允许标识符与点分路径，杜绝任意表达式进入求值路径 */
const IDENTIFIER_PATH = /^[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*$/

/** 禁止沿原型链读取，避免模板变成"对象探测器" */
const FORBIDDEN_SEGMENTS = new Set(["__proto__", "prototype", "constructor"])

function stripTemplateLiteral(template: string): string {
  const trimmed = template.trim()
  if (trimmed.length >= 2 && trimmed.startsWith("`") && trimmed.endsWith("`")) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function resolvePath(context: TemplateContext, path: string): unknown {
  let current: unknown = context
  for (const segment of path.split(".")) {
    if (FORBIDDEN_SEGMENTS.has(segment)) return undefined
    if (current === null || current === undefined) return undefined
    const type = typeof current
    if (type !== "object" && type !== "function") return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

/**
 * 只接受可以安全拼进文件名的基本类型；对象/数组返回 null 表示“不可渲染”。
 * 旧实现会把对象渲染成 `[object Object]`，直接进文件名没有意义。
 */
function stringifyValue(value: unknown): string | null {
  if (value === null || value === undefined) return ""
  switch (typeof value) {
    case "string":
      return value
    case "number":
      return Number.isFinite(value) ? String(value) : ""
    case "boolean":
    case "bigint":
      return String(value)
    default:
      return null
  }
}

/**
 * 渲染模板。永不抛错，非法输入一律降级为空串。
 */
export function renderTemplate(context: TemplateContext, template: unknown, options: RenderTemplateOptions = {}): string {
  if (typeof template !== "string" || template.length === 0) return ""
  const source = stripTemplateLiteral(template)
  const onMissing = options.onMissing
  let output = ""
  let index = 0

  while (index < source.length) {
    if (source[index] === "$" && source[index + 1] === "{") {
      const end = source.indexOf("}", index + 2)
      // 没有闭合的 `}`，原样保留剩余内容
      if (end === -1) {
        output += source.slice(index)
        break
      }
      const path = source.slice(index + 2, end).trim()
      if (path && IDENTIFIER_PATH.test(path)) {
        const value = resolvePath(context, path)
        if (value === undefined) {
          // 上下文里没有这个变量
          onMissing?.(path)
        } else {
          const text = stringifyValue(value)
          if (text === null) {
            onMissing?.(path)
          } else {
            output += text
          }
        }
      } else if (path) {
        // 表达式或非法路径：不执行，按空串处理
        onMissing?.(path)
      }
      index = end + 1
      continue
    }
    output += source[index]
    index += 1
  }

  return output
}
