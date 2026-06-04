import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { Plan, QuotaInfo, ReferralRewardRecord, UserSubscription } from '../api/types'
import { Alert, Card, PageHeader } from '../components/ui'

export function UsersPage() {
  const [userId, setUserId] = useState('')
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [planCode, setPlanCode] = useState('')
  const [featureKey, setFeatureKey] = useState('chat')
  const [grantFeature, setGrantFeature] = useState('')
  const [grantExpires, setGrantExpires] = useState('')
  const [referralRewards, setReferralRewards] = useState<ReferralRewardRecord[]>([])
  const [referralRewardDesc, setReferralRewardDesc] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function lookup(e: FormEvent) {
    e.preventDefault()
    if (!userId.trim()) return
    setLoading(true)
    setError('')
    setMessage('')
    setSubscription(null)
    setQuota(null)
    setReferralRewards([])
    try {
      const uid = userId.trim()
      const [subRes, plansRes, rewardsRes] = await Promise.all([
        api.getUserSubscription(uid),
        plans.length ? Promise.resolve({ plans }) : api.listPlans(),
        api.listUserReferralRewards(uid).catch(() => ({ rewards: [] })),
      ])
      setSubscription(subRes.subscription)
      setPlans(plansRes.plans ?? plans)
      setPlanCode(subRes.subscription.plan_code)
      setReferralRewards(rewardsRes.rewards ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User lookup failed')
    } finally {
      setLoading(false)
    }
  }

  async function loadQuota(e: FormEvent) {
    e.preventDefault()
    if (!userId.trim() || !featureKey.trim()) return
    setError('')
    try {
      const res = await api.getUserQuota(userId.trim(), featureKey.trim())
      setQuota(res.quota)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quota lookup failed')
    }
  }

  async function changePlan(e: FormEvent) {
    e.preventDefault()
    try {
      await api.updateUserPlan(userId.trim(), planCode)
      setMessage('Plan updated.')
      await lookup(e)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan update failed')
    }
  }

  async function resetQuota() {
    try {
      await api.resetUserQuota(userId.trim(), featureKey.trim())
      setMessage('Quota reset.')
      const res = await api.getUserQuota(userId.trim(), featureKey.trim())
      setQuota(res.quota)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    }
  }

  async function grant(e: FormEvent) {
    e.preventDefault()
    if (!grantFeature.trim()) return
    try {
      let expires_at: number | undefined
      if (grantExpires) {
        expires_at = Math.floor(new Date(grantExpires).getTime() / 1000)
      }
      await api.grantFeature(userId.trim(), grantFeature.trim(), expires_at)
      setMessage(`Granted feature "${grantFeature}".`)
      setGrantFeature('')
      setGrantExpires('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grant failed')
    }
  }

  async function grantReferralReward(e: FormEvent) {
    e.preventDefault()
    if (!referralRewardDesc.trim()) return
    try {
      await api.grantReferralReward(userId.trim(), referralRewardDesc.trim())
      setMessage('Referral reward granted.')
      setReferralRewardDesc('')
      const res = await api.listUserReferralRewards(userId.trim())
      setReferralRewards(res.rewards ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Referral grant failed')
    }
  }

  return (
    <>
      <PageHeader
        title="User management"
        description="Look up users by UUID to manage subscriptions, quotas, and feature grants."
      />
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Card>
        <form className="form inline-form" onSubmit={lookup}>
          <label className="flex-grow">
            User ID
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="11111111-1111-1111-1111-111111111111"
              required
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Loading…' : 'Look up'}
          </button>
        </form>
      </Card>

      {subscription && (
        <div className="grid-2 mt">
          <Card>
            <h2 className="card-title">Subscription</h2>
            <ul className="kv-list">
              <li><span>Plan</span><strong>{subscription.plan_code}</strong></li>
              <li><span>Status</span><strong>{subscription.status}</strong></li>
              <li><span>Started</span><strong>{new Date(subscription.starts_at).toLocaleDateString()}</strong></li>
            </ul>
            <form className="form inline-form mt" onSubmit={changePlan}>
              <label>
                Change plan
                <select value={planCode} onChange={(e) => setPlanCode(e.target.value)}>
                  {plans.map((p) => (
                    <option key={p.id} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="btn btn-primary">Update plan</button>
            </form>
          </Card>

          <Card>
            <h2 className="card-title">Quota</h2>
            <form className="form inline-form" onSubmit={loadQuota}>
              <label>
                Feature key
                <input value={featureKey} onChange={(e) => setFeatureKey(e.target.value)} placeholder="chat" />
              </label>
              <button type="submit" className="btn btn-ghost">Check quota</button>
            </form>
            {quota && (
              <>
                <ul className="kv-list mt">
                  <li><span>Usage</span><strong>{quota.usage_count}</strong></li>
                  <li><span>Limit</span><strong>{quota.quota_limit ?? '∞'}</strong></li>
                  <li><span>Period</span><strong>{quota.quota_period}</strong></li>
                </ul>
                <button type="button" className="btn btn-danger mt" onClick={resetQuota}>
                  Reset quota
                </button>
              </>
            )}
          </Card>
        </div>
      )}

      {subscription && (
        <>
          <Card className="mt">
            <h2 className="card-title">Grant feature override</h2>
            <form className="form inline-form" onSubmit={grant}>
              <label>
                Feature key
                <input
                  value={grantFeature}
                  onChange={(e) => setGrantFeature(e.target.value)}
                  placeholder="voice_calls"
                />
              </label>
              <label>
                Expires (optional)
                <input
                  type="datetime-local"
                  value={grantExpires}
                  onChange={(e) => setGrantExpires(e.target.value)}
                />
              </label>
              <button type="submit" className="btn btn-primary">
                Grant
              </button>
            </form>
          </Card>

          <Card className="mt">
            <h2 className="card-title">Referral rewards</h2>
            {referralRewards.length > 0 ? (
              <table className="table mb">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Referrals</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {referralRewards.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td>{r.referrals_count}</td>
                      <td>{r.reward_description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted mb">No referral rewards recorded yet.</p>
            )}
            <form className="form inline-form" onSubmit={grantReferralReward}>
              <label className="flex-grow">
                Reward description
                <input
                  value={referralRewardDesc}
                  onChange={(e) => setReferralRewardDesc(e.target.value)}
                  placeholder="Monthly top referrer — gift card"
                  required
                />
              </label>
              <button type="submit" className="btn btn-primary">
                Grant referral reward
              </button>
            </form>
          </Card>
        </>
      )}
    </>
  )
}
