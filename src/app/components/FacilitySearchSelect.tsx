import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { userApi } from '../api'
import type { CommunityHealthcareFacility } from '../types'

type Props = {
  countryCode: string
  stateProvince: string
  city: string
  facilityId: string | null
  facilityName: string
  onChange: (next: { id: string | null; name: string }) => void
  disabled?: boolean
}

export function FacilitySearchSelect({
  countryCode,
  stateProvince,
  city,
  facilityId,
  facilityName,
  onChange,
  disabled = false,
}: Props) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<CommunityHealthcareFacility[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const locationReady =
    !!countryCode && stateProvince.trim().length > 0 && city.trim().length > 0

  useEffect(() => {
    if (!open) return
    function onDocPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!locationReady) {
      setOptions([])
      setLoadError('')
      return
    }
    let cancelled = false
    const t = window.setTimeout(() => {
      setLoading(true)
      setLoadError('')
      userApi
        .getHealthcareFacilities({
          country_code: countryCode,
          state_province: stateProvince.trim(),
          city: city.trim(),
          q: query.trim(),
          limit: 50,
        })
        .then((r) => {
          if (!cancelled) setOptions(r.facilities ?? [])
        })
        .catch(() => {
          if (!cancelled) {
            setOptions([])
            setLoadError('Could not load health centers')
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, query.trim() ? 200 : 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [locationReady, countryCode, stateProvince, city, query])

  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [open])

  const selectedLabel = facilityName.trim()
  const exactMatch = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return options.find((f) => f.name.toLowerCase() === q) ?? null
  }, [options, query])

  const canAddCustom =
    query.trim().length >= 2 &&
    !exactMatch &&
    !options.some((f) => f.name.toLowerCase() === query.trim().toLowerCase())

  function selectFacility(f: CommunityHealthcareFacility) {
    onChange({ id: f.id, name: f.name })
    setQuery('')
    setOpen(false)
  }

  function selectCustom(name: string) {
    onChange({ id: null, name })
    setQuery('')
    setOpen(false)
  }

  function clearSelection() {
    onChange({ id: null, name: '' })
    setQuery('')
  }

  return (
    <div className="facility-search" ref={rootRef}>
      <div className="facility-search__control">
        <button
          type="button"
          className={`facility-search__trigger app-input${open ? ' is-open' : ''}${
            selectedLabel ? ' has-value' : ''
          }`}
          disabled={disabled || !locationReady}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => {
            if (!locationReady || disabled) return
            setOpen((v) => !v)
          }}
        >
          <span
            className={selectedLabel ? 'facility-search__value' : 'facility-search__placeholder'}
          >
            {!locationReady
              ? 'Select country, state, and city first'
              : selectedLabel || 'Search and select a health center'}
          </span>
          <span className="facility-search__chevron" aria-hidden>
            ▾
          </span>
        </button>

        {open && locationReady && (
          <div className="facility-search__panel" id={listId} role="listbox">
            <input
              ref={searchRef}
              className="app-input facility-search__filter"
              value={query}
              placeholder="Type to filter…"
              autoComplete="off"
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="facility-search__options">
              {loading && <p className="facility-search__status">Loading centers…</p>}
              {!loading && loadError && (
                <p className="facility-search__status facility-search__status--error">{loadError}</p>
              )}
              {!loading && !loadError && options.length === 0 && !canAddCustom && (
                <p className="facility-search__status">
                  No centers listed for this area yet. Type a name to add yours.
                </p>
              )}
              {!loading &&
                options.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="option"
                    aria-selected={facilityId === f.id}
                    className={`facility-search__option${facilityId === f.id ? ' is-selected' : ''}`}
                    onClick={() => selectFacility(f)}
                  >
                    {f.name}
                  </button>
                ))}
              {canAddCustom && (
                <button
                  type="button"
                  className="facility-search__option facility-search__option--add"
                  onClick={() => selectCustom(query.trim())}
                >
                  Add “{query.trim()}”
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedLabel && !disabled && (
        <button type="button" className="facility-search__clear" onClick={clearSelection}>
          Clear
        </button>
      )}

      <p className="u-muted facility-search__hint">
        Pick from the list for your area. Missing centers can be added if they are not listed yet.
      </p>
    </div>
  )
}
