import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { GradientButton, MomAppBar } from '../components/ui'
import { useUserProfile } from '../context/UserProfileContext'
import type {
  FacilityAdminClaim,
  FacilityAdminPeer,
  FacilityAnnouncement,
  FacilityMember,
} from '../types'
import { JOURNEY_STAGES } from '../types'
import { appPath } from '../routes'

type DashTab = 'overview' | 'members' | 'broadcast' | 'team'

function claimStatusLabel(status: string): string {
  switch (status) {
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Not approved'
    case 'revoked':
      return 'Access revoked'
    default:
      return 'Pending review'
  }
}

function journeyLabel(stage?: string): string {
  if (!stage) return ''
  return JOURNEY_STAGES.find((s) => s.value === stage)?.label ?? stage
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function FacilityAdminPage() {
  const navigate = useNavigate()
  const { profile } = useUserProfile()
  const [claims, setClaims] = useState<FacilityAdminClaim[]>([])
  const [approved, setApproved] = useState<FacilityAdminClaim[]>([])
  const [selectedFacilityId, setSelectedFacilityId] = useState('')
  const [members, setMembers] = useState<FacilityMember[]>([])
  const [memberTotal, setMemberTotal] = useState(0)
  const [admins, setAdmins] = useState<FacilityAdminPeer[]>([])
  const [announcements, setAnnouncements] = useState<FacilityAnnouncement[]>([])
  const [tab, setTab] = useState<DashTab>('overview')
  const [memberQuery, setMemberQuery] = useState('')

  const [roleTitle, setRoleTitle] = useState('')
  const [proofNote, setProofNote] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [announceTitle, setAnnounceTitle] = useState('')
  const [announceBody, setAnnounceBody] = useState('')
  const [directMemberId, setDirectMemberId] = useState<string | null>(null)
  const [directTitle, setDirectTitle] = useState('')
  const [directBody, setDirectBody] = useState('')

  const [loading, setLoading] = useState(true)
  const [dashLoading, setDashLoading] = useState(false)
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
        if (current && res.approved?.some((c) => c.healthcare_facility_id === current)) {
          return current
        }
        return res.approved?.[0]?.healthcare_facility_id ?? ''
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load facility admin status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!selectedFacilityId) {
      setMembers([])
      setMemberTotal(0)
      setAnnouncements([])
      setAdmins([])
      return
    }
    let cancelled = false
    setDashLoading(true)
    Promise.all([
      userApi.listFacilityMembers(selectedFacilityId),
      userApi.listFacilityAnnouncements(selectedFacilityId),
      userApi.listFacilityAdmins(selectedFacilityId),
    ])
      .then(([memberRes, annRes, adminRes]) => {
        if (cancelled) return
        setMembers(memberRes.members ?? [])
        setMemberTotal(memberRes.total ?? 0)
        setAnnouncements(annRes.announcements ?? [])
        setAdmins(adminRes.admins ?? [])
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load center data')
      })
      .finally(() => {
        if (!cancelled) setDashLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedFacilityId])

  async function submitClaim() {
    if (!profile?.healthcare_facility_id) {
      setError('Choose your health center in community location first.')
      return
    }
    if (!roleTitle.trim() || !proofNote.trim()) {
      setError('Add your role and how we can verify you.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await userApi.createFacilityAdminClaim({
        healthcare_facility_id: profile.healthcare_facility_id,
        role_title: roleTitle.trim(),
        proof_note: proofNote.trim(),
        proof_url: proofUrl.trim() || undefined,
      })
      setMessage('Request sent — MomLaunchpad will review shortly.')
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
    if (!announceTitle.trim() || !announceBody.trim()) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await userApi.createFacilityAnnouncement(
        selectedFacilityId,
        announceTitle.trim(),
        announceBody.trim(),
      )
      setMessage(`Announcement delivered to ${res.announcement.recipient_count} member(s).`)
      setAnnounceTitle('')
      setAnnounceBody('')
      const annRes = await userApi.listFacilityAnnouncements(selectedFacilityId)
      setAnnouncements(annRes.announcements ?? [])
      setTab('broadcast')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send announcement')
    } finally {
      setBusy(false)
    }
  }

  async function sendDirect() {
    if (!selectedFacilityId || !directMemberId) return
    if (!directTitle.trim() || !directBody.trim()) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await userApi.sendFacilityDirectMessage(
        selectedFacilityId,
        directMemberId,
        directTitle.trim(),
        directBody.trim(),
      )
      setMessage('Message sent to their MomLaunchpad inbox.')
      setDirectMemberId(null)
      setDirectTitle('')
      setDirectBody('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send message')
    } finally {
      setBusy(false)
    }
  }

  const selected = approved.find((c) => c.healthcare_facility_id === selectedFacilityId)
  const directMember = members.find((m) => m.user_id === directMemberId)
  const profileFacilityId = profile?.healthcare_facility_id
  const claimForProfile = claims.find((c) => c.healthcare_facility_id === profileFacilityId)
  const hasPendingForFacility = claimForProfile?.status === 'pending'
  const alreadyApprovedForFacility = approved.some(
    (c) => c.healthcare_facility_id === profileFacilityId,
  )
  const canRequest =
    !!profileFacilityId &&
    !alreadyApprovedForFacility &&
    !hasPendingForFacility &&
    claimForProfile?.status !== 'pending'

  const optedInCount = useMemo(
    () => members.filter((m) => m.facility_announcements_opt_in).length,
    [members],
  )

  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase()
    if (!q) return members
    return members.filter((m) => {
      const hay = [m.display_name, m.city, m.phone_number, journeyLabel(m.journey_stage)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [members, memberQuery])

  const isDashboard = approved.length > 0 && !!selected

  return (
    <>
      <MomAppBar
        pageTitle={isDashboard ? selected?.facility_name || 'Center dashboard' : 'Health center admin'}
        onBack={() => navigate(appPath())}
      />
      <div className="user-app-content">
        <div className="fa-page">
          {error && <div className="u-alert u-alert--error fa-banner">{error}</div>}
          {message && <div className="u-alert u-alert--success fa-banner">{message}</div>}

          {loading ? (
            <div className="fa-loading" aria-live="polite">
              <div className="u-spinner" />
              <p className="u-muted">Loading your admin access…</p>
            </div>
          ) : isDashboard ? (
            <Dashboard
              approved={approved}
              selected={selected!}
              selectedFacilityId={selectedFacilityId}
              onSelectFacility={(id) => {
                setSelectedFacilityId(id)
                setTab('overview')
                setMemberQuery('')
              }}
              tab={tab}
              onTab={setTab}
              dashLoading={dashLoading}
              memberTotal={memberTotal}
              optedInCount={optedInCount}
              adminCount={admins.length}
              announcementCount={announcements.length}
              members={filteredMembers}
              memberQuery={memberQuery}
              onMemberQuery={setMemberQuery}
              announcements={announcements}
              admins={admins}
              announceTitle={announceTitle}
              announceBody={announceBody}
              onAnnounceTitle={setAnnounceTitle}
              onAnnounceBody={setAnnounceBody}
              onSendAnnouncement={sendAnnouncement}
              busy={busy}
              onMessageMember={(id) => {
                setDirectMemberId(id)
                setDirectTitle('')
                setDirectBody('')
                setError('')
                setMessage('')
              }}
              canStillRequestOther={
                !!profileFacilityId &&
                !alreadyApprovedForFacility &&
                !hasPendingForFacility
              }
              onScrollToClaim={() => {
                document.getElementById('fa-extra-claim')?.scrollIntoView({ behavior: 'smooth' })
              }}
            />
          ) : (
            <AccessFlow
              profileFacilityName={profile?.healthcare_facility_name}
              profileCity={profile?.city}
              hasFacility={!!profileFacilityId}
              claim={claimForProfile}
              canRequest={canRequest}
              hasPending={hasPendingForFacility}
              roleTitle={roleTitle}
              proofNote={proofNote}
              proofUrl={proofUrl}
              onRoleTitle={setRoleTitle}
              onProofNote={setProofNote}
              onProofUrl={setProofUrl}
              onSubmit={submitClaim}
              busy={busy}
              claims={claims}
            />
          )}

          {/* Allow requesting another center while already admin elsewhere */}
          {isDashboard &&
            !!profileFacilityId &&
            !alreadyApprovedForFacility &&
            !hasPendingForFacility && (
              <section id="fa-extra-claim" className="fa-section fa-section--late">
                <p className="u-caption">Also manage your community center?</p>
                <div className="fa-card">
                  <p className="fa-lead">
                    Request admin for <strong>{profile?.healthcare_facility_name}</strong>. Multiple
                    staff can be approved for the same center.
                  </p>
                  <label className="app-label">Your role</label>
                  <input
                    className="app-input"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Matron, Midwife, Records officer"
                  />
                  <label className="app-label">How we can verify you</label>
                  <textarea
                    className="app-input"
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                    rows={3}
                    placeholder="Work email, staff ID, or how patients know you"
                  />
                  <label className="app-label">Optional verification link</label>
                  <input
                    className="app-input"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://"
                  />
                  <div className="fa-actions">
                    <GradientButton disabled={busy} onClick={submitClaim}>
                      {busy ? 'Submitting…' : 'Request admin access'}
                    </GradientButton>
                  </div>
                </div>
              </section>
            )}

          {hasPendingForFacility && isDashboard && (
            <div className="fa-card fa-card--soft">
              <p className="fa-status-pill fa-status-pill--pending">Pending review</p>
              <p className="fa-lead" style={{ marginBottom: 0 }}>
                Your request for <strong>{profile?.healthcare_facility_name}</strong> is with
                MomLaunchpad. You can keep using your approved center meanwhile.
              </p>
            </div>
          )}
        </div>
      </div>

      {directMemberId && directMember && (
        <div className="sheet-overlay" role="presentation" onClick={() => setDirectMemberId(null)}>
          <div
            className="sheet-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Message member"
          >
            <h2 className="u-heading-sm">Message {directMember.display_name}</h2>
            <p className="u-muted" style={{ fontSize: '0.85rem' }}>
              Delivered to their MomLaunchpad inbox · up to 30 direct messages per day for this
              center
            </p>
            <label className="app-label">Subject</label>
            <input
              className="app-input"
              value={directTitle}
              onChange={(e) => setDirectTitle(e.target.value)}
              maxLength={200}
              placeholder="e.g. Your ANC appointment"
            />
            <label className="app-label">Message</label>
            <textarea
              className="app-input"
              value={directBody}
              onChange={(e) => setDirectBody(e.target.value)}
              rows={4}
              maxLength={2000}
            />
            <GradientButton
              disabled={busy || !directTitle.trim() || !directBody.trim()}
              onClick={sendDirect}
            >
              {busy ? 'Sending…' : 'Send message'}
            </GradientButton>
            <button
              type="button"
              className="app-btn app-btn--ghost"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => setDirectMemberId(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  )
}

function AccessFlow({
  profileFacilityName,
  profileCity,
  hasFacility,
  claim,
  canRequest,
  hasPending,
  roleTitle,
  proofNote,
  proofUrl,
  onRoleTitle,
  onProofNote,
  onProofUrl,
  onSubmit,
  busy,
  claims,
}: {
  profileFacilityName?: string
  profileCity?: string
  hasFacility: boolean
  claim?: FacilityAdminClaim
  canRequest: boolean
  hasPending: boolean
  roleTitle: string
  proofNote: string
  proofUrl: string
  onRoleTitle: (v: string) => void
  onProofNote: (v: string) => void
  onProofUrl: (v: string) => void
  onSubmit: () => void
  busy: boolean
  claims: FacilityAdminClaim[]
}) {
  return (
    <div className="fa-access">
      <header className="fa-hero">
        <p className="fa-eyebrow">For health center staff</p>
        <h1 className="fa-hero-title">Reach the moms who chose your center</h1>
        <p className="fa-hero-lead">
          Request verification once. After approval, you and your colleagues get a shared dashboard
          for roster, broadcasts, and one-to-one check-ins — without seeing clinical records.
        </p>
        <ol className="fa-steps" aria-label="How verification works">
          <li className={hasFacility ? 'is-done' : 'is-current'}>
            <span className="fa-step-num">1</span>
            <span>Select your health center in community location</span>
          </li>
          <li
            className={
              hasPending || claim?.status === 'approved'
                ? 'is-done'
                : hasFacility
                  ? 'is-current'
                  : ''
            }
          >
            <span className="fa-step-num">2</span>
            <span>Request admin with your role and proof</span>
          </li>
          <li className={claim?.status === 'approved' ? 'is-done' : hasPending ? 'is-current' : ''}>
            <span className="fa-step-num">3</span>
            <span>MomLaunchpad reviews — then your dashboard unlocks</span>
          </li>
        </ol>
      </header>

      {!hasFacility ? (
        <div className="fa-card fa-card--emphasis">
          <h2 className="fa-card-title">Choose your center first</h2>
          <p className="fa-lead">
            Admins are tied to a real facility. Set it in community location, then come back here to
            request access. Multiple staff can request the same center.
          </p>
          <Link className="fa-cta-link" to={appPath('community/onboarding?edit=1')}>
            Open community location
          </Link>
        </div>
      ) : hasPending ? (
        <div className="fa-card fa-card--emphasis fa-pending">
          <p className="fa-status-pill fa-status-pill--pending">Pending review</p>
          <h2 className="fa-card-title">{profileFacilityName}</h2>
          <p className="fa-lead">
            {profileCity ? `${profileCity} · ` : ''}
            We are verifying your request. This usually takes 1–2 business days. You will see your
            dashboard here as soon as you are approved.
          </p>
          {claim?.role_title && (
            <p className="u-muted" style={{ marginBottom: 0 }}>
              Submitted as {claim.role_title}
            </p>
          )}
        </div>
      ) : claim?.status === 'rejected' || claim?.status === 'revoked' ? (
        <div className="fa-card fa-card--emphasis">
          <p
            className={`fa-status-pill ${
              claim.status === 'rejected' ? 'fa-status-pill--rejected' : 'fa-status-pill--revoked'
            }`}
          >
            {claimStatusLabel(claim.status)}
          </p>
          <h2 className="fa-card-title">{profileFacilityName}</h2>
          {claim.admin_note && <p className="fa-lead">{claim.admin_note}</p>}
          <p className="fa-lead">You can submit a new request with clearer verification details.</p>
          <ClaimForm
            roleTitle={roleTitle}
            proofNote={proofNote}
            proofUrl={proofUrl}
            onRoleTitle={onRoleTitle}
            onProofNote={onProofNote}
            onProofUrl={onProofUrl}
            onSubmit={onSubmit}
            busy={busy}
          />
        </div>
      ) : canRequest ? (
        <div className="fa-card fa-card--emphasis">
          <h2 className="fa-card-title">Request access</h2>
          <p className="fa-facility-chip">
            <span aria-hidden>🏥</span>
            <span>
              <strong>{profileFacilityName}</strong>
              {profileCity ? ` · ${profileCity}` : ''}
            </span>
          </p>
          <p className="fa-lead">
            Tell us who you are at this center. Colleagues can request separately — several admins
            can share one dashboard.
          </p>
          <ClaimForm
            roleTitle={roleTitle}
            proofNote={proofNote}
            proofUrl={proofUrl}
            onRoleTitle={onRoleTitle}
            onProofNote={onProofNote}
            onProofUrl={onProofUrl}
            onSubmit={onSubmit}
            busy={busy}
          />
        </div>
      ) : null}

      {claims.length > 0 && (
        <section className="fa-section">
          <p className="u-caption">Your requests</p>
          <ul className="fa-claim-list">
            {claims.map((c) => (
              <li key={c.id} className="fa-claim-row">
                <div>
                  <strong>{c.facility_name || 'Health center'}</strong>
                  {c.role_title ? <span className="u-muted"> · {c.role_title}</span> : null}
                  {c.admin_note ? <p className="fa-claim-note">{c.admin_note}</p> : null}
                </div>
                <span
                  className={`fa-status-pill fa-status-pill--${
                    c.status === 'approved'
                      ? 'approved'
                      : c.status === 'pending'
                        ? 'pending'
                        : c.status === 'rejected'
                          ? 'rejected'
                          : 'revoked'
                  }`}
                >
                  {claimStatusLabel(c.status)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function ClaimForm({
  roleTitle,
  proofNote,
  proofUrl,
  onRoleTitle,
  onProofNote,
  onProofUrl,
  onSubmit,
  busy,
}: {
  roleTitle: string
  proofNote: string
  proofUrl: string
  onRoleTitle: (v: string) => void
  onProofNote: (v: string) => void
  onProofUrl: (v: string) => void
  onSubmit: () => void
  busy: boolean
}) {
  return (
    <div className="fa-form">
      <label className="app-label">Your role at the center</label>
      <input
        className="app-input"
        value={roleTitle}
        onChange={(e) => onRoleTitle(e.target.value)}
        placeholder="e.g. Matron, Community midwife, Admin"
        autoComplete="organization-title"
      />
      <label className="app-label">How we can verify you</label>
      <textarea
        className="app-input"
        value={proofNote}
        onChange={(e) => onProofNote(e.target.value)}
        rows={3}
        placeholder="Work email, staff ID, or how patients know you"
      />
      <label className="app-label">Optional verification link</label>
      <input
        className="app-input"
        value={proofUrl}
        onChange={(e) => onProofUrl(e.target.value)}
        placeholder="https://"
        inputMode="url"
      />
      <div className="fa-actions">
        <GradientButton disabled={busy || !roleTitle.trim() || !proofNote.trim()} onClick={onSubmit}>
          {busy ? 'Submitting…' : 'Submit for verification'}
        </GradientButton>
      </div>
    </div>
  )
}

function Dashboard({
  approved,
  selected,
  selectedFacilityId,
  onSelectFacility,
  tab,
  onTab,
  dashLoading,
  memberTotal,
  optedInCount,
  adminCount,
  announcementCount,
  members,
  memberQuery,
  onMemberQuery,
  announcements,
  admins,
  announceTitle,
  announceBody,
  onAnnounceTitle,
  onAnnounceBody,
  onSendAnnouncement,
  busy,
  onMessageMember,
}: {
  approved: FacilityAdminClaim[]
  selected: FacilityAdminClaim
  selectedFacilityId: string
  onSelectFacility: (id: string) => void
  tab: DashTab
  onTab: (t: DashTab) => void
  dashLoading: boolean
  memberTotal: number
  optedInCount: number
  adminCount: number
  announcementCount: number
  members: FacilityMember[]
  memberQuery: string
  onMemberQuery: (v: string) => void
  announcements: FacilityAnnouncement[]
  admins: FacilityAdminPeer[]
  announceTitle: string
  announceBody: string
  onAnnounceTitle: (v: string) => void
  onAnnounceBody: (v: string) => void
  onSendAnnouncement: () => void
  busy: boolean
  onMessageMember: (userId: string) => void
  canStillRequestOther?: boolean
  onScrollToClaim?: () => void
}) {
  return (
    <div className="fa-dash">
      <header className="fa-dash-head">
        {approved.length > 1 ? (
          <label className="fa-center-switch">
            <span className="u-caption">Your centers</span>
            <select
              className="app-input"
              value={selectedFacilityId}
              onChange={(e) => onSelectFacility(e.target.value)}
            >
              {approved.map((c) => (
                <option key={c.id} value={c.healthcare_facility_id}>
                  {c.facility_name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div>
            <p className="fa-eyebrow">Approved admin</p>
            <h1 className="fa-dash-title">{selected.facility_name}</h1>
          </div>
        )}
        <p className="fa-dash-meta">
          {[selected.facility_city, selected.facility_state_province, selected.role_title]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className="fa-stat-row" aria-label="Center snapshot">
          <div className="fa-stat">
            <strong>{memberTotal}</strong>
            <span>Members</span>
          </div>
          <div className="fa-stat">
            <strong>{optedInCount}</strong>
            <span>Opted-in</span>
          </div>
          <div className="fa-stat">
            <strong>{adminCount}</strong>
            <span>Admins</span>
          </div>
          <div className="fa-stat">
            <strong>{announcementCount}</strong>
            <span>Broadcasts</span>
          </div>
        </div>
      </header>

      <nav className="fa-tabs" aria-label="Dashboard sections">
        {(
          [
            ['overview', 'Overview'],
            ['members', 'Members'],
            ['broadcast', 'Broadcast'],
            ['team', 'Team'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`fa-tab${tab === id ? ' is-active' : ''}`}
            onClick={() => onTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {dashLoading ? (
        <div className="fa-loading fa-loading--inline">
          <div className="u-spinner" />
        </div>
      ) : (
        <>
          {tab === 'overview' && (
            <div className="fa-panel fa-panel--enter">
              <div className="fa-quick">
                <button type="button" className="fa-quick-card" onClick={() => onTab('members')}>
                  <strong>View roster</strong>
                  <span>{memberTotal} moms linked this center</span>
                </button>
                <button type="button" className="fa-quick-card" onClick={() => onTab('broadcast')}>
                  <strong>Send broadcast</strong>
                  <span>3 per week · opted-in only</span>
                </button>
                <button type="button" className="fa-quick-card" onClick={() => onTab('team')}>
                  <strong>Admin team</strong>
                  <span>
                    {adminCount} approved{adminCount === 1 ? ' admin' : ' admins'}
                  </span>
                </button>
              </div>
              <section className="fa-section">
                <div className="fa-section-head">
                  <h2 className="fa-card-title">Recent broadcasts</h2>
                  <button type="button" className="fa-text-btn" onClick={() => onTab('broadcast')}>
                    Manage
                  </button>
                </div>
                {announcements.length === 0 ? (
                  <p className="u-muted">No announcements yet. Start with a short ANC reminder.</p>
                ) : (
                  <ul className="fa-ann-list">
                    {announcements.slice(0, 3).map((a) => (
                      <li key={a.id}>
                        <strong>{a.title}</strong>
                        <span className="u-muted">
                          {formatWhen(a.created_at)} · {a.recipient_count} recipient
                          {a.recipient_count === 1 ? '' : 's'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <p className="fa-privacy">
                Privacy: you see who chose this center and contact details they shared — not chat
                content or clinical notes.
              </p>
            </div>
          )}

          {tab === 'members' && (
            <div className="fa-panel fa-panel--enter">
              <input
                className="app-input"
                value={memberQuery}
                onChange={(e) => onMemberQuery(e.target.value)}
                placeholder="Search by name, city, or journey…"
                aria-label="Search members"
              />
              {members.length === 0 ? (
                <div className="fa-empty">
                  <p>
                    {memberQuery
                      ? 'No members match that search.'
                      : 'No one has registered this center yet. Ask patients to pick it during community setup.'}
                  </p>
                </div>
              ) : (
                <ul className="fa-member-list">
                  {members.map((m) => (
                    <li key={m.user_id} className="fa-member">
                      <div className="fa-avatar" aria-hidden>
                        {initials(m.display_name)}
                      </div>
                      <div className="fa-member-body">
                        <strong>{m.display_name}</strong>
                        <p className="u-muted">
                          {[m.city, journeyLabel(m.journey_stage)].filter(Boolean).join(' · ') ||
                            'Member'}
                        </p>
                        {m.phone_number ? (
                          <a
                            className="fa-wa"
                            href={`https://wa.me/${m.phone_number.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            WhatsApp {m.phone_number}
                          </a>
                        ) : (
                          <span className="u-muted" style={{ fontSize: '0.85rem' }}>
                            No phone on file
                          </span>
                        )}
                        {!m.facility_announcements_opt_in && (
                          <span className="fa-opt-out">Opted out of broadcasts</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="app-btn app-btn--outline app-btn--sm"
                        onClick={() => onMessageMember(m.user_id)}
                      >
                        Message
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'broadcast' && (
            <div className="fa-panel fa-panel--enter">
              <div className="fa-card">
                <h2 className="fa-card-title">Broadcast to opted-in members</h2>
                <label className="app-label">Title</label>
                <input
                  className="app-input"
                  value={announceTitle}
                  onChange={(e) => onAnnounceTitle(e.target.value)}
                  maxLength={200}
                  placeholder="e.g. Antenatal class this Thursday"
                />
                <label className="app-label">Message</label>
                <textarea
                  className="app-input"
                  value={announceBody}
                  onChange={(e) => onAnnounceBody(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Keep it short — members see this in their inbox."
                />
                <p className="u-caption">Limit 3 per center per week · {optedInCount} currently opted in</p>
                <GradientButton
                  disabled={busy || !announceTitle.trim() || !announceBody.trim()}
                  onClick={onSendAnnouncement}
                >
                  {busy ? 'Sending…' : 'Send in-app announcement'}
                </GradientButton>
              </div>
              {announcements.length > 0 && (
                <section className="fa-section">
                  <p className="u-caption">History</p>
                  <ul className="fa-ann-list fa-ann-list--full">
                    {announcements.map((a) => (
                      <li key={a.id}>
                        <strong>{a.title}</strong>
                        <span className="u-muted">
                          {formatWhen(a.created_at)} · {a.recipient_count} recipient
                          {a.recipient_count === 1 ? '' : 's'}
                        </span>
                        <p>{a.body}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {tab === 'team' && (
            <div className="fa-panel fa-panel--enter">
              <div className="fa-card fa-card--soft">
                <h2 className="fa-card-title">Multiple admins welcome</h2>
                <p className="fa-lead">
                  Any verified staff member can request access for this center. Everyone approved
                  shares the same roster and broadcast tools.
                </p>
              </div>
              <ul className="fa-team-list">
                {admins.map((a) => (
                  <li key={a.user_id} className="fa-team-row">
                    <div className="fa-avatar" aria-hidden>
                      {initials(a.display_name)}
                    </div>
                    <div>
                      <strong>{a.display_name}</strong>
                      <p className="u-muted">
                        {[a.role_title || 'Admin', `since ${formatWhen(a.approved_at)}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
