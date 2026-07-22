import { useCallback, useEffect, useState } from 'react'
import { userApi } from '../api'
import {
  badgeLabelForKey,
  pendingRequestFor,
} from '../lib/communityBadges'
import type { CommunityBadgeType, MyCommunityBadges } from '../types'
import { AppCard } from './ui'

function BadgeChip({ label }: { label: string }) {
  return <span className="community-badge-chip">{label}</span>
}

function requestStatusLabel(status: string): string {
  switch (status) {
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    default:
      return 'Pending review'
  }
}

function planLimitCaption(data: MyCommunityBadges): string {
  if (data.is_premium) {
    return `Premium: up to ${data.badge_limit} verified badges (${data.badge_slots_used} of ${data.badge_limit} in use, including pending requests). An admin reviews each request.`
  }
  return `Free plan: up to ${data.badge_limits.free} verified badge(s) (${data.badge_slots_used} of ${data.badge_limit} in use). Premium members can hold up to ${data.badge_limits.premium}. An admin reviews each request.`
}

export function CommunityBadgeProfileSection() {
  const [data, setData] = useState<MyCommunityBadges | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [requestDialog, setRequestDialog] = useState<CommunityBadgeType | null>(null)
  const [requestNote, setRequestNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await userApi.getMyCommunityBadges()
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load badges')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function submitRequest() {
    if (!requestDialog) return
    setSubmitting(requestDialog.key)
    setMessage('')
    setError('')
    try {
      await userApi.createCommunityBadgeRequest(requestDialog.key, requestNote)
      setMessage(`${requestDialog.label} request submitted.`)
      setRequestDialog(null)
      setRequestNote('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit request')
    } finally {
      setSubmitting(null)
    }
  }

  const catalog = data?.requestable_types ?? []
  const available = catalog.filter((t) => {
    if (!data) return false
    if (data.badges.includes(t.key)) return false
    if (pendingRequestFor(data, t.key)) return false
    return true
  })

  return (
    <AppCard>
      <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>Community badges</h3>
      <p className="u-muted" style={{ fontSize: '0.85rem', margin: '0 0 16px' }}>
        {data ? planLimitCaption(data) : 'Request verification for expert badges shown on your community posts.'}
      </p>

      {loading ? (
        <p className="u-muted">Loading badges…</p>
      ) : error && !data ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <p className="u-alert u-alert--error" style={{ margin: 0, flex: 1 }}>{error}</p>
          <button type="button" className="app-btn app-btn--outline app-btn--sm" onClick={load}>
            Retry
          </button>
        </div>
      ) : data ? (
        <>
          <p className="app-label" style={{ marginBottom: 8 }}>Your badges</p>
          {data.badges.length === 0 ? (
            <p className="u-muted" style={{ fontSize: '0.85rem', margin: '0 0 16px' }}>
              No verified badges yet.
            </p>
          ) : (
            <div className="community-badge-list" style={{ marginBottom: 16 }}>
              {data.badges.map((key) => (
                <BadgeChip key={key} label={badgeLabelForKey(key, catalog)} />
              ))}
            </div>
          )}

          {available.length > 0 && (
            <>
              <p className="app-label" style={{ marginBottom: 8 }}>Request verification</p>
              {!data.can_request_more_badges && (
                <p className="u-muted" style={{ fontSize: '0.85rem', margin: '0 0 12px' }}>
                  {data.is_premium
                    ? `You are using all ${data.badge_limit} badge slots. Wait for review before applying for another.`
                    : data.badges.length > 0
                      ? 'You already have your free-plan badge. Upgrade to Premium for more verified badges.'
                      : 'You already have a badge in review. Wait for approval before applying for another.'}
                </p>
              )}
              {data.can_request_more_badges &&
                available.map((t) => (
                  <div key={t.key} className="community-badge-request-row">
                    <div>
                      <strong style={{ fontSize: '0.92rem' }}>{t.label}</strong>
                      {t.description && (
                        <p className="u-muted" style={{ fontSize: '0.82rem', margin: '4px 0 0' }}>
                          {t.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="app-btn app-btn--outline app-btn--sm"
                      disabled={submitting === t.key}
                      onClick={() => {
                        setRequestDialog(t)
                        setRequestNote('')
                      }}
                    >
                      {submitting === t.key ? '…' : 'Request'}
                    </button>
                  </div>
                ))}
            </>
          )}

          {data.requests.length > 0 && (
            <>
              <p className="app-label" style={{ margin: '16px 0 8px' }}>Request history</p>
              <ul className="community-badge-history">
                {data.requests.slice(0, 8).map((r) => (
                  <li key={r.id}>
                    <strong>{badgeLabelForKey(r.badge_type, catalog)}</strong>
                    <span className={`community-badge-status community-badge-status--${r.status}`}>
                      {requestStatusLabel(r.status)}
                    </span>
                    <span className="u-muted" style={{ fontSize: '0.8rem' }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                    {r.status === 'rejected' && r.admin_note && (
                      <p className="u-muted" style={{ fontSize: '0.82rem', margin: '4px 0 0' }}>
                        {r.admin_note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : null}

      {message && <p className="u-muted" style={{ marginTop: 12 }}>{message}</p>}
      {error && data && <p className="u-alert u-alert--error" style={{ marginTop: 12 }}>{error}</p>}

      {requestDialog && (
        <div className="community-badge-dialog-backdrop" role="presentation" onClick={() => setRequestDialog(null)}>
          <div
            className="community-badge-dialog"
            role="dialog"
            aria-labelledby="badge-request-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 id="badge-request-title" style={{ margin: '0 0 8px' }}>
              Request {requestDialog.label}
            </h4>
            {requestDialog.description && (
              <p className="u-muted" style={{ fontSize: '0.85rem', margin: '0 0 12px' }}>
                {requestDialog.description}
              </p>
            )}
            <label className="app-label">Optional note for reviewers</label>
            <textarea
              className="app-input"
              rows={3}
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder="Credentials, workplace, license number, or context"
              style={{ marginBottom: 16, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="app-btn app-btn--outline app-btn--sm" onClick={() => setRequestDialog(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="app-btn app-btn--sm"
                disabled={submitting === requestDialog.key}
                onClick={submitRequest}
              >
                {submitting === requestDialog.key ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppCard>
  )
}
