import type { ReactNode } from 'react'
import { useUserAuth } from '../context/UserAuthContext'
import type { BabyThemeId } from '../lib/babyTheme'

function AppBarExitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden width="20" height="20">
      <path
        d="M9 4.5H5.5a1.5 1.5 0 0 0-1.5 1.5V18a1.5 1.5 0 0 0 1.5 1.5H9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 12H20M20 12l-2.75-2.75M20 12l-2.75 2.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="12" r="0.75" fill="currentColor" />
    </svg>
  )
}

export function AppBackground({
  children,
  babyTheme = 'bloom',
}: {
  children: ReactNode
  babyTheme?: BabyThemeId
}) {
  return (
    <div className="user-app" data-baby-theme={babyTheme}>
      <div className="user-app-bg" aria-hidden>
        <span className="user-app-bubble user-app-bubble--1" />
        <span className="user-app-bubble user-app-bubble--2" />
        <span className="user-app-bubble user-app-bubble--3" />
        <span className="user-app-bubble user-app-bubble--4" />
        <span className="user-app-bubble user-app-bubble--5" />
        <span className="user-app-bubble user-app-bubble--6" />
      </div>
      <div className="user-app-shell">{children}</div>
    </div>
  )
}

export function MomAppBar({
  pageTitle,
  onBack,
  actions,
  showLogout = true,
}: {
  pageTitle?: string
  onBack?: () => void
  actions?: ReactNode
  /** Web-only quick exit — shown top-right when signed in. */
  showLogout?: boolean
}) {
  const { user, logout } = useUserAuth()
  const showActions = actions || (showLogout && user)

  return (
    <header className="mom-app-bar">
      {onBack && (
        <button type="button" className="mom-app-bar-back" onClick={onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <img src="/logo.png" alt="" className="mom-app-bar-logo" />
      <div className="mom-app-bar-brand-wrap">
        <div className="mom-app-bar-brand">MomLaunchPad</div>
        {pageTitle && <div className="mom-app-bar-title">{pageTitle}</div>}
      </div>
      {showActions && (
        <div className="mom-app-bar-actions">
          {actions}
          {showLogout && user && (
            <button
              type="button"
              className="mom-app-bar-exit"
              onClick={logout}
              aria-label="Log out"
              title="Log out"
            >
              <AppBarExitIcon />
            </button>
          )}
        </div>
      )}
    </header>
  )
}

export function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass ${className}`}>{children}</div>
}

export function AppCard({
  children,
  className = '',
  onClick,
  outlined,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  outlined?: boolean
}) {
  const cls = [
    'app-card',
    outlined ? 'app-card--outlined' : '',
    onClick ? 'app-card--tap' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick} style={{ width: '100%', textAlign: 'left', border: outlined ? undefined : 'none' }}>
        {children}
      </button>
    )
  }
  return <div className={cls}>{children}</div>
}

export function GradientButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button type={type} className="gradient-btn" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export function EmptyState({ icon, title, body, action }: {
  icon?: string
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h2 className="u-heading-md">{title}</h2>
      {body && <p className="u-muted">{body}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="u-center-page">
      <div className="u-spinner" />
    </div>
  )
}
