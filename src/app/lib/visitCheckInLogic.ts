import type { DoctorVisit, Reminder } from '../types'
import { DOCTOR_VISIT_TYPE_LABELS } from '../types'

export type VisitCheckInKind = 'upcomingAppointment' | 'recentDebrief' | 'monthlyLog'

export interface VisitCheckInContext {
  kind: VisitCheckInKind
  visit?: DoctorVisit
  appointmentAt?: Date
  dismissalKey(now: Date): string
}

export const visitUpcomingWindowDays = 14
export const visitDebriefWindowDays = 14
export const visitMonthlyPromptDays = 30

function visitTypeLabel(visit: DoctorVisit) {
  return DOCTOR_VISIT_TYPE_LABELS[visit.visit_type] ?? visit.visit_type
}

export function resolveVisitCheckIn(input: {
  visits: DoctorVisit[]
  reminders: Reminder[]
  dismissedKeys: Set<string>
  monthlyDismissedAt?: Date | null
  now?: Date
}): VisitCheckInContext | null {
  const clock = input.now ?? new Date()

  const upcoming = nearestUpcomingAppointment(input.visits, clock)
  if (upcoming) {
    const { visit, appointmentAt } = upcoming
    const withinWindow =
      (appointmentAt.getTime() - clock.getTime()) / 86400000 <= visitUpcomingWindowDays
    if (withinWindow) {
      const ctx = makeContext('upcomingAppointment', visit, appointmentAt)
      if (
        !input.dismissedKeys.has(ctx.dismissalKey(clock)) &&
        !hasMatchingAppointmentReminder(input.reminders, appointmentAt)
      ) {
        return ctx
      }
    }
  }

  for (const visit of input.visits) {
    if (!visitNeedsDebrief(visit, clock)) continue
    const ctx = makeContext('recentDebrief', visit, undefined)
    if (!input.dismissedKeys.has(ctx.dismissalKey(clock))) return ctx
  }

  const monthlyAllowed =
    !input.monthlyDismissedAt ||
    (clock.getTime() - input.monthlyDismissedAt.getTime()) / 86400000 >=
      visitMonthlyPromptDays
  if (monthlyAllowed) {
    const ctx = makeContext('monthlyLog', undefined, undefined)
    if (!input.dismissedKeys.has(ctx.dismissalKey(clock))) return ctx
  }

  return null
}

function makeContext(
  kind: VisitCheckInKind,
  visit: DoctorVisit | undefined,
  appointmentAt: Date | undefined,
): VisitCheckInContext {
  return {
    kind,
    visit,
    appointmentAt,
    dismissalKey(clock: Date) {
      if (kind === 'upcomingAppointment' && visit && appointmentAt) {
        return `upcoming_${visit.id}_${appointmentAt.getTime()}`
      }
      if (kind === 'recentDebrief' && visit) return `debrief_${visit.id}`
      return `monthly_${clock.getFullYear()}_${clock.getMonth() + 1}`
    },
  }
}

function nearestUpcomingAppointment(visits: DoctorVisit[], now: Date) {
  let bestVisit: DoctorVisit | undefined
  let bestAppt: Date | undefined

  for (const visit of visits) {
    if (!visit.next_appointment_at) continue
    const appt = new Date(visit.next_appointment_at)
    if (appt <= now) continue
    if (!bestAppt || appt < bestAppt) {
      bestAppt = appt
      bestVisit = visit
    }
  }

  if (!bestVisit || !bestAppt) return null
  return { visit: bestVisit, appointmentAt: bestAppt }
}

function visitNeedsDebrief(visit: DoctorVisit, clock: Date) {
  if (visit.debrief_completed_at) return false
  const visitDate = new Date(visit.visit_date)
  const daysSince = Math.floor((clock.getTime() - visitDate.getTime()) / 86400000)
  return daysSince >= 0 && daysSince <= visitDebriefWindowDays
}

export function hasMatchingAppointmentReminder(reminders: Reminder[], appt: Date) {
  for (const reminder of reminders) {
    if (reminder.is_completed) continue
    const when = new Date(reminder.reminder_time)
    const sameDay =
      when.getFullYear() === appt.getFullYear() &&
      when.getMonth() === appt.getMonth() &&
      when.getDate() === appt.getDate()
    if (!sameDay) continue

    const title = reminder.title.toLowerCase()
    if (title.includes('appointment') || title.includes('doctor') || title.includes('visit')) {
      return true
    }
    if (Math.abs(when.getTime() - appt.getTime()) / 3600000 <= 2) return true
  }
  return false
}

export function appointmentReminderTitle(visit: DoctorVisit) {
  const label = visitTypeLabel(visit)
  if (visit.provider_name?.trim()) return `${label} with ${visit.provider_name.trim()}`
  return `${label} appointment`
}

export function appointmentReminderDescription(visit: DoctorVisit) {
  const parts: string[] = []
  if (visit.facility_name?.trim()) parts.push(visit.facility_name.trim())
  if (visit.next_appointment_notes?.trim()) parts.push(visit.next_appointment_notes.trim())
  return parts.join(' · ')
}
