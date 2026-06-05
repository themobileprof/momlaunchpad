import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { ReferralRewardPreset, SystemSetting } from '../api/types'
import { Alert, Card, EmptyState, PageHeader, Spinner } from '../components/ui'

function parseReferralPresets(raw: string): ReferralRewardPreset[] {
  if (!raw.trim()) return []
  const parsed = JSON.parse(raw) as ReferralRewardPreset[]
  if (!Array.isArray(parsed)) throw new Error('Presets must be a JSON array')
  return parsed
}

export function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [referralPresets, setReferralPresets] = useState<ReferralRewardPreset[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.listSettings()
      const list = res.settings ?? []
      setSettings(list)
      setDrafts(Object.fromEntries(list.map((s) => [s.key, s.value])))
      const presetSetting = list.find((s) => s.key === 'referral_reward_presets')
      if (presetSetting?.value) {
        try {
          setReferralPresets(parseReferralPresets(presetSetting.value))
        } catch {
          setReferralPresets([])
        }
      } else {
        setReferralPresets([])
      }
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

  async function saveReferralPresets() {
    setError('')
    setMessage('')
    try {
      const cleaned = referralPresets
        .map((preset) => ({
          label: preset.label.trim(),
          description: preset.description.trim(),
        }))
        .filter((preset) => preset.label && preset.description)
      const value = JSON.stringify(cleaned, null, 2)
      await api.updateSetting('referral_reward_presets', value)
      setDrafts((prev) => ({ ...prev, referral_reward_presets: value }))
      setReferralPresets(cleaned)
      setMessage('Referral reward presets saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  function updatePreset(index: number, field: keyof ReferralRewardPreset, value: string) {
    setReferralPresets((prev) =>
      prev.map((preset, i) => (i === index ? { ...preset, [field]: value } : preset)),
    )
  }

  function addPreset() {
    setReferralPresets((prev) => [...prev, { label: '', description: '' }])
  }

  function removePreset(index: number) {
    setReferralPresets((prev) => prev.filter((_, i) => i !== index))
  }

  if (loading) return <Spinner />

  const hasReferralPresets = settings.some((s) => s.key === 'referral_reward_presets')

  return (
    <>
      <PageHeader
        title="System settings"
        description="Global configuration such as AI assistant name and feature toggles."
      />
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      {hasReferralPresets && (
        <Card>
          <h2 className="card-title">Referral reward presets</h2>
          <p className="muted mb">
            Quick-grant buttons on the Referrals and Users pages. Each preset needs a short label
            and the full reward description stored in the database.
          </p>
          {referralPresets.length === 0 ? (
            <EmptyState message="No presets yet — add one below." />
          ) : (
            <table className="table mb">
              <thead>
                <tr>
                  <th>Button label</th>
                  <th>Reward description</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {referralPresets.map((preset, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        className="input-full"
                        value={preset.label}
                        onChange={(e) => updatePreset(index, 'label', e.target.value)}
                        placeholder="e.g. Monthly reward"
                      />
                    </td>
                    <td>
                      <input
                        className="input-full"
                        value={preset.description}
                        onChange={(e) => updatePreset(index, 'description', e.target.value)}
                        placeholder="e.g. 1 month premium extension"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removePreset(index)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={addPreset}>
              Add preset
            </button>
            <button type="button" className="btn btn-primary" onClick={saveReferralPresets}>
              Save presets
            </button>
          </div>
        </Card>
      )}

      <Card className="mt">
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
                      {s.key === 'referral_reward_presets' ? (
                        <span className="muted">Use the structured editor above.</span>
                      ) : (
                        <input
                          className="input-full"
                          value={drafts[s.key] ?? ''}
                          onChange={(e) => setDrafts({ ...drafts, [s.key]: e.target.value })}
                        />
                      )}
                    </td>
                    <td>
                      {s.key !== 'referral_reward_presets' && (
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => save(s.key)}>
                          Save
                        </button>
                      )}
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
