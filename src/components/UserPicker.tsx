import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { AdminUserSummary } from '../api/types'
import { UserRoleBadges } from './UserRoleBadges'

type Props = {
  user: AdminUserSummary | null
  onSelect: (user: AdminUserSummary) => void
  onClear: () => void
  label?: string
}

export function UserPicker({ user, onSelect, onClear, label = 'Email' }: Props) {
  const [email, setEmail] = useState('')
  const [looking, setLooking] = useState(false)
  const [error, setError] = useState('')

  async function lookup(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed.includes('@')) {
      setError('Enter a full email address.')
      return
    }
    setLooking(true)
    setError('')
    try {
      const res = await api.lookupUserByEmail(trimmed)
      const match = res.users?.[0]
      if (!match) {
        setError('No account with that email.')
        return
      }
      setEmail('')
      onSelect(match)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed')
    } finally {
      setLooking(false)
    }
  }

  if (user) {
    return (
      <div className="user-picker">
        <label>
          {label}
          <div className="user-picker-selected">
            <span className="user-picker-primary">
              {user.name ? `${user.name} — ${user.email}` : user.email}
            </span>
            <UserRoleBadges user={user} />
            {user.plan_code && <span className="badge badge-muted">{user.plan_code}</span>}
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
              Change
            </button>
          </div>
        </label>
      </div>
    )
  }

  return (
    <div className="user-picker">
      <form className="form inline-form" onSubmit={lookup}>
        <label className="flex-grow">
          {label}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            autoComplete="email"
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={looking}>
          {looking ? 'Looking up…' : 'Look up'}
        </button>
      </form>
      {error && <p className="user-picker-error">{error}</p>}
    </div>
  )
}
