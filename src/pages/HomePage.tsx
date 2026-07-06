import { Link } from 'react-router-dom'
import { ApkDownloadButton } from '../components/ApkDownloadButton'
import { BrandLogo } from '../components/BrandLogo'
import './home.css'

const JOURNEY = [
  {
    phase: 'Early days',
    title: 'When everything feels new',
    body: 'Questions arrive before answers do. MomLaunchpad meets you with calm guidance—not a lecture, not a panic button—just someone who listens.',
  },
  {
    phase: 'Growing together',
    title: 'When your body keeps changing',
    body: 'Symptoms, appointments, little wins. We help you notice patterns, remember what matters, and feel seen through the middle of it all.',
  },
  {
    phase: 'Almost here',
    title: 'When anticipation gets loud',
    body: 'The final stretch is emotional and practical at once. Stay grounded with reminders, savings goals, and a community that gets the mix of joy and nerves.',
  },
]

const GOOD_FOR_ME_MOMENTS = [
  {
    label: 'Your post',
    title: 'When you are still waiting for answers',
    body: 'Tap Good for me? on what you wrote—a quiet check-in that your question lands in the context of your own journey.',
  },
  {
    label: 'The whole thread',
    title: 'When everyone says something different',
    body: 'Review discussion gently summarizes what mothers are suggesting and what might matter for you—not a pile of conflicting voices.',
  },
  {
    label: 'One reply',
    title: 'When a single tip stays with you',
    body: 'Good for me? on that reply weighs one recommendation against your stage, symptoms, and history—the original question stays in view.',
  },
]

const PILLARS = [
  {
    title: 'A companion who remembers you',
    body: 'Chat that knows your language, your stage, and what you shared last week—so you never start from zero on a hard night.',
    icon: '◐',
  },
  {
    title: 'A circle that feels real',
    body: 'Community built for mothers—local context, shared interests, and Good for me? when another mom’s advice sounds right but you need to know if it fits you.',
    icon: '◎',
  },
  {
    title: 'Gentle structure for busy days',
    body: 'Calendar nudges, health notes, and savings toward what you are preparing for—organized enough to help, light enough to breathe.',
    icon: '◇',
  },
]

const MOBILE_FEATURES = [
  { label: 'AI chat & community', status: 'available' as const },
  { label: 'Calendar & health tracking', status: 'available' as const },
  { label: 'Push reminders', status: 'soon' as const },
  { label: 'Location-aware community', status: 'soon' as const },
  { label: 'Voice companion calls', status: 'soon' as const },
]

const WEB_FEATURES = [
  { label: 'AI chat & community', status: 'available' as const },
  { label: 'Calendar & profile', status: 'available' as const },
  { label: 'Works in any browser', status: 'available' as const },
  { label: 'No install required', status: 'available' as const },
]

function FeatureList({ items }: { items: typeof MOBILE_FEATURES }) {
  return (
    <ul className="home-access-features">
      {items.map((item) => (
        <li key={item.label}>
          <span className="home-access-feature-icon" aria-hidden>
            {item.status === 'available' ? '✓' : '◦'}
          </span>
          <span>{item.label}</span>
          {item.status === 'soon' && (
            <span className="home-access-soon">Coming soon</span>
          )}
        </li>
      ))}
    </ul>
  )
}

