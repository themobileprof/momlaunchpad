import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { userApi } from '../api'
import { GradientButton, MomAppBar } from '../components/ui'
import {
  appointmentReminderDescription,
  appointmentReminderTitle,
} from '../lib/visitCheckInLogic'
import { syncReminderAfterCreate } from '../lib/reminderGoogleSync'
import { DOCTOR_VISIT_TYPES, DOCTOR_VISIT_TYPE_LABELS } from '../types'
import type { DoctorVisit } from '../types'
import { appPath } from '../routes'

export type DoctorVisitFormMode = 'schedule' | 'past' | 'update'

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function defaultVisitDate(mode: DoctorVisitFormMode) {
  const d = new Date()
  if (mode === 'schedule') {
    d.setDate(d.getDate() + 7)
    d.setHours(9, 0, 0, 0)
  } else {
    d.setHours(d.getHours(), 0, 0, 0)
  }
  return toLocalInputValue(d)
}

function resolveMode(
  searchMode: string | null,
  isEdit: boolean,
  visit: DoctorVisit | null,
): DoctorVisitFormMode {
  if (searchMode === 'schedule' || searchMode === 'past' || searchMode === 'update') {
    return searchMode
  }
  if (!isEdit || !visit) return 'past'
  if (new Date(visit.visit_date) > new Date() && !visit.debrief_completed_at) return 'schedule'
  if (!visit.debrief_completed_at) return 'update'
  return 'past'
}

function titleForMode(mode: DoctorVisitFormMode, isEdit: boolean) {
  if (mode === 'schedule') return isEdit ? 'Edit scheduled visit' : 'Schedule visit'
  if (mode === 'update') return 'How did your visit go?'
  return isEdit ? 'Edit visit' : 'Log past visit'
}

function formatSummary(when: string, type: string) {
  const label = DOCTOR_VISIT_TYPE_LABELS[type] ?? type
  const d = new Date(when)
  if (Number.isNaN(d.getTime())) return label
  return `${label} · ${d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`
}

