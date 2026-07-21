"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Bot, Send, User, Loader2, Trash2, Sparkles, Coins, History, Plus, ChevronLeft, Clock, Copy, CheckCircle2, MessageSquare, ChevronDown, PanelLeftClose, PanelLeft, FolderKanban, FilePlus, BarChart3, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const SUGGESTIONS = [
  { icon: FolderKanban, text: "Show me all my projects" },
  { icon: FilePlus, text: "Create a project called Nano ERP" },
  { icon: BarChart3, text: "Give me a project summary" },
  { icon: PieChart, text: "Show project status breakdown" },
]

const MODEL_OPTIONS = [
  { value: "google/gemma-4-31b-it:free", label: "google/gemma-4-31b-it:free" },
  { value: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "nvidia/nemotron-3-ultra-550b-a55b:free" },
  { value: "tencent/hy3:free", label: "tencent/hy3:free" },
  { value: "openai/gpt-oss-20b:free", label: "openai/gpt-oss-20b:free" },
]

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString()
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-[3px] ml-1">
      <span className="size-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="size-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="size-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  )
}

export function AIChat() {
  const [messages, setMessages] = useState<{ role: string; text: string; time?: Date }[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [settings, setSettings] = useState<{ provider: string; model: string } | null>(null)
  const [tokenUsed, setTokenUsed] = useState(0)
  const [tokenLimit, setTokenLimit] = useState(7000000)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [modelOpen, setModelOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sessionsFetchedRef = useRef(false)
  const modelRef = useRef<HTMLDivElement>(null)

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
        time: new Date(),
      }))
      setMessages(msgs.length ? msgs : [{ role: "assistant", text: "Hi! I'm your AI assistant.", time: new Date() }])
      setSessionId(sid)
    } catch {
      toast.error("Failed to load conversation")
    }
  }, [])

  const newChat = () => {
    setSessionId(null)
    setMessages([{ role: "assistant", text: "Hi! I'm your AI assistant.", time: new Date() }])
    setSidebarOpen(false)
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
          time: new Date(),
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelOpen(false)
      }
    }
    if (modelOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [modelOpen])

  const autoResize = () => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
  }

  const saveModel = async (model: string) => {
    setSettings((prev) => prev ? { ...prev, model } : null)
    setModelOpen(false)
    try {
      await fetch("/api/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      })
    } catch {}
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: "user" as const, text: input.trim(), time: new Date() }
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
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply, time: new Date() }])
      if (sessionsFetchedRef.current) {
        sessionsFetchedRef.current = false
        fetchSessions()
      }
    } catch (err: any) {
      const errMsg = err.message || "Failed to get response"
      toast.error(errMsg)
      setMessages((prev) => [...prev, { role: "assistant", text: `Error: ${errMsg}`, time: new Date() }])
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
    setMessages([{ role: "assistant", text: "Hi! I'm your AI assistant.", time: new Date() }])
    fetchSessions()
    toast.success("Conversation cleared")
  }

  const handleClearAll = async () => {
    if (!confirm("Clear all conversations? This cannot be undone.")) return
    try {
      await fetch("/api/ai/history", { method: "DELETE" })
    } catch {}
    setSessionId(null)
    setMessages([{ role: "assistant", text: "Hi! I'm your AI assistant.", time: new Date() }])
    setSessions([])
    toast.success("All conversations cleared")
  }

  const copyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const currentModel = settings?.model || "google/gemma-4-31b-it:free"
  const currentModelLabel = MODEL_OPTIONS.find((m) => m.value === currentModel)?.label || currentModel

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/15 rounded-full blur-2xl animate-pulse" />
            <Loader2 className="size-7 animate-spin text-primary relative" />
          </div>
          <p className="text-sm text-muted-foreground/60 font-medium">Loading chat...</p>
        </div>
      </div>
    )
  }

  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 sm:py-5 space-y-3 sm:space-y-4 hide-scrollbar">
      {messages.length === 1 && !loading && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100%-2rem)] text-center px-4 animate-fade-in-up">
          <div className="relative mb-5 sm:mb-7">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-violet-500 to-emerald-500 opacity-10 rounded-full blur-[80px]" />
            <div className="relative flex size-16 sm:size-28 items-center justify-center rounded-full bg-gradient-to-br from-primary/[0.08] via-violet-500/[0.04] to-emerald-500/[0.06] border border-primary/[0.08] shadow-inner">
              <Sparkles className="size-7 sm:size-11 text-primary" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-semibold bg-gradient-to-r from-foreground via-foreground/90 to-primary/70 bg-clip-text text-transparent mb-2 sm:mb-3">
            How can I help you today?
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground/60 max-w-[280px] sm:max-w-sm mb-5 sm:mb-7 leading-relaxed">
            Ask me to create projects, update status, assign developers, or get summaries.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xs sm:max-w-md">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => { setInput(s.text); inputRef.current?.focus() }}
                className="flex items-center gap-2.5 rounded-xl border border-border/30 bg-card/50 hover:bg-card/80 px-4 py-2.5 sm:py-3 text-xs sm:text-[13px] text-left text-muted-foreground hover:text-foreground hover:border-primary/30 hover:shadow-sm hover:shadow-primary/5 transition-all cursor-pointer group"
              >
                <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/[0.08] to-violet-500/[0.06] border border-primary/[0.06] group-hover:border-primary/[0.15] group-hover:from-primary/[0.12] transition-all">
                  <s.icon className="size-3.5 sm:size-4 text-primary/70 group-hover:text-primary transition-colors" />
                </div>
                <span className="font-medium leading-snug">{s.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-2 sm:gap-3 animate-fade-in-up group",
            msg.role === "user" ? "justify-end" : "justify-start"
          )}
          style={{ animationDelay: `${i * 30}ms` }}
        >
          {msg.role === "assistant" && (
            <div className="hidden sm:flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/[0.12] to-violet-500/[0.08] border border-primary/[0.08] mt-1 shadow-sm">
              <Bot className="size-4 text-primary" />
            </div>
          )}
          <div className={cn(
            "max-w-[88%] sm:max-w-[75%] lg:max-w-[68%] rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm whitespace-pre-wrap leading-relaxed break-words relative shadow-sm",
            msg.role === "user"
              ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground rounded-tr-md shadow-primary/20"
              : "bg-card border border-border/20 text-foreground rounded-tl-md shadow-sm"
          )}>
            <div className="text-[13px] sm:text-sm leading-relaxed">{msg.text}</div>
            <div className={cn(
              "flex items-center gap-2 mt-1.5 sm:mt-2",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}>
              <span className={cn(
                "text-[10px]",
                msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground/40"
              )}>
                {formatTime(msg.time || new Date())}
              </span>
              <button
                onClick={() => copyMessage(msg.text, i)}
                className={cn(
                  "text-[10px] transition-all flex items-center gap-1 px-1.5 py-0.5 rounded-md sm:opacity-0 sm:group-hover:opacity-100",
                  copiedIndex === i
                    ? "text-emerald-500 bg-emerald-500/10"
                    : msg.role === "user"
                      ? "text-primary-foreground/40 hover:text-primary-foreground/70 hover:bg-primary-foreground/10"
                      : "text-muted-foreground/35 hover:text-muted-foreground/70 hover:bg-muted/50"
                )}
              >
                {copiedIndex === i ? <CheckCircle2 className="size-2.5 sm:size-3" /> : <Copy className="size-2.5 sm:size-3" />}
                <span className="hidden sm:inline">{copiedIndex === i ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
          {msg.role === "user" && (
            <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/60 border border-border/20 mt-1 shadow-sm">
              <User className="size-3.5 sm:size-4.5 text-muted-foreground" />
            </div>
          )}
        </div>
      ))}

      {loading && (
        <div className="flex gap-2 sm:gap-3 animate-fade-in-up">
          <div className="hidden sm:flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/[0.12] to-violet-500/[0.08] border border-primary/[0.08] mt-1">
            <Bot className="size-4 text-primary" />
          </div>
          <div className="max-w-[88%] sm:max-w-[75%] rounded-2xl rounded-tl-md px-4 py-3 bg-card border border-border/20 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span className="text-xs sm:text-[13px] text-muted-foreground font-medium">Thinking<TypingDots /></span>
            </div>
          </div>
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  )

  const renderInput = () => (
    <div className="shrink-0 px-3 sm:px-5 pb-3 sm:pb-4 pt-2 sm:pt-3 border-t border-border/10">
      <div className="flex items-center gap-2 rounded-2xl border border-border/20 bg-card/95 backdrop-blur-xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm transition-all duration-200 focus-within:border-primary/30 focus-within:shadow-md focus-within:shadow-primary/5 hover:border-border/40">
        <div className="relative shrink-0" ref={modelRef}>
          <button
            onClick={() => setModelOpen(!modelOpen)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-medium transition-all border",
              modelOpen
                ? "text-primary bg-primary/5 border-primary/20"
                : "text-muted-foreground/60 hover:text-foreground border-transparent hover:bg-muted/50 hover:border-border/30"
            )}
          >
            <Bot className="size-3 sm:size-3.5 shrink-0" />
            <span className="hidden sm:inline max-w-[80px] truncate">{currentModelLabel}</span>
            <ChevronDown className={cn("size-2.5 sm:size-3 shrink-0 transition-transform duration-200", modelOpen && "rotate-180")} />
          </button>
          {modelOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-44 sm:w-52 rounded-xl border border-border/20 bg-popover shadow-xl backdrop-blur-2xl p-1.5 z-30 animate-fade-in-up origin-bottom-left">
              <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider px-2.5 py-1.5">Models</p>
              {MODEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => saveModel(opt.value)}
                  className={cn(
                    "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-xs text-left transition-all",
                    currentModel === opt.value
                      ? "bg-primary/8 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <span className={cn("size-1.5 rounded-full shrink-0 ring-1 ring-offset-1 ring-offset-transparent", currentModel === opt.value ? "bg-primary ring-primary/30" : "bg-muted-foreground/20 ring-transparent")} />
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize() }}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            aria-label="Chat message input"
            className="flex-1 resize-none h-9 sm:h-10 max-h-36 border-0 bg-transparent px-1 py-2 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/35 text-[13px] sm:text-sm outline-none"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="size-8 sm:size-10 shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/35 transition-all duration-200 disabled:opacity-30 disabled:shadow-none disabled:hover:from-violet-500 disabled:hover:to-fuchsia-600"
          >
            <Send className="size-3.5 sm:size-4.5" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-full relative overflow-hidden rounded-2xl">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/15 backdrop-blur-sm z-10 sm:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "flex flex-col shrink-0 border-r border-border/10 bg-gradient-to-b from-card/60 to-card/5 overflow-hidden transition-all duration-300 ease-out z-20",
        "absolute sm:relative inset-y-0 left-0 sm:bg-transparent",
        "shadow-2xl sm:shadow-sm",
        sidebarOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full sm:w-0 sm:overflow-hidden sm:border-r-0"
      )}>
        <div className="flex items-center justify-between px-4 py-3.5 shrink-0 border-b border-border/10">
          <span className="text-xs font-semibold flex items-center gap-2 text-muted-foreground/80">
            <History className="size-3.5" /> History
          </span>
          <div className="flex items-center gap-1">
            {sessions.length > 0 && (
              <button onClick={handleClearAll} className="size-7 flex items-center justify-center rounded-lg text-muted-foreground/25 hover:text-destructive hover:bg-destructive/5 transition-colors" title="Clear all">
                <Trash2 className="size-3" />
              </button>
            )}
            <button onClick={() => setSidebarOpen(false)} className="size-7 flex items-center justify-center rounded-lg sm:hidden text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-colors">
              <ChevronLeft className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="p-2.5">
          <button
            onClick={newChat}
            className={cn(
              "flex items-center gap-2 w-full rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all text-left border",
              !sessionId
                ? "bg-primary/8 text-primary border-primary/20 shadow-sm"
                : "text-muted-foreground/60 border-transparent hover:bg-muted/50 hover:text-foreground hover:border-border/20"
            )}
          >
            <Plus className="size-3.5" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 pb-2.5 space-y-0.5 hide-scrollbar">
          {sessionsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-4 animate-spin text-muted-foreground/40" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="size-7 mx-auto text-muted-foreground/15 mb-2.5" />
              <p className="text-xs text-muted-foreground/35">No conversations yet</p>
            </div>
          ) : (
            sessions.map((s) => {
              const title = getSessionTitle(s)
              const date = new Date(s.updatedAt || s.createdAt)
              const isToday = new Date().toDateString() === date.toDateString()
              return (
                <button
                  key={s.sessionId}
                  onClick={() => { loadSession(s.sessionId); setSidebarOpen(false) }}
                  className={cn(
                    "flex flex-col gap-1 w-full rounded-xl px-3.5 py-2.5 text-xs transition-all text-left group",
                    s.sessionId === sessionId
                      ? "bg-primary/5 text-primary ring-1 ring-primary/15"
                      : "text-muted-foreground/70 hover:bg-muted/30 hover:text-foreground"
                  )}
                >
                  <span className="truncate font-medium leading-snug">{title}</span>
                  <span className="text-[10px] text-muted-foreground/35 flex items-center gap-1.5">
                    <Clock className="size-2.5 shrink-0" />
                    {isToday ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString()}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-background via-background to-card/20 rounded-2xl sm:rounded-none">
        <header className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 sm:py-3 shrink-0 border-b border-border/10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => setSidebarOpen((p) => !p)} className="sm:hidden p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors">
              <PanelLeft className="size-4" />
            </button>
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-primary/15 rounded-full blur-md" />
                <div className="relative flex size-7 sm:size-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-sm">
                  <Bot className="size-3.5 sm:size-4 text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold">AI Chat</h2>
                  {settings && (
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-md px-1.5 sm:px-2 py-0.5 text-[10px] font-medium border",
                      tokenUsed >= tokenLimit
                        ? "bg-destructive/8 text-destructive border-destructive/15"
                        : "bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/15"
                    )}>
                      <Coins className="size-2.5" />
                      <span className="hidden xs:inline">{formatNumber(tokenUsed)}/{formatNumber(tokenLimit)}</span>
                      <span className="xs:hidden">{formatNumber(tokenUsed)}</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground/45 mt-0.5">Ask anything about your projects</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              className="hidden sm:flex size-7 items-center justify-center rounded-lg text-muted-foreground/35 hover:text-foreground hover:bg-muted/50 transition-colors"
              title={sidebarOpen ? "Close history" : "Open history"}
            >
              {sidebarOpen ? <PanelLeft className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
            </button>
            {messages.length > 1 && (
              <button
                onClick={handleClear}
                className="size-7 flex items-center justify-center rounded-lg text-muted-foreground/25 hover:text-destructive hover:bg-destructive/5 transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </header>

        {renderMessages()}
        {renderInput()}
      </div>
    </div>
  )
}
