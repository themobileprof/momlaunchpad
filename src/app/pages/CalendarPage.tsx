import { useEffect, useMemo, useState } from 'react'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { AppCard, EmptyState, GradientButton, MomAppBar } from '../components/ui'
import {
  syncReminderAfterCreate,
  syncReminderAfterUpdate,
  syncReminderBeforeDelete,
} from '../lib/reminderGoogleSync'
import type { Reminder } from '../types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function CalendarPage() {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(today)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formTime, setFormTime] = useState('09:00')
  const [formPriority, setFormPriority] = useState<string>('medium')

  const load = () => {
    userApi
      .listReminders()
      .then(setReminders)
      .catch(() => setReminders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const cells = monthGrid(viewDate.getFullYear(), viewDate.getMonth())
  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const dayReminders = useMemo(
    () =>
      reminders.filter((r) => sameDay(new Date(r.reminder_time), selected)),
    [reminders, selected],
  )

  const eventDays = useMemo(() => {
    const set = new Set<number>()
    reminders.forEach((r) => {
      const d = new Date(r.reminder_time)
      if (d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear()) {
        set.add(d.getDate())
      }
    })
    return set
  }, [reminders, viewDate])

  async function createReminder() {
    if (!formTitle.trim()) return
    const [h, m] = formTime.split(':').map(Number)
    const scheduled = new Date(selected)
    scheduled.setHours(h, m, 0, 0)
    const reminder = await userApi.createReminder({
      title: formTitle.trim(),
      reminder_time: scheduled.toISOString(),
      priority: formPriority,
    })
    await syncReminderAfterCreate(reminder)
    setShowForm(false)
    setFormTitle('')
    load()
  }

  async function toggleComplete(r: Reminder) {
    let updated = await userApi.updateReminder(r.id, { is_completed: !r.is_completed })
    updated = await syncReminderAfterUpdate(updated)
    setReminders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }

  async function deleteReminderItem(r: Reminder) {
    await syncReminderBeforeDelete(r)
    await userApi.deleteReminder(r.id)
    load()
  }

  return (
    <>
      <MomAppBar pageTitle="Calendar" />
      <div className="user-app-content">
        <div style={{ margin: '0 16px 16px' }}>
        <AppCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>‹</button>
            <strong className="u-heading-sm">{monthLabel}</strong>
            <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>›</button>
          </div>
          <div className="calendar-grid" style={{ marginBottom: 8 }}>
            {WEEKDAYS.map((d) => (
              <span key={d} className="u-caption" style={{ fontSize: '0.65rem' }}>{d}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {cells.map((day, i) => {
              if (day === null) return <span key={`e-${i}`} />
              const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
              const isSelected = sameDay(date, selected)
              const isToday = sameDay(date, today)
              const hasEvent = eventDays.has(day)
              return (
                <button
                  key={day}
                  type="button"
                  className={[
                    'calendar-day',
                    isSelected ? 'calendar-day--selected' : '',
                    isToday && !isSelected ? 'calendar-day--today' : '',
                    hasEvent && !isSelected ? 'calendar-day--has-event' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelected(date)}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </AppCard>
        </div>

        <div style={{ padding: '0 24px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 className="u-heading-md">
            {selected.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </h2>
          <span className="app-badge">{dayReminders.length}</span>
        </div>

        {loading ? (
          <div className="u-center-page"><div className="u-spinner" /></div>
        ) : dayReminders.length === 0 ? (
          <EmptyState icon="📅" title="No reminders" body="Add a gentle nudge for this day." />
        ) : (
          <div style={{ padding: '0 16px' }}>
            {dayReminders.map((r) => (
              <div
                key={r.id}
                className="app-card app-card--outlined"
                style={{ display: 'flex', gap: 16, marginBottom: 8, opacity: r.is_completed ? 0.6 : 1 }}
              >
                <div className={`priority-stripe priority-stripe--${r.priority}`} />
                <div style={{ flex: 1 }}>
                  <strong>{r.title}</strong>
                  <p className="u-muted" style={{ margin: '4px 0', fontSize: '0.85rem' }}>
                    {new Date(r.reminder_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <button type="button" className="app-btn app-btn--outline app-btn--sm" onClick={() => toggleComplete(r)}>
                    {r.is_completed ? 'Undo' : 'Mark done'}
                  </button>
                  <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => deleteReminderItem(r)} style={{ marginLeft: 8 }}>
                    Delete
                  </button>
                  {r.google_calendar_event_id && (
                    <p className="u-muted" style={{ margin: '8px 0 0', fontSize: '0.75rem' }}>Synced to Google Calendar</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className="gradient-btn"
          style={{ position: 'fixed', right: 24, bottom: 100, width: 'auto', borderRadius: 30, padding: '16px 24px' }}
          onClick={() => setShowForm(true)}
        >
          + Reminder
        </button>
      </div>

      {showForm && (
        <div className="sheet-overlay" onClick={() => setShowForm(false)} role="presentation">
          <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="u-heading-sm">New reminder</h2>
            <input className="app-input" placeholder="Title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} style={{ marginTop: 12 }} />
            <input className="app-input" type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} style={{ marginTop: 8 }} />
            <select className="app-input" value={formPriority} onChange={(e) => setFormPriority(e.target.value)} style={{ marginTop: 8 }}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div style={{ marginTop: 16 }}>
              <GradientButton onClick={createReminder}>Save reminder</GradientButton>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  )
}
