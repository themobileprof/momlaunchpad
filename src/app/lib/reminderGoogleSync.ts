import { userApi } from '../api'
import type { Reminder } from '../types'
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  isGoogleCalendarSyncEnabled,
  updateGoogleCalendarEvent,
} from './googleCalendarSync'

export async function syncReminderAfterCreate(reminder: Reminder): Promise<Reminder> {
  if (!isGoogleCalendarSyncEnabled()) return reminder
  try {
    const eventId = await createGoogleCalendarEvent(reminder)
    return userApi.updateReminder(reminder.id, { google_calendar_event_id: eventId })
  } catch (e) {
    console.warn('Google Calendar sync failed', e)
    return reminder
  }
}

export async function syncReminderAfterUpdate(reminder: Reminder): Promise<Reminder> {
  if (!isGoogleCalendarSyncEnabled()) return reminder
  try {
    if (reminder.is_completed && reminder.google_calendar_event_id) {
      await deleteGoogleCalendarEvent(reminder.google_calendar_event_id)
      return userApi.updateReminder(reminder.id, { google_calendar_event_id: '' })
    }
    if (reminder.google_calendar_event_id) {
      await updateGoogleCalendarEvent(reminder)
      return reminder
    }
    const eventId = await createGoogleCalendarEvent(reminder)
    return userApi.updateReminder(reminder.id, { google_calendar_event_id: eventId })
  } catch (e) {
    console.warn('Google Calendar sync failed', e)
    return reminder
  }
}

export async function syncReminderBeforeDelete(reminder: Reminder): Promise<void> {
  if (!isGoogleCalendarSyncEnabled() || !reminder.google_calendar_event_id) return
  try {
    await deleteGoogleCalendarEvent(reminder.google_calendar_event_id)
  } catch (e) {
    console.warn('Google Calendar delete failed', e)
  }
}

export async function backfillRemindersToGoogle(reminders: Reminder[]): Promise<void> {
  if (!isGoogleCalendarSyncEnabled()) return
  for (const reminder of reminders) {
    if (reminder.is_completed) continue
    if (reminder.google_calendar_event_id) continue
    await syncReminderAfterCreate(reminder)
  }
}
