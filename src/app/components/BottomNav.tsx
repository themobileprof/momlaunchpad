import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  IconCalendar,
  IconChat,
  IconCommunity,
  IconHome,
  IconMore,
} from './Icons'
import { appPath } from '../routes'
import { useEffect, useState } from 'react'
import { MoreMenuSheet } from './MoreMenuSheet'
import { userApi } from '../api'

const TABS = [
  { to: appPath(), label: 'Home', Icon: IconHome, end: true },
  { to: appPath('calendar'), label: 'Calendar', Icon: IconCalendar },
  { to: appPath('chat'), label: 'Chat', Icon: IconChat },
  { to: appPath('community'), label: 'Community', Icon: IconCommunity },
] as const

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)
  const [inboxUnread, setInboxUnread] = useState(0)

  useEffect(() => {
    let cancelled = false
    userApi
      .getInboxUnreadCount()
      .then((r) => {
        if (!cancelled) setInboxUnread(r.unread ?? 0)
      })
      .catch(() => {
        /* non-critical */
      })
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  const isMoreActive =
    location.pathname.startsWith(appPath('profile')) ||
    location.pathname.startsWith(appPath('settings')) ||
    location.pathname.startsWith(appPath('inbox')) ||
    location.pathname.startsWith(appPath('visits'))

  return (
    <>
      <nav className="bottom-nav-wrap" aria-label="Main">
        <div className="bottom-nav">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={'end' in tab ? tab.end : false}
              className={({ isActive }) =>
                `bottom-nav-item${isActive ? ' bottom-nav-item--active' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <tab.Icon filled={isActive} />
                  <span>{tab.label}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            className={`bottom-nav-item${isMoreActive ? ' bottom-nav-item--active' : ''}`}
            onClick={() => setMoreOpen(true)}
          >
            <IconMore />
            <span>More</span>
            {inboxUnread > 0 && <span className="bottom-nav-badge" aria-hidden />}
          </button>
        </div>
      </nav>
      {moreOpen && (
        <MoreMenuSheet
          onClose={() => setMoreOpen(false)}
          inboxUnread={inboxUnread}
          onInbox={() => {
            setMoreOpen(false)
            navigate(appPath('inbox'))
          }}
          onProfile={() => {
            setMoreOpen(false)
            navigate(appPath('profile'))
          }}
          onSettings={() => {
            setMoreOpen(false)
            navigate(appPath('settings'))
          }}
          onVisits={() => {
            setMoreOpen(false)
            navigate(appPath('visits'))
          }}
        />
      )}
    </>
  )
}
