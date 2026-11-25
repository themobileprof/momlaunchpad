import { useEffect, useRef, useState } from 'react'
import type { WsFrame } from '../types'
import { getWsChatUrl } from '../api'

const REPLY_TIMEOUT_MS = 45_000

export function useChatWebSocket(conversationId?: string) {
  const [connected, setConnected] = useState(false)
  const [lastFrame, setLastFrame] = useState<WsFrame | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shouldReconnect = useRef(true)
  const conversationIdRef = useRef(conversationId)
  const pendingQueueRef = useRef<string[]>([])
  const awaitingReplyRef = useRef(false)
  const replyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onReplyTimeoutRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  useEffect(() => {
    shouldReconnect.current = true

    function flushQueue() {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      let flushed = false
      while (pendingQueueRef.current.length > 0) {
        const content = pendingQueueRef.current[0]
        try {
          ws.send(
            JSON.stringify({
              content,
              conversation_id: conversationIdRef.current,
            }),
          )
          pendingQueueRef.current.shift()
          flushed = true
        } catch {
          break
        }
      }
      if (flushed) {
        awaitingReplyRef.current = true
        if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current)
        replyTimeoutRef.current = setTimeout(() => {
          if (!awaitingReplyRef.current) return
          awaitingReplyRef.current = false
          pendingQueueRef.current = []
          onReplyTimeoutRef.current?.()
        }, REPLY_TIMEOUT_MS)
      }
    }

    function openSocket() {
      if (wsRef.current?.readyState === WebSocket.OPEN) return
      const ws = new WebSocket(getWsChatUrl(conversationId))
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        flushQueue()
      }
      ws.onerror = () => setConnected(false)
      ws.onmessage = (ev) => {
        try {
          const frame = JSON.parse(ev.data as string) as WsFrame
          if (frame.type === 'message' || frame.type === 'done' || frame.type === 'error') {
            awaitingReplyRef.current = false
            if (replyTimeoutRef.current) {
              clearTimeout(replyTimeoutRef.current)
              replyTimeoutRef.current = null
            }
          }
          setLastFrame(frame)
        } catch {
          /* ignore */
        }
      }
      ws.onclose = () => {
        setConnected(false)
        if (shouldReconnect.current) {
          reconnectRef.current = setTimeout(openSocket, 3000)
        }
      }
    }

    openSocket()

    return () => {
      shouldReconnect.current = false
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [conversationId])

  function armReplyTimeout() {
    awaitingReplyRef.current = true
    if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current)
    replyTimeoutRef.current = setTimeout(() => {
      if (!awaitingReplyRef.current) return
      awaitingReplyRef.current = false
      // Drop queued copies so a late reconnect doesn't double-send.
      pendingQueueRef.current = []
      onReplyTimeoutRef.current?.()
    }, REPLY_TIMEOUT_MS)
  }

  function sendMessage(content: string, opts?: { onReplyTimeout?: () => void }) {
    onReplyTimeoutRef.current = opts?.onReplyTimeout ?? null
    const payload = JSON.stringify({
      content,
      conversation_id: conversationIdRef.current,
    })

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(payload)
        armReplyTimeout()
        return true
      } catch {
        pendingQueueRef.current.push(content)
        return false
      }
    }

    pendingQueueRef.current.push(content)
    return false
  }

  return { connected, lastFrame, sendMessage }
}
