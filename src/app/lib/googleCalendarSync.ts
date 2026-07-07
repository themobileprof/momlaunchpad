import { GOOGLE_CLIENT_ID, isGoogleAuthEnabled } from './googleAuth'
import type { Reminder } from '../types'

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
const SYNC_ENABLED_KEY = 'google_calendar_sync_enabled'
const TOKEN_KEY = 'google_calendar_access_token'
const TOKEN_EXP_KEY = 'google_calendar_token_exp_ms'

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }) => { requestAccessToken: (overrides?: { prompt?: string }) => void }
        }
      }
    }
  }
}

let gsiLoaded: Promise<void> | null = null

function loadGsi(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gsiLoaded) return gsiLoaded
  gsiLoaded = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
  return gsiLoaded
}

export function isGoogleCalendarSyncEnabled(): boolean {
  return localStorage.getItem(SYNC_ENABLED_KEY) === 'true'
}

export function setGoogleCalendarSyncEnabled(enabled: boolean) {
  if (enabled) localStorage.setItem(SYNC_ENABLED_KEY, 'true')
  else {
    localStorage.removeItem(SYNC_ENABLED_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXP_KEY)
  }
}

function storeToken(accessToken: string, expiresInSec = 3600) {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + expiresInSec * 1000))
}

function getStoredToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const exp = Number(localStorage.getItem(TOKEN_EXP_KEY) ?? '0')
  if (!token || Date.now() >= exp - 60000) return null
  return token
}

export async function ensureGoogleCalendarAccess(): Promise<boolean> {
  if (!isGoogleAuthEnabled) return false
  const existing = getStoredToken()
  if (existing) return true

  await loadGsi()
  return new Promise((resolve) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: CALENDAR_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          resolve(false)
          return
        }
        storeToken(response.access_token)
        resolve(true)
      },
    })
    client.requestAccessToken({ prompt: 'consent' })
  })
}

async function accessToken(): Promise<string> {
  let token = getStoredToken()
  if (!token) {
    const ok = await ensureGoogleCalendarAccess()
    if (!ok) throw new Error('Google Calendar access was not granted')
    token = getStoredToken()
  }
  if (!token) throw new Error('Could not obtain Google access token')
  return token
}

function eventBody(reminder: Reminder) {
  const start = new Date(reminder.reminder_time)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  return {
    summary: reminder.title,
    ...(reminder.description?.trim() ? { description: reminder.description.trim() } : {}),
    start: { dateTime: start.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    end: { dateTime: end.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    reminders: { useDefault: true },
    extendedProperties: {
      private: { momlaunchpad_reminder_id: reminder.id },
    },
    ...(reminder.is_completed ? { status: 'cancelled' } : {}),
  }
}

export async function createGoogleCalendarEvent(reminder: Reminder): Promise<string> {
  const token = await accessToken()
  const res = await fetch(EVENTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody(reminder)),
  })
  if (!res.ok) throw new Error(await res.text().catch(() => 'Failed to create Google event'))
  const body = (await res.json()) as { id?: string }
  if (!body.id) throw new Error('Google Calendar returned no event id')
  return body.id
}

export async function updateGoogleCalendarEvent(reminder: Reminder): Promise<void> {
  const eventId = reminder.google_calendar_event_id
  if (!eventId) return
  const token = await accessToken()
  const res = await fetch(`${EVENTS_URL}/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody(reminder)),
  })
  if (!res.ok) throw new Error(await res.text().catch(() => 'Failed to update Google event'))
}

export async function deleteGoogleCalendarEvent(eventId: string): Promise<void> {
  if (!eventId) return
  const token = await accessToken()
  const res = await fetch(`${EVENTS_URL}/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status !== 204 && res.status !== 200 && !res.ok) {
    throw new Error(await res.text().catch(() => 'Failed to delete Google event'))
  }
}
