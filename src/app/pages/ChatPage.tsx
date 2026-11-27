import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { userApi } from '../api'
import { IconSend } from '../components/Icons'
import { GradientButton, MomAppBar } from '../components/ui'
import { useChatWebSocket } from '../hooks/useChatWebSocket'
import { offerExternalCalendar } from '../lib/reminderGoogleSync'
import type { ChatMessage } from '../types'
import { appPath } from '../routes'

interface CalendarSuggestion {
  title: string
  description?: string
  suggested_time: string
  priority?: string
  reason?: string
}

const SYMPTOM_STARTER = "I have a symptom I'm worried about"

const STARTERS = [
  'How am I doing this week?',
  SYMPTOM_STARTER,
  'Help me prepare for my appointment',
]

export function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('Chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [calendarSuggestion, setCalendarSuggestion] = useState<CalendarSuggestion | null>(null)
  const [savingSuggestion, setSavingSuggestion] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const streamingIdRef = useRef<string | null>(null)
  const starterSentRef = useRef(false)
  const wasConnectedRef = useRef(false)
  const everConnectedRef = useRef(false)
  const { connected, lastFrame, sendMessage } = useChatWebSocket(id)

  const markLastSendingFailed = useCallback(() => {
    setMessages((prev) => {
      const next = [...prev]
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].is_user && next[i].send_status === 'sending') {
          next[i] = { ...next[i], send_status: 'failed' }
          break
        }
      }
      return next
    })
    setError('No reply yet — check your connection and tap Retry.')
  }, [])

  const clearPendingSendStatus = useCallback(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.is_user && m.send_status ? { ...m, send_status: undefined } : m,
      ),
    )
  }, [])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([userApi.getConversation(id), userApi.getMessages(id)])
      .then(([conv, msgs]) => {
        setTitle(conv.title)
        setMessages(
          msgs.map((m) => ({
            id: m.id ?? crypto.randomUUID(),
            content: m.content,
            is_user: m.is_user,
            timestamp: m.timestamp,
          })),
        )
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load chat'))
      .finally(() => setLoading(false))
  }, [id])

  // After a reconnect, pull messages so replies persisted while offline appear.
  useEffect(() => {
    if (
      connected &&
      !wasConnectedRef.current &&
      everConnectedRef.current &&
      id &&
      !loading
    ) {
      userApi
        .getMessages(id)
        .then((msgs) => {
          setMessages((prev) => {
            const pending = prev.filter((m) => m.is_user && m.send_status)
            const server = msgs.map((m) => ({
              id: m.id ?? crypto.randomUUID(),
              content: m.content,
              is_user: m.is_user,
              timestamp: m.timestamp,
            }))
            if (pending.length === 0) return server
            const serverContents = new Set(
              server.filter((m) => m.is_user).map((m) => m.content.trim()),
            )
            const stillLocal = pending.filter(
              (m) => !serverContents.has(m.content.trim()),
            )
            return [...server, ...stillLocal]
          })
        })
        .catch(() => {
          /* ignore sync errors */
        })
    }
    if (connected) everConnectedRef.current = true
    wasConnectedRef.current = connected
  }, [connected, id, loading])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFrame = useCallback(
    (frame: NonNullable<typeof lastFrame>) => {
      if (frame.type === 'message' && frame.content) {
        clearPendingSendStatus()
        const streamId = streamingIdRef.current ?? crypto.randomUUID()
        streamingIdRef.current = streamId
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === streamId)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = {
              ...next[idx],
              content: next[idx].content + frame.content,
              is_streaming: true,
            }
            return next
          }
          return [
            ...prev,
            {
              id: streamId,
              content: frame.content!,
              is_user: false,
              timestamp: new Date().toISOString(),
              is_streaming: true,
            },
          ]
        })
      }
      if (frame.type === 'done') {
        streamingIdRef.current = null
        clearPendingSendStatus()
        setMessages((prev) =>
          prev.map((m) => (m.is_streaming ? { ...m, is_streaming: false } : m)),
        )
      }
      if (frame.type === 'title_updated' && frame.content) {
        setTitle(frame.content)
      }
      if (frame.type === 'calendar' && frame.data) {
        const title = typeof frame.data.title === 'string' ? frame.data.title : ''
        const suggested =
          typeof frame.data.suggested_time === 'string' ? frame.data.suggested_time : ''
        if (title && suggested) {
          setCalendarSuggestion({
            title,
            description:
              typeof frame.data.description === 'string' ? frame.data.description : undefined,
            suggested_time: suggested,
            priority: typeof frame.data.priority === 'string' ? frame.data.priority : 'medium',
            reason: typeof frame.data.reason === 'string' ? frame.data.reason : undefined,
          })
        }
      }
      if (frame.type === 'error') {
        markLastSendingFailed()
        setError(frame.message ?? frame.content ?? 'Something went wrong')
      }
    },
    [clearPendingSendStatus, markLastSendingFailed],
  )

  async function acceptCalendarSuggestion() {
    if (!calendarSuggestion) return
    setSavingSuggestion(true)
    try {
      const reminder = await userApi.createReminder({
        title: calendarSuggestion.title,
        description: calendarSuggestion.description,
        reminder_time: calendarSuggestion.suggested_time,
        priority: calendarSuggestion.priority || 'medium',
      })
      offerExternalCalendar(reminder)
      setCalendarSuggestion(null)
      navigate(appPath('calendar'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save reminder')
    } finally {
      setSavingSuggestion(false)
    }
  }

  useEffect(() => {
    if (lastFrame) handleFrame(lastFrame)
  }, [lastFrame, handleFrame])

  function handleSend(text?: string, existingId?: string) {
    const content = (text ?? input).trim()
    if (!content) return
    setError('')
    if (!existingId) setInput('')

    const msgId = existingId ?? crypto.randomUUID()
    if (!existingId) {
      setMessages((prev) => [
        ...prev,
        {
          id: msgId,
          content,
          is_user: true,
          timestamp: new Date().toISOString(),
          send_status: 'sending',
        },
      ])
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === existingId ? { ...m, send_status: 'sending' as const } : m,
        ),
      )
    }

    const queued = !sendMessage(content, { onReplyTimeout: markLastSendingFailed })
    if (queued) {
      // Still in flight via reconnect queue — keep "sending" until timeout or reply.
    }
  }

  function handleRetry(msg: ChatMessage) {
    if (!msg.is_user || msg.send_status !== 'failed') return
    handleSend(msg.content, msg.id)
  }

  // Health tracker → chat: open a new topic and send the symptom starter once connected.
  useEffect(() => {
    if (starterSentRef.current) return
    if (searchParams.get('starter') !== 'symptom') return
    if (loading || !connected || messages.length > 0) return
    starterSentRef.current = true
    setSearchParams({}, { replace: true })
    handleSend(SYMPTOM_STARTER)
    // handleSend is stable enough for this one-shot; deps intentionally narrow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loading, connected, messages.length, setSearchParams])

  return (
    <div className="user-app-content--no-nav" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <MomAppBar
        pageTitle="Chat"
        onBack={() => navigate(appPath('chat'))}
        actions={
          <span style={{ fontSize: '0.75rem', color: connected ? 'var(--success)' : 'var(--ink-subtle)' }}>
            ● {connected ? 'Connected' : 'Offline'}
          </span>
        }
      />
      {title && title !== 'Chat' && (
        <div className="chat-topic-bar" title={title}>
          <p className="chat-topic-bar__title">{title}</p>
        </div>
      )}

      {error && <div className="u-alert u-alert--error" style={{ margin: '0 16px' }}>{error}</div>}

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
        {loading ? (
          <div className="u-center-page"><div className="u-spinner" /></div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💭</div>
            <h2 className="u-heading-md">What&apos;s on your mind?</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="filter-chip"
                  onClick={() => handleSend(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="u-muted" style={{ marginTop: 16, fontSize: '0.85rem' }}>
              Logged symptoms live in your{' '}
              <Link to={appPath('symptoms')} style={{ color: 'var(--accent-deep)' }}>
                health tracker
              </Link>
              .
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="chat-bubble-wrap">
              <div
                className={`chat-bubble ${m.is_user ? 'chat-bubble--user' : 'chat-bubble--ai'}${
                  m.send_status === 'failed' ? ' chat-bubble--failed' : ''
                }`}
              >
                {m.content}
                {m.is_streaming && <span className="u-muted"> …</span>}
              </div>
              {m.is_user && m.send_status === 'sending' && (
                <p className="chat-send-meta">Sending…</p>
              )}
              {m.is_user && m.send_status === 'failed' && (
                <button
                  type="button"
                  className="chat-retry-btn"
                  onClick={() => handleRetry(m)}
                >
                  Not delivered — Retry
                </button>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <textarea
          className="chat-input"
          rows={1}
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <button
          type="button"
          className="chat-send-btn"
          onClick={() => handleSend()}
          disabled={!input.trim()}
          aria-label="Send"
        >
          <IconSend />
        </button>
      </div>

      {calendarSuggestion && (
        <div
          className="sheet-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-cal-title"
        >
          <div className="sheet-panel sheet-panel--compose">
            <div className="sheet-panel__handle" aria-hidden />
            <h2 id="chat-cal-title" className="u-heading-sm">Add to your calendar?</h2>
            <p className="u-muted" style={{ margin: '8px 0 0', lineHeight: 1.45 }}>
              {calendarSuggestion.reason ||
                'I can save this as a reminder so you don’t forget.'}
            </p>
            <p className="visit-saved-chip">{calendarSuggestion.title}</p>
            <p className="u-muted" style={{ margin: '8px 0 0', fontSize: '0.88rem' }}>
              {new Date(calendarSuggestion.suggested_time).toLocaleString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
            <div className="sheet-panel__footer sheet-panel__footer--stack">
              <GradientButton onClick={acceptCalendarSuggestion} disabled={savingSuggestion}>
                {savingSuggestion ? 'Saving…' : 'Save reminder'}
              </GradientButton>
              <button
                type="button"
                className="app-btn app-btn--ghost"
                onClick={() => setCalendarSuggestion(null)}
                disabled={savingSuggestion}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
