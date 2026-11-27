import type { Reminder } from '../types'
import { openReminderInGoogleCalendar } from './googleCalendarSync'

/** Offer adding a reminder to Google Calendar via compose URL (no API access). */
export function offerExternalCalendar(reminder: Reminder): void {
  openReminderInGoogleCalendar(reminder)
}
