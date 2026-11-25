import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { FacilitySearchSelect } from '../components/FacilitySearchSelect'
import { GlassCard, GradientButton } from '../components/ui'
import { userApi } from '../api'
import { useBrand } from '../../context/BrandContext'
import { useUserAuth } from '../context/UserAuthContext'
import { useUserProfile } from '../context/UserProfileContext'
import { JOURNEY_STAGES, type JourneyStage } from '../types'
import { appPath } from '../routes'

const SIGNUP_STAGES = JOURNEY_STAGES.filter((s) => s.signup)

/** Combined first-run: journey + local circle (location/facility). Interests deferred. */
export function OnboardingPage() {
  const brand = useBrand()
  const { user } = useUserAuth()
  const { profile, refreshProfile } = useUserProfile()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(profile?.phone_number ?? '')
  const [journeyStage, setJourneyStage] = useState<JourneyStage | null>(null)
  const [pregnancyWeek, setPregnancyWeek] = useState(20)
  const [countryCode, setCountryCode] = useState('')
  const [stateProvince, setStateProvince] = useState('')
  const [city, setCity] = useState('')
  const [facilityName, setFacilityName] = useState('')
  const [facilityId, setFacilityId] = useState<string | null>(null)
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([])
  const [states, setStates] = useState<{ code: string; name: string }[]>([])
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mainDone, setMainDone] = useState(false)

  const hasExistingPhone = Boolean(profile?.phone_number?.trim())
  const lastStep = 3
  const cityIsDropdown = cities.length > 0
  const cityLabel = countryCode === 'NG' ? 'City / LGA' : 'City'

  useEffect(() => {
    if (profile?.phone_number) setPhone(profile.phone_number)
    if (profile?.name) setName(profile.name)
    if (profile?.onboarding_completed) setMainDone(true)
  }, [profile])

  useEffect(() => {
    userApi.getCommunityCountries().then((r) => setCountries(r.countries)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!countryCode) {
      setStates([])
      return
    }
    let cancelled = false
    userApi
      .getCommunityStates(countryCode)
      .then((r) => {
        if (!cancelled) setStates(r.states ?? [])
      })
      .catch(() => {
        if (!cancelled) setStates([])
      })
    return () => {
      cancelled = true
    }
  }, [countryCode])

  useEffect(() => {
    if (!countryCode || !stateProvince.trim()) {
      setCities([])
      return
    }
    let cancelled = false
    setCitiesLoading(true)
    userApi
      .getCommunityCities(countryCode, stateProvince.trim())
      .then((r) => {
        if (!cancelled) setCities(r.cities ?? [])
      })
      .catch(() => {
        if (!cancelled) setCities([])
      })
      .finally(() => {
        if (!cancelled) setCitiesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [countryCode, stateProvince])

  // Users who finished main but not community land on the location step.
  useEffect(() => {
    if (profile?.onboarding_completed && !profile.community_onboarding_completed) {
      setMainDone(true)
      setStep(3)
      if (profile.journey_stage === 'pregnant' || profile.journey_stage === 'ttc') {
        setJourneyStage(profile.journey_stage)
      }
      if (profile.pregnancy_week) setPregnancyWeek(profile.pregnancy_week)
    }
  }, [profile])

  if (!user) return <Navigate to={appPath('login')} replace />
  if (profile?.onboarding_completed && profile?.community_onboarding_completed) {
    return <Navigate to={appPath()} replace />
  }

  async function submit() {
    if (!journeyStage) return
    if (!countryCode || !stateProvince.trim() || !city.trim()) {
      setError('Please complete your location')
      return
    }
    if (!facilityName.trim()) {
      setError('Please select your hospital or health center')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (!mainDone && !profile?.onboarding_completed) {
        const body: Record<string, unknown> = {
          name: name.trim(),
          language: 'en',
          journey_stage: journeyStage,
        }
        if (phone.trim()) body.phone_number = phone.trim()
        if (journeyStage === 'pregnant') {
          body.pregnancy_week = pregnancyWeek
        }
        await userApi.completeOnboarding(body)
        setMainDone(true)
      }
      await userApi.completeCommunityOnboarding({
        country_code: countryCode,
        state_province: stateProvince.trim(),
        city: city.trim(),
        healthcare_facility_id: facilityId ?? undefined,
        healthcare_facility_name: facilityName.trim(),
        interests: [],
      })
      await refreshProfile()
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
    if (step === 1 && !hasExistingPhone && phone.trim()) {
      const digits = phone.replace(/\D/g, '')
      if (digits.length < 7 || digits.length > 15) {
        setError('Enter a valid WhatsApp number')
        return
      }
    }
    if (step === 2 && !journeyStage) {
      setError('Please choose where you are on your journey')
      return
    }
    setError('')
    if (step < lastStep) setStep(step + 1)
    else void submit()
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
          A short setup so chat and your local circle feel personal.
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
              <h2 className="u-heading-lg" style={{ marginBottom: 12 }}>
                Welcome to {brand.productName}
              </h2>
              <p className="u-body u-muted">
                We&apos;ll ask a few gentle questions so your companion and local community can
                support you — not a long form.
              </p>
              <ul style={{ paddingLeft: 0, listStyle: 'none', marginTop: 24 }}>
                {[
                  'Chat that remembers your journey',
                  'Nearby moms at your health center',
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
                style={{ marginBottom: 16 }}
              />
              {!hasExistingPhone && (
                <>
                  <label className="app-label">WhatsApp number (optional)</label>
                  <input
                    className="app-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234…"
                    autoComplete="tel"
                  />
                  <p className="u-caption" style={{ marginTop: 8 }}>
                    Optional — so we can reach you on WhatsApp later.
                  </p>
                </>
              )}
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
              {journeyStage === 'pregnant' && (
                <div style={{ marginTop: 20 }}>
                  <label className="app-label">Pregnancy week: {pregnancyWeek}</label>
                  <input
                    type="range"
                    min={4}
                    max={42}
                    value={pregnancyWeek}
                    onChange={(e) => setPregnancyWeek(Number(e.target.value))}
                    style={{ width: '100%', marginBottom: 8, accentColor: 'var(--accent)' }}
                  />
                </div>
              )}
              {journeyStage === 'ttc' && (
                <p className="u-body u-muted" style={{ marginTop: 16 }}>
                  We&apos;ll tailor support for your fertility journey — cycles, waiting, and the
                  questions that come with trying to conceive.
                </p>
              )}
              <p className="u-muted" style={{ marginTop: 16, fontSize: '0.85rem' }}>
                Healthcare professional at a clinic or hospital? Choose{' '}
                <strong>Trying to conceive</strong> if you&apos;re not currently pregnant, then
                request your professional badge in Profile after signup.
              </p>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="u-heading-md" style={{ marginBottom: 8 }}>Your local circle</h2>
              <p className="u-muted" style={{ marginBottom: 16 }}>
                Share your area and health center so Nearby can show moms registered near you.
              </p>

              <label className="app-label">Country</label>
              <select
                className="app-input"
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value)
                  setStateProvince('')
                  setCity('')
                  setFacilityId(null)
                  setFacilityName('')
                }}
                style={{ marginBottom: 12 }}
              >
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>

              <label className="app-label">State / province</label>
              <select
                className="app-input"
                value={stateProvince}
                disabled={!countryCode || states.length === 0}
                onChange={(e) => {
                  setStateProvince(e.target.value)
                  setCity('')
                  setFacilityId(null)
                  setFacilityName('')
                }}
                style={{ marginBottom: 12 }}
              >
                <option value="">
                  {!countryCode
                    ? 'Select country first'
                    : states.length === 0
                      ? 'No states listed yet'
                      : 'Select state'}
                </option>
                {states.map((s) => (
                  <option key={s.code} value={s.name}>{s.name}</option>
                ))}
              </select>

              <label className="app-label">{cityLabel}</label>
              {cityIsDropdown ? (
                <select
                  className="app-input"
                  value={city}
                  disabled={!stateProvince || citiesLoading}
                  onChange={(e) => {
                    setCity(e.target.value)
                    setFacilityId(null)
                    setFacilityName('')
                  }}
                  style={{ marginBottom: 12 }}
                >
                  <option value="">{citiesLoading ? 'Loading…' : `Select ${cityLabel.toLowerCase()}`}</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="app-input"
                  value={city}
                  disabled={!stateProvince}
                  placeholder={stateProvince ? 'Enter your city' : 'Select state first'}
                  onChange={(e) => {
                    setCity(e.target.value)
                    setFacilityId(null)
                    setFacilityName('')
                  }}
                  style={{ marginBottom: 12 }}
                />
              )}

              <label className="app-label">Hospital / health center</label>
              <FacilitySearchSelect
                countryCode={countryCode}
                stateProvince={stateProvince}
                city={city}
                facilityId={facilityId}
                facilityName={facilityName}
                onChange={({ id, name: facName, city: facilityCity }) => {
                  setFacilityId(id)
                  setFacilityName(facName)
                  if (facilityCity?.trim()) setCity(facilityCity.trim())
                }}
              />
            </div>
          )}
        </GlassCard>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, alignItems: 'center' }}>
          {step > 0 ? (
            <button
              type="button"
              className="app-btn app-btn--ghost"
              onClick={() => setStep(step - 1)}
              disabled={loading}
            >
              Back
            </button>
          ) : (
            <div style={{ width: 64 }} />
          )}
          <div style={{ flex: 1 }}>
            <GradientButton onClick={next} disabled={loading}>
              {loading ? 'Saving…' : step === lastStep ? 'Start your journey →' : 'Continue →'}
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  )
}
