import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { GenderPicker } from '../components/GenderPicker'
import { GlassCard, GradientButton } from '../components/ui'
import { userApi } from '../api'
import { useUserAuth } from '../context/UserAuthContext'
import { useUserProfile } from '../context/UserProfileContext'
import { appPhotos } from '../lib/appPhotos'
import { resolveBabyTheme } from '../lib/babyTheme'
import { JOURNEY_STAGES, type BabyGender, type JourneyStage } from '../types'
import { appPath } from '../routes'

const SIGNUP_STAGES = JOURNEY_STAGES.filter((s) => s.signup)

export function OnboardingPage() {
  const { user } = useUserAuth()
  const { profile, setProfile } = useUserProfile()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(user?.name ?? '')
  const [journeyStage, setJourneyStage] = useState<JourneyStage | null>(null)
  const [pregnancyWeek, setPregnancyWeek] = useState(20)
  const [isFirstPregnancy, setIsFirstPregnancy] = useState<boolean | null>(null)
  const [babyGender, setBabyGender] = useState<BabyGender | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const previewTheme = babyGender ? resolveBabyTheme(babyGender) : 'bloom'

  useEffect(() => {
    const root = document.querySelector('.user-app')
    if (!root || !babyGender) return
    const previous = root.getAttribute('data-baby-theme')
    root.setAttribute('data-baby-theme', previewTheme)
    return () => {
      if (previous) root.setAttribute('data-baby-theme', previous)
    }
  }, [babyGender, previewTheme])

  if (!user) return <Navigate to={appPath('login')} replace />
  if (profile?.onboarding_completed) return <Navigate to={appPath()} replace />

  async function submit() {
    if (!journeyStage) return
    setLoading(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        language: 'en',
        journey_stage: journeyStage,
      }
      if (journeyStage === 'pregnant') {
        body.pregnancy_week = pregnancyWeek
        if (isFirstPregnancy !== null) body.is_first_pregnancy = isFirstPregnancy
        if (babyGender) body.baby_gender = babyGender
      }
      const p = await userApi.completeOnboarding(body)
      setProfile(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  function next() {
    if (step === 1 && !name.trim()) {
      setError('Please enter your name')
      return
    }
    if (step === 2 && !journeyStage) {
      setError('Please choose where you are on your journey')
      return
    }
    if (step === 3 && journeyStage === 'pregnant' && isFirstPregnancy === null) {
      setError('Please let us know if this is your first pregnancy')
      return
    }
    setError('')
    if (step < 3) setStep(step + 1)
    else submit()
  }

  return (
    <div className="user-app-content--no-nav">
        <div className="onboarding-progress">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`onboarding-step-bar${i <= step ? ' onboarding-step-bar--active' : ''}`}
            />
          ))}
        </div>
        <div style={{ padding: '16px 24px' }}>
          <h1 className="u-heading-md">Getting to know you</h1>
          <p className="u-muted" style={{ margin: '8px 0 0' }}>
            A few questions so your space feels personal and joyful.
          </p>
        </div>

        {error && (
          <div className="u-alert u-alert--error" style={{ margin: '0 24px' }}>
            {error}
          </div>
        )}

        <div style={{ padding: '0 24px 24px' }}>
          <GlassCard className="auth-card">
            {step === 0 && (
              <div>
                <div className="auth-photo-banner">
                  <img src={appPhotos.hero.src} alt="" />
                </div>
                <h2 className="u-heading-lg" style={{ marginBottom: 12 }}>Welcome to MomLaunchpad</h2>
                <p className="u-body u-muted">
                  We&apos;ll ask a few gentle questions so your companion can support you in a way
                  that feels personal — not generic.
                </p>
                <ul style={{ paddingLeft: 0, listStyle: 'none', marginTop: 24 }}>
                  {[
                    'Chat that remembers your journey',
                    'A community built for mothers like you',
                    'Calendar nudges when life gets busy',
                  ].map((t) => (
                    <li key={t} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <span style={{ color: 'var(--accent-light)' }}>✓</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="u-heading-md" style={{ marginBottom: 8 }}>What should we call you?</h2>
                <p className="u-muted" style={{ marginBottom: 16 }}>First name is perfect.</p>
                <input
                  className="app-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                />
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="u-heading-md" style={{ marginBottom: 8 }}>Where are you on your journey?</h2>
                <p className="u-muted" style={{ marginBottom: 16 }}>You can update this anytime in your profile.</p>
                {SIGNUP_STAGES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className={`journey-option${journeyStage === s.value ? ' journey-option--selected' : ''}`}
                    onClick={() => setJourneyStage(s.value)}
                  >
                    <strong>{s.label}</strong>
                    <p className="u-muted" style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>{s.description}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="u-heading-md" style={{ marginBottom: 16 }}>A few more details</h2>
                {journeyStage === 'pregnant' && (
                  <>
                    <label className="app-label">Pregnancy week: {pregnancyWeek}</label>
                    <input
                      type="range"
                      min={4}
                      max={42}
                      value={pregnancyWeek}
                      onChange={(e) => setPregnancyWeek(Number(e.target.value))}
                      style={{ width: '100%', marginBottom: 24, accentColor: 'var(--accent)' }}
                    />
                    <p className="app-label">Is this your first pregnancy?</p>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                      {([true, false] as const).map((v) => (
                        <button
                          key={String(v)}
                          type="button"
                          className={`journey-option${isFirstPregnancy === v ? ' journey-option--selected' : ''}`}
                          style={{ flex: 1, textAlign: 'center' }}
                          onClick={() => setIsFirstPregnancy(v)}
                        >
                          {v ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                    <p className="app-label">Know the baby&apos;s gender? (optional)</p>
                    <p className="u-muted" style={{ fontSize: '0.85rem', margin: '0 0 12px' }}>
                      Pick one to color your app — rose for girl, blue for boy, or golden sparkle if
                      it&apos;s still a surprise.
                    </p>
                    <GenderPicker value={babyGender} onChange={setBabyGender} />
                  </>
                )}
                {journeyStage === 'ttc' && (
                  <p className="u-body u-muted">
                    We&apos;ll tailor support for your fertility journey — cycles, waiting, and the
                    questions that come with trying to conceive.
                  </p>
                )}
              </div>
            )}
          </GlassCard>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, alignItems: 'center' }}>
            {step > 0 ? (
              <button type="button" className="app-btn app-btn--ghost" onClick={() => setStep(step - 1)}>
                Back
              </button>
            ) : (
              <div style={{ width: 64 }} />
            )}
            <div style={{ flex: 1 }}>
              <GradientButton onClick={next} disabled={loading}>
                {loading ? 'Saving…' : step === 3 ? 'Start your journey →' : 'Continue →'}
              </GradientButton>
            </div>
          </div>
        </div>
      </div>
  )
}