export function DoctorVisitFormPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loadedVisit, setLoadedVisit] = useState<DoctorVisit | null>(null)
  const [loading, setLoading] = useState(isEdit)

  const mode = useMemo(
    () => resolveMode(searchParams.get('mode'), isEdit, loadedVisit),
    [searchParams, isEdit, loadedVisit],
  )

  const [visitType, setVisitType] = useState('prenatal_checkup')
  const [visitDate, setVisitDate] = useState(() => defaultVisitDate('past'))
  const [providerName, setProviderName] = useState('')
  const [facilityName, setFacilityName] = useState('')
  const [howItWent, setHowItWent] = useState('')
  const [nextAppointment, setNextAppointment] = useState('')
  const [nextNotes, setNextNotes] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [diagnosis, setDiagnosis] = useState('')
  const [treatment, setTreatment] = useState('')
  const [medication, setMedication] = useState('')
  const [pendingTest, setPendingTest] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedVisit, setSavedVisit] = useState<DoctorVisit | null>(null)
  const [addingReminder, setAddingReminder] = useState(false)

  useEffect(() => {
    if (!id) {
      setVisitDate(defaultVisitDate(resolveMode(searchParams.get('mode'), false, null)))
      return
    }
    setLoading(true)
    userApi
      .listDoctorVisits()
      .then((visits) => visits.find((v) => v.id === id) ?? null)
      .then((visit) => {
        if (!visit) {
          setError('Could not load visit')
          return
        }
        setLoadedVisit(visit)
        setVisitType(visit.visit_type)
        setVisitDate(toLocalInputValue(new Date(visit.visit_date)))
        setProviderName(visit.provider_name ?? '')
        setFacilityName(visit.facility_name ?? '')
        setHowItWent(visit.clinical_notes ?? '')
        setDiagnosis(visit.diagnosis ?? '')
        setTreatment(visit.treatment_plan ?? '')
        setNextAppointment(
          visit.next_appointment_at
            ? toLocalInputValue(new Date(visit.next_appointment_at))
            : '',
        )
        setNextNotes(visit.next_appointment_notes ?? '')
        const med = visit.medications?.[0]?.name
        if (med) setMedication(med)
        const test = visit.pending_tests?.find((t) => t.status !== 'completed')?.test_name
        if (test) setPendingTest(test)
        if (visit.diagnosis || visit.treatment_plan || med || test) setShowMore(true)
      })
      .catch(() => setError('Could not load visit'))
      .finally(() => setLoading(false))
  }, [id, searchParams])

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const visitDateIso = new Date(visitDate).toISOString()
      if (mode === 'schedule' && new Date(visitDate) <= new Date()) {
        setError('Pick a future date for a scheduled visit')
        setSaving(false)
        return
      }
      if ((mode === 'past' || mode === 'update') && new Date(visitDate) > new Date()) {
        setError('Use Schedule visit for appointments that have not happened yet')
        setSaving(false)
        return
      }

      const body: Record<string, unknown> = {
        visit_date: visitDateIso,
        visit_type: visitType,
        provider_name: providerName.trim() || undefined,
        facility_name: facilityName.trim() || undefined,
        clinical_notes: howItWent.trim() || undefined,
        next_appointment_at: nextAppointment ? new Date(nextAppointment).toISOString() : undefined,
        next_appointment_notes: nextNotes.trim() || undefined,
        medications: loadedVisit?.medications ?? [],
        lab_results: [],
      }

      if (mode !== 'schedule' && showMore) {
        body.diagnosis = diagnosis.trim() || undefined
        body.treatment_plan = treatment.trim() || undefined
        body.medications = medication.trim()
          ? [{ name: medication.trim(), dosage: '', frequency: 'As prescribed' }]
          : []
      } else if (mode !== 'schedule' && loadedVisit) {
        if (loadedVisit.diagnosis) body.diagnosis = loadedVisit.diagnosis
        if (loadedVisit.treatment_plan) body.treatment_plan = loadedVisit.treatment_plan
      }

      let saved: DoctorVisit
      if (isEdit && id) {
        saved = await userApi.updateDoctorVisit(id, body)
      } else {
        saved = await userApi.createDoctorVisit(body)
      }

      if (mode === 'past' || mode === 'update') {
        const pending_tests = showMore && pendingTest.trim()
          ? [{ test_name: pendingTest.trim(), status: 'pending' as const }]
          : []
        saved = await userApi.debriefDoctorVisit(saved.id, {
          pending_tests,
          medications: showMore && medication.trim()
            ? [{ name: medication.trim(), dosage: '', frequency: 'As prescribed' }]
            : [],
          mark_completed: true,
        })
        navigate(appPath('visits'))
        return
      }

      // Schedule mode: offer one-tap calendar reminder before leaving.
      setSavedVisit(saved)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save visit')
    } finally {
      setSaving(false)
    }
  }

  async function addToCalendarAndFinish() {
    if (!savedVisit) return
    setAddingReminder(true)
    try {
      const reminder = await userApi.createReminder({
        title: appointmentReminderTitle(savedVisit),
        description: appointmentReminderDescription(savedVisit) || undefined,
        reminder_time: savedVisit.visit_date,
        priority: 'medium',
      })
      await syncReminderAfterCreate(reminder)
      navigate(appPath('calendar'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Saved visit, but reminder failed')
      navigate(appPath('calendar'))
    } finally {
      setAddingReminder(false)
    }
  }

  if (loading) {
    return (
      <div className="user-app-content--no-nav">
        <MomAppBar pageTitle="Visit" onBack={() => navigate(appPath('visits'))} />
        <div className="u-center-page"><div className="u-spinner" /></div>
      </div>
    )
  }

  const saveLabel =
    mode === 'schedule'
      ? 'Save appointment'
      : mode === 'update'
        ? 'Save update'
        : 'Save visit'

  return (
    <div className="user-app-content--no-nav visit-form-page">
      <MomAppBar
        pageTitle={titleForMode(mode, isEdit)}
        onBack={() => navigate(savedVisit ? appPath('calendar') : appPath('visits'))}
      />
      <div className="visit-form-page__scroll">
        {error && <div className="u-alert u-alert--error">{error}</div>}

        {mode === 'schedule' && (
          <p className="u-muted" style={{ marginTop: 0 }}>
            Just the essentials — type, date, and time. We&apos;ll ask how it went after.
          </p>
        )}
        {mode === 'update' && (
          <p className="u-muted" style={{ marginTop: 0 }}>
            A short update is enough. Add more details only if you want to.
          </p>
        )}
        {mode === 'past' && (
          <p className="u-muted" style={{ marginTop: 0 }}>
            Log what you remember. Extra clinical detail is optional.
          </p>
        )}

        <label className="app-label">Visit type</label>
        <select className="app-input" value={visitType} onChange={(e) => setVisitType(e.target.value)}>
          {DOCTOR_VISIT_TYPES.map((t) => (
            <option key={t} value={t}>{DOCTOR_VISIT_TYPE_LABELS[t] ?? t}</option>
          ))}
        </select>

        <label className="app-label" style={{ marginTop: 12 }}>
          {mode === 'schedule' ? 'When is it?' : 'When was it?'}
        </label>
        <input
          className="app-input"
          type="datetime-local"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
        />

        <label className="app-label" style={{ marginTop: 12 }}>Provider (optional)</label>
        <input className="app-input" value={providerName} onChange={(e) => setProviderName(e.target.value)} placeholder="Doctor or midwife" />

        <label className="app-label" style={{ marginTop: 12 }}>Facility (optional)</label>
        <input className="app-input" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} placeholder="Clinic or hospital" />

        {mode === 'schedule' ? (
          <>
            <label className="app-label" style={{ marginTop: 12 }}>Note (optional)</label>
            <textarea
              className="app-input"
              rows={2}
              value={howItWent}
              onChange={(e) => setHowItWent(e.target.value)}
              placeholder="Anything to remember before you go"
            />
          </>
        ) : (
          <>
            <label className="app-label" style={{ marginTop: 12 }}>How did it go?</label>
            <textarea
              className="app-input"
              rows={3}
              value={howItWent}
              onChange={(e) => setHowItWent(e.target.value)}
              placeholder="What the doctor said, how you feel, anything useful"
            />

            <label className="app-label" style={{ marginTop: 12 }}>Next appointment (optional)</label>
            <input
              className="app-input"
              type="datetime-local"
              value={nextAppointment}
              onChange={(e) => setNextAppointment(e.target.value)}
            />

            <label className="app-label" style={{ marginTop: 12 }}>Next appointment notes</label>
            <input
              className="app-input"
              value={nextNotes}
              onChange={(e) => setNextNotes(e.target.value)}
              placeholder="Bring scan results, fasting, etc."
            />

            {!showMore ? (
              <button
                type="button"
                className="app-btn app-btn--ghost app-btn--sm"
                style={{ marginTop: 16 }}
                onClick={() => setShowMore(true)}
              >
                Add more details
              </button>
            ) : (
              <div style={{ marginTop: 20 }}>
                <p className="u-caption" style={{ marginBottom: 8 }}>More details (optional)</p>
                <label className="app-label">Diagnosis</label>
                <input className="app-input" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                <label className="app-label" style={{ marginTop: 12 }}>Treatment plan</label>
                <textarea className="app-input" rows={2} value={treatment} onChange={(e) => setTreatment(e.target.value)} />
                <label className="app-label" style={{ marginTop: 12 }}>Medication</label>
                <input className="app-input" value={medication} onChange={(e) => setMedication(e.target.value)} placeholder="Name only" />
                <label className="app-label" style={{ marginTop: 12 }}>Test still to do</label>
                <input className="app-input" value={pendingTest} onChange={(e) => setPendingTest(e.target.value)} placeholder="Blood work, scan…" />
                <button
                  type="button"
                  className="app-btn app-btn--ghost app-btn--sm"
                  style={{ marginTop: 8 }}
                  onClick={() => setShowMore(false)}
                >
                  Hide extra details
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="visit-form-page__footer">
        <p className="visit-form-page__summary">{formatSummary(visitDate, visitType)}</p>
        <GradientButton onClick={submit} disabled={saving || Boolean(savedVisit)}>
          {saving ? 'Saving…' : saveLabel}
        </GradientButton>
      </div>

      {savedVisit && (
        <div className="sheet-overlay" role="dialog" aria-modal="true" aria-labelledby="visit-saved-title">
          <div className="sheet-panel sheet-panel--compose">
            <div className="sheet-panel__handle" aria-hidden />
            <h2 id="visit-saved-title" className="u-heading-sm">Appointment saved</h2>
            <p className="u-muted" style={{ margin: '8px 0 0', lineHeight: 1.45 }}>
              Add it to your calendar so you get a nudge when the day arrives.
            </p>
            <p className="visit-saved-chip">
              {appointmentReminderTitle(savedVisit)}
            </p>
            <div className="sheet-panel__footer sheet-panel__footer--stack">
              <GradientButton onClick={addToCalendarAndFinish} disabled={addingReminder}>
                {addingReminder ? 'Adding…' : 'Add to calendar'}
              </GradientButton>
              <button
                type="button"
                className="app-btn app-btn--ghost"
                onClick={() => navigate(appPath('calendar'))}
                disabled={addingReminder}
              >
                Skip — view calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
