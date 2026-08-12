import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { MomAppBar } from '../components/ui'
import type { AppNotification } from '../types'
import { appPath } from '../routes'

function rewardIcon(n: AppNotification): string {
  if (n.type === 'referral_reward') return '🎁'
  if (n.type === 'facility_announcement') return '🏥'
  switch (n.payload?.reward_kind) {
    case 'topup_code':
      return '📱'
    case 'store_discount':
      return '🏷️'
    default:
      return n.type === 'reward' ? '🎁' : '🔔'
  }
}

function RewardDetails({ n }: { n: AppNotification }) {
  const { code, value, provider, expires_at: expiresAt } = n.payload || {}
  const [copied, setCopied] = useState(false)

  if (!code && !value && !provider && !expiresAt) return null

  async function copyCode() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="inbox-reward" onClick={(e) => e.stopPropagation()} role="presentation">
      {(value || provider) && (
        <p className="inbox-reward-meta">
          {[value, provider].filter(Boolean).join(' · ')}
        </p>
      )}
      {code && (
        <div className="inbox-reward-code">
          <code>{code}</code>
          <button type="button" className="app-btn app-btn--outline app-btn--sm" onClick={copyCode}>
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
      )}
      {expiresAt && (
        <p className="u-caption" style={{ marginTop: 6 }}>
          Expires {new Date(expiresAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

export function InboxPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userApi
      .getInboxNotifications()
      .then((r) => setItems(r.notifications ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function markRead(n: AppNotification) {
    if (n.read_at) return
    await userApi.markInboxRead(n.id)
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)),
    )
  }

  async function markAllRead() {
    await userApi.markAllInboxRead()
    const now = new Date().toISOString()
    setItems((prev) => prev.map((x) => ({ ...x, read_at: x.read_at ?? now })))
  }

  const hasUnread = items.some((n) => !n.read_at)

  return (
    <div className="user-app-content--no-nav">
      <MomAppBar
        pageTitle="Rewards & updates"
        onBack={() => navigate(appPath())}
        actions={
          hasUnread ? (
            <button
              type="button"
              className="app-btn app-btn--ghost app-btn--sm"
              onClick={markAllRead}
            >
              Mark all read
            </button>
          ) : undefined
        }
      />
      <div style={{ padding: 16 }}>
        {loading ? (
          <div className="u-center-page">
            <div className="u-spinner" />
          </div>
        ) : items.length === 0 ? (
          <p className="u-muted" style={{ textAlign: 'center', padding: 48 }}>
            No rewards or updates yet. When you earn a reward, it&apos;ll show up here.
          </p>
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              type="button"
              className="app-card app-card--tap app-card--outlined inbox-item"
              style={{
                width: '100%',
                textAlign: 'left',
                marginBottom: 8,
                border: 'none',
                opacity: n.read_at ? 0.75 : 1,
                background: n.read_at ? 'var(--surface)' : 'var(--mint-soft)',
              }}
              onClick={() => markRead(n)}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }} aria-hidden>
                  {rewardIcon(n)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{n.title}</strong>
                  <p className="u-muted" style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>
                    {n.body}
                  </p>
                  <RewardDetails n={n} />
                  <span className="u-caption">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                {!n.read_at && <span className="inbox-unread-dot" aria-label="Unread" />}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
