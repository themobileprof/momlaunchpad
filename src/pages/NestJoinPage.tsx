import { Link, useParams } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { APP_BASE } from '../app/routes'
import './home.css'

/** Public invite links are paused until Delivery nest goes live. */
export function NestJoinPage() {
  const { token = '' } = useParams<{ token: string }>()

  return (
    <div className="home">
      <div className="home-grain" aria-hidden />
      <header className="home-header">
        <BrandLogo href="/" size="lg" showText className="home-logo" />
      </header>
      <main className="home-join-main">
        <section className="home-hero home-join-hero" aria-labelledby="nest-join-heading">
          <div className="home-hero-glow" aria-hidden />
          <p className="home-eyebrow">Delivery nest · not open yet</p>
          <h1 id="nest-join-heading" className="home-hero-title">
            Tribe gifts are almost here
          </h1>
          <p className="home-hero-lead">
            This invite link is for Nest — a way for family and friends to record gifts toward a
            mom’s delivery costs. We have paused live contributions while we finish the experience
            with moms.
            {token ? ' Ask the person who shared this link to check MomLaunchpad for updates.' : ''}
          </p>
          <div className="home-hero-actions" style={{ marginTop: '1.5rem' }}>
            <Link className="home-btn home-btn-lg" to={`${APP_BASE}/nest`}>
              I’m a mom — share interest
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
