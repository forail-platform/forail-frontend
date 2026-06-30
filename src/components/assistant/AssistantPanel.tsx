import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageCircle, X, Send, Square, Minus, Maximize2, Minimize2, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAssistant, useAssistantHealth } from '@/api/hooks/useAssistant'

function MarkdownContent({ content }: { content: string }) {
  // Escape HTML first so model output (which may echo user/job data) can never
  // inject live markup — the regex transform below only ever adds tags we control.
  const html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="my-2 rounded bg-slate-100 dark:bg-slate-800 p-2 text-xs overflow-auto"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-xs">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')

  return <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
}

function formatTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ', ' + date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const WELCOME_MESSAGE = `Hi! I'm Forail Assistant, your AI helper!
I'm here to help you find everything you need. Just tell me what you're looking for and I'll do my best to assist you!
*Note: I'm an AI assistant, so I may occasionally make mistakes. Feel free to ask again if something isn't clear. Never share personal or sensitive information in the conversation.*`

export function AssistantPanel() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()

  useAssistantHealth() // warm the cache for health status
  const { messages, sendMessage, isStreaming, stop } = useAssistant()


  const handleSend = () => {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    sendMessage(text, location.pathname)
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus()
  }, [open, minimized])

  // Floating button
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
        title="Forail Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    )
  }

  const panelWidth = expanded ? 'w-[600px]' : 'w-[380px]'
  const panelHeight = expanded ? 'h-[700px]' : 'h-[520px]'

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col ${panelWidth} ${minimized ? 'h-auto' : panelHeight} rounded-xl border border-border/50 bg-background shadow-2xl transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-xl border-b bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
            <MessageCircle className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold">Forail Assistant</span>
          <button
            onClick={() => {}}
            className="text-muted-foreground hover:text-foreground"
            title="Info"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setMinimized(!minimized)}
            title={minimized ? 'Expand' : 'Minimize'}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Smaller' : 'Larger'}
          >
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => { setOpen(false); setMinimized(false) }}
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Welcome message (always shown) */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center">
                <div className="mb-4 text-center text-sm font-semibold text-foreground">
                  Forail Assistant
                </div>
                <div className="flex items-end gap-2 w-full">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <MessageCircle className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="rounded-xl rounded-bl-sm bg-muted px-4 py-3">
                      <MarkdownContent content={WELCOME_MESSAGE} />
                    </div>
                    <div className="mt-1 flex items-center justify-between px-1">
                      <span className="text-[10px] text-muted-foreground">Forail Assistant</span>
                      <span className="text-[10px] text-muted-foreground">{formatTime(new Date())}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <MessageCircle className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === 'user' ? '' : ''}`}>
                  <div className={`rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm bg-muted'
                  }`}>
                    {msg.role === 'assistant' ? (
                      msg.content ? (
                        <MarkdownContent content={msg.content} />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      )
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                  <div className={`mt-1 flex px-1 ${msg.role === 'user' ? 'justify-end' : 'justify-between'}`}>
                    <span className="text-[10px] text-muted-foreground">
                      {msg.role === 'user' ? 'You' : 'Forail Assistant'}
                    </span>
                    {msg.role === 'assistant' && (
                      <span className="text-[10px] text-muted-foreground">{formatTime(new Date())}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t px-4 py-3">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend() }}
              className="relative"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isStreaming}
                className="w-full rounded-full border border-border bg-muted/30 py-2.5 pl-4 pr-12 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stop}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90"
                  title="Stop"
                >
                  <Square className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30"
                  title="Send"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
            </form>
            <div className="mt-2 text-center text-[10px] text-muted-foreground">
              Powered by Forail Platform
            </div>
          </div>
        </>
      )}
    </div>
  )
}
