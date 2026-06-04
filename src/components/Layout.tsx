import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ADMIN_BASE } from '../routes'

const nav = [
  { to: ADMIN_BASE, label: 'Dashboard', end: true },
  { to: `${ADMIN_BASE}/plans`, label: 'Plans' },
  { to: `${ADMIN_BASE}/features`, label: 'Features' },
  { to: `${ADMIN_BASE}/languages`, label: 'Languages' },
  { to: `${ADMIN_BASE}/settings`, label: 'Settings' },
  { to: `${ADMIN_BASE}/users`, label: 'Users' },
  { to: `${ADMIN_BASE}/community`, label: 'Community' },
  { to: `${ADMIN_BASE}/referrals`, label: 'Referrals' },
]

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">ML</span>
          <div>
            <strong>MomLaunchpad</strong>
            <small>Operations</small>
          </div>
        </div>
        <nav className="nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="user-email">{user?.email}</span>
            <span className="badge">Admin</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
