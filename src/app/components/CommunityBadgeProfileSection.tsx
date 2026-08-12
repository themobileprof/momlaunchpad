import { useCallback, useEffect, useState } from 'react'
import { userApi } from '../api'
import {
  badgeLabelForKey,
  credentialRequiredForBadge,
  emptyBadgeRequestDetails,
  formatBadgeRequestDetails,
  pendingRequestFor,
  validateBadgeRequestDetails,
} from '../lib/communityBadges'
import type { BadgeRequestDetails, CommunityBadgeType, MyCommunityBadges } from '../types'
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
  const [requestDetails, setRequestDetails] = useState<BadgeRequestDetails>(emptyBadgeRequestDetails())
  const [requestNote, setRequestNote] = useState('')
  const [formError, setFormError] = useState('')

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

  function openRequestDialog(badgeType: CommunityBadgeType) {
    setRequestDialog(badgeType)
    setRequestDetails(emptyBadgeRequestDetails())
    setRequestNote('')
    setFormError('')
  }

  async function submitRequest() {
    if (!requestDialog) return
    const validationError = validateBadgeRequestDetails(requestDialog.key, requestDetails)
    if (validationError) {
      setFormError(validationError)
      return
    }
    setSubmitting(requestDialog.key)
    setMessage('')
    setError('')
    setFormError('')
    try {
      await userApi.createCommunityBadgeRequest(requestDialog.key, requestDetails, requestNote)
      setMessage(`${requestDialog.label} request submitted.`)
      setRequestDialog(null)
      setRequestDetails(emptyBadgeRequestDetails())
      setRequestNote('')
      await load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not submit request')
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

  const credentialRequired = requestDialog
    ? credentialRequiredForBadge(requestDialog.key)
    : false

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
                      onClick={() => openRequestDialog(t)}
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
                    {formatBadgeRequestDetails(r.details).map((line) => (
                      <p key={line} className="u-muted" style={{ fontSize: '0.82rem', margin: '4px 0 0', width: '100%' }}>
                        {line}
                      </p>
                    ))}
                    {r.message?.trim() && (
                      <p className="u-muted" style={{ fontSize: '0.82rem', margin: '4px 0 0', width: '100%' }}>
                        Note: {r.message.trim()}
                      </p>
                    )}
                    {r.status === 'rejected' && r.admin_note && (
                      <p className="u-muted" style={{ fontSize: '0.82rem', margin: '4px 0 0', width: '100%' }}>
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
            <label className="app-label">Workplace or facility</label>
            <input
              className="app-input"
              value={requestDetails.workplace}
              onChange={(e) => setRequestDetails({ ...requestDetails, workplace: e.target.value })}
              placeholder="Hospital, clinic, or program name"
              style={{ marginBottom: 12 }}
            />
            <label className="app-label">Role or job title</label>
            <input
              className="app-input"
              value={requestDetails.role_title}
              onChange={(e) => setRequestDetails({ ...requestDetails, role_title: e.target.value })}
              placeholder="e.g. Staff midwife, Clinic manager"
              style={{ marginBottom: 12 }}
            />
            <label className="app-label">
              {credentialRequired ? 'License or registration number' : 'Employee or program ID (optional)'}
            </label>
            <input
              className="app-input"
              value={requestDetails.credential_id ?? ''}
              onChange={(e) => setRequestDetails({ ...requestDetails, credential_id: e.target.value })}
              placeholder={credentialRequired ? 'Professional license or registration' : 'Optional identifier'}
              style={{ marginBottom: 12 }}
            />
            <label className="app-label">Verification link (optional)</label>
            <input
              className="app-input"
              type="url"
              value={requestDetails.verification_url ?? ''}
              onChange={(e) => setRequestDetails({ ...requestDetails, verification_url: e.target.value })}
              placeholder="Hospital page, registry profile, or LinkedIn"
              style={{ marginBottom: 12 }}
            />
            <label className="app-label">Additional note (optional)</label>
            <textarea
              className="app-input"
              rows={3}
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder="Anything else reviewers should know"
              style={{ marginBottom: 12, resize: 'vertical' }}
            />
            {formError && <p className="u-alert u-alert--error" style={{ marginBottom: 12 }}>{formError}</p>}
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
