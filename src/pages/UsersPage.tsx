import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAdminConfig } from '../context/AdminConfigContext'
import { useAuth } from '../context/AuthContext'
import { UserPicker } from '../components/UserPicker'
import { UserRoleBadges } from '../components/UserRoleBadges'
import { ADMIN_BASE } from '../routes'
import { isTestUser } from '../lib/testUser'
import type {
  AdminUserSummary,
  Feature,
  Plan,
  QuotaInfo,
  ReferralRewardRecord,
  UserSubscription,
} from '../api/types'
import { Alert, Card, EmptyState, PageHeader, Spinner } from '../components/ui'

type FeatureRow = {
  feature: Feature
  quota: QuotaInfo | null
}

const PAGE_SIZE = 100

export function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user: currentAdmin } = useAuth()
  const { config, loading: configLoading } = useAdminConfig()
  const [allUsers, setAllUsers] = useState<AdminUserSummary[]>([])
  const [listOffset, setListOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [listLoading, setListLoading] = useState(true)
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
  const [grantExpiresAt, setGrantExpiresAt] = useState('')
  const [hideTestUsers, setHideTestUsers] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)

  const testUserCount = allUsers.filter((u) => isTestUser(u)).length
  const visibleUsers = hideTestUsers ? allUsers.filter((u) => !isTestUser(u)) : allUsers

  const rewardPresets = config?.referral_reward_presets ?? []

  const loadUserList = useCallback(async (offset: number, append: boolean) => {
    setListLoading(true)
    setError('')
    try {
      const res = await api.listUsers(PAGE_SIZE, offset)
      const batch = res.users ?? []
      setAllUsers((prev) => (append ? [...prev, ...batch] : batch))
      setListOffset(offset)
      setHasMore(batch.length >= PAGE_SIZE)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUserList(0, false)
  }, [loadUserList])

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

  function selectUser(user: AdminUserSummary) {
    setUserId(user.id)
    setSelectedUser(user)
    setSearchParams({ email: user.email }, { replace: true })
    void loadUser(user.id)
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  useEffect(() => {
    const email = searchParams.get('email')?.trim()
    if (!email || !email.includes('@')) return
    if (selectedUser?.email.toLowerCase() === email.toLowerCase()) return
    void api.lookupUserByEmail(email).then((res) => {
      const match = res.users?.[0]
      if (match) {
        setUserId(match.id)
        setSelectedUser(match)
        void loadUser(match.id)
      }
    })
  }, [searchParams, selectedUser?.email, loadUser])

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
      await loadUserList(0, false)
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
      const expires_at = grantExpiresAt
        ? Math.floor(new Date(grantExpiresAt).getTime() / 1000)
        : undefined
      await api.grantFeature(userId, featureKey, expires_at)
      setMessage(
        expires_at
          ? `Granted ${featureKey} until ${new Date(expires_at * 1000).toLocaleString()}.`
          : `Granted ${featureKey}.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grant failed')
    } finally {
      setBusy(null)
    }
  }

  async function grantReferralForUser(target: AdminUserSummary, description: string) {
    setBusy(`referral-${target.id}`)
    setError('')
    try {
      await api.grantReferralReward(target.id, description.trim())
      setMessage(`Referral reward granted for ${target.email}.`)
      await loadUserList(0, false)
      if (userId === target.id) {
        const res = await api.listUserReferralRewards(target.id)
        setReferralRewards(res.rewards ?? [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Referral grant failed')
    } finally {
      setBusy(null)
    }
  }

  async function grantReferralSelected(description: string) {
    if (!selectedUser) return
    await grantReferralForUser(selectedUser, description)
    setRewardDesc('')
  }

  async function toggleAdminRole(makeAdmin: boolean) {
    if (!selectedUser) return
    if (!makeAdmin && selectedUser.id === currentAdmin?.id) {
      setError('You cannot remove your own admin access.')
      return
    }
    const action = makeAdmin ? 'promote' : 'demote'
    if (
      !confirm(
        `${makeAdmin ? 'Promote' : 'Remove admin access for'} ${selectedUser.email}?`,
      )
    ) {
      return
    }
    setBusy(`admin-${action}`)
    setError('')
    try {
      await api.setUserAdmin(selectedUser.id, makeAdmin)
      setMessage(
        makeAdmin
          ? `${selectedUser.email} is now an admin.`
          : `Admin access removed for ${selectedUser.email}.`,
      )
      setSelectedUser({ ...selectedUser, is_admin: makeAdmin })
      await loadUserList(0, false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin update failed')
    } finally {
      setBusy(null)
    }
  }

  async function deleteSelectedUser() {
    if (!selectedUser) return
    if (selectedUser.id === currentAdmin?.id) {
      setError('You cannot delete your own account.')
      return
    }
    if (selectedUser.is_admin) {
      setError('Remove admin access before deleting an admin account, or delete a non-admin user.')
      return
    }
    if (
      !confirm(
        `Soft-delete ${selectedUser.email}? They will be signed out and hidden from the app; their email can be used to register again.`,
      )
    ) {
      return
    }
    setBusy('delete-user')
    setError('')
    try {
      await api.deleteUser(selectedUser.id)
      setMessage(`${selectedUser.email} was deleted.`)
      setSelectedUser(null)
      setUserId('')
      setSubscription(null)
      setFeatureRows([])
      setReferralRewards([])
      await loadUserList(0, false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusy(null)
    }
  }

  if (configLoading && !config) return <Spinner />

  return (
    <>
      <PageHeader
        title="User management"
        description="Real members and demo test accounts (@momlaunchpad.com) are labeled in the list below."
        action={
          <button type="button" className="btn btn-ghost" onClick={() => loadUserList(0, false)}>
            Refresh list
          </button>
        }
      />
      {testUserCount > 0 && (
        <Alert variant="info">
          {testUserCount} demo test account{testUserCount === 1 ? '' : 's'} (@momlaunchpad.com).
          Verified community badges are not granted automatically — use{' '}
          <Link to={`${ADMIN_BASE}/community?tab=badges`}>Community → Grant badges</Link> after seeding.
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Card>
        <div className="card-title-row">
          <h2 className="card-title">All users</h2>
          {testUserCount > 0 && (
            <label className="checkbox-inline muted">
              <input
                type="checkbox"
                checked={hideTestUsers}
                onChange={(e) => setHideTestUsers(e.target.checked)}
              />
              Hide test accounts ({testUserCount})
            </label>
          )}
        </div>
        {listLoading && allUsers.length === 0 ? (
          <Spinner />
        ) : visibleUsers.length === 0 ? (
          <EmptyState
            message={
              hideTestUsers && allUsers.length > 0
                ? 'All loaded users are test accounts. Uncheck “Hide test accounts” to show them.'
                : 'No users yet.'
            }
          />
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Language</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => {
                  const isSelected = selectedUser?.id === user.id
                  const pendingPoints = user.referral_reward_points ?? 0
                  const testAccount = isTestUser(user)
                  return (
                    <tr
                      key={user.id}
                      className={[isSelected ? 'row-selected' : '', testAccount ? 'row-test' : '']
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <td>
                        <div>{user.name || '—'}</div>
                        <div className="table-sub">{user.email}</div>
                        <UserRoleBadges user={user} />
                        {pendingPoints > 0 && (
                          <div className="table-sub">{pendingPoints} referral pts</div>
                        )}
                      </td>
                      <td>
                        {user.plan_code ? (
                          <code>{user.plan_code}</code>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>{user.language}</td>
                      <td>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="actions">
                        <div className="btn-row">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => selectUser(user)}
                          >
                            {isSelected ? 'Selected' : 'Manage'}
                          </button>
                          {pendingPoints > 0 && rewardPresets[0] && (
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              disabled={busy === `referral-${user.id}`}
                              onClick={() =>
                                grantReferralForUser(user, rewardPresets[0].description)
                              }
                            >
                              {busy === `referral-${user.id}`
                                ? '…'
                                : rewardPresets[0].label}
                            </button>
                          )}
                          <Link
                            to={`${ADMIN_BASE}/community`}
                            className="btn btn-sm btn-ghost"
                          >
                            Community
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {hasMore && (
              <div className="mt">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={listLoading}
                  onClick={() => loadUserList(listOffset + PAGE_SIZE, true)}
                >
                  {listLoading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      <Card className="mt">
        <h2 className="card-title">Find by email</h2>
        <UserPicker
          user={selectedUser}
          onSelect={selectUser}
          onClear={handleClear}
        />
      </Card>

      <div ref={detailRef}>
        {loading && <p className="muted mt">Loading account…</p>}

        {subscription && selectedUser && (
          <>
            <Card className="mt">
              <h2 className="card-title">Account — {selectedUser.email}</h2>
              {isTestUser(selectedUser) && (
                <Alert variant="info">
                  Demo test account. Grant verified badges manually in{' '}
                  <Link
                    to={`${ADMIN_BASE}/community?tab=badges&email=${encodeURIComponent(selectedUser.email)}`}
                  >
                    Community → Grant badges
                  </Link>
                  .
                </Alert>
              )}
              <table className="table">
                <tbody>
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
                  {selectedUser.referral_code && (
                    <tr>
                      <th scope="row">Referral code</th>
                      <td><code>{selectedUser.referral_code}</code></td>
                    </tr>
                  )}
                  {(selectedUser.referral_reward_points ?? 0) > 0 && (
                    <tr>
                      <th scope="row">Pending referral points</th>
                      <td>{selectedUser.referral_reward_points}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="btn-row mt">
                <Link
                  to={`${ADMIN_BASE}/community?tab=badges`}
                  className="btn btn-sm btn-ghost"
                >
                  Manage badges
                </Link>
                <Link to={`${ADMIN_BASE}/community`} className="btn btn-sm btn-ghost">
                  Community tools
                </Link>
              </div>
            </Card>

            <Card className="mt">
              <h2 className="card-title">Admin access</h2>
              <p className="muted mb">
                {selectedUser.is_admin
                  ? 'This account can sign in to the admin console.'
                  : 'This account is a regular member only.'}
              </p>
              <div className="btn-row">
                {selectedUser.is_admin ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    disabled={
                      busy === 'admin-demote' || selectedUser.id === currentAdmin?.id
                    }
                    onClick={() => toggleAdminRole(false)}
                  >
                    {busy === 'admin-demote' ? '…' : 'Remove admin access'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    disabled={busy === 'admin-promote'}
                    onClick={() => toggleAdminRole(true)}
                  >
                    {busy === 'admin-promote' ? '…' : 'Promote to admin'}
                  </button>
                )}
                {selectedUser.id === currentAdmin?.id && (
                  <span className="muted table-sub">You cannot demote your own account.</span>
                )}
              </div>
            </Card>

            <Card className="mt danger-zone">
              <h2 className="card-title">Delete account</h2>
              <p className="muted mb">
                Soft-deletes this user: they cannot sign in, disappear from admin lists, and their
                email can be used for a new registration. Community posts remain but are hidden
                from feeds while the author is deleted.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                disabled={
                  busy === 'delete-user' ||
                  selectedUser.id === currentAdmin?.id ||
                  selectedUser.is_admin
                }
                onClick={() => deleteSelectedUser()}
              >
                {busy === 'delete-user' ? '…' : 'Delete user'}
              </button>
              {selectedUser.is_admin && (
                <p className="muted table-sub mt">
                  Admin accounts cannot be deleted from the console.
                </p>
              )}
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
              <label className="mb" style={{ display: 'block' }}>
                Optional expiry for feature grants
                <input
                  type="datetime-local"
                  value={grantExpiresAt}
                  onChange={(e) => setGrantExpiresAt(e.target.value)}
                  style={{ width: '100%', marginTop: '0.35rem' }}
                />
                <span className="muted table-sub">
                  Leave empty for a permanent override.
                </span>
              </label>
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
              {rewardPresets.length > 0 && (
                <>
                  <p className="muted" style={{ marginBottom: '0.5rem' }}>Grant a new reward</p>
                  <div className="btn-row mb">
                    {rewardPresets.map((preset) => (
                      <button
                        key={preset.description}
                        type="button"
                        className="btn btn-sm btn-ghost"
                        disabled={busy?.startsWith('referral')}
                        onClick={() => grantReferralSelected(preset.description)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
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
                  disabled={busy?.startsWith('referral') || !rewardDesc.trim()}
                  onClick={() => grantReferralSelected(rewardDesc)}
                >
                  Grant custom
                </button>
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  )
}
