/** localStorage key — mobile app should read this (or parse the join URL) on first sign-up. */
export const REFERRAL_STORAGE_KEY = 'momlaunchpad_referral_code'

export function normalizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase()
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
