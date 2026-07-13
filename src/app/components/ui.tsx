import type { ReactNode } from 'react'
import type { BabyThemeId } from '../lib/babyTheme'
import { appPhotos } from '../lib/appPhotos'

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
        <img
          className="user-app-bg-photo"
          src={appPhotos.hero.src}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="user-app-shell">{children}</div>
    </div>
  )
}

export function MomAppBar({
  pageTitle,
  onBack,
  actions,
}: {
  pageTitle?: string
  onBack?: () => void
  actions?: ReactNode
}) {
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
      <div>
        <div className="mom-app-bar-brand">MomLaunchPad</div>
        {pageTitle && <div className="mom-app-bar-title">{pageTitle}</div>}
      </div>
      {actions && <div className="mom-app-bar-actions">{actions}</div>}
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
