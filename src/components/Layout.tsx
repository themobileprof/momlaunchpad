import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BrandLogo } from './BrandLogo'
import { useAuth } from '../context/AuthContext'
import { usePendingBadgeRequests } from '../hooks/usePendingBadgeRequests'
import { ADMIN_BASE } from '../routes'

const nav = [
  { to: ADMIN_BASE, label: 'Dashboard', end: true },
  { to: `${ADMIN_BASE}/feedback`, label: 'Feedback' },
  { to: `${ADMIN_BASE}/plans`, label: 'Plans' },
  { to: `${ADMIN_BASE}/features`, label: 'Features' },
  { to: `${ADMIN_BASE}/languages`, label: 'Languages' },
  { to: `${ADMIN_BASE}/settings`, label: 'Settings' },
  { to: `${ADMIN_BASE}/users`, label: 'Users' },
  { to: `${ADMIN_BASE}/community?tab=badge-requests`, label: 'Badge requests', badgeKey: 'badge-requests' as const },
  { to: `${ADMIN_BASE}/community`, label: 'Community' },
  { to: `${ADMIN_BASE}/referrals`, label: 'Referrals' },
]

export function Layout() {
  const { user, logout } = useAuth()
  const { count: pendingBadgeCount } = usePendingBadgeRequests()
  const location = useLocation()
  const communityTab = new URLSearchParams(location.search).get('tab')
  const onCommunity = location.pathname === `${ADMIN_BASE}/community`

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <BrandLogo size="md" subtitle="Operations" />
        </div>
        <nav className="nav">
          {nav.map((item) => {
            const isBadgeQueue =
              'badgeKey' in item && item.badgeKey === 'badge-requests'
            const isCommunityRoot = item.to === `${ADMIN_BASE}/community`
            const isActive = isBadgeQueue
              ? onCommunity && communityTab === 'badge-requests'
              : isCommunityRoot
                ? onCommunity && communityTab !== 'badge-requests'
                : undefined

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive: linkActive }) =>
                  (isActive ?? linkActive) ? 'nav-link active' : 'nav-link'
                }
              >
                <span className="nav-link-label">{item.label}</span>
                {isBadgeQueue && pendingBadgeCount > 0 && (
                  <span className="nav-count">{pendingBadgeCount}</span>
                )}
              </NavLink>
            )
          })}
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
