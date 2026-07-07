import { useEffect, useState } from 'react'
import { initAnalytics, isAnalyticsConfigured, trackPageView } from '../lib/analytics'
import {
  getConsent,
  OPEN_CONSENT_EVENT,
  setConsent,
  type ConsentChoice,
} from '../lib/consent'

/**
 * GDPR opt-in consent banner. Shows on first visit (until a choice is made) and
 * whenever "Cookie settings" is triggered. Analytics stay off until "Accept".
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isAnalyticsConfigured) return
    if (getConsent() === null) setVisible(true)
    const open = () => setVisible(true)
    window.addEventListener(OPEN_CONSENT_EVENT, open)
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open)
  }, [])

  if (!visible) return null

  function decide(choice: ConsentChoice) {
    setConsent(choice)
    setVisible(false)
    if (choice === 'granted') {
      initAnalytics()
      trackPageView(window.location.pathname + window.location.search)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 2147483647,
        maxWidth: 640,
        margin: '0 auto',
        background: '#ffffff',
        color: '#1a1a1a',
        border: '1px solid rgba(0,0,0,0.12)',
        borderRadius: 14,
        boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
        padding: '16px 18px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      <p style={{ margin: 0, flex: '1 1 260px' }}>
        We use cookies for analytics to understand how the app is used and improve
        it. These are optional—you can accept or decline, and change your choice
        anytime via <strong>Cookie settings</strong>. Essential cookies needed to
        run the app are always on.
      </p>
      <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
        <button
          type="button"
          onClick={() => decide('denied')}
          style={{
            appearance: 'none',
            cursor: 'pointer',
            borderRadius: 999,
            border: '1px solid rgba(0,0,0,0.2)',
            background: 'transparent',
            color: '#1a1a1a',
            padding: '9px 16px',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => decide('granted')}
          style={{
            appearance: 'none',
            cursor: 'pointer',
            borderRadius: 999,
            border: 'none',
            background: '#c2185b',
            color: '#ffffff',
            padding: '9px 18px',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Accept
        </button>
      </div>
    </div>
  )
}
