import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { HomeCommunityHighlight } from '../components/HomeCommunityHighlight'
import { VisitCheckInPrompt } from '../components/VisitCheckInPrompt'
import { GradientButton, MomAppBar } from '../components/ui'
import { useUserProfile } from '../context/UserProfileContext'
import { babyThemeLabel, resolveBabyTheme } from '../lib/babyTheme'
import {
  hasProfessionalBadge,
  primaryProfessionalBadgeLabel,
} from '../lib/communityBadges'
import { JOURNEY_STAGES } from '../types'
import { appPath } from '../routes'
import type { MyCommunityBadges, WelcomeMessage } from '../types'

/** Single curated hero — not scattered elsewhere in the app */
const HERO_IMAGE = '/pregnant/main/pexels-alameenng-33662812.jpg'

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 6.5h14v8.4H9.8L5 19.2V6.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8.5 10.2h7M8.5 13h4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CommunityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="8" cy="8.5" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="16.5" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M3.5 19c.9-3.2 2.9-4.8 6-4.8s5.1 1.6 6 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14.4 15c2.9.1 4.9 1.4 6.1 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 5.5h14v14H5v-14Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 3.8v4M16 3.8v4M5 10h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 14h2.5v2.5H8.5V14Z" fill="currentColor" />
    </svg>
  )
}

function VisitsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 4.5h8v15H8v-15Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 8.2v7.6M8.2 12h7.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 7.5H4.8v9H6M18 7.5h1.2v9H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const QUICK_LINKS = [
  { to: 'calendar', label: 'Calendar', sub: 'Appointments, check-ins, and your timeline.', Icon: CalendarIcon, tone: 'calendar', wide: true },
  { to: 'chat', label: 'Chat', sub: 'Guidance that remembers your journey.', Icon: ChatIcon, tone: 'chat' },
  { to: 'community', label: 'Community', sub: 'Moms and caregivers near you.', Icon: CommunityIcon, tone: 'community' },
  { to: 'visits', label: 'Visits', sub: 'Doctor notes and follow-ups.', Icon: VisitsIcon, tone: 'visits' },
] as const

export function AppHomePage() {
  const { profile, activeBabyGender } = useUserProfile()
  const [welcome, setWelcome] = useState<WelcomeMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [badges, setBadges] = useState<MyCommunityBadges | null>(null)

  useEffect(() => {
    userApi
      .getWelcome()
      .then(setWelcome)
      .catch(() => setWelcome(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    userApi
      .getMyCommunityBadges()
      .then(setBadges)
      .catch(() => setBadges(null))
  }, [])

  useEffect(() => {
    userApi.trackUsage('home_view')
  }, [])

  const journeyLabel = JOURNEY_STAGES.find((s) => s.value === profile?.journey_stage)?.label
  const professionalLabel = badges ? primaryProfessionalBadgeLabel(badges) : null
  const isProfessional = badges ? hasProfessionalBadge(badges.badges) : false
  const statusLabel = professionalLabel ?? journeyLabel
  const firstName = profile?.name?.split(' ')[0]
  const theme = resolveBabyTheme(activeBabyGender)
  const week = profile?.pregnancy_week
  const message =
    welcome?.message ??
    (isProfessional
      ? 'Thank you for supporting mothers in your community — chat, community, and reminders are here when you need them.'
      : 'Personalized support for every stage — chat, community, and reminders that fit your life.')

  return (
    <>
      <MomAppBar pageTitle="Home" />
      <div className="user-app-content">
        <section className="home-hero" aria-label="Welcome">
          <img className="home-hero__art" src={HERO_IMAGE} alt="" />
          <div className="home-hero__content">
            <div className="home-hero__panel">
              <p className="home-kicker">Your pregnancy space</p>
              <h1 className="home-hero__greeting">
                Hello{firstName ? `, ${firstName}` : ''}
              </h1>
              <p className="home-hero__message">
                {loading ? 'Preparing your personalized welcome…' : message}
              </p>
              <div className="home-hero__actions">
                <Link to={appPath('chat')} className="home-primary-link">
                  <GradientButton>Talk to your assistant</GradientButton>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="home-status-row" aria-label="Your journey">
          {statusLabel && (
            <span className={`app-badge${professionalLabel ? ' app-badge--verified' : ''}`}>
              {statusLabel}
            </span>
          )}
          {week != null && profile?.journey_stage === 'pregnant' && (
            <span className="app-badge">Week {week}</span>
          )}
          {profile?.baby_gender && (
            <span className="app-badge">{babyThemeLabel(theme)} palette</span>
          )}
        </div>

        <VisitCheckInPrompt />
        <HomeCommunityHighlight />

        <section className="home-bento" aria-labelledby="home-bento-title">
          <div className="home-section-head">
            <p className="home-kicker">Explore</p>
            <h2 id="home-bento-title">Built for your journey</h2>
          </div>
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={appPath(link.to)}
              className={`bento-card bento-card--${link.tone}${'wide' in link && link.wide ? ' bento-card--wide' : ''}`}
            >
              <span className="bento-card__icon">
                <link.Icon />
              </span>
              <span className="bento-card__label">{link.label}</span>
              <span className="bento-card__sub">{link.sub}</span>
            </Link>
          ))}
        </section>
      </div>
      <BottomNav />
    </>
  )
}
