import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userApi } from '../api'
import {
  conditionClassLabel,
  parseConditionClass,
  selectRelevantSymptoms,
  symptomDisplayText,
  symptomTypeLabel,
} from '../lib/conditionClass'
import type { Symptom } from '../types'
import { GradientButton } from './ui'
import { appPath } from '../routes'

export function OngoingSymptomPrompt() {
  const [symptom, setSymptom] = useState<Symptom | null>(null)
  const [dismissedId, setDismissedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    userApi
      .getRecentSymptoms(40)
      .then((list) => {
        const relevant = selectRelevantSymptoms(list, { max: 10 })
        setSymptom(relevant[0] ?? null)
      })
      .catch(() => setSymptom(null))
  }, [])

  if (!symptom || symptom.id === dismissedId) return null

  const cls = parseConditionClass(symptom.condition_class, symptom.symptom_type)

  async function resolve() {
    if (!symptom) return
    setBusy(true)
    setMessage('')
    try {
      await userApi.resolveSymptom(symptom.id)
      setDismissedId(symptom.id)
      setSymptom(null)
      setMessage('Marked as resolved')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not update')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="glass home-prompt-card">
      <p className="u-caption">Ongoing symptom check-in</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <strong style={{ flex: '1 1 12rem' }}>
          Has your {symptomTypeLabel(symptom.symptom_type).toLowerCase()} improved?
        </strong>
        <span className={`symptom-chip symptom-chip--${cls}`}>{conditionClassLabel(cls)}</span>
      </div>
      <p className="u-muted home-prompt-card__body" style={{ marginTop: 8 }}>
        {symptomDisplayText(symptom)}
      </p>
      <div className="home-prompt-card__actions">
        <button
          type="button"
          className="app-btn app-btn--outline app-btn--sm"
          disabled={busy}
          onClick={() => setDismissedId(symptom.id)}
        >
          Not now
        </button>
        <Link
          to={appPath('symptoms')}
          className="app-btn app-btn--ghost app-btn--sm"
          style={{ textDecoration: 'none' }}
        >
          Tracker
        </Link>
        <GradientButton onClick={resolve} disabled={busy}>
          {busy ? 'Saving…' : 'Yes, resolved'}
        </GradientButton>
      </div>
      {message && (
        <p className="u-muted" style={{ margin: '12px 0 0', fontSize: '0.85rem' }}>
          {message}
        </p>
      )}
    </div>
  )
}
