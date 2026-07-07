// Minimal GDPR-style consent for analytics cookies (opt-in).
// No analytics load or cookies are set until the visitor explicitly accepts.

export type ConsentChoice = 'granted' | 'denied'

const CONSENT_KEY = 'analytics_consent'

/** Event fired when a "Cookie settings" trigger wants to reopen the banner. */
export const OPEN_CONSENT_EVENT = 'mlp:open-consent'
/** Event fired when the stored consent choice changes. */
export const CONSENT_CHANGE_EVENT = 'mlp:consent-change'

export function getConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

export function setConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(CONSENT_KEY, choice)
  } catch {
    /* storage unavailable — treat as session-only */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: choice }))
  }
}

/** Re-open the consent banner so a visitor can change or withdraw consent. */
export function openConsentSettings(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))
  }
}
