import { describe, expect, it, beforeEach } from 'vitest'
import {
  loadStoredBabyGender,
  mergeProfileBabyGender,
  saveStoredBabyGender,
} from './babyGenderStorage'
import type { UserProfile } from '../types'

const baseProfile: UserProfile = {
  name: 'Test',
  language: 'en',
  onboarding_completed: true,
  community_onboarding_completed: false,
  community_interests: [],
  referral_code: 'ABC',
  referral_link: 'https://example.com/join?ref=ABC',
  referral_reward_points: 0,
  total_referrals: 0,
}

describe('babyGenderStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips gender in localStorage', () => {
    saveStoredBabyGender('user-1', 'boy')
    expect(loadStoredBabyGender('user-1')).toBe('boy')
    saveStoredBabyGender('user-1', null)
    expect(loadStoredBabyGender('user-1')).toBeNull()
  })

  it('merges stored gender when API profile omits baby_gender', () => {
    saveStoredBabyGender('user-1', 'girl')
    const merged = mergeProfileBabyGender('user-1', baseProfile)
    expect(merged.baby_gender).toBe('girl')
  })

  it('prefers API gender and syncs storage', () => {
    saveStoredBabyGender('user-1', 'girl')
    const merged = mergeProfileBabyGender('user-1', { ...baseProfile, baby_gender: 'boy' })
    expect(merged.baby_gender).toBe('boy')
    expect(loadStoredBabyGender('user-1')).toBe('boy')
  })
})
