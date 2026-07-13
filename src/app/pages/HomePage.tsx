import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { HomeCommunityHighlight } from '../components/HomeCommunityHighlight'
import { VisitCheckInPrompt } from '../components/VisitCheckInPrompt'
import { MomAppBar } from '../components/ui'
import { useUserProfile } from '../context/UserProfileContext'
import { appPhotos } from '../lib/appPhotos'
import { babyThemeLabel, resolveBabyTheme } from '../lib/babyTheme'
import { JOURNEY_STAGES } from '../types'
import { appPath } from '../routes'
import type { WelcomeMessage } from '../types'

const QUICK_LINKS = [
  { to: 'chat', label: 'Chat', sub: 'Your companion', icon: '💬', tone: 'chat' },
  { to: 'community', label: 'Community', sub: 'Moms like you', icon: '◎', tone: 'community' },
  { to: 'calendar', label: 'Calendar', sub: 'Reminders', icon: '📅', tone: 'calendar' },
  { to: 'visits', label: 'Visits', sub: 'Appointments', icon: '🩺', tone: 'visits' },
] as const

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

  useEffect(() => {
    userApi.trackUsage('home_view')
  }, [])

  const journeyLabel = JOURNEY_STAGES.find((s) => s.value === profile?.journey_stage)?.label
  const firstName = profile?.name?.split(' ')[0]
  const theme = resolveBabyTheme(profile?.baby_gender)
  const week = profile?.pregnancy_week

  return (
    <>
      <MomAppBar pageTitle="Home" />
      <div className="user-app-content">
        <section className="home-hero" aria-label="Welcome">
          <img className="home-hero__photo" src={appPhotos.hero.src} alt="" />
          <div className="home-hero__overlay">
            <div className="home-hero__badges">
              {journeyLabel && <span className="app-badge">♥ {journeyLabel}</span>}
              {week != null && profile?.journey_stage === 'pregnant' && (
                <span className="app-badge">Week {week}</span>
              )}
              {profile?.baby_gender && (
                <span className="app-badge">{babyThemeLabel(theme)} theme</span>
              )}
            </div>
            <h1 className="home-hero__greeting">
              Hello{firstName ? `, ${firstName}` : ''} 👋
            </h1>
            <p className="home-hero__message">
              {loading
                ? 'Loading your personalized message…'
                : welcome?.message ??
                  'Your cozy corner for pregnancy support — chat, community, and gentle nudges when life gets busy.'}
            </p>
          </div>
        </section>

        <div className="home-welcome-card">
          <div className="home-welcome-card__row">
            <img
              className="home-welcome-card__thumb"
              src={appPhotos.welcome.src}
              alt={appPhotos.welcome.alt}
            />
            <div>
              <p className="u-caption" style={{ margin: '0 0 6px' }}>
                Personalized for you
              </p>
              <p className="u-body" style={{ margin: 0, fontWeight: 600 }}>
                Your assistant remembers your journey — symptoms, visits, and milestones — so advice
                always feels like it&apos;s meant for <em>you</em>.
              </p>
            </div>
          </div>
        </div>

        <VisitCheckInPrompt />
        <HomeCommunityHighlight />

        <div className="home-photo-strip" aria-hidden>
          {appPhotos.strip.map((photo) => (
            <img key={photo.src} src={photo.src} alt="" loading="lazy" />
          ))}
        </div>

        <h2 className="section-title">Jump in</h2>
        <div className="action-tiles">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={appPath(link.to)}
              className={`action-tile action-tile--${link.tone}`}
            >
              <span className="action-tile__icon" aria-hidden>
                {link.icon}
              </span>
              <span className="action-tile__label">{link.label}</span>
              <span className="action-tile__sub">{link.sub}</span>
            </Link>
          ))}
        </div>
      </div>
      <BottomNav />
    </>
  )
}
