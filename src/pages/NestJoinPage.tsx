import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { publicNestApi } from '../lib/publicApi'
import type { PublicNest } from '../app/types'
import './home.css'

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

export function NestJoinPage() {
  const { token = '' } = useParams<{ token: string }>()
  const [nest, setNest] = useState<PublicNest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [doneMessage, setDoneMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'recorded' | 'pledged'>('recorded')

  useEffect(() => {
    if (!token) return
    setLoading(true)
    publicNestApi
      .getNest(token)
      .then(setNest)
      .catch((e) => setError(e instanceof Error ? e.message : 'Invite not found'))
      .finally(() => setLoading(false))
  }, [token])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!name.trim() || !(value > 0)) {
      setError('Enter your name and a positive amount')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await publicNestApi.contribute(token, {
        display_name: name.trim(),
        amount: value,
        note: note.trim() || undefined,
        phone: phone.trim() || undefined,
        status,
      })
      setDoneMessage(res.message)
      const refreshed = await publicNestApi.getNest(token)
      setNest(refreshed)
      setAmount('')
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="home">
      <div className="home-grain" aria-hidden />
      <header className="home-header">
        <BrandLogo href="/" size="lg" showText className="home-logo" />
      </header>

      <main className="home-join-main">
        <section className="home-hero home-join-hero" aria-labelledby="nest-join-heading">
          <div className="home-hero-glow" aria-hidden />
          <p className="home-eyebrow">Delivery nest</p>
          {loading ? (
            <p className="home-hero-lead">Loading invite…</p>
          ) : !nest ? (
            <>
              <h1 id="nest-join-heading" className="home-hero-title">Invite not found</h1>
              <p className="home-hero-lead">
                This link may be wrong or the nest may be closed. Ask your person for a fresh invite.
              </p>
              <Link className="home-btn home-btn-ghost home-btn-lg" to="/">
                About MomLaunchpad
              </Link>
            </>
          ) : (
            <>
              <h1 id="nest-join-heading" className="home-hero-title">
                Help {nest.mom_first_name} prepare for delivery
              </h1>
              <p className="home-hero-lead">
                {nest.title}. Record what you can give this month — then send it the way you usually would.
              </p>
              <p className="home-join-code" role="status">
                {money(nest.total_raised, nest.currency)} raised
                {nest.goal_amount > 0 ? ` of ${money(nest.goal_amount, nest.currency)}` : ''}
              </p>

              {doneMessage ? (
                <div className="home-join-code" role="status" style={{ marginTop: '1rem' }}>
                  {doneMessage}
                </div>
              ) : (
                <form onSubmit={submit} className="nest-join-form">
                  {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
                  <label>
                    Your name
                    <input value={name} onChange={(e) => setName(e.target.value)} required />
                  </label>
                  <label>
                    Amount ({nest.currency})
                    <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                  </label>
                  <label>
                    Phone (optional)
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </label>
                  <label>
                    Note (optional)
                    <input value={note} onChange={(e) => setNote(e.target.value)} />
                  </label>
                  <fieldset>
                    <legend>This gift is</legend>
                    <label className="nest-join-form__radio">
                      <input type="radio" checked={status === 'recorded'} onChange={() => setStatus('recorded')} />
                      Already sent / I will send now
                    </label>
                    <label className="nest-join-form__radio">
                      <input type="radio" checked={status === 'pledged'} onChange={() => setStatus('pledged')} />
                      A pledge for later this month
                    </label>
                  </fieldset>
                  <button type="submit" className="home-btn home-btn-lg" disabled={busy}>
                    {busy ? 'Saving…' : 'Record contribution'}
                  </button>
                </form>
              )}

              <p className="home-join-note" style={{ marginTop: '1.5rem' }}>
                MomLaunchpad records the nest so {nest.mom_first_name} can see progress. It does not move money for you yet.
              </p>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
