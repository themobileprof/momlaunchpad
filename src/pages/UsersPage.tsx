import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { UserPicker } from '../components/UserPicker'
import type {
  AdminUserSummary,
  Feature,
  Plan,
  QuotaInfo,
  ReferralRewardRecord,
  UserSubscription,
} from '../api/types'
import { Alert, Card, EmptyState, PageHeader } from '../components/ui'

type FeatureRow = {
  feature: Feature
  quota: QuotaInfo | null
}

const REWARD_PRESETS = [
  'Monthly top referrer — gift card',
  'Referral milestone — account credit',
]

export function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [userId, setUserId] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null)
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [featureRows, setFeatureRows] = useState<FeatureRow[]>([])
  const [referralRewards, setReferralRewards] = useState<ReferralRewardRecord[]>([])
  const [rewardDesc, setRewardDesc] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const loadFeatureQuotas = useCallback(async (uid: string, featureList: Feature[]) => {
    const rows = await Promise.all(
      featureList.map(async (f) => {
        try {
          const res = await api.getUserQuota(uid, f.feature_key)
          return { feature: f, quota: res.quota }
        } catch {
          return { feature: f, quota: null }
        }
      }),
    )
    setFeatureRows(rows)
  }, [])

  const loadUser = useCallback(
    async (uid: string) => {
      setLoading(true)
      setError('')
      setMessage('')
      setSubscription(null)
      setFeatureRows([])
      setReferralRewards([])
      try {
        const [subRes, plansRes, featuresRes, rewardsRes] = await Promise.all([
          api.getUserSubscription(uid),
          plans.length ? Promise.resolve({ plans }) : api.listPlans(),
          features.length ? Promise.resolve({ features }) : api.listFeatures(),
          api.listUserReferralRewards(uid).catch(() => ({ rewards: [] })),
        ])
        const planList = plansRes.plans ?? plans
        const featureList = featuresRes.features ?? features
        setSubscription(subRes.subscription)
        setPlans(planList)
        setFeatures(featureList)
        setReferralRewards(rewardsRes.rewards ?? [])
        await loadFeatureQuotas(uid, featureList)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load this user')
      } finally {
        setLoading(false)
      }
    },
    [plans, features, loadFeatureQuotas],
  )

  useEffect(() => {
    const email = searchParams.get('email')?.trim()
    if (!email || !email.includes('@')) return
    void api.lookupUserByEmail(email).then((res) => {
      const match = res.users?.[0]
      if (match) {
        setUserId(match.id)
        setSelectedUser(match)
        void loadUser(match.id)
      }
    })
  }, [searchParams, loadUser])

  function handleSelect(user: AdminUserSummary) {
    setUserId(user.id)
    setSelectedUser(user)
    setSearchParams({ email: user.email }, { replace: true })
    void loadUser(user.id)
  }

  function handleClear() {
    setUserId('')
    setSelectedUser(null)
    setSubscription(null)
    setFeatureRows([])
    setReferralRewards([])
    setSearchParams({}, { replace: true })
  }

  async function switchPlan(planCode: string) {
    if (!userId || subscription?.plan_code === planCode) return
    setBusy(`plan-${planCode}`)
    setError('')
    try {
      await api.updateUserPlan(userId, planCode)
      setMessage(`Plan set to ${planCode}.`)
      await loadUser(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan update failed')
    } finally {
      setBusy(null)
    }
  }

  async function resetQuota(featureKey: string) {
    if (!userId) return
    setBusy(`reset-${featureKey}`)
    setError('')
    try {
      await api.resetUserQuota(userId, featureKey)
      setMessage(`Reset quota for ${featureKey}.`)
      await loadFeatureQuotas(userId, features)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setBusy(null)
    }
  }

  async function grantFeature(featureKey: string) {
    if (!userId) return
    setBusy(`grant-${featureKey}`)
    setError('')
    try {
      await api.grantFeature(userId, featureKey)
      setMessage(`Granted ${featureKey}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grant failed')
    } finally {
      setBusy(null)
    }
  }

  async function grantReferral(description: string) {
    if (!userId || !description.trim()) return
    setBusy('referral')
    setError('')
    try {
      await api.grantReferralReward(userId, description.trim())
      setMessage('Referral reward granted.')
      setRewardDesc('')
      const res = await api.listUserReferralRewards(userId)
      setReferralRewards(res.rewards ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Referral grant failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader
        title="User management"
        description="Look up by email, then use the lists below to act on that account."
      />
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Card>
        <UserPicker user={selectedUser} onSelect={handleSelect} onClear={handleClear} />
        {loading && <p className="muted mt">Loading account…</p>}
      </Card>

      {subscription && selectedUser && (
        <>
          <Card className="mt">
            <h2 className="card-title">Account</h2>
            <table className="table">
              <tbody>
                <tr>
                  <th scope="row">Email</th>
                  <td>{selectedUser.email}</td>
                </tr>
                {selectedUser.name && (
                  <tr>
                    <th scope="row">Name</th>
                    <td>{selectedUser.name}</td>
                  </tr>
                )}
                <tr>
                  <th scope="row">Subscription</th>
                  <td>
                    <span className="badge badge-ok">{subscription.plan_code}</span>
                    <span className="table-sub"> · {subscription.status}</span>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Started</th>
                  <td>{new Date(subscription.starts_at).toLocaleDateString()}</td>
                </tr>
              </tbody>
            </table>
          </Card>

          <Card className="mt">
            <h2 className="card-title">Plans</h2>
            {plans.length === 0 ? (
              <EmptyState message="No plans configured." />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Code</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => {
                    const isCurrent = subscription.plan_code === p.code
                    return (
                      <tr key={p.id} className={isCurrent ? 'row-selected' : ''}>
                        <td>{p.name}</td>
                        <td><code>{p.code}</code></td>
                        <td className="actions">
                          {isCurrent ? (
                            <span className="badge badge-ok">Current</span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              disabled={busy === `plan-${p.code}`}
                              onClick={() => switchPlan(p.code)}
                            >
                              {busy === `plan-${p.code}` ? 'Switching…' : 'Switch here'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Card>

          <Card className="mt">
            <h2 className="card-title">Feature quotas</h2>
            {featureRows.length === 0 ? (
              <EmptyState message="No features configured." />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Usage</th>
                    <th>Limit</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {featureRows.map(({ feature, quota }) => (
                    <tr key={feature.id}>
                      <td>
                        <strong>{feature.name}</strong>
                        <div className="table-sub"><code>{feature.feature_key}</code></div>
                      </td>
                      <td>{quota?.usage_count ?? '—'}</td>
                      <td>
                        {quota ? (quota.quota_limit ?? '∞') : '—'}
                        {quota?.quota_period && (
                          <span className="table-sub"> / {quota.quota_period}</span>
                        )}
                      </td>
                      <td className="actions">
                        <div className="btn-row">
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            disabled={busy === `reset-${feature.feature_key}`}
                            onClick={() => resetQuota(feature.feature_key)}
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            disabled={busy === `grant-${feature.feature_key}`}
                            onClick={() => grantFeature(feature.feature_key)}
                          >
                            Grant override
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
            <p className="muted" style={{ marginBottom: '0.5rem' }}>Grant a new reward</p>
            <div className="btn-row mb">
              {REWARD_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="btn btn-sm btn-ghost"
                  disabled={busy === 'referral'}
                  onClick={() => grantReferral(preset)}
                >
                  {preset.split(' — ')[1] ?? preset}
                </button>
              ))}
            </div>
            <div className="btn-row">
              <input
                className="input-full"
                value={rewardDesc}
                onChange={(e) => setRewardDesc(e.target.value)}
                placeholder="Custom description…"
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={busy === 'referral' || !rewardDesc.trim()}
                onClick={() => grantReferral(rewardDesc)}
              >
                Grant custom
              </button>
            </div>
          </Card>
        </>
      )}
    </>
  )
}
