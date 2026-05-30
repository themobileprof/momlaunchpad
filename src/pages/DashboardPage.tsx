import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { QuotaStats, TopicAnalytic, UserStats, VoiceCall } from '../api/types'
import { Alert, Card, PageHeader, Spinner } from '../components/ui'

export function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [topics, setTopics] = useState<TopicAnalytic[]>([])
  const [calls, setCalls] = useState<VoiceCall[]>([])
  const [quota, setQuota] = useState<QuotaStats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getUserStats(),
      api.getTopicAnalytics(7),
      api.getCallHistory(7),
      api.getQuotaStats('today'),
    ])
      .then(([userRes, topicRes, callRes, quotaRes]) => {
        setStats(userRes.stats)
        setTopics(topicRes.analytics ?? [])
        setCalls(callRes.calls ?? [])
        setQuota(quotaRes.stats)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (error) return <Alert variant="error">{error}</Alert>

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Platform health, usage, and conversation insights."
      />

      <div className="stat-grid">
        <Card>
          <span className="stat-label">Total users</span>
          <strong className="stat-value">{stats?.total_users ?? 0}</strong>
        </Card>
        <Card>
          <span className="stat-label">Active (7 days)</span>
          <strong className="stat-value">{stats?.active_users_7_days ?? 0}</strong>
        </Card>
        <Card>
          <span className="stat-label">Active (30 days)</span>
          <strong className="stat-value">{stats?.active_users_30_days ?? 0}</strong>
        </Card>
        <Card>
          <span className="stat-label">Usage today</span>
          <strong className="stat-value">{quota?.total_usage ?? 0}</strong>
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <h2 className="card-title">Users by plan</h2>
          <ul className="kv-list">
            {Object.entries(stats?.users_by_plan ?? {}).map(([plan, count]) => (
              <li key={plan}>
                <span>{plan}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="card-title">Users by language</h2>
          <ul className="kv-list">
            {Object.entries(stats?.users_by_language ?? {}).map(([lang, count]) => (
              <li key={lang}>
                <span>{lang}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <h2 className="card-title">Top chat topics (7 days)</h2>
          {topics.length === 0 ? (
            <p className="muted">No message data yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Count</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((t) => (
                  <tr key={t.intent}>
                    <td>
                      <code>{t.intent}</code>
                      {t.sample_query && (
                        <div className="table-sub muted">{t.sample_query.slice(0, 80)}…</div>
                      )}
                    </td>
                    <td>{t.count}</td>
                    <td>{t.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card>
          <h2 className="card-title">Voice calls (7 days)</h2>
          {calls.length === 0 ? (
            <p className="muted">No voice calls recorded.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {calls.slice(0, 10).map((c) => (
                  <tr key={c.call_sid}>
                    <td>{c.user_email || c.user_id}</td>
                    <td>{c.duration_seconds}s</td>
                    <td>{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  )
}
