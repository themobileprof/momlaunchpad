import type { BabyGender, UserProfile } from '../types'

const STORAGE_PREFIX = 'user_baby_gender_'

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`
}

function isBabyGender(value: string): value is BabyGender {
  return value === 'girl' || value === 'boy' || value === 'unknown'
}

/** Read cached baby gender for this user (web fallback when API omits the field). */
export function loadStoredBabyGender(userId: string): BabyGender | null {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (raw && isBabyGender(raw)) return raw
  } catch {
    /* private browsing / blocked storage */
  }
  return null
}

export function saveStoredBabyGender(userId: string, gender: BabyGender | null | undefined) {
  try {
    const key = storageKey(userId)
    if (gender) localStorage.setItem(key, gender)
    else localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Prefer API value; fall back to local cache so theme survives refresh. */
export function mergeProfileBabyGender(userId: string, profile: UserProfile): UserProfile {
  if (profile.baby_gender) {
    saveStoredBabyGender(userId, profile.baby_gender)
    return profile
  }
  const stored = loadStoredBabyGender(userId)
  if (stored) return { ...profile, baby_gender: stored }
  return profile
}
