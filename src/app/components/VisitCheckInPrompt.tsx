import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userApi } from '../api'
import { GradientButton } from './ui'
import type { DoctorVisit, Reminder, VisitPendingTest } from '../types'
import { DOCTOR_VISIT_TYPE_LABELS } from '../types'
import {
  appointmentReminderDescription,
  appointmentReminderTitle,
  resolveVisitCheckIn,
  type VisitCheckInContext,
} from '../lib/visitCheckInLogic'
import {
  loadDismissedKeys,
  loadMonthlyDismissedAt,
  saveDismissedKey,
  saveMonthlyDismissedAt,
} from '../lib/visitCheckInDismissals'
import { syncReminderAfterCreate } from '../lib/reminderGoogleSync'
import { appPath } from '../routes'

interface PendingTestRow {
  name: string
  dueBy: string
  remind: boolean
}

const DEFAULT_TEST_REMINDER_DAYS = 7

/** Fallback due date (a week out) when a follow-up test has no explicit date. */
function defaultTestDueDate(): Date {
  return new Date(Date.now() + DEFAULT_TEST_REMINDER_DAYS * 86400000)
}

export function VisitCheckInPrompt() {
  const [visits, setVisits] = useState<DoctorVisit[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissedKeys())
  const [monthlyDismissedAt, setMonthlyDismissedAt] = useState<Date | null>(() =>
    loadMonthlyDismissedAt(),
  )
  const [busy, setBusy] = useState(false)
  const [debriefVisit, setDebriefVisit] = useState<DoctorVisit | null>(null)
  const [testRows, setTestRows] = useState<PendingTestRow[]>([{ name: '', dueBy: '', remind: true }])
  const [medication, setMedication] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    userApi.listDoctorVisits().then(setVisits).catch(() => setVisits([]))
    userApi.listReminders().then(setReminders).catch(() => setReminders([]))
  }, [])

  const context = resolveVisitCheckIn({
    visits,
    reminders,
    dismissedKeys: dismissed,
    monthlyDismissedAt,
  })

  if (!context) return null

  function dismiss(ctx: VisitCheckInContext) {
    const key = ctx.dismissalKey(new Date())
    saveDismissedKey(key)
    if (ctx.kind === 'monthlyLog') {
      saveMonthlyDismissedAt()
      setMonthlyDismissedAt(new Date())
    }
    setDismissed(new Set([...dismissed, key]))
  }

  async function addAppointmentReminder(ctx: VisitCheckInContext) {
    if (!ctx.visit || !ctx.appointmentAt) return
    setBusy(true)
    try {
      let reminder = await userApi.createReminder({
        title: appointmentReminderTitle(ctx.visit),
        description: appointmentReminderDescription(ctx.visit) || undefined,
        reminder_time: ctx.appointmentAt.toISOString(),
        priority: 'medium',
      })
      reminder = await syncReminderAfterCreate(reminder)
      setReminders((prev) => [...prev, reminder])
      dismiss(ctx)
      setMessage('Appointment added to your calendar')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to add reminder')
    } finally {
      setBusy(false)
    }
  }

  async function submitDebrief() {
    if (!debriefVisit) return
    setBusy(true)
    setMessage('')
    try {
      const pendingTests: VisitPendingTest[] = testRows
        .filter((row) => row.name.trim())
        .map((row) => ({
          test_name: row.name.trim(),
          due_by: row.dueBy ? new Date(`${row.dueBy}T09:00:00`).toISOString() : undefined,
          status: 'pending',
        }))

      const updated = await userApi.debriefDoctorVisit(debriefVisit.id, {
        pending_tests: pendingTests,
        medications: medication.trim()
          ? [{ name: medication.trim(), dosage: '', frequency: 'As prescribed' }]
          : [],
        mark_completed: true,
      })

      for (let i = 0; i < testRows.length; i++) {
        const name = testRows[i].name.trim()
        if (!name || !testRows[i].remind) continue
        const due = testRows[i].dueBy
          ? new Date(`${testRows[i].dueBy}T09:00:00`)
          : defaultTestDueDate()
        let reminder = await userApi.createReminder({
          title: `Test: ${name}`,
          description: `Follow-up from ${DOCTOR_VISIT_TYPE_LABELS[debriefVisit.visit_type] ?? debriefVisit.visit_type}`,
          reminder_time: due.toISOString(),
          priority: 'medium',
        })
        reminder = await syncReminderAfterCreate(reminder)
        setReminders((prev) => [...prev, reminder])
      }

      setVisits((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
      setDebriefVisit(null)
      if (context?.kind === 'recentDebrief') dismiss(context)
      setMessage('Visit follow-up saved')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to save follow-up')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="glass" style={{ margin: '16px 16px 0', padding: 16 }}>
        {context.kind === 'upcomingAppointment' && context.visit && context.appointmentAt && (
          <>
            <p className="u-caption" style={{ margin: '0 0 4px' }}>Upcoming appointment</p>
            <strong>
              {DOCTOR_VISIT_TYPE_LABELS[context.visit.visit_type] ?? context.visit.visit_type} ·{' '}
              {context.appointmentAt.toLocaleString()}
            </strong>
            {context.visit.provider_name && (
              <p className="u-muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                {context.visit.provider_name}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" className="app-btn app-btn--outline app-btn--sm" disabled={busy} onClick={() => dismiss(context)}>
                Not now
              </button>
              <GradientButton onClick={() => addAppointmentReminder(context)} disabled={busy}>
                {busy ? 'Adding…' : 'Add to calendar'}
              </GradientButton>
            </div>
          </>
        )}

        {context.kind === 'recentDebrief' && context.visit && (
          <>
            <p className="u-caption" style={{ margin: '0 0 4px' }}>After your visit</p>
            <strong>
              How did your {(DOCTOR_VISIT_TYPE_LABELS[context.visit.visit_type] ?? context.visit.visit_type).toLowerCase()} on{' '}
              {new Date(context.visit.visit_date).toLocaleDateString()} go?
            </strong>
            <p className="u-muted" style={{ margin: '8px 0 0', fontSize: '0.85rem' }}>
              Log any tests still to do. We can add reminders if you want.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" className="app-btn app-btn--outline app-btn--sm" onClick={() => dismiss(context)}>
                Not now
              </button>
              <GradientButton onClick={() => { setDebriefVisit(context.visit!); setTestRows([{ name: '', dueBy: '', remind: true }]); setMedication('') }}>
                Log follow-up
              </GradientButton>
            </div>
          </>
        )}

        {context.kind === 'monthlyLog' && (
          <>
            <p className="u-caption" style={{ margin: '0 0 4px' }}>Doctor visit check-in</p>
            <strong>Any appointment coming up, or a visit you had recently?</strong>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" className="app-btn app-btn--outline app-btn--sm" onClick={() => dismiss(context)}>
                Not now
              </button>
              <Link to={appPath('visits/new')} className="gradient-btn" style={{ textDecoration: 'none', padding: '10px 16px', borderRadius: 12, fontSize: '0.9rem' }}>
                Log visit
              </Link>
            </div>
          </>
        )}

        {message && <p className="u-muted" style={{ margin: '12px 0 0', fontSize: '0.85rem' }}>{message}</p>}
      </div>

      {debriefVisit && (
        <div className="sheet-overlay" role="presentation" onClick={() => setDebriefVisit(null)}>
          <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="u-heading-sm">Visit follow-up</h2>
            <p className="u-muted" style={{ fontSize: '0.85rem' }}>
              Tests still to do (optional). Reminders are optional too.
            </p>
            {testRows.map((row, i) => (
              <div key={i} style={{ marginTop: 12 }}>
                <input
                  className="app-input"
                  placeholder={`Test or scan ${i + 1}`}
                  value={row.name}
                  onChange={(e) => {
                    const next = [...testRows]
                    next[i] = { ...next[i], name: e.target.value }
                    setTestRows(next)
                  }}
                />
                <input
                  className="app-input"
                  type="date"
                  value={row.dueBy}
                  onChange={(e) => {
                    const next = [...testRows]
                    next[i] = { ...next[i], dueBy: e.target.value }
                    setTestRows(next)
                  }}
                  style={{ marginTop: 8 }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={row.remind}
                    onChange={(e) => {
                      const next = [...testRows]
                      next[i] = { ...next[i], remind: e.target.checked }
                      setTestRows(next)
                    }}
                  />
                  Remind me
                </label>
              </div>
            ))}
            <button
              type="button"
              className="app-btn app-btn--ghost app-btn--sm"
              style={{ marginTop: 8 }}
              onClick={() => setTestRows([...testRows, { name: '', dueBy: '', remind: true }])}
            >
              + Add another test
            </button>
            <input
              className="app-input"
              placeholder="Medication prescribed (optional, name only)"
              value={medication}
              onChange={(e) => setMedication(e.target.value)}
              style={{ marginTop: 16 }}
            />
            <div style={{ marginTop: 16 }}>
              <GradientButton onClick={submitDebrief} disabled={busy}>
                {busy ? 'Saving…' : 'Save'}
              </GradientButton>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
