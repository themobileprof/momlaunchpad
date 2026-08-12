import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAdminConfig } from '../context/AdminConfigContext'
import type {
  AdminUserSummary,
  CatalogKeyLabel,
  CommunityBadgeHolder,
  CommunityBadgeRequest,
  CommunityCountry,
  CommunityInterest,
  CommunityRegion,
  CommunityReport,
  CommunityUserBadge,
  FacilityAdminClaim,
} from '../api/types'
import { ADMIN_BASE } from '../routes'
import { Tabs } from '../components/Tabs'
import { UserPicker } from '../components/UserPicker'
import { Alert, Card, EmptyState, PageHeader, Spinner } from '../components/ui'
import { usePendingBadgeRequests } from '../hooks/usePendingBadgeRequests'
import { formatBadgeRequestDetails, formatUserLocation } from '../lib/badgeRequestFormat'

const COMMUNITY_TABS = [
  'reports',
  'badge-requests',
  'facility-admins',
  'verified',
  'badges',
  'catalog',
] as const
type CommunityTab = (typeof COMMUNITY_TABS)[number]

function isCommunityTab(value: string | null): value is CommunityTab {
  return COMMUNITY_TABS.includes(value as CommunityTab)
}

export function CommunityPage() {
  const { config, loading: configLoading } = useAdminConfig()
  const { count: pendingBadgeCount, reload: reloadPendingCount } = usePendingBadgeRequests()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [tab, setTab] = useState<CommunityTab>(
    isCommunityTab(tabFromUrl) ? tabFromUrl : 'reports',
  )
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [reportFilter, setReportFilter] = useState('')
  const [reports, setReports] = useState<CommunityReport[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)

  const [badgeUserId, setBadgeUserId] = useState('')
  const [badgeUser, setBadgeUser] = useState<AdminUserSummary | null>(null)
  const [badgeTypes, setBadgeTypes] = useState<CatalogKeyLabel[]>([])
  const [userBadges, setUserBadges] = useState<CommunityUserBadge[]>([])
  const [badgesLoading, setBadgesLoading] = useState(false)
  const [badgeBusy, setBadgeBusy] = useState<string | null>(null)
  const [postBusy, setPostBusy] = useState<string | null>(null)

  const [requestFilter, setRequestFilter] = useState('pending')
  const [badgeRequests, setBadgeRequests] = useState<CommunityBadgeRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestNotes, setRequestNotes] = useState<Record<string, string>>({})
  const [requestBusy, setRequestBusy] = useState<string | null>(null)

  const [facilityClaimFilter, setFacilityClaimFilter] = useState('pending')
  const [facilityClaims, setFacilityClaims] = useState<FacilityAdminClaim[]>([])
  const [facilityClaimsLoading, setFacilityClaimsLoading] = useState(false)
  const [facilityClaimNotes, setFacilityClaimNotes] = useState<Record<string, string>>({})
  const [facilityClaimBusy, setFacilityClaimBusy] = useState<string | null>(null)

  const [verifiedFilter, setVerifiedFilter] = useState('')
  const [holders, setHolders] = useState<CommunityBadgeHolder[]>([])
  const [holdersLoading, setHoldersLoading] = useState(false)

  function changeTab(next: CommunityTab) {
    setTab(next)
    setSearchParams({ tab: next }, { replace: true })
  }

  useEffect(() => {
    if (isCommunityTab(tabFromUrl) && tabFromUrl !== tab) {
      setTab(tabFromUrl)
    }
  }, [tabFromUrl, tab])

  const [catalogKind, setCatalogKind] = useState('')
  const [catalogRows, setCatalogRows] = useState<CatalogKeyLabel[] | CommunityInterest[]>([])
  const [regionRows, setRegionRows] = useState<CommunityRegion[]>([])
  const [catalogCountries, setCatalogCountries] = useState<CommunityCountry[]>([])
  const [regionCountryFilter, setRegionCountryFilter] = useState('')
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogForm, setCatalogForm] = useState({
    key: '',
    label: '',
    group_key: '',
    description: '',
    country_code: '',
    region_code: '',
    region_id: '',
    sort_order: '0',
    is_enabled: true,
  })

  const reportStatuses = config?.report_statuses ?? []
  const postStatuses = config?.post_statuses ?? []
  const catalogSections =
    config?.catalog_sections?.some((s) => s.id === 'regions')
      ? (config?.catalog_sections ?? [])
      : [...(config?.catalog_sections ?? []), { id: 'regions', label: 'Regions' }]

  useEffect(() => {
    if (config?.default_report_status) {
      setReportFilter((prev) => prev || config.default_report_status)
    }
    if (config?.catalog_sections[0]?.id) {
      setCatalogKind((prev) => prev || config.catalog_sections[0].id)
    }
  }, [config])

  const loadReports = useCallback(async () => {
    if (!reportFilter) return
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
          setCatalogCountries(res.countries ?? [])
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
        case 'regions': {
          const [countriesRes, regionsRes] = await Promise.all([
            api.listCatalogCountries(),
            api.listCatalogRegions(regionCountryFilter || undefined),
          ])
          setCatalogCountries(countriesRes.countries ?? [])
          setRegionRows(regionsRes.regions ?? [])
          setCatalogRows([])
          break
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load catalog')
    } finally {
      setCatalogLoading(false)
    }
  }, [catalogKind, regionCountryFilter])

  useEffect(() => {
    if (tab === 'reports') loadReports()
  }, [tab, loadReports])

  useEffect(() => {
    if (tab === 'catalog') loadCatalog()
  }, [tab, catalogKind, loadCatalog])

  const loadBadgeTypes = useCallback(async () => {
    const res = await api.listBadgeTypes()
    setBadgeTypes(res.badge_types ?? [])
  }, [])

  const loadUserBadges = useCallback(async (uid: string) => {
    setBadgesLoading(true)
    setError('')
    try {
      const res = await api.listUserBadges(uid)
      setUserBadges(res.badges ?? [])
    } catch (e) {
      setUserBadges([])
      setError(e instanceof Error ? e.message : 'Failed to load user badges')
    } finally {
      setBadgesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!badgeUserId) {
      setUserBadges([])
      return
    }
    void loadUserBadges(badgeUserId)
  }, [badgeUserId, loadUserBadges])

  const loadBadgeRequests = useCallback(async () => {
    setRequestsLoading(true)
    setError('')
    try {
      const res = await api.listBadgeRequests(requestFilter)
      setBadgeRequests(res.requests ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load badge requests')
    } finally {
      setRequestsLoading(false)
    }
  }, [requestFilter])

  const loadFacilityClaims = useCallback(async () => {
    setFacilityClaimsLoading(true)
    setError('')
    try {
      const res = await api.listFacilityAdminClaims(facilityClaimFilter)
      setFacilityClaims(res.claims ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load facility admin claims')
    } finally {
      setFacilityClaimsLoading(false)
    }
  }, [facilityClaimFilter])

  useEffect(() => {
    if (tab !== 'badges' && tab !== 'badge-requests' && tab !== 'verified') return
    void loadBadgeTypes()
  }, [tab, loadBadgeTypes])

  const loadHolders = useCallback(async () => {
    setHoldersLoading(true)
    setError('')
    try {
      const res = await api.listBadgeHolders(verifiedFilter || undefined)
      setHolders(res.holders ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load verified members')
    } finally {
      setHoldersLoading(false)
    }
  }, [verifiedFilter])

  useEffect(() => {
    if (tab === 'verified') void loadHolders()
  }, [tab, loadHolders])

  useEffect(() => {
    if (tab === 'badge-requests') loadBadgeRequests()
  }, [tab, loadBadgeRequests])

  useEffect(() => {
    if (tab === 'facility-admins') loadFacilityClaims()
  }, [tab, loadFacilityClaims])

  const emailFromUrl = searchParams.get('email')?.trim() ?? ''

  useEffect(() => {
    if (tab !== 'badges' || !emailFromUrl || badgeUser?.email === emailFromUrl) return
    let cancelled = false
    void (async () => {
      try {
        const res = await api.lookupUserByEmail(emailFromUrl)
        const match = res.users?.[0]
        if (cancelled || !match) return
        setBadgeUser(match)
        setBadgeUserId(match.id)
      } catch {
        // User can still look up manually.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tab, emailFromUrl, badgeUser?.email])

  function badgeLabel(key: string) {
    return badgeTypes.find((b) => b.key === key)?.label ?? key
  }

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

  async function setPostStatus(postId: string, status: string) {
    setPostBusy(`${postId}-${status}`)
    setError('')
    try {
      await api.updateCommunityPostStatus(postId, status)
      setMessage(`Post set to ${status}.`)
      await loadReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Post update failed')
    } finally {
      setPostBusy(null)
    }
  }

  async function grantBadge(badgeKey: string) {
    if (!badgeUserId) return
    setBadgeBusy(`grant-${badgeKey}`)
    setError('')
    try {
      await api.grantCommunityBadge(badgeUserId, badgeKey)
      setMessage(`Granted ${badgeKey}.`)
      await loadUserBadges(badgeUserId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grant failed')
    } finally {
      setBadgeBusy(null)
    }
  }

  async function revokeBadge(badgeKey: string) {
    if (!badgeUserId) return
    setBadgeBusy(`revoke-${badgeKey}`)
    setError('')
    try {
      await api.revokeCommunityBadge(badgeUserId, badgeKey)
      setMessage(`Revoked ${badgeKey}.`)
      await loadUserBadges(badgeUserId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed')
    } finally {
      setBadgeBusy(null)
    }
  }

  const heldBadgeKeys = new Set(userBadges.map((b) => b.badge_type))
  const grantableBadgeTypes = badgeTypes.filter((bt) => !heldBadgeKeys.has(bt.key))

  async function approveBadgeRequest(id: string) {
    setRequestBusy(`approve-${id}`)
    setError('')
    const note = requestNotes[id]?.trim()
    try {
      await api.approveBadgeRequest(id, note || undefined)
      setMessage('Badge request approved — badge granted.')
      setRequestNotes((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      await loadBadgeRequests()
      await reloadPendingCount()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed')
    } finally {
      setRequestBusy(null)
    }
  }

  async function rejectBadgeRequest(id: string) {
    setRequestBusy(`reject-${id}`)
    setError('')
    const note = requestNotes[id]?.trim()
    try {
      await api.rejectBadgeRequest(id, note || undefined)
      setMessage('Badge request rejected.')
      setRequestNotes((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      await loadBadgeRequests()
      await reloadPendingCount()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed')
    } finally {
      setRequestBusy(null)
    }
  }

  async function approveFacilityClaim(id: string) {
    setFacilityClaimBusy(`approve-${id}`)
    setError('')
    const note = facilityClaimNotes[id]?.trim()
    try {
      await api.approveFacilityAdminClaim(id, note || undefined)
      setMessage('Health center admin claim approved.')
      setFacilityClaimNotes((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      await loadFacilityClaims()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed')
    } finally {
      setFacilityClaimBusy(null)
    }
  }

  async function rejectFacilityClaim(id: string) {
    setFacilityClaimBusy(`reject-${id}`)
    setError('')
    const note = facilityClaimNotes[id]?.trim()
    try {
      await api.rejectFacilityAdminClaim(id, note || undefined)
      setMessage('Health center admin claim rejected.')
      setFacilityClaimNotes((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      await loadFacilityClaims()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed')
    } finally {
      setFacilityClaimBusy(null)
    }
  }

  async function revokeFacilityClaim(id: string) {
    setFacilityClaimBusy(`revoke-${id}`)
    setError('')
    const note = facilityClaimNotes[id]?.trim()
    try {
      await api.revokeFacilityAdminClaim(id, note || undefined)
      setMessage('Health center admin access revoked.')
      setFacilityClaimNotes((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      await loadFacilityClaims()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed')
    } finally {
      setFacilityClaimBusy(null)
    }
  }

  async function toggleCatalogEnabled(row: CatalogKeyLabel | CommunityInterest) {
    setError('')
    const next = !row.is_enabled
    const sort_order = row.sort_order ?? 0
    try {
      switch (catalogKind) {
        case 'interest-groups':
          await api.upsertInterestGroup(row.key, { label: row.label, sort_order, is_enabled: next })
          break
        case 'interests': {
          const interest = row as CommunityInterest
          await api.upsertCatalogInterest(row.key, {
            label: row.label,
            group_key: interest.group_key,
            sort_order,
            is_enabled: next,
          })
          break
        }
        case 'badge-types':
          await api.upsertBadgeType(row.key, {
            label: row.label,
            description: row.description,
            sort_order,
            is_enabled: next,
          })
          break
        case 'event-types':
          await api.upsertEventType(row.key, {
            label: row.label,
            description: row.description,
            sort_order,
            is_enabled: next,
          })
          break
        case 'countries':
          await api.upsertCatalogCountry(row.key.toUpperCase(), {
            name: row.label,
            sort_order,
            is_enabled: next,
          })
          break
      }
      setMessage(`${row.label} ${next ? 'enabled' : 'disabled'}.`)
      await loadCatalog()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  function startEditCatalog(row: CatalogKeyLabel | CommunityInterest) {
    const interest = row as CommunityInterest
    setCatalogForm({
      key: row.key,
      label: row.label,
      group_key: interest.group_key ?? '',
      description: row.description ?? '',
      country_code: '',
      region_code: '',
      region_id: '',
      sort_order: String(row.sort_order ?? 0),
      is_enabled: row.is_enabled,
    })
  }

  function startEditRegion(row: CommunityRegion) {
    setCatalogForm({
      key: '',
      label: row.name,
      group_key: '',
      description: '',
      country_code: row.country_code,
      region_code: row.code,
      region_id: row.id,
      sort_order: String(row.sort_order ?? 0),
      is_enabled: row.is_enabled,
    })
  }

  async function toggleRegionEnabled(row: CommunityRegion) {
    setError('')
    const next = !row.is_enabled
    try {
      await api.updateCatalogRegion(row.id, {
        country_code: row.country_code,
        code: row.code,
        name: row.name,
        sort_order: row.sort_order,
        is_enabled: next,
      })
      setMessage(`${row.name} ${next ? 'enabled' : 'disabled'}.`)
      await loadCatalog()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  async function saveCatalog(e: FormEvent) {
    e.preventDefault()
    const sort_order = parseInt(catalogForm.sort_order, 10) || 0
    setError('')
    try {
      if (catalogKind === 'regions') {
        const country_code = catalogForm.country_code.trim().toUpperCase()
        const code = catalogForm.region_code.trim()
        const name = catalogForm.label.trim()
        if (!country_code || !code || !name) return
        const payload = {
          country_code,
          code,
          name,
          sort_order,
          is_enabled: catalogForm.is_enabled,
        }
        if (catalogForm.region_id) {
          await api.updateCatalogRegion(catalogForm.region_id, payload)
        } else {
          await api.createCatalogRegion(payload)
        }
        setMessage('Region saved.')
        setCatalogForm({
          key: '',
          label: '',
          group_key: '',
          description: '',
          country_code: regionCountryFilter || '',
          region_code: '',
          region_id: '',
          sort_order: '0',
          is_enabled: true,
        })
        await loadCatalog()
        return
      }

      const key = catalogForm.key.trim()
      if (!key || !catalogForm.label.trim()) return
      const payload = {
        label: catalogForm.label.trim(),
        sort_order,
        is_enabled: catalogForm.is_enabled,
      }
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
        country_code: '',
        region_code: '',
        region_id: '',
        sort_order: '0',
        is_enabled: true,
      })
      await loadCatalog()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  if (configLoading && !config) return <Spinner />

  return (
    <>
      <PageHeader
        title="Community"
        description="Moderation queue, badge verification requests, manual grants, and onboarding catalog."
      />
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Tabs
        active={tab}
        onChange={(id) => changeTab(id as CommunityTab)}
        tabs={[
          { id: 'reports', label: 'Reports' },
          {
            id: 'badge-requests',
            label:
              pendingBadgeCount > 0
                ? `Badge requests (${pendingBadgeCount})`
                : 'Badge requests',
          },
          { id: 'facility-admins', label: 'Health center admins' },
          { id: 'verified', label: 'Verified members' },
          { id: 'badges', label: 'Grant badges' },
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
                {reportStatuses.map((s) => (
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
                      <strong>{r.target_type}</strong>
                      {r.target_type === 'post' && (
                        <div className="btn-row mt">
                          {postStatuses.map((status) => (
                            <button
                              key={status}
                              type="button"
                              className="btn btn-sm btn-ghost"
                              disabled={postBusy === `${r.target_id}-${status}`}
                              onClick={() => setPostStatus(r.target_id, status)}
                            >
                              {postBusy === `${r.target_id}-${status}` ? '…' : status}
                            </button>
                          ))}
                        </div>
                      )}
                      {r.target_type === 'user' && (
                        <div className="table-sub muted">
                          Look up member by email under Users.
                        </div>
                      )}
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

      {tab === 'badge-requests' && (
        <Card className="mt">
          <div className="form inline-form" style={{ marginBottom: '1rem' }}>
            <label>
              Status
              <select
                value={requestFilter}
                onChange={(e) => setRequestFilter(e.target.value)}
              >
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </label>
            <button type="button" className="btn btn-ghost" onClick={loadBadgeRequests}>
              Refresh
            </button>
          </div>
          {requestsLoading ? (
            <Spinner />
          ) : badgeRequests.length === 0 ? (
            <EmptyState message={`No ${requestFilter} badge requests.`} />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Location</th>
                  <th>Badge</th>
                  <th>Verification details</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  {requestFilter !== 'pending' && <th>Admin note</th>}
                  {requestFilter === 'pending' && <th>Admin note</th>}
                  {requestFilter === 'pending' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {badgeRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <div>{req.user_name || '—'}</div>
                      <div className="table-sub">
                        {req.user_email ? (
                          <Link
                            to={`${ADMIN_BASE}/users?email=${encodeURIComponent(req.user_email)}`}
                          >
                            {req.user_email}
                          </Link>
                        ) : (
                          req.user_id
                        )}
                      </div>
                    </td>
                    <td>
                      {formatUserLocation(req) || <span className="muted">—</span>}
                    </td>
                    <td>
                      <strong>{badgeLabel(req.badge_type)}</strong>
                      <div className="table-sub">
                        <code>{req.badge_type}</code>
                      </div>
                    </td>
                    <td>
                      {formatBadgeRequestDetails(req.details).length > 0 ? (
                        <div>
                          {formatBadgeRequestDetails(req.details).map((line) => (
                            <div key={line}>{line}</div>
                          ))}
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                      {req.message?.trim() && (
                        <div className="table-sub">Note: {req.message.trim()}</div>
                      )}
                      {req.details?.verification_url?.trim() && (
                        <div className="table-sub">
                          <a href={req.details.verification_url} target="_blank" rel="noreferrer">
                            Open verification link
                          </a>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge">{req.status}</span>
                    </td>
                    <td>{new Date(req.created_at).toLocaleString()}</td>
                    {requestFilter !== 'pending' && (
                      <td>{req.admin_note?.trim() || <span className="muted">—</span>}</td>
                    )}
                    {requestFilter === 'pending' && (
                      <td>
                        <input
                          className="input-full"
                          value={requestNotes[req.id] ?? ''}
                          onChange={(e) =>
                            setRequestNotes((prev) => ({
                              ...prev,
                              [req.id]: e.target.value,
                            }))
                          }
                          placeholder="Optional note (e.g. license verified)"
                        />
                      </td>
                    )}
                    {requestFilter === 'pending' && (
                      <td className="actions">
                        <div className="btn-row">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            disabled={requestBusy === `approve-${req.id}`}
                            onClick={() => approveBadgeRequest(req.id)}
                          >
                            {requestBusy === `approve-${req.id}` ? '…' : 'Approve & grant'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            disabled={requestBusy === `reject-${req.id}`}
                            onClick={() => rejectBadgeRequest(req.id)}
                          >
                            {requestBusy === `reject-${req.id}` ? '…' : 'Reject'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 'facility-admins' && (
        <Card className="mt">
          <div className="form inline-form" style={{ marginBottom: '1rem' }}>
            <label>
              Status
              <select
                value={facilityClaimFilter}
                onChange={(e) => setFacilityClaimFilter(e.target.value)}
              >
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
                <option value="revoked">revoked</option>
              </select>
            </label>
            <button type="button" className="btn btn-ghost" onClick={loadFacilityClaims}>
              Refresh
            </button>
          </div>
          {facilityClaimsLoading ? (
            <Spinner />
          ) : facilityClaims.length === 0 ? (
            <EmptyState message={`No ${facilityClaimFilter} health center admin claims.`} />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Health center</th>
                  <th>Role / proof</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  {(facilityClaimFilter === 'pending' || facilityClaimFilter === 'approved') && (
                    <th>Admin note</th>
                  )}
                  {(facilityClaimFilter === 'pending' || facilityClaimFilter === 'approved') && (
                    <th>Actions</th>
                  )}
                  {facilityClaimFilter !== 'pending' && facilityClaimFilter !== 'approved' && (
                    <th>Admin note</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {facilityClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td>
                      <div>{claim.user_name || '—'}</div>
                      <div className="table-sub">
                        {claim.user_email ? (
                          <Link
                            to={`${ADMIN_BASE}/users?email=${encodeURIComponent(claim.user_email)}`}
                          >
                            {claim.user_email}
                          </Link>
                        ) : (
                          claim.user_id
                        )}
                      </div>
                      {claim.user_phone ? (
                        <div className="table-sub">{claim.user_phone}</div>
                      ) : null}
                    </td>
                    <td>
                      <strong>{claim.facility_name || '—'}</strong>
                      <div className="table-sub">
                        {[claim.facility_city, claim.facility_state_province, claim.facility_country_code]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </div>
                    </td>
                    <td>
                      {claim.role_title ? <div>{claim.role_title}</div> : null}
                      {claim.proof_note ? <div className="table-sub">{claim.proof_note}</div> : null}
                      {claim.proof_url ? (
                        <div className="table-sub">
                          <a href={claim.proof_url} target="_blank" rel="noreferrer">
                            Proof link
                          </a>
                        </div>
                      ) : null}
                      {!claim.role_title && !claim.proof_note && !claim.proof_url ? (
                        <span className="muted">—</span>
                      ) : null}
                    </td>
                    <td>
                      <span className="badge">{claim.status}</span>
                    </td>
                    <td>{new Date(claim.created_at).toLocaleString()}</td>
                    {(facilityClaimFilter === 'pending' || facilityClaimFilter === 'approved') && (
                      <td>
                        <input
                          className="input-full"
                          value={facilityClaimNotes[claim.id] ?? ''}
                          onChange={(e) =>
                            setFacilityClaimNotes((prev) => ({
                              ...prev,
                              [claim.id]: e.target.value,
                            }))
                          }
                          placeholder="Optional note"
                        />
                      </td>
                    )}
                    {facilityClaimFilter === 'pending' && (
                      <td>
                        <div className="btn-row">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            disabled={facilityClaimBusy === `approve-${claim.id}`}
                            onClick={() => approveFacilityClaim(claim.id)}
                          >
                            {facilityClaimBusy === `approve-${claim.id}` ? '…' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            disabled={facilityClaimBusy === `reject-${claim.id}`}
                            onClick={() => rejectFacilityClaim(claim.id)}
                          >
                            {facilityClaimBusy === `reject-${claim.id}` ? '…' : 'Reject'}
                          </button>
                        </div>
                      </td>
                    )}
                    {facilityClaimFilter === 'approved' && (
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          disabled={facilityClaimBusy === `revoke-${claim.id}`}
                          onClick={() => revokeFacilityClaim(claim.id)}
                        >
                          {facilityClaimBusy === `revoke-${claim.id}` ? '…' : 'Revoke'}
                        </button>
                      </td>
                    )}
                    {facilityClaimFilter !== 'pending' && facilityClaimFilter !== 'approved' && (
                      <td>{claim.admin_note?.trim() || <span className="muted">—</span>}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 'verified' && (
        <Card className="mt">
          <div className="form inline-form" style={{ marginBottom: '1rem' }}>
            <label>
              Badge
              <select
                value={verifiedFilter}
                onChange={(e) => setVerifiedFilter(e.target.value)}
              >
                <option value="">All verified members</option>
                {badgeTypes.map((bt) => (
                  <option key={bt.key} value={bt.key}>
                    {bt.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn btn-ghost" onClick={loadHolders}>
              Refresh
            </button>
          </div>
          {holdersLoading ? (
            <Spinner />
          ) : holders.length === 0 ? (
            <EmptyState
              message={
                verifiedFilter
                  ? `No members hold the ${badgeLabel(verifiedFilter)} badge yet.`
                  : 'No verified members yet.'
              }
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Badge</th>
                  <th>Verified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {holders.map((h) => (
                  <tr key={`${h.user_id}-${h.badge_type}`}>
                    <td>
                      <div>{h.name || '—'}</div>
                      <div className="table-sub">
                        <Link to={`${ADMIN_BASE}/users?email=${encodeURIComponent(h.email)}`}>
                          {h.email}
                        </Link>
                      </div>
                    </td>
                    <td>
                      <strong>{h.label}</strong>
                      <div className="table-sub">
                        <code>{h.badge_type}</code>
                      </div>
                    </td>
                    <td>{new Date(h.verified_at).toLocaleDateString()}</td>
                    <td className="actions">
                      <Link
                        to={`${ADMIN_BASE}/community?tab=badges&email=${encodeURIComponent(h.email)}`}
                        className="btn btn-sm btn-ghost"
                      >
                        Manage badges
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 'badges' && (
        <Card className="mt">
          <UserPicker
            label="Member email"
            user={badgeUser}
            onSelect={(u) => {
              setBadgeUser(u)
              setBadgeUserId(u.id)
            }}
            onClear={() => {
              setBadgeUser(null)
              setBadgeUserId('')
            }}
          />
          {!badgeUser && (
            <p className="muted mt">Look up a member to view, grant, or revoke badges.</p>
          )}
          {badgeUser && (
            <>
              <h2 className="card-title mt">Current badges — {badgeUser.email}</h2>
              {badgesLoading ? (
                <Spinner />
              ) : userBadges.length === 0 ? (
                <EmptyState message="This member has no badges yet." />
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Badge</th>
                      <th>Key</th>
                      <th>Verified</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userBadges.map((badge) => (
                      <tr key={badge.badge_type}>
                        <td>{badge.label}</td>
                        <td><code>{badge.badge_type}</code></td>
                        <td className="muted">
                          {new Date(badge.verified_at).toLocaleString()}
                        </td>
                        <td className="actions">
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            disabled={badgeBusy === `revoke-${badge.badge_type}`}
                            onClick={() => revokeBadge(badge.badge_type)}
                          >
                            {badgeBusy === `revoke-${badge.badge_type}` ? '…' : 'Revoke'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <h2 className="card-title mt">Grant from catalog</h2>
              {badgeTypes.length === 0 ? (
                <EmptyState message="No badge types in catalog." />
              ) : grantableBadgeTypes.length === 0 ? (
                <p className="muted">Member already holds every catalog badge.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Badge</th>
                      <th>Key</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grantableBadgeTypes.map((bt) => (
                      <tr key={bt.key}>
                        <td>{bt.label}</td>
                        <td><code>{bt.key}</code></td>
                        <td className="actions">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            disabled={badgeBusy === `grant-${bt.key}`}
                            onClick={() => grantBadge(bt.key)}
                          >
                            {badgeBusy === `grant-${bt.key}` ? '…' : 'Grant'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
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
                  onChange={(e) => setCatalogKind(e.target.value)}
                >
                  {catalogSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </label>
              {catalogKind === 'regions' && (
                <label>
                  Country filter
                  <select
                    value={regionCountryFilter}
                    onChange={(e) => setRegionCountryFilter(e.target.value)}
                  >
                    <option value="">All countries</option>
                    {catalogCountries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {catalogLoading ? (
              <Spinner />
            ) : catalogKind === 'regions' ? (
              regionRows.length === 0 ? (
                <EmptyState message="No regions for this filter." />
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Country</th>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionRows.map((row) => (
                      <tr key={row.id}>
                        <td><code>{row.country_code}</code></td>
                        <td><code>{row.code}</code></td>
                        <td>{row.name}</td>
                        <td>
                          <span className={row.is_enabled ? 'badge badge-ok' : 'badge badge-muted'}>
                            {row.is_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="actions">
                          <div className="btn-row">
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() => toggleRegionEnabled(row)}
                            >
                              {row.is_enabled ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() => startEditRegion(row)}
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : catalogRows.length === 0 ? (
              <EmptyState message="No catalog entries." />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Label</th>
                    <th>Status</th>
                    <th>Actions</th>
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
                      <td>
                        <span className={row.is_enabled ? 'badge badge-ok' : 'badge badge-muted'}>
                          {row.is_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="actions">
                        <div className="btn-row">
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => toggleCatalogEnabled(row)}
                          >
                            {row.is_enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => startEditCatalog(row)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card>
            <h2 className="card-title">
              {catalogKind === 'regions'
                ? catalogForm.region_id
                  ? `Edit ${catalogForm.region_code}`
                  : 'Add region'
                : catalogForm.key
                  ? `Edit ${catalogForm.key}`
                  : 'Add / upsert entry'}
            </h2>
            <form className="form" onSubmit={saveCatalog}>
              {catalogKind === 'regions' ? (
                <>
                  <label>
                    Country code
                    <select
                      value={catalogForm.country_code}
                      onChange={(e) =>
                        setCatalogForm({ ...catalogForm, country_code: e.target.value })
                      }
                      required
                    >
                      <option value="">Select country</option>
                      {catalogCountries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Region code
                    <input
                      value={catalogForm.region_code}
                      onChange={(e) =>
                        setCatalogForm({ ...catalogForm, region_code: e.target.value })
                      }
                      required
                      disabled={!!catalogForm.region_id}
                      placeholder="CA"
                    />
                  </label>
                  <label>
                    Region name
                    <input
                      value={catalogForm.label}
                      onChange={(e) =>
                        setCatalogForm({ ...catalogForm, label: e.target.value })
                      }
                      required
                    />
                  </label>
                </>
              ) : (
                <>
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
                      onChange={(e) =>
                        setCatalogForm({ ...catalogForm, label: e.target.value })
                      }
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
                </>
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
