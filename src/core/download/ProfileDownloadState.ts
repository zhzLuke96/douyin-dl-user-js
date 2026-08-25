export interface ProfileState {
  version: number
  profileKey: string
  secUid: string
  profileName: string
  tabKey: string
  status: string
  createdAt: number
  updatedAt: number
  lastRunAt: number
  completedAt: number
  knownIds: string[]
  downloadedIds: string[]
  failedItems: Record<string, { count?: number; reason?: string; message?: string; updatedAt?: number; desc?: string }>
  coverDownloadedIds: string[]
  coverFailedItems: Record<string, { count?: number; reason?: string; message?: string; updatedAt?: number; desc?: string }>
}

const DB_NAME = "dy-dl-profile-download-state"
const DB_VERSION = 1
const STORE_NAME = "profile-download-state"
const MAX_STORED_PROFILE_STATES = 30
const PROFILE_STATE_TTL_MS = 90 * 24 * 60 * 60 * 1000

let dbPromise: Promise<IDBDatabase> | null = null

function getProfileStateDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onupgradeneeded = () => {
          const db = request.result
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "profileKey" })
          }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => {
          dbPromise = null
          reject(request.error)
        }
        request.onblocked = () => {
          dbPromise = null
          reject(new Error("IndexedDB blocked"))
        }
      } catch (error) {
        dbPromise = null
        reject(error)
      }
    })
  }
  return dbPromise
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export class ProfileDownloadState {
  static STORAGE_PREFIX = "__douyin-dl-profile-state__:"

  private static _storage_key(profileKey: string) {
    return `${this.STORAGE_PREFIX}${profileKey}`
  }

  static create_default(profile: Partial<ProfileState> = {}): ProfileState {
    return {
      version: 1,
      profileKey: profile.profileKey || "",
      secUid: profile.secUid || "",
      profileName: profile.profileName || "",
      tabKey: profile.tabKey || "post",
      status: "idle",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastRunAt: 0,
      completedAt: 0,
      knownIds: [],
      downloadedIds: [],
      failedItems: {} as ProfileState["failedItems"],
      coverDownloadedIds: [],
      coverFailedItems: {} as ProfileState["coverFailedItems"],
    }
  }

  static async load(profileKey: string, profile: Partial<ProfileState> = {}): Promise<ProfileState> {
    try {
      const db = await getProfileStateDB()
      const transaction = db.transaction(STORE_NAME, "readonly")
      const stored = await requestResult(transaction.objectStore(STORE_NAME).get(profileKey) as IDBRequest<ProfileState | undefined>)
      if (stored) {
        this._remove_legacy(profileKey)
        return this._normalize(stored, profile, profileKey)
      }
      const legacy = this._read_legacy(profileKey)
      if (legacy) {
        const state = this._normalize(legacy, profile, profileKey)
        await this.save(profileKey, state)
        return state
      }
      return this.create_default({ ...profile, profileKey })
    } catch (error) {
      console.error("[dy-dl]加载作者下载状态失败", error)
      const legacy = this._read_legacy(profileKey)
      if (legacy) return this._normalize(legacy, profile, profileKey)
      return this.create_default({ ...profile, profileKey })
    }
  }

  static async save(profileKey: string, state: ProfileState): Promise<ProfileState> {
    const nextState = { ...state, updatedAt: Date.now() }
    try {
      const db = await getProfileStateDB()
      const transaction = db.transaction(STORE_NAME, "readwrite")
      transaction.objectStore(STORE_NAME).put(nextState)
      await transactionComplete(transaction)
      this._remove_legacy(profileKey)
    } catch (error) {
      console.error("[dy-dl]保存作者下载状态到 IndexedDB 失败", error)
    }
    return nextState
  }

  static async reset(profileKey: string): Promise<void> {
    try {
      const db = await getProfileStateDB()
      const transaction = db.transaction(STORE_NAME, "readwrite")
      transaction.objectStore(STORE_NAME).delete(profileKey)
      await transactionComplete(transaction)
    } catch (error) {
      console.error("[dy-dl]删除作者下载状态失败", error)
    }
    this._remove_legacy(profileKey)
  }

  static async pruneOldStates(): Promise<void> {
    try {
      const db = await getProfileStateDB()
      const readTransaction = db.transaction(STORE_NAME, "readonly")
      const records = await requestResult(readTransaction.objectStore(STORE_NAME).getAll() as IDBRequest<ProfileState[]>)
      const cutoff = Date.now() - PROFILE_STATE_TTL_MS
      const toDelete = new Set<string>()
      for (const state of records) {
        if (!state.updatedAt || state.updatedAt < cutoff) toDelete.add(state.profileKey)
      }
      const active = records.filter((state) => state.updatedAt && state.updatedAt >= cutoff).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      for (const state of active.slice(MAX_STORED_PROFILE_STATES)) toDelete.add(state.profileKey)
      if (toDelete.size === 0) return
      const writeTransaction = db.transaction(STORE_NAME, "readwrite")
      const store = writeTransaction.objectStore(STORE_NAME)
      for (const profileKey of toDelete) store.delete(profileKey)
      await transactionComplete(writeTransaction)
      console.info(`[dy-dl]清理作者下载状态 ${toDelete.size} 条`)
    } catch (error) {
      console.error("[dy-dl]清理作者下载状态失败", error)
    }
  }

  static async migrateLegacyStorage(): Promise<void> {
    try {
      const legacyKeys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.STORAGE_PREFIX)) legacyKeys.push(key)
      }
      if (legacyKeys.length === 0) return
      const db = await getProfileStateDB()
      const readTransaction = db.transaction(STORE_NAME, "readonly")
      const storedRecords = await requestResult(readTransaction.objectStore(STORE_NAME).getAll() as IDBRequest<ProfileState[]>)
      const storedByKey = new Map(storedRecords.map((state) => [state.profileKey, state] as const))
      const statesToPut: ProfileState[] = []
      // 中断时可能出现 IDB 已写入但 localStorage 未删完，用 updatedAt 避免旧数据覆盖新状态
      for (const key of legacyKeys) {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        let parsed: any
        try {
          parsed = JSON.parse(raw)
        } catch {
          continue
        }
        const profileKey = key.slice(this.STORAGE_PREFIX.length)
        const state = this._normalize(parsed, {}, profileKey)
        if (!parsed?.updatedAt) state.updatedAt = 0
        const stored = storedByKey.get(profileKey)
        if (!stored || (stored.updatedAt || 0) < (state.updatedAt || 0)) statesToPut.push(state)
      }
      if (statesToPut.length > 0) {
        const writeTransaction = db.transaction(STORE_NAME, "readwrite")
        const store = writeTransaction.objectStore(STORE_NAME)
        for (const state of statesToPut) store.put(state)
        await transactionComplete(writeTransaction)
      }
      for (const key of legacyKeys) localStorage.removeItem(key)
    } catch (error) {
      console.error("[dy-dl]迁移旧作者下载状态失败", error)
    }
  }

  private static _normalize(parsed: any, profile: Partial<ProfileState>, profileKey: string): ProfileState {
    const source = parsed && typeof parsed === "object" ? parsed : {}
    return {
      ...this.create_default({ ...profile, profileKey }),
      ...source,
      profileKey,
      secUid: profile.secUid || source.secUid || "",
      profileName: profile.profileName || source.profileName || "",
      tabKey: profile.tabKey || source.tabKey || "post",
      knownIds: Array.isArray(source.knownIds) ? source.knownIds : [],
      downloadedIds: Array.isArray(source.downloadedIds) ? source.downloadedIds : [],
      failedItems: source.failedItems && typeof source.failedItems === "object" ? source.failedItems : {},
      coverDownloadedIds: Array.isArray(source.coverDownloadedIds) ? source.coverDownloadedIds : [],
      coverFailedItems: source.coverFailedItems && typeof source.coverFailedItems === "object" ? source.coverFailedItems : {},
    }
  }

  private static _read_legacy(profileKey: string): any | null {
    try {
      const raw = localStorage.getItem(this._storage_key(profileKey))
      if (!raw) return null
      return JSON.parse(raw)
    } catch (error) {
      console.error("[dy-dl]读取旧作者下载状态失败", error)
      return null
    }
  }

  private static _remove_legacy(profileKey: string) {
    try {
      localStorage.removeItem(this._storage_key(profileKey))
    } catch {}
  }
}
