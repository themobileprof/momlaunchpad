import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { ReferralLeaderboardEntry } from '../api/types'
import { Alert, Card, EmptyState, PageHeader, Spinner } from '../components/ui'

export function ReferralsPage() {
  const [entries, setEntries] = useState<ReferralLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [rewardDesc, setRewardDesc] = useState<Record<string, string>>({})

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

  async function grant(userId: string, e: FormEvent) {
    e.preventDefault()
    const description = rewardDesc[userId]?.trim()
    if (!description) return
    setError('')
    try {
      await api.grantReferralReward(userId, description)
      setMessage(`Reward granted for ${userId}.`)
      setRewardDesc((prev) => ({ ...prev, [userId]: '' }))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grant failed')
    }
  }

  if (loading) return <Spinner />

  return (
    <>
      <PageHeader
        title="Referrals"
        description="Users with pending referral reward points — grant rewards to clear their balance."
        action={
          <button type="button" className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
        }
      />
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

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
                <th>Grant reward</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.user_id}>
                  <td>
                    <div>{entry.name || entry.email}</div>
                    <div className="table-sub">
                      <code>{entry.user_id}</code>
                    </div>
                  </td>
                  <td>
                    <code>{entry.referral_code}</code>
                  </td>
                  <td>{entry.total_referrals}</td>
                  <td>
                    <strong>{entry.referral_reward_points}</strong>
                  </td>
                  <td>
                    <form className="form inline-form" onSubmit={(e) => grant(entry.user_id, e)}>
                      <label className="flex-grow">
                        Description
                        <input
                          value={rewardDesc[entry.user_id] ?? ''}
                          onChange={(e) =>
                            setRewardDesc((prev) => ({
                              ...prev,
                              [entry.user_id]: e.target.value,
                            }))
                          }
                          placeholder="e.g. $50 gift card — March 2026"
                          required
                        />
                      </label>
                      <button type="submit" className="btn btn-primary btn-sm">
                        Grant
                      </button>
                    </form>
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
