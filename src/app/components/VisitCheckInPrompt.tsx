import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userApi } from '../api'
import { GradientButton } from './ui'
import type { DoctorVisit, Reminder } from '../types'
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

export function VisitCheckInPrompt() {
  const [visits, setVisits] = useState<DoctorVisit[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissedKeys())
  const [monthlyDismissedAt, setMonthlyDismissedAt] = useState<Date | null>(() =>
    loadMonthlyDismissedAt(),
  )
  const [busy, setBusy] = useState(false)
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

  return (
    <div className="glass home-prompt-card">
      {context.kind === 'upcomingAppointment' && context.visit && context.appointmentAt && (
        <>
          <p className="u-caption">
            {context.isScheduledVisit ? 'Scheduled visit' : 'Upcoming appointment'}
          </p>
          <strong>
            {DOCTOR_VISIT_TYPE_LABELS[context.visit.visit_type] ?? context.visit.visit_type} ·{' '}
            {context.appointmentAt.toLocaleString()}
          </strong>
          {context.visit.provider_name && (
            <p className="u-muted" style={{ margin: '4px 0 0', fontSize: '0.875rem' }}>
              {context.visit.provider_name}
            </p>
          )}
          <div className="home-prompt-card__actions">
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
          <p className="u-caption">After your visit</p>
          <strong>
            How did your {(DOCTOR_VISIT_TYPE_LABELS[context.visit.visit_type] ?? context.visit.visit_type).toLowerCase()} on{' '}
            {new Date(context.visit.visit_date).toLocaleDateString()} go?
          </strong>
          <p className="u-muted home-prompt-card__body" style={{ marginTop: 8 }}>
            A short update is enough — add more details only if you want.
          </p>
          <div className="home-prompt-card__actions">
            <button type="button" className="app-btn app-btn--outline app-btn--sm" onClick={() => dismiss(context)}>
              Not now
            </button>
            <Link
              to={appPath(`visits/${context.visit.id}/edit?mode=update`)}
              className="gradient-btn app-btn--sm"
              style={{ textDecoration: 'none', width: 'auto', flex: '0 0 auto' }}
            >
              Give update
            </Link>
          </div>
        </>
      )}

      {context.kind === 'monthlyLog' && (
        <>
          <p className="u-caption">Doctor visit check-in</p>
          <strong>Anything coming up, or a visit you already had?</strong>
          <div className="home-prompt-card__actions" style={{ flexWrap: 'wrap' }}>
            <button type="button" className="app-btn app-btn--outline app-btn--sm" onClick={() => dismiss(context)}>
              Not now
            </button>
            <Link
              to={appPath('visits/new?mode=schedule')}
              className="app-btn app-btn--outline app-btn--sm"
              style={{ textDecoration: 'none' }}
              onClick={() => dismiss(context)}
            >
              Schedule visit
            </Link>
            <Link
              to={appPath('visits/new?mode=past')}
              className="gradient-btn app-btn--sm"
              style={{ textDecoration: 'none', width: 'auto', flex: '0 0 auto' }}
              onClick={() => dismiss(context)}
            >
              Log past visit
            </Link>
          </div>
        </>
      )}

      {message && <p className="u-muted" style={{ margin: '12px 0 0', fontSize: '0.85rem' }}>{message}</p>}
    </div>
  )
}
