import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { useAdminConfig } from '../context/AdminConfigContext'
import type { Feature, Plan, PlanFeature } from '../api/types'
import { Alert, Card, EmptyState, PageHeader, Spinner } from '../components/ui'

export function PlansPage() {
  const { config } = useAdminConfig()
  const quotaPeriods = config?.quota_periods ?? []
  const [plans, setPlans] = useState<Plan[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [planFeatures, setPlanFeatures] = useState<PlanFeature[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const [newPlan, setNewPlan] = useState({ code: '', name: '', description: '' })
  const [quotaLimit, setQuotaLimit] = useState('')
  const [quotaPeriod, setQuotaPeriod] = useState('')
  const [assignBusy, setAssignBusy] = useState<number | null>(null)

  useEffect(() => {
    if (quotaPeriod === '' && quotaPeriods[0]) {
      setQuotaPeriod(quotaPeriods[0])
    }
  }, [quotaPeriods, quotaPeriod])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [p, f] = await Promise.all([api.listPlans(), api.listFeatures()])
      setPlans(p.plans ?? [])
      setFeatures(f.features ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function selectPlan(plan: Plan) {
    setSelectedPlan(plan)
    setMessage('')
    try {
      const res = await api.getPlanFeatures(plan.id)
      setPlanFeatures(res.features ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load plan features')
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.createPlan(newPlan)
      setNewPlan({ code: '', name: '', description: '' })
      setMessage('Plan created.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    }
  }

  async function toggleActive(plan: Plan) {
    try {
      await api.updatePlan(plan.id, { active: !plan.active })
      await load()
      if (selectedPlan?.id === plan.id) {
        setSelectedPlan({ ...plan, active: !plan.active })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  async function deactivate(plan: Plan) {
    if (!confirm(`Deactivate plan "${plan.name}"?`)) return
    try {
      await api.deletePlan(plan.id)
      if (selectedPlan?.id === plan.id) {
        setSelectedPlan(null)
        setPlanFeatures([])
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function assignFeature(featureId: number) {
    if (!selectedPlan || !quotaPeriod) return
    setAssignBusy(featureId)
    try {
      await api.assignFeatureToPlan(selectedPlan.id, featureId, {
        quota_limit: quotaLimit === '' ? null : Number(quotaLimit),
        quota_period: quotaPeriod,
      })
      setMessage('Feature assigned.')
      const res = await api.getPlanFeatures(selectedPlan.id)
      setPlanFeatures(res.features ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assign failed')
    } finally {
      setAssignBusy(null)
    }
  }

  const assignedIds = new Set(planFeatures.map((pf) => pf.feature_id))
  const unassignedFeatures = features.filter((f) => !assignedIds.has(f.id))

  async function removeFeature(featureId: number) {
    if (!selectedPlan) return
    try {
      await api.removeFeatureFromPlan(selectedPlan.id, featureId)
      const res = await api.getPlanFeatures(selectedPlan.id)
      setPlanFeatures(res.features ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed')
    }
  }

  if (loading) return <Spinner />

  return (
    <>
      <PageHeader title="Subscription plans" description="Manage plans and feature quotas." />

      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <div className="grid-2">
        <Card>
          <h2 className="card-title">All plans</h2>
          {plans.length === 0 ? (
            <EmptyState message="No plans configured." />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className={selectedPlan?.id === p.id ? 'row-selected' : ''}>
                    <td><code>{p.code}</code></td>
                    <td>{p.name}</td>
                    <td>
                      <span className={p.active ? 'badge badge-ok' : 'badge badge-muted'}>
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="actions">
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => selectPlan(p)}>
                        Features
                      </button>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggleActive(p)}>
                        {p.active ? 'Disable' : 'Enable'}
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => deactivate(p)}>
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <h2 className="card-title">Create plan</h2>
          <form className="form" onSubmit={handleCreate}>
            <label>
              Code
              <input value={newPlan.code} onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value })} required placeholder="premium" />
            </label>
            <label>
              Name
              <input value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} required />
            </label>
            <label>
              Description
              <textarea value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} rows={2} />
            </label>
            <button type="submit" className="btn btn-primary">Create plan</button>
          </form>
        </Card>
      </div>

      {selectedPlan && (
        <Card className="mt">
          <h2 className="card-title">Features for {selectedPlan.name}</h2>
          {planFeatures.length === 0 ? (
            <EmptyState message="No features assigned to this plan." />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Quota</th>
                  <th>Period</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {planFeatures.map((pf) => (
                  <tr key={pf.feature_id}>
                    <td><code>{pf.feature_key}</code></td>
                    <td>{pf.quota_limit ?? '∞'}</td>
                    <td>{pf.quota_period}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => removeFeature(pf.feature_id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="mt">
            <p className="muted mb">Defaults for new assignments</p>
            <div className="form inline-form mb">
              <label>
                Quota limit
                <input type="number" min={0} value={quotaLimit} onChange={(e) => setQuotaLimit(e.target.value)} placeholder="empty = ∞" />
              </label>
              <label>
                Period
                <select value={quotaPeriod} onChange={(e) => setQuotaPeriod(e.target.value)} required>
                  {quotaPeriods.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {unassignedFeatures.length === 0 ? (
              <EmptyState message="All features are on this plan." />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedFeatures.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <strong>{f.name}</strong>
                        <div className="table-sub"><code>{f.feature_key}</code></div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={assignBusy === f.id}
                          onClick={() => assignFeature(f.id)}
                        >
                          {assignBusy === f.id ? 'Adding…' : 'Add to plan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}
    </>
  )
}
