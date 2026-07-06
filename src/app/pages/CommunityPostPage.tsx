import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { userApi } from '../api'
import { IconHeart } from '../components/Icons'
import { GradientButton, MomAppBar } from '../components/ui'
import type { CommunityEvent, CommunityPost, CommunityReply } from '../types'
import { appPath } from '../routes'

export function CommunityPostPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<CommunityPost | null>(null)
  const [replies, setReplies] = useState<CommunityReply[]>([])
  const [event, setEvent] = useState<CommunityEvent | null>(null)
  const [replyText, setReplyText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    userApi.getPost(id).then(setPost).catch(() => setPost(null))
    userApi.getReplies(id).then((r) => setReplies(r.replies))
    userApi.getEvent(id).then(setEvent)
  }, [id])

  async function toggleLike() {
    if (!post) return
    const res = await userApi.togglePostLike(post.id)
    setPost({ ...post, liked_by_me: res.liked, like_count: res.like_count })
  }

  async function submitReply() {
    if (!id || !replyText.trim()) return
    const r = await userApi.createReply(id, replyText.trim())
    setReplies((prev) => [...prev, r])
    setReplyText('')
    if (post) setPost({ ...post, reply_count: post.reply_count + 1 })
  }

  async function evaluate(replyId?: string) {
    if (!id) return
    setEvaluating(true)
    try {
      const res = await userApi.evaluateForMe(id, replyId)
      navigate(appPath(`chat/${res.conversation_id}`))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start review')
    } finally {
      setEvaluating(false)
    }
  }

  async function toggleEventInterest() {
    if (!event) return
    const res = await userApi.toggleEventInterest(event.id)
    setEvent({ ...event, interested_by_me: res.interested, interested_count: res.interested_count })
  }

  if (!post) {
    return (
      <div className="u-center-page">
        <div className="u-spinner" />
      </div>
    )
  }

  return (
    <div className="user-app-content--no-nav">
      <MomAppBar
        pageTitle="Post"
        onBack={() => navigate(appPath('community'))}
        actions={
          <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => setMenuOpen(!menuOpen)}>
            ⋮
          </button>
        }
      />

      {menuOpen && (
        <div className="sheet-overlay" onClick={() => setMenuOpen(false)} role="presentation">
          <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="sheet-item" onClick={() => { userApi.hidePost(post.id); navigate(appPath('community')) }}>Hide post</button>
            <button type="button" className="sheet-item" onClick={() => userApi.reportPost(post.id, 'inappropriate')}>Report post</button>
            {post.author.id && (
              <button type="button" className="sheet-item" onClick={() => userApi.blockUser(post.author.id!)}>Block user</button>
            )}
          </div>
        </div>
      )}

      {error && <div className="u-alert u-alert--error" style={{ margin: '0 16px' }}>{error}</div>}

      <div style={{ padding: 16 }}>
        <div className="app-card">
          <strong>{post.is_anonymous ? 'Anonymous Mom' : post.author.display_name}</strong>
          <p className="u-body" style={{ whiteSpace: 'pre-wrap', margin: '12px 0' }}>{post.body}</p>
          <div className="post-actions">
            <button type="button" className={`post-action${post.liked_by_me ? ' post-action--active' : ''}`} onClick={toggleLike}>
              <IconHeart filled={post.liked_by_me} /> {post.like_count}
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
          <GradientButton onClick={() => evaluate()} disabled={evaluating}>
            {evaluating ? 'Starting…' : 'Good for me? — Review discussion'}
          </GradientButton>
          </div>
        </div>

        {event && (
          <div className="app-card" style={{ marginTop: 16 }}>
            <h3 className="u-heading-sm">{event.title}</h3>
            <p className="u-muted">{new Date(event.starts_at).toLocaleString()}</p>
            {event.venue && <p>{event.venue}</p>}
            <button type="button" className="app-btn app-btn--outline" onClick={toggleEventInterest} style={{ marginTop: 8 }}>
              {event.interested_by_me ? '✓ Interested' : 'Mark interested'} ({event.interested_count})
            </button>
          </div>
        )}

        <h3 className="u-heading-sm" style={{ margin: '24px 0 12px' }}>Replies ({replies.length})</h3>
        {replies.map((r) => (
          <div key={r.id} className="app-card app-card--outlined" style={{ marginBottom: 8 }}>
            <strong>{r.is_anonymous ? 'Anonymous' : r.author.display_name}</strong>
            <p style={{ margin: '8px 0' }}>{r.body}</p>
            <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => evaluate(r.id)}>
              Good for me?
            </button>
          </div>
        ))}

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <input
            className="app-input"
            placeholder="Write a reply…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="button" className="app-btn app-btn--outline" onClick={submitReply}>Reply</button>
        </div>
      </div>
    </div>
  )
}
