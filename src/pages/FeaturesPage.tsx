import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { Feature } from '../api/types'
import { Alert, Card, EmptyState, PageHeader, Spinner } from '../components/ui'

export function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ feature_key: '', name: '', description: '' })
  const [editing, setEditing] = useState<Feature | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.listFeatures()
      setFeatures(res.features ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.createFeature(form)
      setForm({ feature_key: '', name: '', description: '' })
      setMessage('Feature created.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    }
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault()
    if (!editing) return
    try {
      await api.updateFeature(editing.id, {
        name: editing.name,
        description: editing.description,
      })
      setEditing(null)
      setMessage('Feature updated.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  async function handleDelete(f: Feature) {
    if (!confirm(`Delete feature "${f.feature_key}"?`)) return
    try {
      await api.deleteFeature(f.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (loading) return <Spinner />

  return (
    <>
      <PageHeader title="Features" description="Feature flags and quota keys used by subscription plans." />
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <div className="grid-2">
        <Card>
          <h2 className="card-title">All features</h2>
          {features.length === 0 ? (
            <EmptyState message="No features defined." />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Name</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {features.map((f) => (
                  <tr key={f.id}>
                    <td><code>{f.feature_key}</code></td>
                    <td>{f.name}</td>
                    <td className="actions">
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditing({ ...f })}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(f)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          {editing ? (
            <>
              <h2 className="card-title">Edit feature</h2>
              <form className="form" onSubmit={handleUpdate}>
                <label>
                  Key
                  <input value={editing.feature_key} disabled />
                </label>
                <label>
                  Name
                  <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
                </label>
                <label>
                  Description
                  <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} />
                </label>
                <div className="btn-row">
                  <button type="submit" className="btn btn-primary">Save</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="card-title">Create feature</h2>
              <form className="form" onSubmit={handleCreate}>
                <label>
                  Key
                  <input value={form.feature_key} onChange={(e) => setForm({ ...form, feature_key: e.target.value })} required placeholder="voice_calls" />
                </label>
                <label>
                  Name
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </label>
                <label>
                  Description
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                </label>
                <button type="submit" className="btn btn-primary">Create feature</button>
              </form>
            </>
          )}
        </Card>
      </div>
    </>
  )
}
