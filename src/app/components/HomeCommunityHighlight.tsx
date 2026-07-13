import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userApi } from '../api'
import { GradientButton } from './ui'
import { appPath } from '../routes'

export function HomeCommunityHighlight() {
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [locationLabel, setLocationLabel] = useState<string | null>(null)
  const [nearbyCount, setNearbyCount] = useState(0)
  const [eventCount, setEventCount] = useState(0)
  const [topPostId, setTopPostId] = useState<string | null>(null)
  const [topPostPreview, setTopPostPreview] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const status = await userApi.getCommunityStatus()
        if (!status.community_onboarding_completed) {
          setNeedsOnboarding(true)
          const parts = [status.city, status.state_province, status.country].filter(Boolean)
          setLocationLabel(parts.join(', ') || null)
          return
        }

        const [nearby, events] = await Promise.all([
          userApi.getCommunityFeed('nearby', undefined, 5),
          userApi.getCommunityFeed('events', undefined, 5),
        ])
        setNearbyCount(nearby.posts.length)
        setEventCount(events.posts.length)
        const first = nearby.posts[0]
        if (first) {
          setTopPostId(first.id)
          setTopPostPreview(first.body.slice(0, 120))
        }
      } catch {
        /* hide card */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return null
  if (needsOnboarding) {
    return (
      <div className="glass home-prompt-card">
        <p className="u-caption">Community</p>
        <strong>Join moms near you</strong>
        <p className="u-muted home-prompt-card__body">
          {locationLabel ? `Set up your feed for ${locationLabel}` : 'Add your location and topics to see nearby posts.'}
        </p>
        <Link to={appPath('community/onboarding')}>
          <GradientButton>Set up community feed</GradientButton>
        </Link>
      </div>
    )
  }

  if (nearbyCount === 0 && eventCount === 0) return null

  return (
    <div className="glass home-prompt-card">
      <p className="u-caption">Near you</p>
      <strong>
        {nearbyCount > 0 ? `${nearbyCount} recent post${nearbyCount === 1 ? '' : 's'} nearby` : 'Community pulse'}
        {eventCount > 0 ? ` · ${eventCount} upcoming event${eventCount === 1 ? '' : 's'}` : ''}
      </strong>
      {topPostPreview && (
        <p className="u-muted home-prompt-card__body" style={{ marginBottom: 8 }}>
          “{topPostPreview}{topPostPreview.length >= 120 ? '…' : ''}”
        </p>
      )}
      <div className="home-prompt-card__actions">
        <Link to={appPath('community')} className="app-btn app-btn--outline app-btn--sm" style={{ textDecoration: 'none' }}>
          Open community
        </Link>
        {topPostId && (
          <Link to={appPath(`community/post/${topPostId}`)} className="app-btn app-btn--ghost app-btn--sm" style={{ textDecoration: 'none' }}>
            Read post
          </Link>
        )}
      </div>
    </div>
  )
}
