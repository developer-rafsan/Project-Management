"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Bot, Send, User, Loader2, Trash2, Sparkles, Cpu, Coins, History, Plus, ChevronLeft, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const SUGGESTIONS = [
  "Show me all my projects",
  "Create a project called Nano ERP",
  "Give me a project summary",
  "Show project status breakdown",
]

const MODEL_LABELS: Record<string, string> = {
  openrouter: "OpenRouter",
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString()
}

interface Session {
  _id: string
  sessionId: string
  messages: { role: string; content: string }[]
  updatedAt: string
  createdAt: string
}

function getSessionTitle(s: Session): string {
  const first = s.messages?.find(m => m.role === 'user')?.content
  if (!first) return "Chat"
  return first.length > 36 ? first.slice(0, 36) + "…" : first
}

export function AIChat() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [settings, setSettings] = useState<{ provider: string; model: string } | null>(null)
  const [tokenUsed, setTokenUsed] = useState(0)
  const [tokenLimit, setTokenLimit] = useState(7000000)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsOpen, setSessionsOpen] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sessionsFetchedRef = useRef(false)

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const res = await fetch("/api/ai/history?limit=50")
      const data = await res.json()
      const list = data.conversations || []
      setSessions(list)
      return list
    } catch {
      return []
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  const loadSession = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/ai/history?sessionId=${sid}`)
      const data = await res.json()
      const msgs = (data.messages || []).filter((m: any) => m.role !== 'system').map((m: any) => ({
        role: m.role,
        text: m.content || '',
      }))
      setMessages(msgs.length ? msgs : [{ role: "assistant", text: "Hi! I'm your AI assistant. Ask me anything about your projects." }])
      setSessionId(sid)
    } catch {
      toast.error("Failed to load conversation")
    }
  }, [])

  const newChat = () => {
    setSessionId(null)
    setMessages([{ role: "assistant", text: "Hi! I'm your AI assistant. Ask me anything about your projects." }])
    setSessionsOpen(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    let cancelled = false

    fetch("/api/ai/settings")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setSettings({ provider: data.provider || "openai", model: data.model })
        setTokenUsed(data.totalTokensUsed || 0)
        setTokenLimit(data.totalTokensLimit || 7000000)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSettingsLoading(false)
      })

    const init = async () => {
      const list = await fetchSessions()
      if (cancelled || sessionsFetchedRef.current) return
      sessionsFetchedRef.current = true
      const latest = list[0]
      if (latest) {
        setSessionId(latest.sessionId)
        const msgRes = await fetch(`/api/ai/history?sessionId=${latest.sessionId}`)
        const msgData = await msgRes.json()
        const msgs = (msgData.messages || []).filter((m: any) => m.role !== 'system').map((m: any) => ({
          role: m.role,
          text: m.content || '',
        }))
        if (msgs.length) setMessages(msgs)
      }
    }
    init()

    return () => { cancelled = true }
  }, [fetchSessions])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const autoResize = () => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: "user", text: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
    }

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text, sessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error)

      setSessionId(data.sessionId)
      if (data.provider && data.model) {
        setSettings({ provider: data.provider, model: data.model })
      }
      if (data.usage?.totalTokens) {
        setTokenUsed((prev) => prev + data.usage.totalTokens)
      }
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }])
      if (sessionsFetchedRef.current) {
        sessionsFetchedRef.current = false
        fetchSessions()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to get response")
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I encountered an error. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = async () => {
    if (sessionId) {
      try {
        await fetch(`/api/ai/history?sessionId=${sessionId}`, { method: "DELETE" })
      } catch {}
    }
    setSessionId(null)
    setMessages([{ role: "assistant", text: "Hi! I'm your AI assistant. Ask me anything about your projects." }])
    fetchSessions()
    toast.success("Conversation cleared")
  }

  const handleClearAll = async () => {
    if (!confirm("Clear all conversations? This cannot be undone.")) return
    try {
      await fetch("/api/ai/history", { method: "DELETE" })
    } catch {}
    setSessionId(null)
    setMessages([{ role: "assistant", text: "Hi! I'm your AI assistant. Ask me anything about your projects." }])
    setSessions([])
    toast.success("All conversations cleared")
  }

  const toggleSessions = () => {
    const next = !sessionsOpen
    setSessionsOpen(next)
    if (next && !sessionsFetchedRef.current) {
      fetchSessions()
    }
  }

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex gap-0 sm:gap-3 h-full relative">
      {sessionsOpen && (
        <div className="fixed inset-0 bg-black/20 z-10 sm:hidden" onClick={() => setSessionsOpen(false)} />
      )}
      <div className={cn(
        "flex flex-col shrink-0 border-r sm:border-r-0 sm:border sm:bg-card/30 sm:rounded-xl overflow-hidden transition-all duration-300 ease-out z-20",
        "fixed sm:static inset-y-0 left-0 bg-background sm:bg-transparent",
        sessionsOpen ? "w-72 sm:w-56 translate-x-0" : "w-72 sm:w-56 -translate-x-full sm:translate-x-0 sm:w-0 sm:overflow-hidden"
      )}>
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground">History</span>
          <div className="flex items-center gap-0.5">
            {sessions.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleClearAll}
                className="size-6 p-0 text-muted-foreground/40 hover:text-destructive"
                title="Clear all history"
                aria-label="Clear all history"
              >
                <Trash2 className="size-3" />
              </Button>
            )}
            <Button variant="ghost" size="xs" onClick={() => setSessionsOpen(false)} className="size-6 p-0 sm:hidden" aria-label="Close history">
              <ChevronLeft className="size-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          <button
            onClick={newChat}
            className={cn(
              "flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-xs transition-colors text-left",
              !sessionId ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent"
            )}
            aria-label="Start new chat"
          >
            <Plus className="size-3.5" />
            New Chat
          </button>
          {sessionsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/40 text-center py-4">No conversations yet</p>
          ) : (
            sessions.map((s) => {
              const title = getSessionTitle(s)
              const date = new Date(s.updatedAt || s.createdAt).toLocaleDateString()
              return (
                <button
                  key={s.sessionId}
                  onClick={() => { loadSession(s.sessionId); setSessionsOpen(false) }}
                  className={cn(
                    "flex flex-col gap-0.5 w-full rounded-lg px-2.5 py-2 text-xs transition-colors text-left",
                    s.sessionId === sessionId ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <span className="truncate font-medium">{title}</span>
                  <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                    <Clock className="size-2.5 shrink-0" /> {date}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button onClick={toggleSessions} className="sm:hidden p-1 -ml-1 text-muted-foreground hover:text-foreground" aria-label="Toggle history">
              <History className="size-4" />
            </button>
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md" />
              <div className="relative flex size-8 sm:size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-sm">
                <Bot className="size-4 sm:size-4.5 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">AI Chat</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {settings && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/15">
                    <Cpu className="size-2.5" />
                    <span className="hidden xs:inline">{MODEL_LABELS[settings.provider] || settings.provider} · </span>
                    {settings.model}
                  </span>
                )}
                {tokenLimit > 0 && (
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
                    tokenUsed >= tokenLimit
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : "bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/15"
                  )}>
                    <Coins className="size-2.5" />
                    <span>{formatNumber(tokenUsed)}/</span>
                    {formatNumber(tokenLimit)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="xs"
              onClick={toggleSessions}
              className="hidden sm:flex gap-1.5 text-muted-foreground/50 hover:text-foreground h-7 px-2 rounded-lg shrink-0"
              aria-label={sessionsOpen ? "Close history" : "Open history"}
            >
              <History className="size-3.5" />
            </Button>
            {messages.length > 1 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleClear}
                className="gap-1.5 text-muted-foreground/50 hover:text-destructive h-7 px-2 rounded-lg shrink-0"
                aria-label="Clear current conversation"
              >
                <Trash2 className="size-3.5" /> <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-0.5 mb-3 sm:mb-4">
          {messages.length === 1 && !loading && (
            <div className="flex flex-col items-center justify-center py-6 sm:py-12 text-center px-2 animate-fade-in-up">
              <div className="relative mb-3 sm:mb-5">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
                <div className="relative flex size-12 sm:size-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10">
                  <Sparkles className="size-5 sm:size-7 text-primary" />
                </div>
              </div>
              <p className="text-sm font-medium text-foreground/80 mb-1">How can I help you today?</p>
              <p className="text-xs text-muted-foreground/60 max-w-[220px] sm:max-w-xs">
                Ask me to create projects, update status, assign developers, or get summaries.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2 sm:gap-3 animate-fade-in-up",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {msg.role === "assistant" && (
                <div className="hidden sm:flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 mt-1 shadow-xs">
                  <Bot className="size-4 text-primary" />
                </div>
              )}
              <div className={cn(
                "max-w-[88%] sm:max-w-[78%] lg:max-w-[70%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed shadow-xs break-words",
                msg.role === "user"
                  ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md"
                  : "bg-card border border-border/50 text-foreground rounded-bl-md"
              )}>
                {msg.text}
              </div>
              {msg.role === "user" && (
                <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/70 border border-border/50 mt-1 shadow-xs">
                  <User className="size-3.5 sm:size-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 sm:gap-3 animate-fade-in-up">
              <div className="hidden sm:flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 mt-1">
                <Bot className="size-4 text-primary" />
              </div>
              <div className="max-w-[88%] sm:max-w-[78%] rounded-2xl rounded-bl-md px-4 sm:px-5 py-3 sm:py-3.5 bg-card border border-border/50">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground animate-pulse">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {messages.length === 1 && !loading && (
          <div className="flex gap-2 mb-3 sm:mb-4 shrink-0 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); inputRef.current?.focus() }}
                className="snap-start shrink-0 rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border hover:bg-card transition-all duration-200 cursor-pointer shadow-xs whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="relative shrink-0">
          <div className="flex items-end gap-2 rounded-xl sm:rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 shadow-xs transition-all duration-200 focus-within:border-primary/40 focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary/20">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize() }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about projects, tasks, team... (Shift+Enter for new line)"
              rows={1}
              aria-label="Chat message input"
              className="flex-1 resize-none h-8 sm:h-9 max-h-40 border-0 bg-transparent px-1 py-1.5 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/40 text-sm outline-none"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="size-8 sm:size-9 shrink-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm transition-all duration-200 disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="size-3.5 sm:size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
