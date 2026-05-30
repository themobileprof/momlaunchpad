import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { SystemSetting } from '../api/types'
import { Alert, Card, EmptyState, PageHeader, Spinner } from '../components/ui'

export function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.listSettings()
      const list = res.settings ?? []
      setSettings(list)
      setDrafts(Object.fromEntries(list.map((s) => [s.key, s.value])))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function save(key: string) {
    setError('')
    setMessage('')
    try {
      await api.updateSetting(key, drafts[key] ?? '')
      setMessage(`Updated "${key}".`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function saveAll(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await Promise.all(settings.map((s) => api.updateSetting(s.key, drafts[s.key] ?? s.value)))
      setMessage('All settings saved.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  if (loading) return <Spinner />

  return (
    <>
      <PageHeader
        title="System settings"
        description="Global configuration such as AI assistant name and feature toggles."
      />
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Card>
        {settings.length === 0 ? (
          <EmptyState message="No system settings in the database." />
        ) : (
          <form onSubmit={saveAll}>
            <table className="table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {settings.map((s) => (
                  <tr key={s.key}>
                    <td>
                      <code>{s.key}</code>
                      {s.description && <div className="table-sub muted">{s.description}</div>}
                    </td>
                    <td>
                      <input
                        className="input-full"
                        value={drafts[s.key] ?? ''}
                        onChange={(e) => setDrafts({ ...drafts, [s.key]: e.target.value })}
                      />
                    </td>
                    <td>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => save(s.key)}>
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt">
              <button type="submit" className="btn btn-primary">Save all</button>
            </div>
          </form>
        )}
      </Card>
    </>
  )
}
