import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { userApi } from '../api'
import type { UserProfile } from '../types'
import { useUserAuth } from './UserAuthContext'

interface UserProfileContextValue {
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<UserProfile | null>
  setProfile: (p: UserProfile) => void
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null)

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useUserAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return null
    }
    setLoading(true)
    try {
      const p = await userApi.getProfile()
      setProfile(p)
      return p
    } catch {
      setProfile(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    refreshProfile()
  }, [user, refreshProfile])

  const value = useMemo(
    () => ({ profile, loading, refreshProfile, setProfile }),
    [profile, loading, refreshProfile],
  )

  return (
    <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>
  )
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext)
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider')
  return ctx
}
