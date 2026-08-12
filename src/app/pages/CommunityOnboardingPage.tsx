import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { userApi } from '../api'
import { GradientButton, MomAppBar } from '../components/ui'
import { useUserProfile } from '../context/UserProfileContext'
import { appPath } from '../routes'
import type { CommunityHealthcareFacility } from '../types'

export function CommunityOnboardingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEdit = searchParams.get('edit') === '1'
  const { profile, refreshProfile } = useUserProfile()
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([])
  const [groups, setGroups] = useState<{ key: string; label: string; items: { key: string; label: string }[] }[]>([])
  const [countryCode, setCountryCode] = useState('')
  const [stateProvince, setStateProvince] = useState('')
  const [city, setCity] = useState('')
  const [facilityName, setFacilityName] = useState('')
  const [facilityId, setFacilityId] = useState<string | null>(null)
  const [facilitySuggestions, setFacilitySuggestions] = useState<CommunityHealthcareFacility[]>([])
  const [showFacilitySuggestions, setShowFacilitySuggestions] = useState(false)
  const [interests, setInterests] = useState<string[]>([])
  const [stateSuggestions, setStateSuggestions] = useState<string[]>([])
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const facilityBlurTimer = useRef<number | null>(null)

  useEffect(() => {
    userApi.getCommunityCountries().then((r) => setCountries(r.countries))
    userApi.getCommunityInterests().then((r) => setGroups(r.groups))
    if (isEdit) return
    userApi.getCommunityStatus().then((s) => {
      if (s.community_onboarding_completed) navigate(appPath('community'))
    })
  }, [navigate, isEdit])

  useEffect(() => {
    if (!isEdit || !profile) return
    if (profile.country_code) setCountryCode(profile.country_code)
    if (profile.state_province) setStateProvince(profile.state_province)
    if (profile.city) setCity(profile.city)
    if (profile.healthcare_facility_name) setFacilityName(profile.healthcare_facility_name)
    if (profile.healthcare_facility_id) setFacilityId(profile.healthcare_facility_id)
    if (profile.community_interests?.length) setInterests(profile.community_interests)
  }, [isEdit, profile])

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

  useEffect(() => {
    if (!countryCode || !stateProvince.trim() || !city.trim() || facilityName.trim().length < 2) {
      setFacilitySuggestions([])
      return
    }
    const t = setTimeout(() => {
      userApi
        .getHealthcareFacilities({
          country_code: countryCode,
          state_province: stateProvince.trim(),
          city: city.trim(),
          q: facilityName.trim(),
        })
        .then((r) => setFacilitySuggestions(r.facilities))
        .catch(() => setFacilitySuggestions([]))
    }, 300)
    return () => clearTimeout(t)
  }, [countryCode, stateProvince, city, facilityName])

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
    if (!facilityName.trim()) {
      setError('Please enter your hospital or health center')
      return
    }
    if (interests.length === 0 && !isEdit) {
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
        healthcare_facility_id: facilityId ?? undefined,
        healthcare_facility_name: facilityName.trim(),
        interests,
      })
      await refreshProfile()
      navigate(isEdit ? appPath('settings') : appPath('community'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="user-app-content--no-nav">
      <MomAppBar
        pageTitle={isEdit ? 'Edit community location' : 'Community setup'}
        onBack={() => navigate(isEdit ? appPath('settings') : appPath('community'))}
      />
      <div style={{ padding: 16 }}>
        <h2 className="u-heading-md">{isEdit ? 'Update your local circle' : 'Join your local circle'}</h2>
        <p className="u-muted">
          Share your area and health center so Nearby can show moms registered near you.
        </p>

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
          onChange={(e) => {
            setStateProvince(e.target.value)
            setFacilityId(null)
          }}
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
          onChange={(e) => {
            setCity(e.target.value)
            setFacilityId(null)
          }}
          style={{ marginBottom: 12 }}
        />
        <datalist id="city-list">
          {citySuggestions.map((s) => <option key={s} value={s} />)}
        </datalist>

        <label className="app-label">Hospital / health center</label>
        <div className="facility-autocomplete" style={{ position: 'relative', marginBottom: 16 }}>
          <input
            className="app-input"
            value={facilityName}
            autoComplete="off"
            placeholder="Start typing to search or add yours"
            onChange={(e) => {
              setFacilityName(e.target.value)
              setFacilityId(null)
              setShowFacilitySuggestions(true)
            }}
            onFocus={() => setShowFacilitySuggestions(true)}
            onBlur={() => {
              facilityBlurTimer.current = window.setTimeout(() => setShowFacilitySuggestions(false), 150)
            }}
          />
          {showFacilitySuggestions && facilitySuggestions.length > 0 && (
            <ul className="facility-autocomplete__list" role="listbox">
              {facilitySuggestions.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    className="facility-autocomplete__option"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (facilityBlurTimer.current) window.clearTimeout(facilityBlurTimer.current)
                      setFacilityName(f.name)
                      setFacilityId(f.id)
                      setShowFacilitySuggestions(false)
                    }}
                  >
                    {f.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="u-muted" style={{ fontSize: '0.8rem', margin: '6px 0 0' }}>
            Can&apos;t find it? Type the full name — we&apos;ll add it for others nearby.
          </p>
        </div>

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
          {loading ? 'Saving…' : isEdit ? 'Save changes ✓' : 'Join community →'}
        </GradientButton>
      </div>
    </div>
  )
}
