import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { GradientButton, MomAppBar } from '../components/ui'
import { appPath } from '../routes'

export function CommunityOnboardingPage() {
  const navigate = useNavigate()
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([])
  const [groups, setGroups] = useState<{ key: string; label: string; items: { key: string; label: string }[] }[]>([])
  const [countryCode, setCountryCode] = useState('')
  const [stateProvince, setStateProvince] = useState('')
  const [city, setCity] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [stateSuggestions, setStateSuggestions] = useState<string[]>([])
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    userApi.getCommunityCountries().then((r) => setCountries(r.countries))
    userApi.getCommunityInterests().then((r) => setGroups(r.groups))
    userApi.getCommunityStatus().then((s) => {
      if (s.community_onboarding_completed) navigate(appPath('community'))
    })
  }, [navigate])

  useEffect(() => {
    if (!countryCode || stateProvince.length < 2) return
    const t = setTimeout(() => {
      userApi
        .getLocationSuggestions({ country_code: countryCode, field: 'state_province', q: stateProvince })
        .then((r) => setStateSuggestions(r.suggestions))
    }, 300)
    return () => clearTimeout(t)
  }, [countryCode, stateProvince])

  useEffect(() => {
    if (!countryCode || city.length < 2) return
    const t = setTimeout(() => {
      userApi
        .getLocationSuggestions({
          country_code: countryCode,
          field: 'city',
          q: city,
          state_province: stateProvince,
        })
        .then((r) => setCitySuggestions(r.suggestions))
    }, 300)
    return () => clearTimeout(t)
  }, [countryCode, city, stateProvince])

  function toggleInterest(key: string) {
    setInterests((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key)
      if (prev.length >= 5) return prev
      return [...prev, key]
    })
  }

  async function submit() {
    if (!countryCode || !stateProvince.trim() || !city.trim()) {
      setError('Please complete your location')
      return
    }
    if (interests.length === 0) {
      setError('Pick at least one interest')
      return
    }
    setLoading(true)
    setError('')
    try {
      await userApi.completeCommunityOnboarding({
        country_code: countryCode,
        state_province: stateProvince.trim(),
        city: city.trim(),
        interests,
      })
      navigate(appPath('community'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="user-app-content--no-nav">
      <MomAppBar pageTitle="Community setup" onBack={() => navigate(appPath('community'))} />
      <div style={{ padding: 16 }}>
        <h2 className="u-heading-md">Join your local circle</h2>
        <p className="u-muted">Share your area and interests so we can show you relevant posts.</p>

        {error && <div className="u-alert u-alert--error">{error}</div>}

        <label className="app-label">Country</label>
        <select className="app-input" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} style={{ marginBottom: 12 }}>
          <option value="">Select country</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>

        <label className="app-label">State / province</label>
        <input
          className="app-input"
          list="state-list"
          value={stateProvince}
          onChange={(e) => setStateProvince(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <datalist id="state-list">
          {stateSuggestions.map((s) => <option key={s} value={s} />)}
        </datalist>

        <label className="app-label">City</label>
        <input
          className="app-input"
          list="city-list"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <datalist id="city-list">
          {citySuggestions.map((s) => <option key={s} value={s} />)}
        </datalist>

        <p className="app-label">Interests (up to 5)</p>
        {groups.map((g) => (
          <div key={g.key} style={{ marginBottom: 12 }}>
            <p className="u-caption">{g.label}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {g.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`filter-chip${interests.includes(item.key) ? ' filter-chip--active' : ''}`}
                  onClick={() => toggleInterest(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <GradientButton onClick={submit} disabled={loading}>
          {loading ? 'Saving…' : 'Join community →'}
        </GradientButton>
      </div>
    </div>
  )
}
