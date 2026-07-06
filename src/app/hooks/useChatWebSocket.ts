import { useEffect, useRef, useState } from 'react'
import type { WsFrame } from '../types'
import { getWsChatUrl } from '../api'

export function useChatWebSocket(conversationId?: string) {
  const [connected, setConnected] = useState(false)
  const [lastFrame, setLastFrame] = useState<WsFrame | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shouldReconnect = useRef(true)

  useEffect(() => {
    shouldReconnect.current = true

    function openSocket() {
      if (wsRef.current?.readyState === WebSocket.OPEN) return
      const ws = new WebSocket(getWsChatUrl(conversationId))
      wsRef.current = ws

      ws.onopen = () => setConnected(true)
      ws.onerror = () => setConnected(false)
      ws.onmessage = (ev) => {
        try {
          setLastFrame(JSON.parse(ev.data as string) as WsFrame)
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
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [conversationId])

  function sendMessage(content: string) {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return false
    wsRef.current.send(JSON.stringify({ content }))
    return true
  }

  return { connected, lastFrame, sendMessage }
}
