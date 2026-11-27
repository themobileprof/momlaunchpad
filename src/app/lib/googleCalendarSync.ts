import type { Reminder } from '../types'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** UTC stamp for Google Calendar template URLs: YYYYMMDDTHHMMSSZ */
function toGoogleUtcStamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  )
}

/**
 * Opens Google Calendar’s “create event” page with the reminder prefilled.
 * No OAuth and no sensitive scopes — the user saves the event in Google Calendar.
 */
export function googleCalendarTemplateUrl(reminder: Reminder): string {
  const start = new Date(reminder.reminder_time)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: reminder.title,
    dates: `${toGoogleUtcStamp(start)}/${toGoogleUtcStamp(end)}`,
  })
  if (reminder.description?.trim()) {
    params.set('details', reminder.description.trim())
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function openReminderInGoogleCalendar(reminder: Reminder): void {
  window.open(googleCalendarTemplateUrl(reminder), '_blank', 'noopener,noreferrer')
}
