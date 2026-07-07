/** localStorage key — mobile app should read this (or parse the join URL) on first sign-up. */
export const REFERRAL_STORAGE_KEY = 'momlaunchpad_referral_code'

/** Max length we ever persist/send; the backend column is VARCHAR(16). */
const MAX_REFERRAL_CODE_LENGTH = 16

/**
 * Uppercases, trims, and strips anything outside [A-Z0-9]. Referral codes are
 * alphanumeric by design, so this is a defensive filter: attacker-supplied
 * `?ref=` values can't smuggle markup, quotes, or control characters into
 * storage, request bodies, or generated links.
 */
export function normalizeReferralCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, MAX_REFERRAL_CODE_LENGTH)
}

/** Persist ?ref= or ?referral_code= from the URL. Returns the normalized code if saved. */
export function captureReferralFromSearchParams(params: URLSearchParams): string | null {
  const raw = params.get('ref') ?? params.get('referral_code') ?? ''
  const code = normalizeReferralCode(raw)
  if (!code) return null
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, code)
  } catch {
    // private mode / storage disabled
  }
  return code
}

export function getStoredReferralCode(): string | null {
  try {
    const value = localStorage.getItem(REFERRAL_STORAGE_KEY)
    return value ? normalizeReferralCode(value) : null
  } catch {
    return null
  }
}
