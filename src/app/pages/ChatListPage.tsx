import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { EmptyState, GradientButton, MomAppBar } from '../components/ui'
import type { Conversation } from '../types'
import { appPath } from '../routes'

function formatRelative(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString()
}

export function ChatListPage() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    userApi
      .listConversations()
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoading(false))
  }, [])

  const latest = conversations[0]

  async function createTopic() {
    setCreating(true)
    try {
      const c = await userApi.createConversation('New conversation')
      navigate(appPath(`chat/${c.id}`))
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <MomAppBar
        pageTitle="Chat"
        actions={
          <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={createTopic} disabled={creating}>
            + New topic
          </button>
        }
      />
      <div className="user-app-content">
        {latest && (
          <div className="continue-chat-card">
            <p className="u-caption" style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>Continue chatting</p>
            <h2 className="u-heading-sm" style={{ color: 'white', marginBottom: 4 }}>{latest.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.85rem', marginBottom: 16 }}>
              {formatRelative(latest.updated_at)}
            </p>
            <Link to={appPath(`chat/${latest.id}`)}>
              <button type="button" className="app-btn app-btn--white-outline" style={{ width: '100%' }}>
                Open conversation
              </button>
            </Link>
          </div>
        )}

        {loading ? (
          <div className="u-center-page"><div className="u-spinner" /></div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon="✨"
            title="Start your first conversation"
            body="Ask anything — we're here to listen."
            action={<GradientButton onClick={createTopic}>New topic</GradientButton>}
          />
        ) : (
          <div style={{ padding: '0 16px' }}>
            <p className="u-caption" style={{ color: 'var(--teal)', marginBottom: 8 }}>All topics</p>
            {conversations.map((c) => (
              <Link
                key={c.id}
                to={appPath(`chat/${c.id}`)}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 8 }}
              >
                <div
                  className="app-card app-card--outlined app-card--tap"
                  style={{ display: 'flex', gap: 12, alignItems: 'center' }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: c.is_starred ? 'var(--teal)' : 'var(--surface-muted)',
                      color: c.is_starred ? 'white' : 'var(--teal)',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    {c.is_starred ? '★' : '💬'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block' }}>{c.title}</strong>
                    <span className="u-muted" style={{ fontSize: '0.82rem' }}>
                      {formatRelative(c.updated_at)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </>
  )
}
