import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { GenderPicker } from '../components/GenderPicker'
import { AppCard, GradientButton, MomAppBar } from '../components/ui'
import { useUserAuth } from '../context/UserAuthContext'
import { useUserProfile } from '../context/UserProfileContext'
import { JOURNEY_STAGES, type BabyGender, type JourneyStage } from '../types'
import { appPath } from '../routes'

export function ProfilePage() {
  const { user } = useUserAuth()
  const { profile, setProfile } = useUserProfile()
  const [name, setName] = useState('')
  const [journeyStage, setJourneyStage] = useState<JourneyStage | undefined>()
  const [pregnancyWeek, setPregnancyWeek] = useState(20)
  const [babyGender, setBabyGender] = useState<BabyGender | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setJourneyStage(profile.journey_stage)
      if (profile.pregnancy_week) setPregnancyWeek(profile.pregnancy_week)
      setBabyGender(profile.baby_gender ?? null)
    }
  }, [profile])

  useEffect(() => {
    const root = document.querySelector('.user-app')
    if (!root || !babyGender) return
    const previous = root.getAttribute('data-baby-theme')
    root.setAttribute('data-baby-theme', babyGender)
    return () => {
      if (previous) root.setAttribute('data-baby-theme', previous)
    }
  }, [babyGender])

  async function save() {
    setSaving(true)
    setMessage('')
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        language: 'en',
        journey_stage: journeyStage,
      }
      if (journeyStage === 'pregnant') {
        body.pregnancy_week = pregnancyWeek
        if (babyGender) body.baby_gender = babyGender
        else body.baby_gender = ''
      }
      const p = await userApi.updateProfile(body)
      setProfile(p)
      setMessage('Saved!')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const p = await userApi.uploadProfilePhoto(file)
    setProfile(p)
  }

  const referralUrl =
    profile?.referral_link ||
    (profile?.referral_code
      ? `${window.location.origin}/join?ref=${encodeURIComponent(profile.referral_code)}`
      : '')

  async function copyReferral() {
    if (!referralUrl) return
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setMessage('Could not copy link')
    }
  }

  async function shareReferral() {
    if (!referralUrl) return
    const shareData = {
      title: 'Join me on MomLaunchpad',
      text: 'Join me on MomLaunchpad — gentle support, community, and personalized guidance for your pregnancy journey.',
      url: referralUrl,
    }
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData)
      } catch {
        // user dismissed the share sheet
      }
    } else {
      copyReferral()
    }
  }

  return (
    <>
      <MomAppBar pageTitle="Your profile" />
      <div className="user-app-content">
        <div style={{ padding: 16 }}>
          <p className="u-caption">Personalization</p>
          <div style={{ marginBottom: 16 }}>
          <AppCard>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'var(--surface-muted)',
                  overflow: 'hidden',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {profile?.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '2rem' }}>👤</span>
                )}
              </div>
              <div>
                <strong>{profile?.name || 'Your profile'}</strong>
                <p className="u-muted" style={{ margin: 0, fontSize: '0.85rem' }}>{user?.email}</p>
              </div>
            </div>
            <label className="app-btn app-btn--outline app-btn--sm" style={{ cursor: 'pointer' }}>
              Change photo
              <input type="file" accept="image/*" hidden onChange={onPhotoChange} />
            </label>
          </AppCard>
          </div>

          <p className="u-caption">About you</p>
          <div style={{ marginBottom: 16 }}>
          <AppCard>
            <label className="app-label">Name</label>
            <input className="app-input" value={name} onChange={(e) => setName(e.target.value)} />
          </AppCard>
          </div>

          <p className="u-caption">Journey</p>
          <div style={{ marginBottom: 16 }}>
          <AppCard>
            <select
              className="app-input"
              value={journeyStage ?? ''}
              onChange={(e) => setJourneyStage(e.target.value as JourneyStage)}
            >
              <option value="">Select stage</option>
              {JOURNEY_STAGES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {journeyStage === 'pregnant' && (
              <>
                <label className="app-label" style={{ marginTop: 12 }}>Week: {pregnancyWeek}</label>
                <input
                  type="range"
                  min={4}
                  max={42}
                  value={pregnancyWeek}
                  onChange={(e) => setPregnancyWeek(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
                <p className="app-label" style={{ marginTop: 16 }}>Baby gender & app colors</p>
                <p className="u-muted" style={{ fontSize: '0.85rem', margin: '0 0 12px' }}>
                  Optional — your whole app shifts to match (rose, blue, or golden surprise).
                </p>
                <GenderPicker value={babyGender} onChange={setBabyGender} />
              </>
            )}
          </AppCard>
          </div>

          <p className="u-caption">Community feed</p>
          <div style={{ marginBottom: 16 }}>
            <AppCard>
              {profile?.community_interests?.length ? (
                <p style={{ margin: '0 0 12px' }}>
                  Topics: {profile.community_interests.join(', ')}
                </p>
              ) : (
                <p className="u-muted" style={{ margin: '0 0 12px' }}>
                  Choose topics to personalize your community feed.
                </p>
              )}
              <Link to={`${appPath('community/onboarding')}?edit=1`} className="app-btn app-btn--outline app-btn--sm" style={{ textDecoration: 'none' }}>
                Edit feed topics
              </Link>
            </AppCard>
          </div>

          {profile?.referral_code && (
            <>
              <p className="u-caption">Referrals</p>
              <div style={{ marginBottom: 16 }}>
          <AppCard>
                <p style={{ margin: '0 0 8px' }}>Your code: <strong>{profile.referral_code}</strong></p>
                <p className="u-muted" style={{ fontSize: '0.85rem', margin: '0 0 12px' }}>
                  {profile.total_referrals} referrals · {profile.referral_reward_points} reward points
                </p>

                <label className="app-label">Your invite link</label>
                <input
                  className="app-input"
                  readOnly
                  value={referralUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  style={{ marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="app-btn app-btn--outline app-btn--sm"
                    style={{ flex: 1 }}
                    onClick={copyReferral}
                  >
                    {copied ? 'Copied ✓' : 'Copy link'}
                  </button>
                  <button
                    type="button"
                    className="app-btn app-btn--sm"
                    style={{ flex: 1 }}
                    onClick={shareReferral}
                  >
                    Share
                  </button>
                </div>
              </AppCard>
              </div>
            </>
          )}

          {message && <p className={message === 'Saved!' ? 'u-muted' : 'u-alert u-alert--error'}>{message}</p>}
          <GradientButton onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes ✓'}
          </GradientButton>
        </div>
      </div>
      <BottomNav />
    </>
  )
}
