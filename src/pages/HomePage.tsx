import { Link } from 'react-router-dom'
import { ApkDownloadSection } from '../components/ApkDownloadSection'
import { BrandLogo } from '../components/BrandLogo'
import { HomePhotoVisual } from '../components/HomePhotoVisual'
import { appPath } from '../app/routes'
import { openConsentSettings } from '../lib/consent'
import './home.css'

const FEATURES = [
  {
    icon: '✨',
    title: 'Guidance made personal',
    desc: 'The assistant remembers your milestones and appointments, so advice fits where you actually are—not generic tips.',
  },
  {
    icon: '💬',
    title: 'Supportive chat',
    desc: 'Ask questions any time and get gentle, judgment-free answers.',
  },
  {
    icon: '🤝',
    title: 'A caring community',
    desc: 'Share your journey and connect with moms who truly get it.',
  },
  {
    icon: '🗓️',
    title: 'Your pregnancy calendar',
    desc: 'Track milestones and appointments week by week.',
  },
] as const

export function HomePage() {
  return (
    <div className="home home--compact">
      <div className="home-grain" aria-hidden />
      <header className="home-header home-header--compact">
        <BrandLogo href="/" size="lg" showText className="home-logo" />
      </header>

      <main className="home-compact-main">
        <HomePhotoVisual />

        <div className="home-compact-content">
          <section className="home-hero home-hero--compact" aria-labelledby="hero-heading">
            <div className="home-hero-glow" aria-hidden />
            <h1 id="hero-heading" className="home-hero-title home-reveal">
              A softer place to land
            </h1>
            <p className="home-hero-lead home-reveal" style={{ animationDelay: '0.08s' }}>
              Chat, community, and gentle support for your pregnancy journey.
            </p>
            <div className="home-hero-actions home-reveal" style={{ animationDelay: '0.14s' }}>
              <Link to={appPath('login')} className="home-btn home-btn-primary home-btn-lg">
                Sign in
              </Link>
              <Link to={appPath('register')} className="home-btn home-btn-outline home-btn-lg">
                Create account
              </Link>
            </div>
          </section>

          <ul className="home-features home-reveal" style={{ animationDelay: '0.2s' }}>
            {FEATURES.map((feature) => (
              <li key={feature.title} className="home-feature">
                <span className="home-feature-icon" aria-hidden>
                  {feature.icon}
                </span>
                <div>
                  <h2 className="home-feature-title">{feature.title}</h2>
                  <p className="home-feature-desc">{feature.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <ApkDownloadSection />
        </div>
      </main>

      <footer className="home-footer home-footer--compact">
        <p className="home-footer-copy">
          © {new Date().getFullYear()} MomLaunchpad
          <span aria-hidden> · </span>
          <Link to={appPath('login')}>App</Link>
          <span aria-hidden> · </span>
          <button type="button" className="home-footer-link" onClick={openConsentSettings}>
            Cookie settings
          </button>
        </p>
      </footer>
    </div>
  )
}
