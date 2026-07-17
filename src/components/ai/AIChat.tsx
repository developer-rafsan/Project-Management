"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, Send, User, Loader2, Trash2, Sparkles, Cpu, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export function AIChat() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [settings, setSettings] = useState<{ provider: string; model: string } | null>(null)
  const [tokenUsed, setTokenUsed] = useState(0)
  const [tokenLimit, setTokenLimit] = useState(7000000)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/ai/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings({ provider: data.provider || "openai", model: data.model })
        setTokenUsed(data.totalTokensUsed || 0)
        setTokenLimit(data.totalTokensLimit || 7000000)
        setMessages([{ role: "assistant", text: `Hi! I'm your AI assistant. Ask me anything about your projects.` }])
      })
      .catch(() => {
        setMessages([{ role: "assistant", text: "Hi! I'm your AI assistant. Ask me anything about your projects." }])
      })
      .finally(() => setSettingsLoading(false))
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: "user", text: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

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
    } catch (err: any) {
      toast.error(err.message || "Failed to get response")
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I encountered an error. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    toast.success("Conversation cleared")
  }

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
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
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/15">
                  <Cpu className="size-2.5" />
                  {MODEL_LABELS[settings.provider] || settings.provider} · {settings.model}
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
                  <span className="hidden xs:inline">{formatNumber(tokenUsed)} / </span>
                  {formatNumber(tokenLimit)} <span className="hidden xs:inline">tokens</span>
                </span>
              )}
            </div>
          </div>
        </div>
        {messages.length > 1 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={handleClear}
            className="gap-1.5 text-muted-foreground/50 hover:text-destructive h-7 px-2 rounded-lg shrink-0"
          >
            <Trash2 className="size-3.5" /> <span className="hidden sm:inline">Clear</span>
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-0.5 mb-3 sm:mb-4 scrollbar-thin">
        {messages.length === 1 && !loading && (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center px-2">
            <div className="relative mb-3 sm:mb-4">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
              <div className="relative flex size-12 sm:size-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10">
                <Sparkles className="size-5 sm:size-7 text-primary" />
              </div>
            </div>
            <p className="text-sm font-medium text-foreground/80 mb-1">How can I help you today?</p>
            <p className="text-xs text-muted-foreground/60 max-w-[260px] sm:max-w-xs">
              Ask me to create projects, update status, assign developers, or get summaries.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2 sm:gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
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
          <div className="flex gap-2 sm:gap-3">
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
        <div className="flex flex-wrap gap-2 mb-3 sm:mb-4 shrink-0">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border hover:bg-card transition-all duration-200 cursor-pointer shadow-xs"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="relative shrink-0">
        <div className="flex items-center gap-2 rounded-xl sm:rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 shadow-xs transition-all duration-200 focus-within:border-primary/40 focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary/20">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about projects, tasks, team..."
            className="flex-1 h-8 sm:h-9 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/40 text-sm"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="size-8 sm:size-9 shrink-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm transition-all duration-200 disabled:opacity-40"
          >
            <Send className="size-3.5 sm:size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
