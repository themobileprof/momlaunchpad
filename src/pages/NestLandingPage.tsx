import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { APP_BASE } from '../app/routes'
import './home.css'

/** Public marketing stub for the delivery nest. */
export function NestLandingPage() {
  return (
    <div className="home">
      <div className="home-grain" aria-hidden />
      <header className="home-header">
        <BrandLogo href="/" size="lg" showText className="home-logo" />
      </header>
      <main className="home-join-main">
        <section className="home-hero home-join-hero" aria-labelledby="nest-landing-heading">
          <div className="home-hero-glow" aria-hidden />
          <p className="home-eyebrow">Delivery nest</p>
          <h1 id="nest-landing-heading" className="home-hero-title">
            Save toward your due date
            <span className="home-hero-accent"> with people who love you</span>
          </h1>
          <p className="home-hero-lead">
            Create a nest in MomLaunchpad, invite close family and friends, and get a gentle
            end-of-month nudge so your tribe can contribute before delivery.
          </p>
          <div className="home-hero-actions" style={{ marginTop: '1.5rem' }}>
            <Link className="home-btn home-btn-lg" to={`${APP_BASE}/nest`}>
              Open your nest
            </Link>
            <Link className="home-btn home-btn-ghost home-btn-lg" to="/">
              Back to MomLaunchpad
            </Link>
          </div>
          <p className="home-join-note" style={{ marginTop: '1.5rem' }}>
            Invited to contribute? Use the personal link your person shared with you.
          </p>
        </section>
      </main>
    </div>
  )
}
