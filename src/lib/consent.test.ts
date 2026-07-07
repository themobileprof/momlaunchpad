import { describe, expect, it, vi } from 'vitest'
import {
  CONSENT_CHANGE_EVENT,
  getConsent,
  OPEN_CONSENT_EVENT,
  openConsentSettings,
  setConsent,
} from './consent'

describe('getConsent', () => {
  it('returns null when nothing is stored (no implied consent)', () => {
    expect(getConsent()).toBeNull()
  })

  it('reads a stored granted/denied choice', () => {
    setConsent('granted')
    expect(getConsent()).toBe('granted')
    setConsent('denied')
    expect(getConsent()).toBe('denied')
  })

  it('treats an unrecognized stored value as no choice', () => {
    localStorage.setItem('analytics_consent', 'maybe')
    expect(getConsent()).toBeNull()
  })

  it('does not throw when storage is unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError')
    })
    expect(() => getConsent()).not.toThrow()
    expect(getConsent()).toBeNull()
    spy.mockRestore()
  })
})

describe('setConsent', () => {
  it('persists the choice and emits a change event', () => {
    const handler = vi.fn()
    window.addEventListener(CONSENT_CHANGE_EVENT, handler)
    setConsent('granted')
    expect(localStorage.getItem('analytics_consent')).toBe('granted')
    expect(handler).toHaveBeenCalledOnce()
    window.removeEventListener(CONSENT_CHANGE_EVENT, handler)
  })

  it('does not throw when storage writes fail', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    expect(() => setConsent('denied')).not.toThrow()
    spy.mockRestore()
  })
})

describe('openConsentSettings', () => {
  it('dispatches the open-consent event so the banner can reappear', () => {
    const handler = vi.fn()
    window.addEventListener(OPEN_CONSENT_EVENT, handler)
    openConsentSettings()
    expect(handler).toHaveBeenCalledOnce()
    window.removeEventListener(OPEN_CONSENT_EVENT, handler)
  })
})
