import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { AppCard, GradientButton, MomAppBar } from '../components/ui'
import { useUserProfile } from '../context/UserProfileContext'
import type { FacilityAdminClaim, FacilityMember } from '../types'
import { appPath } from '../routes'

function claimStatusLabel(status: string): string {
  switch (status) {
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    case 'revoked':
      return 'Revoked'
    default:
      return 'Pending review'
  }
}

export function FacilityAdminPage() {
  const { profile } = useUserProfile()
  const [claims, setClaims] = useState<FacilityAdminClaim[]>([])
  const [approved, setApproved] = useState<FacilityAdminClaim[]>([])
  const [selectedFacilityId, setSelectedFacilityId] = useState('')
  const [members, setMembers] = useState<FacilityMember[]>([])
  const [memberTotal, setMemberTotal] = useState(0)
  const [roleTitle, setRoleTitle] = useState('')
  const [proofNote, setProofNote] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [announceTitle, setAnnounceTitle] = useState('')
  const [announceBody, setAnnounceBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await userApi.getMyFacilityAdmin()
      setClaims(res.claims ?? [])
      setApproved(res.approved ?? [])
      setSelectedFacilityId((current) => {
        if (current) return current
        return res.approved?.[0]?.healthcare_facility_id ?? ''
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load facility admin status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!selectedFacilityId) {
      setMembers([])
      setMemberTotal(0)
      return
    }
    let cancelled = false
    userApi
      .listFacilityMembers(selectedFacilityId)
      .then((res) => {
        if (cancelled) return
        setMembers(res.members ?? [])
        setMemberTotal(res.total ?? 0)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load members')
      })
    return () => {
      cancelled = true
    }
  }, [selectedFacilityId])

  async function submitClaim() {
    if (!profile?.healthcare_facility_id) {
      setError('Complete community setup and select your health center first.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await userApi.createFacilityAdminClaim({
        healthcare_facility_id: profile.healthcare_facility_id,
        role_title: roleTitle.trim() || undefined,
        proof_note: proofNote.trim() || undefined,
        proof_url: proofUrl.trim() || undefined,
      })
      setMessage('Claim submitted for review.')
      setRoleTitle('')
      setProofNote('')
      setProofUrl('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit claim')
    } finally {
      setBusy(false)
    }
  }

  async function sendAnnouncement() {
    if (!selectedFacilityId) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await userApi.createFacilityAnnouncement(
        selectedFacilityId,
        announceTitle.trim(),
        announceBody.trim(),
      )
      setMessage(`Announcement sent to ${res.announcement.recipient_count} member(s).`)
      setAnnounceTitle('')
      setAnnounceBody('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send announcement')
    } finally {
      setBusy(false)
    }
  }

  const selected = approved.find((c) => c.healthcare_facility_id === selectedFacilityId)
  const hasPendingForFacility =
    !!profile?.healthcare_facility_id &&
    claims.some(
      (c) =>
        c.healthcare_facility_id === profile.healthcare_facility_id && c.status === 'pending',
    )
  const alreadyApprovedForFacility =
    !!profile?.healthcare_facility_id &&
    approved.some((c) => c.healthcare_facility_id === profile.healthcare_facility_id)

  return (
    <>
      <MomAppBar pageTitle="Health center" />
      <div className="user-app-content">
        <div style={{ padding: 16 }}>
          <p className="u-muted" style={{ marginTop: 0 }}>
            Reach people who registered your health center in MomLaunchpad — encourage app use
            with in-app announcements. Phone numbers (when shared) help with WhatsApp later.
          </p>

          {error && <div className="u-alert u-alert--error">{error}</div>}
          {message && <div className="u-alert u-alert--success">{message}</div>}

          {loading ? (
            <p className="u-muted">Loading…</p>
          ) : (
            <>
              <p className="u-caption">Claim your center</p>
              <div style={{ marginBottom: 16 }}>
                <AppCard>
                  {profile?.healthcare_facility_name ? (
                    <p style={{ marginTop: 0 }}>
                      Your community center:{' '}
                      <strong>{profile.healthcare_facility_name}</strong>
                      {profile.city ? ` · ${profile.city}` : ''}
                    </p>
                  ) : (
                    <p style={{ marginTop: 0 }}>
                      Set your health center in{' '}
                      <Link to={appPath('community/onboarding?edit=1')}>community location</Link>{' '}
                      before claiming admin access.
                    </p>
                  )}

                  {alreadyApprovedForFacility ? (
                    <p className="u-muted">You are an approved admin for this center.</p>
                  ) : hasPendingForFacility ? (
                    <p className="u-muted">Your claim is pending MomLaunchpad review.</p>
                  ) : profile?.healthcare_facility_id ? (
                    <>
                      <label className="app-label">Your role at the center</label>
                      <input
                        className="app-input"
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.target.value)}
                        placeholder="e.g. Matron, Community midwife, Admin"
                        style={{ marginBottom: 12 }}
                      />
                      <label className="app-label">How we can verify you</label>
                      <textarea
                        className="app-input"
                        value={proofNote}
                        onChange={(e) => setProofNote(e.target.value)}
                        rows={3}
                        placeholder="Work email, staff ID, or how patients know you"
                        style={{ marginBottom: 12 }}
                      />
                      <label className="app-label">Optional verification link</label>
                      <input
                        className="app-input"
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                        placeholder="https://"
                        style={{ marginBottom: 12 }}
                      />
                      <GradientButton disabled={busy} onClick={submitClaim}>
                        {busy ? 'Submitting…' : 'Request health center admin'}
                      </GradientButton>
                    </>
                  ) : null}
                </AppCard>
              </div>

              {claims.length > 0 && (
                <>
                  <p className="u-caption">Your claims</p>
                  <div style={{ marginBottom: 16 }}>
                    <AppCard>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {claims.map((c) => (
                          <li key={c.id} style={{ marginBottom: 8 }}>
                            <strong>{c.facility_name || 'Health center'}</strong>
                            {' — '}
                            {claimStatusLabel(c.status)}
                            {c.admin_note ? (
                              <span className="u-muted"> · {c.admin_note}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </AppCard>
                  </div>
                </>
              )}

              {approved.length > 0 && (
                <>
                  <p className="u-caption">Your centers</p>
                  <div style={{ marginBottom: 16 }}>
                    <AppCard>
                      {approved.length > 1 && (
                        <select
                          className="app-input"
                          value={selectedFacilityId}
                          onChange={(e) => setSelectedFacilityId(e.target.value)}
                          style={{ marginBottom: 12 }}
                        >
                          {approved.map((c) => (
                            <option key={c.id} value={c.healthcare_facility_id}>
                              {c.facility_name}
                            </option>
                          ))}
                        </select>
                      )}
                      {selected && (
                        <p style={{ marginTop: 0 }}>
                          <strong>{selected.facility_name}</strong>
                          {selected.facility_city
                            ? ` · ${selected.facility_city}`
                            : ''}
                          {' · '}
                          {memberTotal} member{memberTotal === 1 ? '' : 's'} on MomLaunchpad
                        </p>
                      )}

                      <label className="app-label">Announcement title</label>
                      <input
                        className="app-input"
                        value={announceTitle}
                        onChange={(e) => setAnnounceTitle(e.target.value)}
                        maxLength={200}
                        placeholder="e.g. Antenatal class this Thursday"
                        style={{ marginBottom: 12 }}
                      />
                      <label className="app-label">Message</label>
                      <textarea
                        className="app-input"
                        value={announceBody}
                        onChange={(e) => setAnnounceBody(e.target.value)}
                        rows={4}
                        maxLength={2000}
                        placeholder="Keep it short — members see this in their inbox."
                        style={{ marginBottom: 12 }}
                      />
                      <p className="u-caption" style={{ marginBottom: 12 }}>
                        Limit: 3 announcements per center per week. Only members who opted in
                        receive messages.
                      </p>
                      <GradientButton
                        disabled={busy || !announceTitle.trim() || !announceBody.trim()}
                        onClick={sendAnnouncement}
                      >
                        {busy ? 'Sending…' : 'Send in-app announcement'}
                      </GradientButton>
                    </AppCard>
                  </div>

                  <p className="u-caption">Members ({memberTotal})</p>
                  <div style={{ marginBottom: 16 }}>
                    <AppCard>
                      {members.length === 0 ? (
                        <p className="u-muted" style={{ margin: 0 }}>
                          No one has registered this center yet. Ask patients to pick it during
                          community setup.
                        </p>
                      ) : (
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                          {members.map((m) => (
                            <li
                              key={m.user_id}
                              style={{
                                padding: '10px 0',
                                borderBottom: '1px solid var(--border-subtle, #eee)',
                              }}
                            >
                              <strong>{m.display_name}</strong>
                              {m.city ? (
                                <span className="u-muted"> · {m.city}</span>
                              ) : null}
                              {m.phone_number ? (
                                <div style={{ fontSize: '0.9rem', marginTop: 4 }}>
                                  <a href={`https://wa.me/${m.phone_number.replace(/\D/g, '')}`}>
                                    WhatsApp {m.phone_number}
                                  </a>
                                </div>
                              ) : (
                                <div className="u-muted" style={{ fontSize: '0.85rem' }}>
                                  No phone on file
                                </div>
                              )}
                              {!m.facility_announcements_opt_in && (
                                <div className="u-muted" style={{ fontSize: '0.8rem' }}>
                                  Opted out of announcements
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </AppCard>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  )
}
