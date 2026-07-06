import { Link } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { MomAppBar } from '../components/ui'
import { useUserAuth } from '../context/UserAuthContext'
import { appPath } from '../routes'

export function SettingsPage() {
  const { logout, user } = useUserAuth()

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
            <p className="u-caption">App</p>
            <Link to="/" className="sheet-item" style={{ padding: '8px 0' }}>Marketing site</Link>
            <Link to={appPath('community/onboarding')} className="sheet-item" style={{ padding: '8px 0' }}>Edit community location</Link>
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
