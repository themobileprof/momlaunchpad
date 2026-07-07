import { Link } from 'react-router-dom'
import { ApkDownloadSection } from '../components/ApkDownloadSection'
import { BrandLogo } from '../components/BrandLogo'
import { HomePhotoVisual } from '../components/HomePhotoVisual'
import { appPath } from '../app/routes'
import './home.css'

export function HomePage() {
  return (
    <div className="home home--compact">
      <div className="home-grain" aria-hidden />
      <header className="home-header home-header--compact">
        <BrandLogo href="/" size="lg" showText className="home-logo" />
        <Link to={appPath('login')} className="home-header-signin">
          Sign in
        </Link>
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

          <ApkDownloadSection />
        </div>
      </main>

      <footer className="home-footer home-footer--compact">
        <p className="home-footer-copy">
          © {new Date().getFullYear()} MomLaunchpad
          <span aria-hidden> · </span>
          <Link to={appPath('login')}>App</Link>
        </p>
      </footer>
    </div>
  )
}
