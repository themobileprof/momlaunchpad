import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { MomAppBar } from '../components/ui'
import type { CommunityNotification } from '../types'
import { appPath } from '../routes'

export function CommunityNotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<CommunityNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userApi
      .getNotifications()
      .then((r) => setNotifications(r.notifications))
      .finally(() => setLoading(false))
  }, [])

  async function openNotification(n: CommunityNotification) {
    if (!n.read_at) {
      await userApi.markNotificationRead(n.id)
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)),
      )
    }
    const postId = n.payload?.post_id as string | undefined
    if (postId) navigate(appPath(`community/post/${postId}`))
  }

  return (
    <div className="user-app-content--no-nav">
      <MomAppBar pageTitle="Notifications" onBack={() => navigate(appPath('community'))} />
      <div style={{ padding: 16 }}>
        {loading ? (
          <div className="u-center-page"><div className="u-spinner" /></div>
        ) : notifications.length === 0 ? (
          <p className="u-muted" style={{ textAlign: 'center', padding: 48 }}>No notifications yet</p>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              className="app-card app-card--tap app-card--outlined"
              style={{
                width: '100%',
                textAlign: 'left',
                marginBottom: 8,
                border: 'none',
                opacity: n.read_at ? 0.7 : 1,
                background: n.read_at ? 'var(--surface)' : 'var(--mint-soft)',
              }}
              onClick={() => openNotification(n)}
            >
              <strong>{n.title}</strong>
              <p className="u-muted" style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>{n.body}</p>
              <span className="u-caption">{new Date(n.created_at).toLocaleString()}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
