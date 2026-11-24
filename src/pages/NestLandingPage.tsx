import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { APP_BASE } from '../app/routes'
import './home.css'

/** Public marketing stub while Delivery nest is in interest-survey mode. */
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
          <p className="home-eyebrow">Delivery nest · coming soon</p>
          <h1 id="nest-landing-heading" className="home-hero-title">
            Prepare for delivery
            <span className="home-hero-accent"> with your tribe</span>
          </h1>
          <p className="home-hero-lead">
            Nest will let moms invite close family and friends to gift toward hospital fees and
            baby needs before the due date — without MomLaunchpad holding the money. We are
            collecting interest first so we build what you actually need.
          </p>
          <div className="home-hero-actions" style={{ marginTop: '1.5rem' }}>
            <Link className="home-btn home-btn-lg" to={`${APP_BASE}/nest`}>
              Tell us if you want Nest
            </Link>
            <Link className="home-btn home-btn-ghost home-btn-lg" to="/">
              Back to MomLaunchpad
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
