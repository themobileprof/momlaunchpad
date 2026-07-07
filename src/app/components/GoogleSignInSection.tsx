import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { isGoogleAuthEnabled } from '../lib/googleAuth'

type Props = {
  mode: 'signin' | 'signup'
  onSuccess: (idToken: string) => void
  onError: (message: string) => void
}

export function GoogleSignInSection({ mode, onSuccess, onError }: Props) {
  if (!isGoogleAuthEnabled) return null

  function handleSuccess(res: CredentialResponse) {
    if (res.credential) {
      onSuccess(res.credential)
      return
    }
    onError('Google sign-in did not return a credential')
  }

  return (
    <>
      <div className="auth-divider">or</div>
      <div className="google-signin-wrap">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => onError('Google sign-in was cancelled or blocked')}
          theme="outline"
          size="large"
          width="320"
          text={mode === 'signup' ? 'signup_with' : 'continue_with'}
          shape="rectangular"
        />
      </div>
    </>
  )
}
