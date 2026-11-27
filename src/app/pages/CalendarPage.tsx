import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { PregnancyWeekStory } from '../components/PregnancyWeekStory'
import { EmptyState, GradientButton, MomAppBar } from '../components/ui'
import { useUserProfile } from '../context/UserProfileContext'
import {
  syncReminderAfterCreate,
  syncReminderAfterUpdate,
  syncReminderBeforeDelete,
} from '../lib/reminderGoogleSync'
import { appPath } from '../routes'
import type { CommunityEvent, DoctorVisit, Reminder } from '../types'
import { DOCTOR_VISIT_TYPE_LABELS } from '../types'

type TimelineKind = 'reminder' | 'visit' | 'community'

interface TimelineItem {
  id: string
  kind: TimelineKind
  at: Date
  title: string
  subtitle: string
  priority?: Reminder['priority']
  completed?: boolean
  sourceId?: string
}

const STAGE_COPY: Record<string, (week?: number) => string> = {
  pregnant: (week) =>
    week
      ? `Week ${week}: keep appointments and gentle reminders in one place.`
      : 'Your appointments and reminders, in one calm timeline.',
  ttc: () =>
    'A calm timeline for reminders and moments that support your goals.',
  postpartum: () =>
    'Recovery-focused timeline with practical reminders and follow-ups.',
  miscarriage: () =>
    'A gentle, low-pressure timeline with only what is helpful right now.',
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function fmtDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function monthMatches(date: Date, viewDate: Date) {
  return date.getMonth() === viewDate.getMonth() && date.getFullYear() === viewDate.getFullYear()
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function asTimelineReminder(r: Reminder): TimelineItem {
  const at = new Date(r.reminder_time)
  return {
    id: `reminder-${r.id}`,
    kind: 'reminder',
    at,
    title: r.title,
    subtitle: formatTime(at),
    priority: r.priority,
    completed: r.is_completed,
    sourceId: r.id,
  }
}

function asTimelineVisit(v: DoctorVisit): TimelineItem[] {
  const visitDate = new Date(v.visit_date)
  const visitType = DOCTOR_VISIT_TYPE_LABELS[v.visit_type] ?? v.visit_type
  const rows: TimelineItem[] = [
    {
      id: `visit-${v.id}`,
      kind: 'visit',
      at: visitDate,
      title: visitType,
      subtitle: v.provider_name ? `${formatTime(visitDate)} · ${v.provider_name}` : formatTime(visitDate),
      sourceId: v.id,
    },
  ]
  if (v.next_appointment_at) {
    const next = new Date(v.next_appointment_at)
    rows.push({
      id: `visit-next-${v.id}`,
      kind: 'visit',
      at: next,
      title: 'Next appointment',
      subtitle: v.next_appointment_notes
        ? `${formatTime(next)} · ${v.next_appointment_notes}`
        : formatTime(next),
      sourceId: v.id,
    })
  }
  return rows
}

function asTimelineCommunity(event: CommunityEvent): TimelineItem {
  const at = new Date(event.starts_at)
  const place = [event.city, event.state_province].filter(Boolean).join(', ')
  return {
    id: `community-${event.id}`,
    kind: 'community',
    at,
    title: event.title,
    subtitle: place ? `${formatTime(at)} · ${place}` : formatTime(at),
    sourceId: event.post_id,
  }
}

export function CalendarPage() {
  const today = new Date()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useUserProfile()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [visits, setVisits] = useState<DoctorVisit[]>([])
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState(toInputDate(today))
  const [formTime, setFormTime] = useState('09:00')
  const [toast, setToast] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [r, v, feed] = await Promise.all([
        userApi.listReminders().catch(() => [] as Reminder[]),
        userApi.listDoctorVisits().catch(() => [] as DoctorVisit[]),
        userApi.getCommunityFeed('events', undefined, 12).catch(() => ({ posts: [] as { id: string }[] })),
      ])
      setReminders(r)
      setVisits(v)
      const eventResults = await Promise.all(
        feed.posts.map((post) => userApi.getEvent(post.id).catch(() => null)),
      )
      setCommunityEvents(eventResults.filter((e): e is CommunityEvent => Boolean(e)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const add = searchParams.get('add')
    if (add === 'reminder') {
      setShowForm(true)
      setSearchParams({}, { replace: true })
    } else if (add === 'appointment') {
      setSearchParams({}, { replace: true })
      navigate(appPath('visits/new?mode=schedule'))
    }
  }, [searchParams, setSearchParams, navigate])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const timeline = useMemo(() => {
    const all: TimelineItem[] = [
      ...reminders.map(asTimelineReminder),
      ...visits.flatMap(asTimelineVisit),
      ...communityEvents.map(asTimelineCommunity),
    ]
    return all
      .filter((item) => monthMatches(item.at, viewDate))
      .sort((a, b) => a.at.getTime() - b.at.getTime())
  }, [communityEvents, reminders, viewDate, visits])

  const [nowMs] = useState(() => Date.now())
  const upcomingCount = useMemo(
    () => timeline.filter((item) => item.at.getTime() >= nowMs && !item.completed).length,
    [timeline, nowMs],
  )

  const stageLine =
    STAGE_COPY[profile?.journey_stage ?? '']?.(profile?.pregnancy_week) ??
    'A single timeline for the things that matter in your journey.'

  async function createReminder() {
    if (!formTitle.trim() || !formDate || !formTime) return
    setSaving(true)
    try {
      const scheduled = new Date(`${formDate}T${formTime}:00`)
      const reminder = await userApi.createReminder({
        title: formTitle.trim(),
        reminder_time: scheduled.toISOString(),
        priority: 'medium',
      })
      await syncReminderAfterCreate(reminder)
      setShowForm(false)
      setFormTitle('')
      setFormDate(toInputDate(today))
      setFormTime('09:00')
      setToast('Reminder saved')
      await load()
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Could not save reminder')
    } finally {
      setSaving(false)
    }
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

  function timelineClass(item: TimelineItem) {
    if (item.kind === 'community') return 'calendar-timeline-item calendar-timeline-item--community'
    if (item.kind === 'visit') return 'calendar-timeline-item calendar-timeline-item--visit'
    if (item.completed) return 'calendar-timeline-item calendar-timeline-item--done'
    return 'calendar-timeline-item'
  }

  const isPregnant = profile?.journey_stage === 'pregnant'

  return (
    <>
      <MomAppBar pageTitle="Calendar" />
      <div className="user-app-content">
        {isPregnant && <PregnancyWeekStory profileWeek={profile?.pregnancy_week} />}

        <section className="calendar-story-head">
          <h2 className="u-heading-sm calendar-story-head__section-title">
            {isPregnant ? 'Your schedule this month' : monthLabel}
          </h2>
          <div className="calendar-story-head__row">
            <button
              type="button"
              className="app-btn app-btn--ghost app-btn--sm"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
            >
              ‹
            </button>
            <strong className="u-heading-sm">{isPregnant ? monthLabel : 'Timeline'}</strong>
            <button
              type="button"
              className="app-btn app-btn--ghost app-btn--sm"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
            >
              ›
            </button>
          </div>
          <p className="calendar-story-head__narration">
            {isPregnant
              ? 'Appointments and reminders alongside your weekly pregnancy story above.'
              : stageLine}
          </p>
          <div className="calendar-story-head__meta">
            <span className="app-badge">{upcomingCount} upcoming</span>
            <span className="app-badge">Appointments · Reminders</span>
          </div>
        </section>

        {loading ? (
          <div className="u-center-page"><div className="u-spinner" /></div>
        ) : timeline.length === 0 ? (
          <EmptyState
            icon="📅"
            title="Nothing scheduled yet"
            body="Save your next clinic visit or a gentle reminder — it only takes a moment."
            action={
              <div className="calendar-empty-actions">
                <GradientButton onClick={() => navigate(appPath('visits/new?mode=schedule'))}>
                  Schedule appointment
                </GradientButton>
                <button
                  type="button"
                  className="app-btn app-btn--outline"
                  onClick={() => setShowForm(true)}
                >
                  Add reminder
                </button>
              </div>
            }
          />
        ) : (
          <section className="calendar-timeline">
            {timeline.map((item) => (
              <article key={item.id} className={timelineClass(item)}>
                <div className="calendar-timeline-item__date">
                  <span>{fmtDate(item.at)}</span>
                </div>
                <div className="calendar-timeline-item__body">
                  <p className="calendar-timeline-item__kind">
                    {item.kind === 'visit' ? 'Appointment' : item.kind === 'reminder' ? 'Reminder' : 'Community'}
                  </p>
                  <h3 className="calendar-timeline-item__title">{item.title}</h3>
                  <p className="calendar-timeline-item__sub">{item.subtitle}</p>

                  {item.kind === 'reminder' && item.sourceId && (
                    <div className="calendar-timeline-item__actions">
                      <button
                        type="button"
                        className="app-btn app-btn--outline app-btn--sm"
                        onClick={() => {
                          const match = reminders.find((r) => r.id === item.sourceId)
                          if (match) void toggleComplete(match)
                        }}
                      >
                        {item.completed ? 'Undo' : 'Mark done'}
                      </button>
                      <button
                        type="button"
                        className="app-btn app-btn--ghost app-btn--sm"
                        onClick={() => {
                          const match = reminders.find((r) => r.id === item.sourceId)
                          if (match) void deleteReminderItem(match)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  {item.kind === 'visit' && item.sourceId && (
                    <div className="calendar-timeline-item__actions">
                      <Link to={appPath(`visits/${item.sourceId}/edit`)} className="app-btn app-btn--outline app-btn--sm">
                        Open visit
                      </Link>
                    </div>
                  )}

                  {item.kind === 'community' && item.sourceId && (
                    <div className="calendar-timeline-item__actions">
                      <Link to={appPath(`community/post/${item.sourceId}`)} className="app-btn app-btn--outline app-btn--sm">
                        View event post
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        <div className="calendar-action-dock" role="group" aria-label="Add to calendar">
          <button
            type="button"
            className="calendar-action-dock__primary"
            onClick={() => navigate(appPath('visits/new?mode=schedule'))}
          >
            <span className="calendar-action-dock__icon" aria-hidden>＋</span>
            Schedule appointment
          </button>
          <button
            type="button"
            className="calendar-action-dock__secondary"
            onClick={() => setShowForm(true)}
          >
            Add reminder
          </button>
        </div>
      </div>

      {showForm && (
        <div className="sheet-overlay" onClick={() => setShowForm(false)} role="presentation">
          <div className="sheet-panel sheet-panel--compose" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-panel__handle" aria-hidden />
            <h2 className="u-heading-sm">Quick reminder</h2>
            <p className="u-muted" style={{ margin: '6px 0 0', fontSize: '0.88rem' }}>
              Vitamins, scans, rest — whatever you need to remember.
            </p>
            <label className="app-label" style={{ marginTop: 16 }}>What for?</label>
            <input
              className="app-input"
              placeholder="e.g. Take folic acid"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              autoFocus
            />
            <div className="calendar-compose-row">
              <div>
                <label className="app-label">Date</label>
                <input className="app-input" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div>
                <label className="app-label">Time</label>
                <input className="app-input" type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} />
              </div>
            </div>
            <div className="sheet-panel__footer">
              <button type="button" className="app-btn app-btn--ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <GradientButton onClick={createReminder} disabled={saving || !formTitle.trim()}>
                {saving ? 'Saving…' : 'Save reminder'}
              </GradientButton>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="calendar-toast" role="status">{toast}</div>}

      <BottomNav />
    </>
  )
}
