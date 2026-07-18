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
  failedItems: Record<string, { count?: number; reason?: string; updatedAt?: number; desc?: string }>
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
    }
  }

  static load(profileKey: string, profile: Partial<ProfileState> = {}): ProfileState {
    try {
      const raw = localStorage.getItem(this._storage_key(profileKey))
      if (!raw) {
        return this.create_default({ ...profile, profileKey })
      }
      const parsed = JSON.parse(raw)
      return {
        ...this.create_default({ ...profile, profileKey }),
        ...parsed,
        profileKey,
        secUid: profile.secUid || parsed.secUid || "",
        profileName: profile.profileName || parsed.profileName || "",
        tabKey: profile.tabKey || parsed.tabKey || "post",
        knownIds: Array.isArray(parsed.knownIds) ? parsed.knownIds : [],
        downloadedIds: Array.isArray(parsed.downloadedIds) ? parsed.downloadedIds : [],
        failedItems: parsed.failedItems && typeof parsed.failedItems === "object" ? parsed.failedItems : {},
      }
    } catch (error) {
      console.error("[dy-dl]加载作者下载状态失败", error)
      return this.create_default({ ...profile, profileKey })
    }
  }

  static save(profileKey: string, state: ProfileState): ProfileState {
    const nextState = { ...state, updatedAt: Date.now() }
    localStorage.setItem(this._storage_key(profileKey), JSON.stringify(nextState))
    return nextState
  }

  static reset(profileKey: string) {
    localStorage.removeItem(this._storage_key(profileKey))
  }
}
