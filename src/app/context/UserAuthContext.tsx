import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError } from '../../api/client'
import { getStoredReferralCode } from '../../lib/referral'
import { setUserToken, userApi } from '../api'
import type { AppUser } from '../types'

interface UserAuthContextValue {
  user: AppUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  googleSignIn: (idToken: string) => Promise<void>
  logout: () => void
  refreshSession: () => Promise<void>
}

const UserAuthContext = createContext<UserAuthContextValue | null>(null)

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const persistAuth = useCallback((token: string, u: AppUser) => {
    setUserToken(token)
    setUser(u)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('user_token')
    if (!token) {
      setLoading(false)
      return
    }
    userApi
      .refresh()
      .then((res) => {
        persistAuth(res.token, res.user)
      })
      .catch(() =>
        userApi.me().then((u) => {
          setUser(u)
        }),
      )
      .catch(() => {
        setUserToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [persistAuth])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await userApi.login(email, password)
      persistAuth(res.token, res.user)
    },
    [persistAuth],
  )

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const referral = getStoredReferralCode()
      const res = await userApi.register({
        email,
        password,
        name,
        referral_code: referral ?? undefined,
      })
      persistAuth(res.token, res.user)
    },
    [persistAuth],
  )

  const googleSignIn = useCallback(
    async (idToken: string) => {
      const referral = getStoredReferralCode()
      const res = await userApi.googleSignIn(idToken, referral ?? undefined)
      persistAuth(res.token, res.user)
    },
    [persistAuth],
  )

  const logout = useCallback(() => {
    setUserToken(null)
    setUser(null)
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const res = await userApi.refresh()
      persistAuth(res.token, res.user)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) logout()
    }
  }, [persistAuth, logout])

  const value = useMemo(
    () => ({ user, loading, login, register, googleSignIn, logout, refreshSession }),
    [user, loading, login, register, googleSignIn, logout, refreshSession],
  )

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext)
  if (!ctx) throw new Error('useUserAuth must be used within UserAuthProvider')
  return ctx
}
