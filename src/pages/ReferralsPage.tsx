import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { ReferralLeaderboardEntry } from '../api/types'
import { ADMIN_BASE } from '../routes'
import { Alert, Card, EmptyState, PageHeader, Spinner } from '../components/ui'

const GRANT_PRESETS = [
  { label: 'Gift card', description: 'Monthly top referrer — gift card' },
  { label: 'Account credit', description: 'Referral milestone — account credit' },
]

export function ReferralsPage() {
  const [entries, setEntries] = useState<ReferralLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

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

  if (loading) return <Spinner />

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
                      {GRANT_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
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
