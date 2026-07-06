import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { AppBackground, GlassCard, GradientButton } from '../components/ui'
import { useUserAuth } from '../context/UserAuthContext'
import { appPath } from '../routes'

export function UserRegisterPage() {
  const { register, googleSignIn, user } = useUserAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  if (user) return <Navigate to={appPath()} replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(email, password, name.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppBackground>
      <div className="auth-page user-app-content--no-nav">
        <div className="auth-logo-wrap">
          <div className="auth-logo-ring">
            <img src="/logo.png" alt="MomLaunchpad" />
          </div>
          <h1 className="u-heading-md">Create your account</h1>
          <p className="u-muted">A softer place to land on your journey</p>
        </div>

        {error && <div className="u-alert u-alert--error">{error}</div>}

        <GlassCard className="auth-card">
          <form onSubmit={handleSubmit}>
            <label className="app-label">Sign up with email</label>
            <input
              className="app-input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              style={{ marginBottom: 16 }}
            />
            <input
              className="app-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{ marginBottom: 16 }}
            />
            <input
              className="app-input"
              type="password"
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <div style={{ marginTop: 32 }}>
              <GradientButton type="submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account →'}
              </GradientButton>
            </div>
          </form>

          {googleClientId && (
            <>
              <div className="auth-divider">or</div>
              <GoogleLogin
                onSuccess={(res) => {
                  if (res.credential) {
                    setLoading(true)
                    googleSignIn(res.credential)
                      .catch((err) =>
                        setError(err instanceof Error ? err.message : 'Google sign-in failed'),
                      )
                      .finally(() => setLoading(false))
                  }
                }}
                onError={() => setError('Google sign-in failed')}
                theme="outline"
                size="large"
                width="100%"
                text="signup_with"
              />
            </>
          )}
        </GlassCard>

        <div className="auth-footer">
          <p className="u-muted">
            Already have an account? <Link to={appPath('login')}>Sign in</Link>
          </p>
        </div>
      </div>
    </AppBackground>
  )
}
