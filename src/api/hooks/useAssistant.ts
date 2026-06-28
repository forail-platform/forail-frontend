import { useState, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AssistantHealth {
  status: string
  version: string
  ollama: boolean
  chromadb: boolean
  model: string
}

const ASSISTANT_BASE = '/assistant/api/v1'

export function useAssistantHealth() {
  return useQuery<AssistantHealth>({
    queryKey: ['assistant_health'],
    queryFn: async () => {
      const resp = await fetch(`${ASSISTANT_BASE}/health`)
      if (!resp.ok) throw new Error('Assistant unavailable')
      return resp.json()
    },
    retry: 3,
    retryDelay: 5000,
    refetchInterval: 30000,
    staleTime: 15000,
  })
}

export function useAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (text: string, pageContext?: string) => {
    // Ignore a new send while one is already in flight: it would orphan the
    // previous AbortController and let two readers race on the same slot.
    if (abortRef.current) return

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setIsStreaming(true)

    // Add empty assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    const controller = new AbortController()
    abortRef.current = controller

    let botContent = ''
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))

      const resp = await fetch(`${ASSISTANT_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: pageContext ? { page: pageContext } : undefined,
          history,
        }),
        signal: controller.signal,
      })

      if (!resp.ok || !resp.body) {
        throw new Error('Chat request failed')
      }

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.token) {
                botContent += data.token
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: botContent }
                  return updated
                })
              }
              if (data.error) {
                botContent += `\n\n*Error: ${data.error}*`
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: botContent }
                  return updated
                })
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        // Append the failure note rather than discarding everything already streamed.
        const note = '*Unable to reach the assistant. Please try again later.*'
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: botContent ? `${botContent}\n\n${note}` : note,
          }
          return updated
        })
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [messages])

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clear = useCallback(() => {
    setMessages([])
  }, [])

  return { messages, sendMessage, isStreaming, stop, clear }
}
