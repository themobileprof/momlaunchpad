import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { MomAppBar } from '../components/ui'
import { useUserAuth } from '../context/UserAuthContext'
import { backfillRemindersToGoogle } from '../lib/reminderGoogleSync'
import {
  ensureGoogleCalendarAccess,
  isGoogleCalendarSyncEnabled,
  setGoogleCalendarSyncEnabled,
} from '../lib/googleCalendarSync'
import { isGoogleAuthEnabled } from '../lib/googleAuth'
import { appPath } from '../routes'

export function SettingsPage() {
  const { logout, user } = useUserAuth()
  const [calendarSync, setCalendarSync] = useState(isGoogleCalendarSyncEnabled())
  const [calendarBusy, setCalendarBusy] = useState(false)
  const [calendarMsg, setCalendarMsg] = useState('')

  useEffect(() => {
    setCalendarSync(isGoogleCalendarSyncEnabled())
  }, [])

  async function toggleCalendarSync(enabled: boolean) {
    if (!isGoogleAuthEnabled) {
      setCalendarMsg('Google sign-in is not configured for this site.')
      return
    }
    setCalendarBusy(true)
    setCalendarMsg('')
    try {
      if (enabled) {
        const ok = await ensureGoogleCalendarAccess()
        if (!ok) {
          setCalendarMsg('Google Calendar access was not granted.')
          return
        }
        setGoogleCalendarSyncEnabled(true)
        setCalendarSync(true)
        const reminders = await userApi.listReminders()
        await backfillRemindersToGoogle(reminders)
        setCalendarMsg('Google Calendar sync enabled.')
      } else {
        setGoogleCalendarSyncEnabled(false)
        setCalendarSync(false)
        setCalendarMsg('Sync turned off. Existing Google events were kept.')
      }
    } catch (e) {
      setCalendarMsg(e instanceof Error ? e.message : 'Could not update calendar sync')
    } finally {
      setCalendarBusy(false)
    }
  }

  return (
    <>
      <MomAppBar pageTitle="Settings" />
      <div className="user-app-content">
        <div style={{ padding: 16 }}>
          <div className="app-card" style={{ marginBottom: 16 }}>
            <p className="u-caption">Account</p>
            <strong>{user?.name || user?.email}</strong>
            <p className="u-muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{user?.email}</p>
          </div>

          <div className="app-card" style={{ marginBottom: 16 }}>
            <p className="u-caption">Preferences</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0' }}>
              <div>
                <strong style={{ display: 'block' }}>Google Calendar sync</strong>
                <span className="u-muted" style={{ fontSize: '0.85rem' }}>
                  {calendarSync ? 'Reminders sync to your primary Google Calendar' : 'Send app reminders to Google Calendar'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={calendarSync}
                disabled={calendarBusy || !isGoogleAuthEnabled}
                onChange={(e) => toggleCalendarSync(e.target.checked)}
              />
            </div>
            {calendarMsg && <p className="u-muted" style={{ fontSize: '0.85rem', margin: '8px 0 0' }}>{calendarMsg}</p>}
          </div>

          <div className="app-card" style={{ marginBottom: 16 }}>
            <p className="u-caption">App</p>
            <Link to="/" className="sheet-item" style={{ padding: '8px 0', display: 'block' }}>Marketing site</Link>
            <Link to={`${appPath('community/onboarding')}?edit=1`} className="sheet-item" style={{ padding: '8px 0', display: 'block' }}>
              Edit community location & feed topics
            </Link>
            <Link to={appPath('visits')} className="sheet-item" style={{ padding: '8px 0', display: 'block' }}>
              Doctor visit records
            </Link>
          </div>

          <button type="button" className="app-btn app-btn--outline" style={{ width: '100%' }} onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
      <BottomNav />
    </>
  )
}
