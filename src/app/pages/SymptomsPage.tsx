import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { EmptyState, GradientButton, MomAppBar } from '../components/ui'
import {
  conditionClassLabel,
  parseConditionClass,
  symptomDisplayText,
  symptomTypeLabel,
} from '../lib/conditionClass'
import { appPath } from '../routes'
import { SYMPTOM_FILTER_TYPES, type Symptom, type SymptomStats } from '../types'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ConditionChip({ symptom }: { symptom: Symptom }) {
  const cls = parseConditionClass(symptom.condition_class, symptom.symptom_type)
  const recurrent =
    symptom.is_recurrent === true || (symptom.recurrence_count ?? 0) > 1
  const label = recurrent && (symptom.recurrence_count ?? 0) > 1
    ? `${conditionClassLabel(cls)} · recurrent x${symptom.recurrence_count}`
    : conditionClassLabel(cls)
  return <span className={`symptom-chip symptom-chip--${cls}`}>{label}</span>
}

function SymptomRow({
  symptom,
  busyId,
  onResolve,
}: {
  symptom: Symptom
  busyId: string | null
  onResolve: (id: string) => void
}) {
  return (
    <div className="app-card app-card--outlined" style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <strong style={{ flex: '1 1 auto' }}>{symptomTypeLabel(symptom.symptom_type)}</strong>
        <ConditionChip symptom={symptom} />
        {symptom.is_resolved ? (
          <span className="app-badge">Resolved</span>
        ) : (
          <span className="app-badge">Ongoing</span>
        )}
      </div>
      <p className="u-muted" style={{ margin: '6px 0 0', fontSize: '0.9rem' }}>
        {symptomDisplayText(symptom)}
      </p>
      <p className="u-muted" style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>
        {formatWhen(symptom.reported_at)}
        {symptom.severity && symptom.severity !== 'unknown' ? ` · ${symptom.severity}` : ''}
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {!symptom.is_resolved && (
          <button
            type="button"
            className="gradient-btn app-btn--sm"
            style={{ width: 'auto' }}
            disabled={busyId === symptom.id}
            onClick={() => onResolve(symptom.id)}
          >
            {busyId === symptom.id ? 'Saving…' : 'Mark resolved'}
          </button>
        )}
        {symptom.conversation_id && (
          <Link
            to={appPath(`chat/${symptom.conversation_id}`)}
            className="app-btn app-btn--ghost app-btn--sm"
            style={{ display: 'inline-block' }}
          >
            Open chat
          </Link>
        )}
      </div>
    </div>
  )
}

export function SymptomsPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<SymptomStats | null>(null)
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [filter, setFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [startingChat, setStartingChat] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [s, history] = await Promise.all([
        userApi.getSymptomStats(),
        userApi.getSymptomHistory({ limit: 50, type: filter || undefined }),
      ])
      setStats(s)
      setSymptoms(history)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load symptoms')
      setStats(null)
      setSymptoms([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    void load()
  }, [load])

  async function resolve(id: string) {
    setBusyId(id)
    try {
      await userApi.resolveSymptom(id)
      setSymptoms((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, is_resolved: true, resolved_at: new Date().toISOString() }
            : s,
        ),
      )
      const s = await userApi.getSymptomStats()
      setStats(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resolve symptom')
    } finally {
      setBusyId(null)
    }
  }

  async function talkAboutSymptom() {
    setStartingChat(true)
    setError('')
    try {
      const conversation = await userApi.createConversation('Symptom check-in')
      navigate(appPath(`chat/${conversation.id}?starter=symptom`))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start chat')
      setStartingChat(false)
    }
  }

  const ongoing = symptoms.filter((s) => !s.is_resolved)
  const resolved = symptoms.filter((s) => s.is_resolved)
  const topTypes = Object.entries(stats?.by_type ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <>
      <MomAppBar pageTitle="Health tracker" onBack={() => navigate(appPath())} />
      <div className="user-app-content page-section">
        <p className="u-muted" style={{ marginTop: 0 }}>
          Symptoms you mention in chat show up here. Resolve them when they improve.
        </p>

        <GradientButton onClick={talkAboutSymptom} disabled={startingChat}>
          {startingChat ? 'Opening chat…' : 'Talk about a symptom'}
        </GradientButton>

        {error && <div className="u-alert u-alert--error" style={{ marginTop: 12 }}>{error}</div>}

        {loading ? (
          <div className="u-center-page"><div className="u-spinner" /></div>
        ) : (
          <>
            {stats && (
              <div className="symptom-stats" aria-label="Symptom totals" style={{ marginTop: 16 }}>
                <div className="symptom-stats__cell">
                  <strong>{stats.ongoing}</strong>
                  <span className="u-muted">Ongoing</span>
                </div>
                <div className="symptom-stats__cell">
                  <strong>{stats.resolved}</strong>
                  <span className="u-muted">Resolved</span>
                </div>
                <div className="symptom-stats__cell">
                  <strong>{stats.total_symptoms}</strong>
                  <span className="u-muted">Total</span>
                </div>
              </div>
            )}

            {topTypes.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p className="u-caption" style={{ marginBottom: 8 }}>Most logged</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {topTypes.map(([type, count]) => (
                    <button
                      key={type}
                      type="button"
                      className={`filter-chip${filter === type ? ' filter-chip--active' : ''}`}
                      onClick={() => setFilter(filter === type ? '' : type)}
                    >
                      {symptomTypeLabel(type)} ({count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="app-label" style={{ marginTop: 8 }}>Filter by type</label>
            <select
              className="app-input"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ marginBottom: 16 }}
            >
              <option value="">All symptoms</option>
              {SYMPTOM_FILTER_TYPES.map((t) => (
                <option key={t} value={t}>{symptomTypeLabel(t)}</option>
              ))}
            </select>

            {symptoms.length === 0 ? (
              <EmptyState
                icon="💛"
                title={filter ? 'No matches for this filter' : 'No symptoms logged yet'}
                body={
                  filter
                    ? 'Try another type, or clear the filter to see everything.'
                    : 'Describe how you feel in chat — we will keep a simple record here.'
                }
                action={
                  filter ? (
                    <button type="button" className="app-btn app-btn--outline" onClick={() => setFilter('')}>
                      Clear filter
                    </button>
                  ) : (
                    <GradientButton onClick={talkAboutSymptom} disabled={startingChat}>
                      {startingChat ? 'Opening chat…' : 'Talk about a symptom'}
                    </GradientButton>
                  )
                }
              />
            ) : (
              <>
                {ongoing.length > 0 && (
                  <section style={{ marginBottom: 20 }}>
                    <h2 className="u-heading-sm" style={{ marginBottom: 8 }}>Ongoing</h2>
                    {ongoing.map((s) => (
                      <SymptomRow key={s.id} symptom={s} busyId={busyId} onResolve={resolve} />
                    ))}
                  </section>
                )}
                {resolved.length > 0 && (
                  <section>
                    <h2 className="u-heading-sm" style={{ marginBottom: 8 }}>Resolved</h2>
                    {resolved.map((s) => (
                      <SymptomRow key={s.id} symptom={s} busyId={busyId} onResolve={resolve} />
                    ))}
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </>
  )
}
