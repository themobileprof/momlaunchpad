import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAdminConfig } from '../context/AdminConfigContext'
import type { AdminUserSummary, ReferralLeaderboardEntry } from '../api/types'
import { ADMIN_BASE } from '../routes'
import { UserPicker } from '../components/UserPicker'
import { Alert, Card, EmptyState, PageHeader, Spinner } from '../components/ui'

type RewardKind = 'topup_code' | 'store_discount' | 'message'

const REWARD_KIND_LABELS: Record<RewardKind, string> = {
  topup_code: 'Airtime / top-up code',
  store_discount: 'Store discount',
  message: 'Message only',
}

export function ReferralsPage() {
  const { config, loading: configLoading } = useAdminConfig()
  const [entries, setEntries] = useState<ReferralLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const [rewardUser, setRewardUser] = useState<AdminUserSummary | null>(null)
  const [rewardKind, setRewardKind] = useState<RewardKind>('topup_code')
  const [rewardTitle, setRewardTitle] = useState('')
  const [rewardBody, setRewardBody] = useState('')
  const [rewardCode, setRewardCode] = useState('')
  const [rewardValue, setRewardValue] = useState('')
  const [rewardProvider, setRewardProvider] = useState('')
  const [rewardExpires, setRewardExpires] = useState('')
  const [rewardBusy, setRewardBusy] = useState(false)

  const grantPresets = config?.referral_reward_presets ?? []

  async function sendReward() {
    if (!rewardUser || !rewardBody.trim()) return
    setRewardBusy(true)
    setError('')
    try {
      await api.sendUserReward(rewardUser.id, {
        reward_kind: rewardKind,
        title: rewardTitle.trim() || undefined,
        body: rewardBody.trim(),
        code: rewardKind === 'message' ? undefined : rewardCode.trim() || undefined,
        value: rewardValue.trim() || undefined,
        provider: rewardProvider.trim() || undefined,
        expires_at: rewardExpires ? new Date(rewardExpires).toISOString() : undefined,
      })
      setMessage(`Reward sent to ${rewardUser.email}.`)
      setRewardTitle('')
      setRewardBody('')
      setRewardCode('')
      setRewardValue('')
      setRewardProvider('')
      setRewardExpires('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reward')
    } finally {
      setRewardBusy(false)
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getReferralLeaderboard(100)
      setEntries(res.entries ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function grant(entry: ReferralLeaderboardEntry, description: string) {
    setBusyId(entry.user_id)
    setError('')
    try {
      await api.grantReferralReward(entry.user_id, description)
      setMessage(`Reward granted for ${entry.email}.`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grant failed')
    } finally {
      setBusyId(null)
    }
  }

  if (loading || (configLoading && !config)) return <Spinner />

  return (
    <>
      <PageHeader
        title="Referrals"
        description="Pending referral points — grant from each row."
        action={
          <button type="button" className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
        }
      />
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Card className="mb">
        <h2 className="card-title">Send a reward</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Deliver a top-up code, store discount, or message to a member. It appears in their
          in-app Rewards &amp; updates inbox.
        </p>
        <UserPicker
          label="Member email"
          user={rewardUser}
          onSelect={setRewardUser}
          onClear={() => setRewardUser(null)}
        />
        {rewardUser && (
          <div className="form" style={{ marginTop: '1rem' }}>
            <label>
              Reward type
              <select
                value={rewardKind}
                onChange={(e) => setRewardKind(e.target.value as RewardKind)}
              >
                {(Object.keys(REWARD_KIND_LABELS) as RewardKind[]).map((k) => (
                  <option key={k} value={k}>
                    {REWARD_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title (optional)
              <input
                value={rewardTitle}
                onChange={(e) => setRewardTitle(e.target.value)}
                placeholder="Defaults based on reward type"
              />
            </label>
            <label>
              Message
              <textarea
                value={rewardBody}
                onChange={(e) => setRewardBody(e.target.value)}
                placeholder="e.g. Thanks for referring 3 friends — here's ₦1,000 airtime!"
                required
              />
            </label>
            {rewardKind !== 'message' && (
              <label>
                {rewardKind === 'topup_code' ? 'Top-up code' : 'Discount code'}
                <input
                  value={rewardCode}
                  onChange={(e) => setRewardCode(e.target.value)}
                  placeholder={rewardKind === 'topup_code' ? '1234-5678-9012' : 'SAVE20'}
                />
              </label>
            )}
            <div className="grid-2">
              <label>
                Value (optional)
                <input
                  value={rewardValue}
                  onChange={(e) => setRewardValue(e.target.value)}
                  placeholder={rewardKind === 'store_discount' ? '20% off' : '₦1,000'}
                />
              </label>
              <label>
                {rewardKind === 'store_discount' ? 'Store (optional)' : 'Provider (optional)'}
                <input
                  value={rewardProvider}
                  onChange={(e) => setRewardProvider(e.target.value)}
                  placeholder={rewardKind === 'store_discount' ? 'Baby Store' : 'MTN'}
                />
              </label>
            </div>
            <label>
              Expires (optional)
              <input
                type="date"
                value={rewardExpires}
                onChange={(e) => setRewardExpires(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn btn-primary"
              disabled={rewardBusy || !rewardBody.trim()}
              onClick={sendReward}
            >
              {rewardBusy ? 'Sending…' : 'Send reward'}
            </button>
          </div>
        )}
      </Card>

      <Card>
        {entries.length === 0 ? (
          <EmptyState message="No users with pending referral points." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Code</th>
                <th>Referrals</th>
                <th>Points</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.user_id}>
                  <td>
                    <div>{entry.name || '—'}</div>
                    <div className="table-sub">{entry.email}</div>
                  </td>
                  <td>{entry.referral_code}</td>
                  <td>{entry.total_referrals}</td>
                  <td><strong>{entry.referral_reward_points}</strong></td>
                  <td className="actions">
                    <div className="btn-row">
                      {grantPresets.map((preset) => (
                        <button
                          key={preset.description}
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={busyId === entry.user_id}
                          onClick={() => grant(entry, preset.description)}
                        >
                          {busyId === entry.user_id ? '…' : preset.label}
                        </button>
                      ))}
                      <Link
                        to={`${ADMIN_BASE}/users?email=${encodeURIComponent(entry.email)}`}
                        className="btn btn-sm btn-ghost"
                      >
                        Account
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  )
}
