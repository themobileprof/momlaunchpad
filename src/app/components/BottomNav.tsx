import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  IconCalendar,
  IconChat,
  IconCommunity,
  IconHome,
  IconMore,
} from './Icons'
import { appPath } from '../routes'
import { useState } from 'react'
import { MoreMenuSheet } from './MoreMenuSheet'

const TABS = [
  { to: appPath(), label: 'Home', Icon: IconHome, end: true },
  { to: appPath('chat'), label: 'Chat', Icon: IconChat },
  { to: appPath('community'), label: 'Community', Icon: IconCommunity },
  { to: appPath('calendar'), label: 'Calendar', Icon: IconCalendar },
] as const

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive =
    location.pathname.startsWith(appPath('profile')) ||
    location.pathname.startsWith(appPath('settings'))

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
          </button>
        </div>
      </nav>
      {moreOpen && (
        <MoreMenuSheet
          onClose={() => setMoreOpen(false)}
          onProfile={() => {
            setMoreOpen(false)
            navigate(appPath('profile'))
          }}
          onSettings={() => {
            setMoreOpen(false)
            navigate(appPath('settings'))
          }}
        />
      )}
    </>
  )
}
