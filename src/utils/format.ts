/**
 * 在context下执行代码
 */
export function runInContext(context: Record<string, any>, code: string): any {
  const keys = Object.keys(context)
  const head = `const {${keys.join(", ")}} = __CTX__; `
  const body = code.trim()
  const fn = new Function("__CTX__", `${head}\nreturn (${body})`)
  return fn(context)
}

/**
 * 日期格式化函数
 */
export function formatDate(date: Date, format = "YYYY-MM-DD HH:mm:ss"): string {
  const o: Record<string, string> = {
    YYYY: date.getFullYear().toString(),
    MM: ("0" + (date.getMonth() + 1)).slice(-2),
    DD: ("0" + date.getDate()).slice(-2),
    HH: ("0" + date.getHours()).slice(-2),
    mm: ("0" + date.getMinutes()).slice(-2),
    ss: ("0" + date.getSeconds()).slice(-2),
  }
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (m) => o[m])
}
