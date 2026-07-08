import { useState, useEffect } from "preact/hooks"

// #region 事件
export class Emitter<Events extends Record<string, any[]>> {
  private events = new Map<keyof Events, Set<Function>>()

  on<K extends keyof Events>(event: K, handler: (...args: Events[K]) => void): () => void {
    let set = this.events.get(event)
    if (!set) {
      set = new Set()
      this.events.set(event, set)
    }
    set.add(handler)
    return () => this.off(event, handler)
  }

  off<K extends keyof Events>(event: K, handler: (...args: Events[K]) => void): void {
    const set = this.events.get(event)
    if (!set) return
    set.delete(handler)
    if (set.size === 0) {
      this.events.delete(event)
    }
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
    const set = this.events.get(event)
    if (!set) return
    // 防止 emit 过程中修改
    for (const fn of [...set]) {
      fn(...args)
    }
  }

  once<K extends keyof Events>(event: K, handler: (...args: Events[K]) => void): () => void {
    const wrap: (...args: Events[K]) => void = (...args: Events[K]) => {
      handler(...args)
      this.off(event, wrap)
    }
    return this.on(event, wrap)
  }

  /**
   * 清空某个事件或全部
   */
  clear(event?: keyof Events): void {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
  }

  useEvent<K extends keyof Events, T = Events[K] extends [infer First] ? First : Events[K][0]>(event: K, getter?: (...args: Events[K]) => T): T | null {
    const [state, setState] = useState<T | null>(null)
    useEffect(() => {
      const off = this.on(event, (...args: Events[K]) => {
        setState(getter ? getter(...args) : (args[0] as unknown as T))
      })
      return () => off()
    }, [])
    return state
  }
}
// #endregion
