import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { userApi } from '../api'
import { IconSend } from '../components/Icons'
import { MomAppBar } from '../components/ui'
import { useChatWebSocket } from '../hooks/useChatWebSocket'
import type { ChatMessage } from '../types'
import { appPath } from '../routes'

const STARTERS = [
  'How am I doing this week?',
  'I have a symptom I\'m worried about',
  'Help me prepare for my appointment',
]

export function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [title, setTitle] = useState('Chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const streamingIdRef = useRef<string | null>(null)
  const { connected, lastFrame, sendMessage } = useChatWebSocket(id)

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFrame = useCallback(
    (frame: NonNullable<typeof lastFrame>) => {
      if (frame.type === 'message' && frame.content) {
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
        setMessages((prev) =>
          prev.map((m) => (m.is_streaming ? { ...m, is_streaming: false } : m)),
        )
      }
      if (frame.type === 'title_updated' && frame.content) {
        setTitle(frame.content)
      }
      if (frame.type === 'error') {
        setError(frame.message ?? frame.content ?? 'Something went wrong')
      }
    },
    [],
  )

  useEffect(() => {
    if (lastFrame) handleFrame(lastFrame)
  }, [lastFrame, handleFrame])

  function handleSend(text?: string) {
    const content = (text ?? input).trim()
    if (!content) return
    setError('')
    setInput('')
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        content,
        is_user: true,
        timestamp: new Date().toISOString(),
      },
    ])
    if (!sendMessage(content)) {
      setError('Could not send message. Check your connection.')
    }
  }

  return (
    <div className="user-app-content--no-nav" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <MomAppBar
        pageTitle={title}
        onBack={() => navigate(appPath('chat'))}
        actions={
          <span style={{ fontSize: '0.75rem', color: connected ? 'var(--success)' : 'var(--ink-subtle)' }}>
            ● {connected ? 'Connected' : 'Offline'}
          </span>
        }
      />

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
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`chat-bubble ${m.is_user ? 'chat-bubble--user' : 'chat-bubble--ai'}`}
            >
              {m.content}
              {m.is_streaming && <span className="u-muted"> …</span>}
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
          disabled={!input.trim() || !connected}
          aria-label="Send"
        >
          <IconSend />
        </button>
      </div>
    </div>
  )
}
