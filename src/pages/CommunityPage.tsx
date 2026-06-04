import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type {
  CatalogKeyLabel,
  CommunityInterest,
  CommunityReport,
} from '../api/types'
import { Tabs } from '../components/Tabs'
import { Alert, Card, EmptyState, PageHeader, Spinner } from '../components/ui'

const REPORT_STATUSES = ['open', 'reviewed', 'dismissed', 'actioned'] as const
const POST_STATUSES = ['active', 'hidden', 'removed', 'pending_review'] as const

type CatalogKind = 'interest-groups' | 'interests' | 'badge-types' | 'event-types' | 'countries'

export function CommunityPage() {
  const [tab, setTab] = useState('reports')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [reportFilter, setReportFilter] = useState('open')
  const [reports, setReports] = useState<CommunityReport[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)

  const [postId, setPostId] = useState('')
  const [postStatus, setPostStatus] = useState('hidden')

  const [badgeUserId, setBadgeUserId] = useState('')
  const [badgeType, setBadgeType] = useState('')

  const [catalogKind, setCatalogKind] = useState<CatalogKind>('interest-groups')
  const [catalogRows, setCatalogRows] = useState<CatalogKeyLabel[] | CommunityInterest[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogForm, setCatalogForm] = useState({
    key: '',
    label: '',
    group_key: '',
    description: '',
    sort_order: '0',
    is_enabled: true,
  })

  const loadReports = useCallback(async () => {
    setReportsLoading(true)
    setError('')
    try {
      const res = await api.listCommunityReports(reportFilter)
      setReports(res.reports ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports')
    } finally {
      setReportsLoading(false)
    }
  }, [reportFilter])

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true)
    setError('')
    try {
      switch (catalogKind) {
        case 'interest-groups': {
          const res = await api.listInterestGroups()
          setCatalogRows(res.interest_groups ?? [])
          break
        }
        case 'interests': {
          const res = await api.listCatalogInterests()
          setCatalogRows(res.interests ?? [])
          break
        }
        case 'badge-types': {
          const res = await api.listBadgeTypes()
          setCatalogRows(res.badge_types ?? [])
          break
        }
        case 'event-types': {
          const res = await api.listEventTypes()
          setCatalogRows(res.event_types ?? [])
          break
        }
        case 'countries': {
          const res = await api.listCatalogCountries()
          setCatalogRows(
            (res.countries ?? []).map((c) => ({
              key: c.code,
              label: c.name,
              sort_order: c.sort_order,
              is_enabled: c.is_enabled,
            })),
          )
          break
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load catalog')
    } finally {
      setCatalogLoading(false)
    }
  }, [catalogKind])

  useEffect(() => {
    if (tab === 'reports') loadReports()
  }, [tab, loadReports])

  useEffect(() => {
    if (tab === 'catalog') loadCatalog()
  }, [tab, catalogKind, loadCatalog])

  async function updateReport(id: string, status: string) {
    setError('')
    try {
      await api.updateCommunityReport(id, status)
      setMessage(`Report marked ${status}.`)
      await loadReports()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    }
  }

  async function handlePostStatus(e: FormEvent) {
    e.preventDefault()
    if (!postId.trim()) return
    setError('')
    try {
      await api.updateCommunityPostStatus(postId.trim(), postStatus)
      setMessage(`Post ${postId} set to ${postStatus}.`)
      setPostId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Post update failed')
    }
  }

  async function grantBadge(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.grantCommunityBadge(badgeUserId.trim(), badgeType.trim())
      setMessage('Badge granted.')
      setBadgeType('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grant failed')
    }
  }

  async function revokeBadge(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.revokeCommunityBadge(badgeUserId.trim(), badgeType.trim())
      setMessage('Badge revoked.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed')
    }
  }

  function startEditCatalog(row: CatalogKeyLabel | CommunityInterest) {
    const interest = row as CommunityInterest
    setCatalogForm({
      key: row.key,
      label: row.label,
      group_key: interest.group_key ?? '',
      description: row.description ?? '',
      sort_order: String(row.sort_order ?? 0),
      is_enabled: row.is_enabled,
    })
  }

  async function saveCatalog(e: FormEvent) {
    e.preventDefault()
    const key = catalogForm.key.trim()
    if (!key || !catalogForm.label.trim()) return
    const sort_order = parseInt(catalogForm.sort_order, 10) || 0
    const payload = {
      label: catalogForm.label.trim(),
      sort_order,
      is_enabled: catalogForm.is_enabled,
    }
    setError('')
    try {
      switch (catalogKind) {
        case 'interest-groups':
          await api.upsertInterestGroup(key, payload)
          break
        case 'interests':
          await api.upsertCatalogInterest(key, {
            ...payload,
            group_key: catalogForm.group_key.trim(),
          })
          break
        case 'badge-types':
          await api.upsertBadgeType(key, {
            ...payload,
            description: catalogForm.description.trim() || undefined,
          })
          break
        case 'event-types':
          await api.upsertEventType(key, {
            ...payload,
            description: catalogForm.description.trim() || undefined,
          })
          break
        case 'countries':
          await api.upsertCatalogCountry(key.toUpperCase(), {
            name: catalogForm.label.trim(),
            sort_order,
            is_enabled: catalogForm.is_enabled,
          })
          break
      }
      setMessage('Catalog entry saved.')
      setCatalogForm({
        key: '',
        label: '',
        group_key: '',
        description: '',
        sort_order: '0',
        is_enabled: true,
      })
      await loadCatalog()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  return (
    <>
      <PageHeader
        title="Community"
        description="Moderation queue, post visibility, expert badges, and onboarding catalog."
      />
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'reports', label: 'Reports' },
          { id: 'posts', label: 'Posts' },
          { id: 'badges', label: 'Badges' },
          { id: 'catalog', label: 'Catalog' },
        ]}
      />

      {tab === 'reports' && (
        <Card className="mt">
          <div className="form inline-form" style={{ marginBottom: '1rem' }}>
            <label>
              Status filter
              <select
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value)}
              >
                {REPORT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn btn-ghost" onClick={loadReports}>
              Refresh
            </button>
          </div>
          {reportsLoading ? (
            <Spinner />
          ) : reports.length === 0 ? (
            <EmptyState message="No reports for this filter." />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <code>{r.target_type}</code>
                      <div className="table-sub">
                        <code>{r.target_id}</code>
                      </div>
                    </td>
                    <td>
                      {r.reason}
                      {r.details && <div className="table-sub">{r.details}</div>}
                    </td>
                    <td>
                      <span className="badge">{r.status}</span>
                    </td>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                    <td className="actions">
                      {r.status === 'open' && (
                        <div className="btn-row">
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => updateReport(r.id, 'reviewed')}
                          >
                            Reviewed
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => updateReport(r.id, 'dismissed')}
                          >
                            Dismiss
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => updateReport(r.id, 'actioned')}
                          >
                            Actioned
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 'posts' && (
        <Card className="mt">
          <h2 className="card-title">Update post status</h2>
          <form className="form" onSubmit={handlePostStatus}>
            <label>
              Post ID
              <input
                value={postId}
                onChange={(e) => setPostId(e.target.value)}
                placeholder="UUID"
                required
              />
            </label>
            <label>
              Status
              <select value={postStatus} onChange={(e) => setPostStatus(e.target.value)}>
                {POST_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn btn-primary">
              Apply
            </button>
          </form>
        </Card>
      )}

      {tab === 'badges' && (
        <Card className="mt">
          <h2 className="card-title">User badges</h2>
          <form className="form" onSubmit={grantBadge}>
            <label>
              User ID
              <input
                value={badgeUserId}
                onChange={(e) => setBadgeUserId(e.target.value)}
                placeholder="UUID"
                required
              />
            </label>
            <label>
              Badge type key
              <input
                value={badgeType}
                onChange={(e) => setBadgeType(e.target.value)}
                placeholder="expert_obgyn"
                required
              />
            </label>
            <div className="btn-row">
              <button type="submit" className="btn btn-primary">
                Grant badge
              </button>
              <button type="button" className="btn btn-danger" onClick={revokeBadge}>
                Revoke badge
              </button>
            </div>
          </form>
        </Card>
      )}

      {tab === 'catalog' && (
        <div className="grid-2 mt">
          <Card>
            <div className="form inline-form" style={{ marginBottom: '1rem' }}>
              <label>
                Catalog
                <select
                  value={catalogKind}
                  onChange={(e) => setCatalogKind(e.target.value as CatalogKind)}
                >
                  <option value="interest-groups">Interest groups</option>
                  <option value="interests">Interests</option>
                  <option value="badge-types">Badge types</option>
                  <option value="event-types">Event types</option>
                  <option value="countries">Countries</option>
                </select>
              </label>
            </div>
            {catalogLoading ? (
              <Spinner />
            ) : catalogRows.length === 0 ? (
              <EmptyState message="No catalog entries." />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Label</th>
                    <th>Enabled</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {catalogRows.map((row) => (
                    <tr key={row.key}>
                      <td>
                        <code>{row.key}</code>
                        {'group_key' in row && row.group_key && (
                          <div className="table-sub">group: {row.group_key}</div>
                        )}
                      </td>
                      <td>{row.label}</td>
                      <td>{row.is_enabled ? 'Yes' : 'No'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => startEditCatalog(row)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card>
            <h2 className="card-title">
              {catalogForm.key ? `Edit ${catalogForm.key}` : 'Add / upsert entry'}
            </h2>
            <form className="form" onSubmit={saveCatalog}>
              <label>
                Key
                <input
                  value={catalogForm.key}
                  onChange={(e) => setCatalogForm({ ...catalogForm, key: e.target.value })}
                  required
                  disabled={catalogKind === 'countries' && !!catalogForm.key}
                  placeholder="stable_key"
                />
              </label>
              <label>
                {catalogKind === 'countries' ? 'Country name' : 'Label'}
                <input
                  value={catalogForm.label}
                  onChange={(e) => setCatalogForm({ ...catalogForm, label: e.target.value })}
                  required
                />
              </label>
              {catalogKind === 'interests' && (
                <label>
                  Group key
                  <input
                    value={catalogForm.group_key}
                    onChange={(e) =>
                      setCatalogForm({ ...catalogForm, group_key: e.target.value })
                    }
                    required
                  />
                </label>
              )}
              {(catalogKind === 'badge-types' || catalogKind === 'event-types') && (
                <label>
                  Description
                  <textarea
                    value={catalogForm.description}
                    onChange={(e) =>
                      setCatalogForm({ ...catalogForm, description: e.target.value })
                    }
                  />
                </label>
              )}
              <label>
                Sort order
                <input
                  type="number"
                  value={catalogForm.sort_order}
                  onChange={(e) =>
                    setCatalogForm({ ...catalogForm, sort_order: e.target.value })
                  }
                />
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={catalogForm.is_enabled}
                  onChange={(e) =>
                    setCatalogForm({ ...catalogForm, is_enabled: e.target.checked })
                  }
                />
                Enabled
              </label>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </form>
          </Card>
        </div>
      )}
    </>
  )
}
