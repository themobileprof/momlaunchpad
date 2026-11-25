import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { GradientButton, MomAppBar } from '../components/ui'
import { useBrand } from '../../context/BrandContext'
import { appPath } from '../routes'
import type { NestInterestResponse } from '../types'

const INTEREST_OPTIONS = [
  { value: 'yes', label: 'Yes — I would use this' },
  { value: 'no', label: 'No — not for me' },
  { value: 'maybe', label: 'Maybe — depends on the details' },
] as const

export function NestPage() {
  const brand = useBrand()
  const navigate = useNavigate()
  const [existing, setExisting] = useState<NestInterestResponse | null>(null)
  const [interested, setInterested] = useState<'yes' | 'no' | 'maybe' | ''>('')
  const [moreInfo, setMoreInfo] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    userApi
      .getNestInterest()
      .then((res) => {
        if (cancelled) return
        const response = res.response
        setExisting(response)
        if (response) {
          setInterested(response.interested as 'yes' | 'no' | 'maybe')
          setMoreInfo(response.more_info ?? '')
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!interested) {
      setError('Please choose an option')
      return
    }
    setBusy(true)
    setError('')
    setSaved(false)
    try {
      const res = await userApi.submitNestInterest({
        interested,
        more_info: moreInfo.trim() || undefined,
      })
      setExisting(res.response)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your answer')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <MomAppBar pageTitle="Delivery nest" onBack={() => navigate(appPath())} />
      <div className="user-app-content page-section">
        <p className="u-muted" style={{ marginTop: 0 }}>
          Coming soon — we are shaping this with moms before we open it.
        </p>

        <div className="app-card" style={{ padding: 16, marginBottom: 16 }}>
          <h2 className="u-heading-sm" style={{ marginTop: 0 }}>
            What Delivery nest is for
          </h2>
          <p style={{ marginBottom: 12 }}>
            A private place to prepare money for delivery — hospital fees, transport, baby items —
            with people who already love you. You set a goal tied to your due date.{' '}
            {brand.productName} does <strong>not</strong> hold the money: transfers still happen
            the way your family
            already does (bank, cash, wallet).
          </p>
          <h3 className="u-heading-sm" style={{ fontSize: '1rem' }}>
            How your tribe helps
          </h3>
          <ul style={{ margin: '0 0 0 1.1rem', padding: 0, lineHeight: 1.55 }}>
            <li>You invite close family and friends with a personal link.</li>
            <li>
              Each month they get a gentle nudge to gift toward your nest — and can record what
              they sent or pledged.
            </li>
            <li>
              You see who has joined and what has been recorded, so you are not chasing people one
              by one on WhatsApp.
            </li>
            <li>
              Near your due date, the nest helps you see if you are close to the amount you planned
              for birth.
            </li>
          </ul>
        </div>

        {error && <div className="u-alert u-alert--error">{error}</div>}
        {saved && (
          <div className="u-alert u-alert--success">
            Thanks — we saved your answer
            {existing?.interested === 'yes'
              ? '. We will prioritize building Nest for moms like you.'
              : '.'}
          </div>
        )}

        {loading ? (
          <div className="u-center-page">
            <div className="u-spinner" />
          </div>
        ) : (
          <form className="app-card" style={{ padding: 16 }} onSubmit={submit}>
            <h2 className="u-heading-sm" style={{ marginTop: 0 }}>
              Would you want this?
            </h2>
            <p className="u-muted" style={{ fontSize: '0.9rem' }}>
              A short signal helps us decide what to build next. You can update your answer anytime.
            </p>
            <fieldset style={{ border: 0, margin: '12px 0 0', padding: 0 }}>
              <legend className="app-label">Your answer</legend>
              {INTEREST_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 10,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="nest-interest"
                    value={opt.value}
                    checked={interested === opt.value}
                    onChange={() => setInterested(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </fieldset>
            <label className="app-label" style={{ marginTop: 12 }}>
              More info (optional)
            </label>
            <textarea
              className="app-input"
              value={moreInfo}
              onChange={(e) => setMoreInfo(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="What would make Nest useful for you? Who would you invite? Any worries?"
            />
            <div style={{ marginTop: 16 }}>
              <GradientButton type="submit" disabled={busy || !interested}>
                {busy ? 'Saving…' : existing ? 'Update answer' : 'Send answer'}
              </GradientButton>
            </div>
          </form>
        )}
      </div>
      <BottomNav />
    </>
  )
}
