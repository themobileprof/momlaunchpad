import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { IconBell, IconComment, IconHeart } from '../components/Icons'
import { EmptyState, MomAppBar } from '../components/ui'
import type { CommunityFeedFilter, CommunityPost } from '../types'
import { appPath } from '../routes'
import { resolveMediaUrl } from '../lib/mediaUrl'

const FILTERS: { value: CommunityFeedFilter; label: string }[] = [
  { value: 'for_you', label: 'For You' },
  { value: 'nearby', label: 'Nearby' },
  { value: 'events', label: 'Events' },
  { value: 'my_posts', label: 'My Posts' },
]

function PostCard({ post, onLike }: { post: CommunityPost; onLike: () => void }) {
  return (
    <Link to={appPath(`community/post/${post.id}`)} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="app-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong>{post.is_anonymous ? 'Anonymous Mom' : post.author.display_name}</strong>
          {post.is_event && (
            <span className="app-badge" style={{ background: 'color-mix(in srgb, var(--teal) 10%, transparent)' }}>
              Local event
            </span>
          )}
        </div>
        <p className="u-body" style={{ margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{post.body}</p>
        {post.image_urls.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 8 }}>
            {post.image_urls.map((url) => (
              <img key={url} src={resolveMediaUrl(url)} alt="" style={{ height: 80, borderRadius: 8, objectFit: 'cover' }} />
            ))}
          </div>
        )}
        <div className="post-actions">
          <button
            type="button"
            className={`post-action${post.liked_by_me ? ' post-action--active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              onLike()
            }}
          >
            <IconHeart filled={post.liked_by_me} /> {post.like_count}
          </button>
          <span className="post-action">
            <IconComment /> {post.reply_count}
          </span>
        </div>
      </div>
    </Link>
  )
}

export function CommunityPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<CommunityFeedFilter>('for_you')
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [onboarded, setOnboarded] = useState(true)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    userApi.getCommunityStatus().then((s) => {
      setOnboarded(s.community_onboarding_completed)
      if (!s.community_onboarding_completed) {
        navigate(appPath('community/onboarding'))
      }
    })
    userApi.getNotifications().then((r) => {
      setUnread(r.notifications.filter((n) => !n.read_at).length)
    })
  }, [navigate])

  useEffect(() => {
    setLoading(true)
    userApi
      .getCommunityFeed(filter)
      .then((r) => setPosts(r.posts))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [filter])

  async function likePost(postId: string) {
    const res = await userApi.togglePostLike(postId)
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, liked_by_me: res.liked, like_count: res.like_count } : p,
      ),
    )
  }

  if (!onboarded) return null

  return (
    <>
      <MomAppBar
        pageTitle="Community"
        actions={
          <Link to={appPath('community/notifications')} style={{ position: 'relative', color: 'var(--teal)', padding: 8 }}>
            <IconBell />
            {unread > 0 && <span className="notification-dot" />}
          </Link>
        }
      />
      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`filter-chip${filter === f.value ? ' filter-chip--active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="user-app-content" style={{ paddingBottom: 160 }}>
        {loading ? (
          <div className="u-center-page"><div className="u-spinner" /></div>
        ) : posts.length === 0 ? (
          <EmptyState icon="◎" title="Nothing here yet" body="Be the first to share with mothers nearby." />
        ) : (
          <div style={{ padding: '0 16px' }}>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} onLike={() => likePost(p.id)} />
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        className="community-fab"
        aria-label="Create post"
        onClick={() => navigate(appPath('community/create'))}
      >
        +
      </button>
      <BottomNav />
    </>
  )
}
