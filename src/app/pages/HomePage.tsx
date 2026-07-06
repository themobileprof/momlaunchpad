import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { AppCard, MomAppBar } from '../components/ui'
import { useUserProfile } from '../context/UserProfileContext'
import { JOURNEY_STAGES } from '../types'
import { appPath } from '../routes'
import type { WelcomeMessage } from '../types'

export function AppHomePage() {
  const { profile } = useUserProfile()
  const [welcome, setWelcome] = useState<WelcomeMessage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userApi
      .getWelcome()
      .then(setWelcome)
      .catch(() => setWelcome(null))
      .finally(() => setLoading(false))
  }, [])

  const journeyLabel = JOURNEY_STAGES.find((s) => s.value === profile?.journey_stage)?.label

  return (
    <>
      <MomAppBar pageTitle="Home" />
      <div className="user-app-content">
        <div style={{ padding: '8px 16px 0' }}>
          {journeyLabel && (
            <span className="app-badge" style={{ marginBottom: 12, display: 'inline-flex' }}>
              ♥ {journeyLabel}
            </span>
          )}
        </div>

        <div className="glass" style={{ margin: '0 16px 24px', padding: 16, opacity: 0.95 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <span>👋</span>
            <strong>Welcome{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}</strong>
          </div>
          {loading ? (
            <p className="u-muted">Loading your message…</p>
          ) : (
            <p className="u-body" style={{ margin: 0 }}>
              {welcome?.message ?? 'We\'re glad you\'re here. Tap Chat when you\'re ready to talk.'}
            </p>
          )}
        </div>

        <p className="u-caption" style={{ padding: '0 16px', marginBottom: 8 }}>Quick links</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 16px' }}>
          <Link to={appPath('chat')} style={{ textDecoration: 'none', color: 'inherit' }}>
            <AppCard>
              <div style={{ color: 'var(--teal)', fontSize: '1.25rem', marginBottom: 8 }}>💬</div>
              <strong style={{ fontSize: '0.9rem' }}>Chat</strong>
            </AppCard>
          </Link>
          <Link to={appPath('community')} style={{ textDecoration: 'none', color: 'inherit' }}>
            <AppCard>
              <div style={{ color: 'var(--teal)', fontSize: '1.25rem', marginBottom: 8 }}>◎</div>
              <strong style={{ fontSize: '0.9rem' }}>Community</strong>
            </AppCard>
          </Link>
          <Link to={appPath('calendar')} style={{ textDecoration: 'none', color: 'inherit' }}>
            <AppCard>
              <div style={{ color: 'var(--teal)', fontSize: '1.25rem', marginBottom: 8 }}>📅</div>
              <strong style={{ fontSize: '0.9rem' }}>Calendar</strong>
            </AppCard>
          </Link>
          <Link to={appPath('profile')} style={{ textDecoration: 'none', color: 'inherit' }}>
            <AppCard>
              <div style={{ color: 'var(--teal)', fontSize: '1.25rem', marginBottom: 8 }}>👤</div>
              <strong style={{ fontSize: '0.9rem' }}>Profile</strong>
            </AppCard>
          </Link>
        </div>
      </div>
      <BottomNav />
    </>
  )
}
