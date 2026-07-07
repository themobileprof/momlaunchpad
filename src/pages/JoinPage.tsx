import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApkDownloadSection } from '../components/ApkDownloadSection'
import { BrandLogo } from '../components/BrandLogo'
import {
  captureReferralFromSearchParams,
  getStoredReferralCode,
} from '../lib/referral'
import './home.css'

export function JoinPage() {
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState(() => getStoredReferralCode())

  useEffect(() => {
    const captured = captureReferralFromSearchParams(searchParams)
    if (captured) setCode(captured)
  }, [searchParams])

  return (
    <div className="home">
      <div className="home-grain" aria-hidden />
      <header className="home-header">
        <BrandLogo href="/" size="lg" showText className="home-logo" />
      </header>

      <main className="home-join-main">
        <section className="home-hero home-join-hero" aria-labelledby="join-heading">
          <div className="home-hero-glow" aria-hidden />
          <p className="home-eyebrow">You&apos;re invited</p>
          <h1 id="join-heading" className="home-hero-title">
            Join MomLaunchpad
            <span className="home-hero-accent"> with a friend&apos;s invite</span>
          </h1>
          <p className="home-hero-lead">
            Download the app and sign up — your invite is remembered on this device so
            your friend gets credit when you join.
          </p>

          {code ? (
            <p className="home-join-code" role="status">
              Invite code <strong>{code}</strong> saved
            </p>
          ) : (
            <p className="home-join-code home-join-code-missing" role="status">
              No invite code in this link. Ask your friend to share their full invite URL.
            </p>
          )}

          <ApkDownloadSection className="home-join-apk" />

          <div className="home-hero-actions" style={{ marginTop: '1.5rem' }}>
            <Link className="home-btn home-btn-ghost home-btn-lg" to="/">
              Learn more about MomLaunchpad
            </Link>
          </div>

          <p className="home-join-note">
            Already installed? Open this same link on your phone after installing, then sign up
            in the app — or use Android App Links if configured in the mobile build.
          </p>
        </section>
      </main>

      <footer className="home-footer home-footer-minimal">
        <p className="home-footer-copy">© {new Date().getFullYear()} MomLaunchpad</p>
      </footer>
    </div>
  )
}
