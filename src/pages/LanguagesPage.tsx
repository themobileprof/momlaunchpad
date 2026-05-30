import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { Language } from '../api/types'
import { Alert, Card, EmptyState, PageHeader, Spinner } from '../components/ui'

export function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    code: '',
    name: '',
    native_name: '',
    is_enabled: true,
    is_experimental: false,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.listLanguages()
      setLanguages(res.languages ?? [])
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
      await api.createLanguage(form)
      setForm({ code: '', name: '', native_name: '', is_enabled: true, is_experimental: false })
      setMessage('Language created.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    }
  }

  async function toggle(lang: Language, field: 'is_enabled' | 'is_experimental') {
    try {
      await api.updateLanguage(lang.code, { [field]: !lang[field] })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  async function handleDelete(lang: Language) {
    if (lang.code === 'en') return
    if (!confirm(`Delete language "${lang.code}"?`)) return
    try {
      await api.deleteLanguage(lang.code)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (loading) return <Spinner />

  return (
    <>
      <PageHeader title="Languages" description="Enable or experiment with supported app languages." />
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <div className="grid-2">
        <Card>
          <h2 className="card-title">Configured languages</h2>
          {languages.length === 0 ? (
            <EmptyState message="No languages configured." />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Enabled</th>
                  <th>Experimental</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {languages.map((lang) => (
                  <tr key={lang.code}>
                    <td><code>{lang.code}</code></td>
                    <td>{lang.native_name || lang.name}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggle(lang, 'is_enabled')}>
                        {lang.is_enabled ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggle(lang, 'is_experimental')}>
                        {lang.is_experimental ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td>
                      {lang.code !== 'en' && (
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(lang)}>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <h2 className="card-title">Add language</h2>
          <form className="form" onSubmit={handleCreate}>
            <label>
              Code
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="pt" maxLength={10} />
            </label>
            <label>
              English name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Native name
              <input value={form.native_name} onChange={(e) => setForm({ ...form, native_name: e.target.value })} required />
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} />
              Enabled for users
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={form.is_experimental} onChange={(e) => setForm({ ...form, is_experimental: e.target.checked })} />
              Experimental
            </label>
            <button type="submit" className="btn btn-primary">Add language</button>
          </form>
        </Card>
      </div>
    </>
  )
}
