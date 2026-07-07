import { describe, expect, it, vi } from 'vitest'
import {
  REFERRAL_STORAGE_KEY,
  captureReferralFromSearchParams,
  getStoredReferralCode,
  normalizeReferralCode,
} from './referral'

describe('normalizeReferralCode', () => {
  it('trims and uppercases valid codes', () => {
    expect(normalizeReferralCode('  ab12cd  ')).toBe('AB12CD')
  })

  it('strips characters outside [A-Z0-9] (defense against injected markup)', () => {
    expect(normalizeReferralCode('<b>alert</b>')).toBe('BALERTB')
    expect(normalizeReferralCode('ABC"><img>')).toBe('ABCIMG')
    expect(normalizeReferralCode('AB-12_CD.EF')).toBe('AB12CDEF')
    expect(normalizeReferralCode('a b\tc\nd')).toBe('ABCD')
  })

  it('never returns quotes, angle brackets, or whitespace', () => {
    const dirty = `"'<>&/\\ \t\n${'X'.repeat(3)}`
    const clean = normalizeReferralCode(dirty)
    expect(clean).toMatch(/^[A-Z0-9]*$/)
  })

  it('caps length at the backend column size (16)', () => {
    expect(normalizeReferralCode('A'.repeat(50))).toHaveLength(16)
  })

  it('returns empty string for input with no safe characters', () => {
    expect(normalizeReferralCode('!!!___###')).toBe('')
  })
})

describe('captureReferralFromSearchParams', () => {
  it('reads the ?ref= param and persists the normalized code', () => {
    const code = captureReferralFromSearchParams(new URLSearchParams('?ref=abc123'))
    expect(code).toBe('ABC123')
    expect(localStorage.getItem(REFERRAL_STORAGE_KEY)).toBe('ABC123')
  })

  it('supports the ?referral_code= alias', () => {
    const code = captureReferralFromSearchParams(new URLSearchParams('?referral_code=xyz789'))
    expect(code).toBe('XYZ789')
  })

  it('prefers ?ref= over ?referral_code= when both are present', () => {
    const code = captureReferralFromSearchParams(
      new URLSearchParams('?ref=first&referral_code=second'),
    )
    expect(code).toBe('FIRST')
  })

  it('returns null and stores nothing when no code is present', () => {
    expect(captureReferralFromSearchParams(new URLSearchParams(''))).toBeNull()
    expect(localStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull()
  })

  it('sanitizes a hostile ?ref= value before storing it', () => {
    const code = captureReferralFromSearchParams(
      new URLSearchParams(`?ref=${encodeURIComponent('"><script>evil()</script>')}`),
    )
    expect(code).toMatch(/^[A-Z0-9]*$/)
    expect(localStorage.getItem(REFERRAL_STORAGE_KEY)).toMatch(/^[A-Z0-9]*$/)
  })

  it('does not throw when localStorage is unavailable (private mode)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    expect(() => captureReferralFromSearchParams(new URLSearchParams('?ref=abc'))).not.toThrow()
    spy.mockRestore()
  })
})

describe('getStoredReferralCode', () => {
  it('returns null when nothing is stored', () => {
    expect(getStoredReferralCode()).toBeNull()
  })

  it('re-normalizes whatever is in storage', () => {
    localStorage.setItem(REFERRAL_STORAGE_KEY, 'weird value!')
    expect(getStoredReferralCode()).toBe('WEIRDVALUE')
  })

  it('does not throw when localStorage getItem fails', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError')
    })
    expect(() => getStoredReferralCode()).not.toThrow()
    expect(getStoredReferralCode()).toBeNull()
    spy.mockRestore()
  })
})
