export const FARM_PROFILE_KEY = 'urvara_farm_profile'
export const FARM_PLOTS_KEY = 'urvara_farm_plots'
export const CROP_RECORDS_KEY = 'kisaan_crop_records'
export const FARM_EXPENSES_KEY = 'kisaan_expenses'
const PROFILE_KEYS = [FARM_PROFILE_KEY, 'kisaan_farm_profile', 'kisaan_profile']

export function readStoredFarmProfile() {
  try {
    for (const key of PROFILE_KEYS) {
      const raw = localStorage.getItem(key)
      if (raw === null) continue
      const profile = JSON.parse(raw)
      if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return { profile: null, valid: false }
      return { profile, valid: true }
    }
    return { profile: null, valid: true }
  } catch {
    return { profile: null, valid: false }
  }
}

export function writeStoredFarmProfile(profile) {
  try {
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return false
    const existing = localStorage.getItem(FARM_PROFILE_KEY)
    if (existing !== null) {
      const parsed = JSON.parse(existing)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false
    }
    localStorage.setItem(FARM_PROFILE_KEY, JSON.stringify(profile))
    return true
  } catch {
    return false
  }
}

export function readStoredCollection(key) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return { items: [], valid: true }
    const items = JSON.parse(raw)
    return Array.isArray(items) ? { items, valid: true } : { items: [], valid: false }
  } catch {
    return { items: [], valid: false }
  }
}

export function writeStoredCollection(key, items) {
  try {
    if (!Array.isArray(items)) return false
    const existing = localStorage.getItem(key)
    if (existing !== null && !Array.isArray(JSON.parse(existing))) return false
    localStorage.setItem(key, JSON.stringify(items))
    return true
  } catch {
    return false
  }
}

export function createRecordId(prefix = 'record') {
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}-${id}`
}
