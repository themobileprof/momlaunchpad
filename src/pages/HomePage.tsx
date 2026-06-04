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

const PILLARS = [
  {
    title: 'A companion who remembers you',
    body: 'Chat that knows your language, your stage, and what you shared last week—so you never start from zero on a hard night.',
    icon: '◐',
  },
  {
    title: 'A circle that feels real',
    body: 'Community built for mothers: interests, local context, expert voices—without the noise of a generic social feed.',
    icon: '◎',
  },
  {
    title: 'Gentle structure for busy days',
    body: 'Calendar nudges, health notes, and savings toward what you are preparing for—organized enough to help, light enough to breathe.',
    icon: '◇',
  },
]

export function HomePage() {
  return (
    <div className="home">
      <div className="home-grain" aria-hidden />
      <header className="home-header">
        <a href="/" className="home-logo" aria-label="MomLaunchpad home">
          <span className="home-logo-mark" aria-hidden />
          <span className="home-logo-text">MomLaunchpad</span>
        </a>
        <nav className="home-nav" aria-label="Page sections">
          <a href="#journey">Your journey</a>
          <a href="#support">How we help</a>
          <a href="#trust">Built for you</a>
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
            MomLaunchpad is a companion for the emotional arc of pregnancy—from the first
            flutter of worry to the last-week whirlwind—woven together with chat, community,
            and tools that respect your pace.
          </p>
          <div className="home-hero-actions home-reveal" style={{ animationDelay: '0.28s' }}>
            <a className="home-btn home-btn-primary" href="#support">
              See how it helps
            </a>
            <a className="home-btn home-btn-ghost" href="#trust">
              Why mothers trust us
            </a>
          </div>
          <blockquote className="home-hero-quote home-reveal" style={{ animationDelay: '0.36s' }}>
            <p>“I wanted something that felt like a friend who had time—not another app shouting at me.”</p>
            <footer>— the feeling we design for</footer>
          </blockquote>
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
          </ul>
        </section>

        <section className="home-cta" aria-labelledby="cta-heading">
          <h2 id="cta-heading">Ready when you are</h2>
          <p>
            MomLaunchpad is coming to iOS and Android. Be among the first mothers to experience
            support that honors the whole of your pregnancy—not just the clinical checklist.
          </p>
          <a className="home-btn home-btn-primary home-btn-lg" href="mailto:hello@momlaunchpad.com">
            Get early access
          </a>
        </section>
      </main>

      <footer className="home-footer">
        <p className="home-footer-brand">MomLaunchpad</p>
        <p className="home-footer-tag">Warm support for every chapter of pregnancy.</p>
        <p className="home-footer-copy">© {new Date().getFullYear()} MomLaunchpad. All rights reserved.</p>
      </footer>
    </div>
  )
}
