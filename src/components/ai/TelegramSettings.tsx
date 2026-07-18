"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Smartphone, CheckCircle2, XCircle, Loader2, Link2, Unlink,
  Copy, RefreshCw, Bot, KeyRound, Eye, EyeOff, Globe,
  ArrowUpRight, ShieldCheck, Clock, User, ChevronDown, ChevronUp,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface TelegramStatus {
  isConnected: boolean
  telegramUsername?: string | null
  connectedAt?: string | null
  hasBotToken?: boolean
  botUsername?: string | null
}

export function TelegramSettings() {
  const [status, setStatus] = useState<TelegramStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [connectCode, setConnectCode] = useState<string | null>(null)
  const [codeLoading, setCodeLoading] = useState(false)

  const [botToken, setBotToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [savingBot, setSavingBot] = useState(false)
  const [botStatus, setBotStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [botMsg, setBotMsg] = useState('')
  const [savedBotUsername, setSavedBotUsername] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
  const [webhookSet, setWebhookSet] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const tokenInitialized = useRef(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/status")
      const data = await res.json()
      setStatus(data)
      setSavedBotUsername(data.botUsername || null)
      if (data.hasBotToken && !tokenInitialized.current) {
        tokenInitialized.current = true
        setBotToken('••••••••••••••••')
      }
      return data
    } catch {
      setStatus({ isConnected: false })
      return { isConnected: false }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCode = useCallback(async () => {
    setCodeLoading(true)
    try {
      const res = await fetch("/api/telegram/code")
      const data = await res.json()
      if (res.ok) setConnectCode(data.code)
    } catch {
      // silent
    } finally {
      setCodeLoading(false)
    }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  useEffect(() => {
    if (status?.isConnected || !status) return
    const interval = setInterval(async () => {
      if (document.hidden) return
      const s = await fetchStatus()
      if (s?.isConnected) clearInterval(interval)
    }, 4000)
    return () => clearInterval(interval)
  }, [fetchStatus, status?.isConnected, status])

  useEffect(() => {
    if (!loading && !status?.isConnected && !connectCode) {
      fetchCode()
    }
  }, [loading, status?.isConnected, connectCode, fetchCode])

  const handleSaveBot = async () => {
    if (!botToken.trim()) {
      toast.error('Enter your Telegram bot token')
      return
    }
    setSavingBot(true)
    setBotStatus('testing')
    setBotMsg('')
    try {
      const res = await fetch('/api/telegram/save-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: botToken.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setBotStatus('success')
        setBotMsg(`@${data.botUsername} — ${data.message}`)
        setSavedBotUsername(data.botUsername)
        setWebhookUrl(data.webhookUrl || null)
        setWebhookSet(data.webhookSet || false)
        if (data.webhookSet) {
          toast.success('Bot configured and webhook registered!')
        } else {
          toast.success('Bot saved! Set up ngrok to activate webhook.')
        }
        fetchStatus()
      } else {
        setBotStatus('error')
        setBotMsg(data.error || 'Failed to configure bot')
      }
    } catch {
      setBotStatus('error')
      setBotMsg('Failed to connect. Check the token and try again.')
    } finally {
      setSavingBot(false)
    }
  }

  const handleDisconnect = async () => {
    setActionLoading(true)
    try {
      const res = await fetch("/api/telegram/disconnect", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Telegram disconnected")
      fetchStatus()
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect")
    } finally {
      setActionLoading(false)
    }
  }

  const botUsername = savedBotUsername || status?.botUsername

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground/60">Loading Telegram settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-xl pb-4">
      {/* Connection Status Card */}
      <div className={cn(
        "rounded-xl border p-4 transition-all duration-300",
        status?.isConnected
          ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-emerald-500/[0.02]"
          : "border-border/60 bg-card/30"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
            status?.isConnected ? "bg-emerald-500/10" : "bg-muted/60"
          )}>
            <Smartphone className={cn("size-5", status?.isConnected ? "text-emerald-500" : "text-muted-foreground")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Telegram</p>
              {status?.isConnected ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="size-2.5" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Disconnected
                </span>
              )}
            </div>
            {status?.isConnected && status?.telegramUsername ? (
              <p className="text-xs text-emerald-500/80 mt-0.5">Connected as @{status.telegramUsername}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">Connect your Telegram account to manage projects on the go</p>
            )}
          </div>
          {status?.isConnected && (
            <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={actionLoading} className="gap-1.5 shrink-0 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive px-2 sm:px-2.5">
              {actionLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Unlink className="size-3.5" />}
              <span className="hidden sm:inline">Disconnect</span>
            </Button>
          )}
        </div>
      </div>

      {/* Bot Configuration */}
      <div className="rounded-xl border border-border/60 bg-card/30 p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="flex size-6 items-center justify-center rounded-lg bg-muted/60">
            <Bot className="size-3.5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider">Bot Configuration</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Create a bot on <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-0.5 hover:text-primary/80">@BotFather <ArrowUpRight className="size-2.5" /></a>
            , paste the token below, and save to activate.
          </p>

          <div className={cn(
            "flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 transition-colors",
            "focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20",
            botStatus === 'success' && "border-emerald-500/40",
            botStatus === 'error' && "border-destructive/40"
          )}>
            <KeyRound className="size-4 shrink-0 text-muted-foreground" />
            <input
              type={showToken ? "text" : "password"}
              value={botToken}
              onChange={(e) => { setBotToken(e.target.value); setBotStatus('idle') }}
              onFocus={() => { if (botToken === '••••••••••••••••') { setBotToken(''); setShowToken(true) } }}
              placeholder="Enter bot token from @BotFather..."
              className="flex-1 h-8 border-0 bg-transparent px-0.5 text-sm shadow-none focus-visible:outline-none placeholder:text-muted-foreground/40"
            />
            <button type="button" onClick={() => setShowToken(!showToken)} className="p-1 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
              {showToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleSaveBot}
              disabled={savingBot || !botToken.trim()}
              className="gap-1.5 h-8 text-xs"
            >
              {savingBot ? <Loader2 className="size-3.5 animate-spin" /> : <Globe className="size-3.5" />}
              {savingBot ? 'Configuring...' : 'Save & Activate'}
            </Button>
            {botStatus === 'success' && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="size-3.5" /> {botMsg}
              </span>
            )}
            {botStatus === 'error' && (
              <span className="inline-flex items-center gap-1 text-xs text-destructive">
                <XCircle className="size-3.5" /> {botMsg}
              </span>
            )}
          </div>

          {botUsername && webhookSet && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 px-3 py-2.5 border border-emerald-500/10">
              <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
              <div className="text-xs">
                <span className="font-medium text-emerald-600 dark:text-emerald-400">@{botUsername}</span>
                <span className="text-muted-foreground ml-1">— Webhook active, ready for connections</span>
              </div>
            </div>
          )}

          {botUsername && !webhookSet && process.env.NODE_ENV !== 'production' && (
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2.5 space-y-2">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs font-medium text-amber-600 w-full"
              >
                <XCircle className="size-3.5 shrink-0" />
                <span>Local mode — set up ngrok to receive live messages</span>
                {showAdvanced ? <ChevronUp className="size-3 ml-auto" /> : <ChevronDown className="size-3 ml-auto" />}
              </button>
              {showAdvanced && (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>In development, the bot is saved but needs a public HTTPS URL to receive Telegram updates.</p>
                  <div className="space-y-1.5">
                    <p className="font-medium text-foreground/70">1. Start ngrok:</p>
                    <pre className="text-[11px] bg-background/80 rounded px-2.5 py-1.5 font-mono select-all border border-border/30">ngrok http 3000</pre>
                    <p className="font-medium text-foreground/70 mt-2">2. Copy the HTTPS URL and add to <code className="text-[11px] bg-background/80 px-1 rounded font-mono border border-border/30">.env.local</code>:</p>
                    <pre className="text-[11px] bg-background/80 rounded px-2.5 py-1.5 font-mono select-all break-all border border-border/30">TELEGRAM_WEBHOOK_URL=https://abc123.ngrok-free.app/api/telegram/webhook</pre>
                    <p className="font-medium text-foreground/70 mt-2">3. Restart server and click <strong>Save & Activate</strong> again.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Connect Section (only if bot is configured but not connected) */}
      {botUsername && !status?.isConnected && (
        <>
          <div className="rounded-xl border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.03] to-emerald-500/[0.01] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
                <Link2 className="size-3.5 text-emerald-500" />
              </div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Connect Your Account</p>
            </div>

            <div className="flex items-center justify-center py-2">
              {codeLoading ? (
                <Loader2 className="size-6 sm:size-8 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-center w-full min-w-0">
                  <p className="text-xs text-muted-foreground mb-2">Send this code to the bot:</p>
                  <span className="inline-block text-lg sm:text-2xl lg:text-3xl font-mono font-bold tracking-[0.15em] sm:tracking-[0.25em] select-all px-4 sm:px-6 py-2 rounded-lg bg-background border border-emerald-500/20 shadow-sm truncate max-w-full">
                    {connectCode}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { if (connectCode) { navigator.clipboard.writeText(connectCode); toast.success("Code copied!") } }} disabled={!connectCode} className="gap-1.5">
                <Copy className="size-3.5" />
                Copy Code
              </Button>
              <Button variant="outline" size="sm" onClick={async () => { setCodeLoading(true); try { const res = await fetch("/api/telegram/code", { method: "POST" }); const data = await res.json(); if (res.ok) { setConnectCode(data.code); toast.success("New code generated") } } catch { toast.error("Failed to regenerate code") } finally { setCodeLoading(false) } }} disabled={codeLoading} className="gap-1.5">
                <RefreshCw className={cn("size-3.5", codeLoading && "animate-spin")} />
                Regenerate
              </Button>
            </div>

            <div className="rounded-lg bg-background/80 border border-border/30 p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
              <p className="text-[11px] sm:text-xs font-medium text-foreground/70 flex items-center gap-1.5">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</span>
                Open the bot
                <a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-0.5">
                  @{botUsername} <ArrowUpRight className="size-2.5" />
                </a>
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground ml-7">Click above or search <strong>@{botUsername}</strong> in Telegram</p>
              <p className="text-[11px] sm:text-xs font-medium text-foreground/70 flex items-center gap-1.5">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
                Send <strong className="font-mono text-primary">/start</strong>
              </p>
              <p className="text-[11px] sm:text-xs font-medium text-foreground/70 flex items-center gap-1.5">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">3</span>
                Send the code: <strong className="font-mono text-primary break-all">{connectCode}</strong>
              </p>
            </div>
          </div>
        </>
      )}

      {/* Connection Info (when connected) */}
      {status?.isConnected && (
        <div className="rounded-xl border border-border/60 bg-card/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex size-6 items-center justify-center rounded-lg bg-muted/60">
              <ShieldCheck className="size-3.5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider">Connection Details</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="rounded-lg bg-muted/30 p-2.5">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Telegram User</p>
              <div className="flex items-center gap-1.5">
                <User className="size-3 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">@{status.telegramUsername || "—"}</span>
              </div>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Connected Since</p>
              <div className="flex items-center gap-1.5">
                <Clock className="size-3 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium">{status.connectedAt ? new Date(status.connectedAt).toLocaleDateString() : "—"}</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-gradient-to-r from-primary/5 to-primary/[0.02] border border-primary/10 p-3">
            <p className="text-xs text-muted-foreground">
              <strong className="text-primary">Tip:</strong> Send messages to <strong>@{botUsername}</strong> to manage projects on the go.
              Try "Show my projects" or "Create a project called Nano ERP".
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
