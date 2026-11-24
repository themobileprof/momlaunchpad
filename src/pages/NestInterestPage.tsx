import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { NestInterestResponse } from '../api/types'
import { ADMIN_BASE } from '../routes'
import { Alert, Card, EmptyState, PageHeader, Spinner } from '../components/ui'

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function label(interested: string) {
  switch (interested) {
    case 'yes':
      return 'Yes'
    case 'no':
      return 'No'
    case 'maybe':
      return 'Maybe'
    default:
      return interested
  }
}

export function NestInterestPage() {
  const [items, setItems] = useState<NestInterestResponse[]>([])
  const [stats, setStats] = useState({ total: 0, yes: 0, no: 0, maybe: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.listNestInterest()
      setItems(res.responses ?? [])
      setStats(res.stats ?? { total: 0, yes: 0, no: 0, maybe: 0 })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load nest interest')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <Spinner />

  return (
    <>
      <PageHeader
        title="Delivery nest interest"
        description="Survey answers from moms while Nest is not yet live. Use this to decide build priority."
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
          <strong className="stat-value">{stats.total}</strong>
        </Card>
        <Card>
          <span className="stat-label">Yes</span>
          <strong className="stat-value">{stats.yes}</strong>
        </Card>
        <Card>
          <span className="stat-label">Maybe</span>
          <strong className="stat-value">{stats.maybe}</strong>
        </Card>
        <Card>
          <span className="stat-label">No</span>
          <strong className="stat-value">{stats.no}</strong>
        </Card>
      </div>

      <Card>
        {items.length === 0 ? (
          <EmptyState message="No nest interest answers yet. Moms submit from Delivery nest in the app." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Want Nest?</th>
                <th>More info</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div>{r.user_name || '—'}</div>
                    <div className="table-sub">
                      {r.user_email ? (
                        <Link
                          to={`${ADMIN_BASE}/users?email=${encodeURIComponent(r.user_email)}`}
                        >
                          {r.user_email}
                        </Link>
                      ) : (
                        r.user_id
                      )}
                    </div>
                  </td>
                  <td>{label(r.interested)}</td>
                  <td>{r.more_info?.trim() || <span className="muted">—</span>}</td>
                  <td className="muted">{formatDate(r.updated_at || r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  )
}
