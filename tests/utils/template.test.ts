import { describe, expect, it, vi } from "vitest"
import { renderTemplate } from "../../src/utils/template"

const ctx = {
  nickname: "阿星",
  short_id: "abc123",
  tags: "#旅行_#vlog",
  desc: "海边的日落",
  media: { video: { width: 1080 }, images: [] },
  zero: 0,
  flag: false,
  empty: "",
  nothing: null,
  unknown_value: undefined,
}

describe("renderTemplate 基本插值", () => {
  it("渲染反引号包裹的模板", () => {
    expect(renderTemplate(ctx, "`${nickname}_${short_id}`")).toBe("阿星_abc123")
  })

  it("反引号可以省略", () => {
    expect(renderTemplate(ctx, "${nickname}_${short_id}")).toBe("阿星_abc123")
  })

  it("保留模板里的普通文本与中文", () => {
    expect(renderTemplate(ctx, "`${nickname}-${desc}`")).toBe("阿星-海边的日落")
  })

  it("支持点分路径", () => {
    expect(renderTemplate(ctx, "${media.video.width}")).toBe("1080")
  })

  it("数字 0 与布尔 false 正常渲染", () => {
    expect(renderTemplate(ctx, "${zero}${flag}")).toBe("0false")
  })

  it("路径中间缺失时渲染为空串而不是抛错", () => {
    expect(renderTemplate(ctx, "a${media.video.height}b")).toBe("ab")
    expect(renderTemplate(ctx, "${media.author.name}")).toBe("")
  })
})

describe("renderTemplate 安全边界", () => {
  it("未知变量渲染为空串", () => {
    expect(renderTemplate(ctx, "a${nope}b")).toBe("ab")
  })

  it("null / undefined 渲染为空串", () => {
    expect(renderTemplate(ctx, "${nothing}${unknown_value}")).toBe("")
  })

  it("对象与数组不再渲染成 [object Object]", () => {
    expect(renderTemplate(ctx, "${media}")).toBe("")
    expect(renderTemplate(ctx, "${media.images}")).toBe("")
  })

  it("把表达式当未知变量处理，不执行", () => {
    expect(renderTemplate(ctx, "${1+1}")).toBe("")
    expect(renderTemplate(ctx, "${nickname.toUpperCase()}")).toBe("")
    expect(renderTemplate(ctx, "${nickname.length}")).toBe("")
  })

  it("不会执行模板里注入的代码", () => {
    const spy = vi.fn()
    ;(globalThis as any).__dy_dl_pwned = spy
    // 旧实现会把这段当函数调用执行；新实现只按路径取值，必然得到空串
    expect(renderTemplate(ctx, "`${__dy_dl_pwned()}`")).toBe("")
    expect(renderTemplate(ctx, "`${globalThis.__dy_dl_pwned()}`")).toBe("")
    expect(spy).not.toHaveBeenCalled()
    delete (globalThis as any).__dy_dl_pwned
  })

  it("不能沿原型链读取", () => {
    expect(renderTemplate(ctx, "${media.__proto__}")).toBe("")
    expect(renderTemplate(ctx, "${media.constructor}")).toBe("")
    expect(renderTemplate(ctx, "${constructor.prototype}")).toBe("")
  })

  it("未闭合的 ${ 原样保留，不吞掉后面的内容", () => {
    expect(renderTemplate(ctx, "a${b")).toBe("a${b")
  })

  it("空模板与非字符串输入返回空串", () => {
    expect(renderTemplate(ctx, "")).toBe("")
    expect(renderTemplate(ctx, "   ")).toBe("")
    expect(renderTemplate(ctx, null)).toBe("")
    expect(renderTemplate(ctx, undefined)).toBe("")
    expect(renderTemplate(ctx, 42)).toBe("")
  })
})

describe("renderTemplate 路径与回调", () => {
  it("反斜杠按普通字符处理，Windows 路径模板可用", () => {
    expect(renderTemplate({ user_dir: "1_阿星" }, "`D:\\douyin\\${user_dir}\\videos`")).toBe("D:\\douyin\\1_阿星\\videos")
  })

  it("onMissing 会报告无法渲染的路径", () => {
    const seen: string[] = []
    renderTemplate(ctx, "${nope}${media}${1+1}", { onMissing: (path) => seen.push(path) })
    expect(seen).toEqual(["nope", "media", "1+1"])
  })

  it("变量存在时不触发 onMissing", () => {
    const seen: string[] = []
    renderTemplate(ctx, "${nickname}", { onMissing: (path) => seen.push(path) })
    expect(seen).toEqual([])
  })
})