export function HomePage() {
  return (
    <div className="home">
      <div className="home-grain" aria-hidden />
      <header className="home-header">
        <BrandLogo href="/" size="lg" showText className="home-logo" />
        <nav className="home-nav" aria-label="Page sections">
          <a href="#get-started">Get started</a>
          <a href="#journey">Your journey</a>
          <a href="#support">How we help</a>
          <a href="#good-for-me">Good for me?</a>
          <Link to="/app" className="home-nav-app-link">Web app</Link>
        </nav>
      </header>

      <main>
        <section className="home-hero" aria-labelledby="hero-heading">
          <div className="home-hero-glow" aria-hidden />
          <p className="home-eyebrow home-reveal" style={{ animationDelay: '0.05s' }}>
            Pregnancy support, reimagined
          </p>
          <h1 id="hero-heading" className="home-hero-title home-reveal" style={{ animationDelay: '0.12s' }}>
            A softer place to land
            <span className="home-hero-accent"> on the days that ask a lot of you</span>
          </h1>
          <p className="home-hero-lead home-reveal" style={{ animationDelay: '0.2s' }}>
            Chat, community, and gentle structure for your pregnancy journey—on your phone
            first, or in the browser when that fits your day.
          </p>
          <div className="home-hero-actions home-reveal" style={{ animationDelay: '0.28s' }}>
            <a className="home-btn home-btn-primary home-btn-lg" href="#get-started">
              Get started
            </a>
            <a className="home-btn home-btn-ghost" href="#support">
              See how it helps
            </a>
          </div>
          <blockquote className="home-hero-quote home-reveal" style={{ animationDelay: '0.36s' }}>
            <p>“I wanted something that felt like a friend who had time—not another app shouting at me.”</p>
            <footer>— the feeling we design for</footer>
          </blockquote>
        </section>

        <section
          id="get-started"
          className="home-section home-access"
          aria-labelledby="access-heading"
        >
          <div className="home-section-intro home-section-intro--center">
            <p className="home-eyebrow">Get started</p>
            <h2 id="access-heading">Two ways to use MomLaunchpad</h2>
            <p className="home-section-lead">
              The Android app is our primary experience—built for your pocket, with mobile-only
              features on the way. The web app brings chat, community, and calendar to any
              screen, no install required.
            </p>
          </div>

          <div className="home-access-grid">
            <article className="home-access-card home-access-card--primary">
              <div className="home-access-card-head">
                <span className="home-access-badge home-access-badge--primary">Recommended</span>
                <span className="home-access-icon" aria-hidden>📱</span>
                <h3>Android app</h3>
                <p className="home-access-tagline">
                  Your pocket companion—the full experience, with push, location, and voice
                  features arriving soon.
                </p>
              </div>
              <FeatureList items={MOBILE_FEATURES} />
              <div className="home-access-cta">
                <ApkDownloadButton size="lg" installHelpOpen />
              </div>
            </article>

            <article className="home-access-card home-access-card--secondary">
              <div className="home-access-card-head">
                <span className="home-access-badge">Also available</span>
                <span className="home-access-icon" aria-hidden>🌐</span>
                <h3>Web app</h3>
                <p className="home-access-tagline">
                  Sign in from any browser—ideal for longer chats, community threads, or when
                  you are at your desk.
                </p>
              </div>
              <FeatureList items={WEB_FEATURES} />
              <div className="home-access-cta">
                <Link to="/app" className="home-btn home-btn-outline home-btn-lg home-access-web-btn">
                  Open web app
                </Link>
                <p className="home-access-note">Free · same account as mobile</p>
              </div>
            </article>
          </div>
        </section>

        <section id="journey" className="home-section home-journey" aria-labelledby="journey-heading">
          <div className="home-section-intro">
            <p className="home-eyebrow">Your journey</p>
            <h2 id="journey-heading">Every chapter deserves a different kind of care</h2>
            <p className="home-section-lead">
              Pregnancy is not one long symptom list. It is a sequence of emotional climates—and
              your support should shift with them.
            </p>
          </div>
          <ol className="home-journey-list">
            {JOURNEY.map((step, i) => (
              <li
                key={step.phase}
                className="home-journey-card"
                style={{ animationDelay: `${0.08 * i}s` }}
              >
                <span className="home-journey-phase">{step.phase}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="support" className="home-section home-pillars" aria-labelledby="support-heading">
          <div className="home-section-intro home-section-intro--center">
            <p className="home-eyebrow">How we help</p>
            <h2 id="support-heading">Support that feels human, not mechanical</h2>
          </div>
          <ul className="home-pillar-grid">
            {PILLARS.map((pillar, i) => (
              <li key={pillar.title} className="home-pillar" style={{ animationDelay: `${0.1 * i}s` }}>
                <span className="home-pillar-icon" aria-hidden>
                  {pillar.icon}
                </span>
                <h3>{pillar.title}</h3>
                <p>{pillar.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-section home-belonging" aria-labelledby="belonging-heading">
          <div className="home-belonging-inner">
            <p className="home-eyebrow">You are not alone</p>
            <h2 id="belonging-heading">The weight is lighter when it is shared</h2>
            <p>
              Late-night questions. Small victories. The things you are afraid to say out loud.
              MomLaunchpad holds space for all of it—in your language, with mothers who understand
              the texture of this season.
            </p>
          </div>
        </section>

        <section
          id="good-for-me"
          className="home-section home-good-for-me"
          aria-labelledby="good-for-me-heading"
        >
          <div className="home-good-for-me-inner">
            <p className="home-eyebrow">Community, made personal</p>
            <span className="home-good-for-me-badge" aria-hidden>
              Good for me?
            </span>
            <h2 id="good-for-me-heading">When the thread helps—but your heart still hesitates</h2>
            <p className="home-good-for-me-lead">
              Other mothers share their paths with generosity: try this, I swore by that, my
              doctor said… It can feel like relief and pressure at once. You want to belong—but
              your body, your week, and your history are not identical to anyone else&apos;s.
            </p>
            <p className="home-good-for-me-lead">
              <strong>Good for me?</strong> opens a private chat that reads the conversation in
              light of your journey—what you&apos;ve logged, where you are, what you&apos;ve been
              carrying—and offers a calm, personalized take: what might fit, what to treat gently,
              and when to bring it to your care team. Not a verdict from the crowd. Not
              fear-mongering. Space to think clearly before you act on someone else&apos;s story.
            </p>
            <ol className="home-good-for-me-moments">
              {GOOD_FOR_ME_MOMENTS.map((moment, i) => (
                <li
                  key={moment.label}
                  className="home-good-for-me-moment"
                  style={{ animationDelay: `${0.08 * i}s` }}
                >
                  <span className="home-good-for-me-moment-label">{moment.label}</span>
                  <h3>{moment.title}</h3>
                  <p>{moment.body}</p>
                </li>
              ))}
            </ol>
            <p className="home-good-for-me-footnote">
              Other mothers share their paths; <strong>Good for me?</strong> helps you find yours.
              It never replaces your doctor—it helps you walk into that conversation clearer, not
              more alone.
            </p>
          </div>
        </section>

        <section id="trust" className="home-section home-trust" aria-labelledby="trust-heading">
          <div className="home-section-intro">
            <p className="home-eyebrow">Built for you</p>
            <h2 id="trust-heading">Designed with dignity at the center</h2>
          </div>
          <ul className="home-trust-list">
            <li>
              <strong>Your story stays yours</strong>
              <span>Thoughtful privacy practices and controls meant for sensitive health conversations.</span>
            </li>
            <li>
              <strong>Multilingual from the start</strong>
              <span>Support that meets you in the language you think and feel in—not as an afterthought.</span>
            </li>
            <li>
              <strong>Gentle by default</strong>
              <span>No doom scrolling. No shame. Just steady, warm guidance when you reach for it.</span>
            </li>
            <li>
              <strong>Advice with your name on it</strong>
              <span>
                Community wisdom stays shared; Good for me? checks whether a tip fits your stage
                and your health story before you take it to heart.
              </span>
            </li>
          </ul>
        </section>

        <section className="home-cta" aria-labelledby="cta-heading">
          <h2 id="cta-heading">Ready when you are</h2>
          <p>
            Download the Android app for the fullest experience—or open the web app if you prefer
            to start in your browser today.
          </p>
          <div className="home-cta-actions home-cta-actions--dual">
            <ApkDownloadButton size="lg" showInstallHelp={false} />
            <Link to="/app" className="home-btn home-btn-outline home-btn-lg">
              Open web app
            </Link>
            <a className="home-btn home-btn-ghost home-btn-lg" href="mailto:hello@momlaunchpad.com">
              Contact us
            </a>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <BrandLogo size="md" className="home-footer-logo" />
        <p className="home-footer-tag">Warm support for every chapter of pregnancy.</p>
        <p className="home-footer-links">
          <Link to="/app">Web app</Link>
          <span aria-hidden> · </span>
          <a href="#get-started">Download Android</a>
        </p>
        <p className="home-footer-copy">© {new Date().getFullYear()} MomLaunchpad. All rights reserved.</p>
      </footer>
    </div>
  )
}
