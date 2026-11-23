import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { EmptyState, GradientButton, MomAppBar } from '../components/ui'
import { appPath } from '../routes'
import type { Nest, NestContribution, NestContributor } from '../types'
import { useUserProfile } from '../context/UserProfileContext'

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

export function NestPage() {
  const navigate = useNavigate()
  const { profile } = useUserProfile()
  const [nest, setNest] = useState<Nest | null>(null)
  const [contributions, setContributions] = useState<NestContribution[]>([])
  const [contributors, setContributors] = useState<NestContributor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const [goal, setGoal] = useState('500000')
  const [monthly, setMonthly] = useState('50000')
  const [title, setTitle] = useState('')

  const [logName, setLogName] = useState('')
  const [logAmount, setLogAmount] = useState('')
  const [logNote, setLogNote] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { nest: mine } = await userApi.getMyNest()
      setNest(mine)
      if (mine) {
        const activity = await userApi.listNestActivity(mine.id)
        setContributions(activity.contributions)
        setContributors(activity.contributors)
      } else {
        setContributions([])
        setContributors([])
        const first = profile?.name?.split(' ')[0]
        setTitle(first ? `${first}'s delivery nest` : 'My delivery nest')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load nest')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function createNest() {
    setBusy(true)
    setError('')
    try {
      const body = {
        title: title.trim() || undefined,
        goal_amount: Number(goal) || 0,
        monthly_target_amount: Number(monthly) || undefined,
        currency: 'NGN',
        expected_delivery_date: profile?.expected_delivery_date || undefined,
        reminder_day_of_month: 28,
      }
      const { nest: created } = await userApi.createNest(body)
      setNest(created)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create nest')
    } finally {
      setBusy(false)
    }
  }

  async function copyInvite() {
    if (!nest?.invite_link) return
    try {
      await navigator.clipboard.writeText(nest.invite_link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy link')
    }
  }

  async function shareInvite() {
    if (!nest?.invite_link) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: nest.title,
          text: `Help me prepare for delivery — contribute to my nest on MomLaunchpad.`,
          url: nest.invite_link,
        })
        return
      } catch {
        /* fall through */
      }
    }
    await copyInvite()
  }

  async function logGift() {
    if (!nest) return
    const amount = Number(logAmount)
    if (!logName.trim() || !(amount > 0)) {
      setError('Enter a name and amount')
      return
    }
    setBusy(true)
    setError('')
    try {
      await userApi.recordNestContribution(nest.id, {
        display_name: logName.trim(),
        amount,
        note: logNote.trim() || undefined,
        status: 'recorded',
      })
      setLogName('')
      setLogAmount('')
      setLogNote('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record gift')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <MomAppBar pageTitle="Delivery nest" onBack={() => navigate(appPath())} />
      <div className="user-app-content page-section">
        <p className="u-muted" style={{ marginTop: 0 }}>
          Invite close family and friends. Each month they can record a gift toward your due date.
          Money still moves the way you already do — transfer, cash, or wallet.
        </p>

        {error && <div className="u-alert u-alert--error">{error}</div>}

        {loading ? (
          <div className="u-center-page"><div className="u-spinner" /></div>
        ) : !nest ? (
          <div className="app-card" style={{ padding: 16 }}>
            <h2 className="u-heading-sm" style={{ marginTop: 0 }}>Start your nest</h2>
            <label className="app-label">Title</label>
            <input className="app-input" value={title} onChange={(e) => setTitle(e.target.value)} />
            <label className="app-label" style={{ marginTop: 12 }}>Goal amount (NGN)</label>
            <input className="app-input" inputMode="numeric" value={goal} onChange={(e) => setGoal(e.target.value)} />
            <label className="app-label" style={{ marginTop: 12 }}>Monthly nudge (NGN, optional)</label>
            <input className="app-input" inputMode="numeric" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
            <div style={{ marginTop: 16 }}>
              <GradientButton onClick={createNest} disabled={busy}>
                {busy ? 'Creating…' : 'Create nest'}
              </GradientButton>
            </div>
          </div>
        ) : (
          <>
            <div className="app-card app-card--outlined" style={{ marginBottom: 16 }}>
              <strong>{nest.title}</strong>
              <p className="u-muted" style={{ margin: '6px 0 0', fontSize: '0.9rem' }}>
                {money(nest.total_raised, nest.currency)} raised
                {nest.goal_amount > 0 ? ` of ${money(nest.goal_amount, nest.currency)}` : ''}
                {` · ${Math.round(nest.progress_percentage)}%`}
              </p>
              {nest.expected_delivery_date && (
                <p className="u-muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                  Due around {new Date(nest.expected_delivery_date).toLocaleDateString()}
                </p>
              )}
              <div className="nest-progress" aria-hidden>
                <div className="nest-progress__bar" style={{ width: `${Math.min(100, nest.progress_percentage)}%` }} />
              </div>
              <p className="u-muted" style={{ margin: '12px 0 0', fontSize: '0.85rem' }}>
                Tribe reminder day: {nest.reminder_day_of_month} of each month (calendar reminder for you).
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <GradientButton onClick={shareInvite} disabled={busy}>
                  Share invite
                </GradientButton>
                <button type="button" className="app-btn app-btn--outline app-btn--sm" onClick={copyInvite}>
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
              <p className="u-muted" style={{ margin: '10px 0 0', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                {nest.invite_link}
              </p>
            </div>

            <section style={{ marginBottom: 20 }}>
              <h2 className="u-heading-sm">Log a gift you already received</h2>
              <label className="app-label">From</label>
              <input className="app-input" value={logName} onChange={(e) => setLogName(e.target.value)} placeholder="Aunty Bisi" />
              <label className="app-label" style={{ marginTop: 8 }}>Amount ({nest.currency})</label>
              <input className="app-input" inputMode="numeric" value={logAmount} onChange={(e) => setLogAmount(e.target.value)} />
              <label className="app-label" style={{ marginTop: 8 }}>Note (optional)</label>
              <input className="app-input" value={logNote} onChange={(e) => setLogNote(e.target.value)} />
              <div style={{ marginTop: 12 }}>
                <button type="button" className="app-btn app-btn--outline" disabled={busy} onClick={logGift}>
                  Save gift
                </button>
              </div>
            </section>

            <section style={{ marginBottom: 20 }}>
              <h2 className="u-heading-sm">Tribe ({contributors.length})</h2>
              {contributors.length === 0 ? (
                <p className="u-muted">No one has joined yet — share your invite link.</p>
              ) : (
                contributors.map((p) => (
                  <div key={p.id} className="u-muted" style={{ marginBottom: 4 }}>
                    {p.display_name}
                  </div>
                ))
              )}
            </section>

            <section>
              <h2 className="u-heading-sm">Activity</h2>
              {contributions.length === 0 ? (
                <EmptyState icon="🪺" title="No contributions yet" body="When your people record a gift, it shows up here." />
              ) : (
                contributions.map((c) => (
                  <div key={c.id} className="app-card app-card--outlined" style={{ marginBottom: 8 }}>
                    <strong>{c.contributor_name}</strong>
                    <p style={{ margin: '4px 0 0' }}>
                      {money(c.amount, c.currency)} · {c.status}
                    </p>
                    <p className="u-muted" style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>
                      {new Date(c.created_at).toLocaleString()}
                      {c.note ? ` · ${c.note}` : ''}
                    </p>
                  </div>
                ))
              )}
            </section>
          </>
        )}
      </div>
      <BottomNav />
    </>
  )
}
