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
import { mergeProfileBabyGender } from '../lib/babyGenderStorage'
import type { BabyGender, UserProfile } from '../types'
import { useUserAuth } from './UserAuthContext'

interface UserProfileContextValue {
  profile: UserProfile | null
  loading: boolean
  /** Live gender preview while editing profile/onboarding (overrides saved value for theming). */
  previewBabyGender: BabyGender | null
  setPreviewBabyGender: (gender: BabyGender | null) => void
  /** Saved gender, or preview while the user is picking one. */
  activeBabyGender: BabyGender | null | undefined
  refreshProfile: () => Promise<UserProfile | null>
  setProfile: (p: UserProfile) => void
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null)

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useUserAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [previewBabyGender, setPreviewBabyGender] = useState<BabyGender | null>(null)
  const [loading, setLoading] = useState(true)

  const activeBabyGender = previewBabyGender ?? profile?.baby_gender

  const applyProfile = useCallback(
    (p: UserProfile) => {
      if (user) {
        const merged = mergeProfileBabyGender(user.id, p)
        setProfile(merged)
        return merged
      }
      setProfile(p)
      return p
    },
    [user],
  )

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return null
    }
    setLoading(true)
    try {
      const p = await userApi.getProfile()
      return applyProfile(p)
    } catch {
      setProfile(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [user, applyProfile])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setPreviewBabyGender(null)
      setLoading(false)
      return
    }
    refreshProfile()
  }, [user, refreshProfile])

  const value = useMemo(
    () => ({
      profile,
      loading,
      previewBabyGender,
      setPreviewBabyGender,
      activeBabyGender,
      refreshProfile,
      setProfile: applyProfile,
    }),
    [profile, loading, previewBabyGender, activeBabyGender, refreshProfile, applyProfile],
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
