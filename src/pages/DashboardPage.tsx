import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { QuotaStats, TopicAnalytic, UserStats, VoiceCall } from '../api/types'
import { ADMIN_BASE } from '../routes'
import { Alert, Card, PageHeader, Spinner } from '../components/ui'

export function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [topics, setTopics] = useState<TopicAnalytic[]>([])
  const [calls, setCalls] = useState<VoiceCall[]>([])
  const [quota, setQuota] = useState<QuotaStats | null>(null)
  const [topicDays, setTopicDays] = useState(7)
  const [quotaPeriod, setQuotaPeriod] = useState('today')
  const [pendingBadgeRequests, setPendingBadgeRequests] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [userRes, topicRes, callRes, quotaRes, badgeReqRes] = await Promise.all([
        api.getUserStats(),
        api.getTopicAnalytics(topicDays),
        api.getCallHistory(topicDays),
        api.getQuotaStats(quotaPeriod),
        api.listBadgeRequests('pending'),
      ])
      setStats(userRes.stats)
      setTopics(topicRes.analytics ?? [])
      setCalls(callRes.calls ?? [])
      setQuota(quotaRes.stats)
      setPendingBadgeRequests(badgeReqRes.requests?.length ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [topicDays, quotaPeriod])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <Spinner />
  if (error) return <Alert variant="error">{error}</Alert>

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Server-side metrics and chat insights. Use Google Analytics 4 for DAU/WAU, retention, and in-app feature funnels."
        action={
          <button type="button" className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
        }
      />

      {pendingBadgeRequests > 0 && (
        <Alert variant="success">
          <strong>{pendingBadgeRequests} badge request{pendingBadgeRequests === 1 ? '' : 's'}</strong>{' '}
          waiting for review.{' '}
          <Link to={`${ADMIN_BASE}/community?tab=badge-requests`}>Review now →</Link>
        </Alert>
      )}

      <Card>
        <h2 className="card-title">Where to look</h2>
        <ul className="kv-list">
          <li>
            <span>GA4 (mobile app)</span>
            <span className="muted">DAU / WAU, retention, feature_used events</span>
          </li>
          <li>
            <span>This console</span>
            <span className="muted">Chat topics + sample questions, user counts, quota, testimonials</span>
          </li>
          <li>
            <span>
              <Link to={`${ADMIN_BASE}/feedback`}>Feedback</Link>
            </span>
            <span className="muted">Full testimonial text &amp; star ratings</span>
          </li>
        </ul>
      </Card>

      <div className="stat-grid">
        <Card>
          <span className="stat-label">Total users</span>
          <strong className="stat-value">{stats?.total_users ?? 0}</strong>
        </Card>
        <Card>
          <span className="stat-label">Chatted (7 days)</span>
          <strong className="stat-value">{stats?.active_users_7_days ?? 0}</strong>
          <span className="muted table-sub">Users who sent a chat message — not full DAU</span>
        </Card>
        <Card>
          <span className="stat-label">Chatted (30 days)</span>
          <strong className="stat-value">{stats?.active_users_30_days ?? 0}</strong>
          <span className="muted table-sub">See GA4 for all-app active users</span>
        </Card>
        <Card>
          <span className="stat-label">Quota usage ({quotaPeriod})</span>
          <strong className="stat-value">{quota?.total_usage ?? 0}</strong>
          <span className="muted table-sub">
            {quota?.users_at_limit ?? 0} at limit · {quota?.users_over_limit ?? 0} over
          </span>
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

      <Card>
        <div className="form inline-form">
          <label>
            Quota period
            <select value={quotaPeriod} onChange={(e) => setQuotaPeriod(e.target.value)}>
              <option value="today">today</option>
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
            </select>
          </label>
        </div>
      </Card>

      <div className="grid-2">
        <Card>
          <div className="btn-row" style={{ justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}>Top chat topics</h2>
            <label className="muted">
              Period{' '}
              <select
                value={topicDays}
                onChange={(e) => setTopicDays(Number(e.target.value))}
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </label>
          </div>
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
          <h2 className="card-title">Voice calls ({topicDays} days)</h2>
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
