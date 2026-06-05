import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { UserFeedback } from '../api/types'
import { ADMIN_BASE } from '../routes'
import { Alert, Card, EmptyState, PageHeader, Spinner } from '../components/ui'

function stars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function FeedbackPage() {
  const [items, setItems] = useState<UserFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.listFeedback()
      setItems(res.feedback ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <Spinner />

  const avgRating =
    items.length > 0
      ? (items.reduce((s, f) => s + f.rating, 0) / items.length).toFixed(1)
      : '—'

  return (
    <>
      <PageHeader
        title="Feedback & testimonials"
        description="Full ratings and written quotes from the app. GA4 only stores rating metadata — read testimonials here."
        action={
          <button type="button" className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
        }
      />
      {error && <Alert variant="error">{error}</Alert>}

      <div className="stat-grid">
        <Card>
          <span className="stat-label">Total responses</span>
          <strong className="stat-value">{items.length}</strong>
        </Card>
        <Card>
          <span className="stat-label">Average rating</span>
          <strong className="stat-value">{avgRating}</strong>
        </Card>
        <Card>
          <span className="stat-label">With written text</span>
          <strong className="stat-value">
            {items.filter((f) => f.message?.trim()).length}
          </strong>
        </Card>
      </div>

      <Card>
        {items.length === 0 ? (
          <EmptyState message="No feedback yet. Users submit from Settings → Send Feedback in the app." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id}>
                  <td>
                    <div>{f.user_name || '—'}</div>
                    <div className="table-sub">
                      {f.user_email ? (
                        <Link to={`${ADMIN_BASE}/users?email=${encodeURIComponent(f.user_email)}`}>
                          {f.user_email}
                        </Link>
                      ) : (
                        f.user_id
                      )}
                    </div>
                  </td>
                  <td>
                    <span title={`${f.rating} / 5`}>{stars(f.rating)}</span>
                  </td>
                  <td>{f.message?.trim() || <span className="muted">—</span>}</td>
                  <td className="muted">{formatDate(f.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  )
}
