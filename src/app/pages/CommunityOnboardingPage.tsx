import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { userApi } from '../api'
import { FacilitySearchSelect } from '../components/FacilitySearchSelect'
import { GradientButton, MomAppBar } from '../components/ui'
import { useUserProfile } from '../context/UserProfileContext'
import { appPath } from '../routes'

export function CommunityOnboardingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEdit = searchParams.get('edit') === '1'
  const { profile, refreshProfile } = useUserProfile()
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([])
  const [states, setStates] = useState<{ code: string; name: string }[]>([])
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [groups, setGroups] = useState<{ key: string; label: string; items: { key: string; label: string }[] }[]>([])
  const [countryCode, setCountryCode] = useState('')
  const [stateProvince, setStateProvince] = useState('')
  const [city, setCity] = useState('')
  const [facilityName, setFacilityName] = useState('')
  const [facilityId, setFacilityId] = useState<string | null>(null)
  const [interests, setInterests] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [citiesLoading, setCitiesLoading] = useState(false)

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
      setError('Please select your hospital or health center')
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

  const cityIsDropdown = cities.length > 0
  const cityLabel = countryCode === 'NG' ? 'City / LGA' : 'City'

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
          onChange={({ id, name, city: facilityCity }) => {
            setFacilityId(id)
            setFacilityName(name)
            if (facilityCity?.trim()) setCity(facilityCity.trim())
          }}
        />

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
