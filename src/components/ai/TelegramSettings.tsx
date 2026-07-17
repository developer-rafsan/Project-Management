"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Smartphone, CheckCircle, XCircle, Loader2, Link2, Unlink,
  Copy, RefreshCw, Bot, KeyRound, Eye, EyeOff, Globe,
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

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/status")
      const data = await res.json()
      setStatus(data)
      setSavedBotUsername(data.botUsername || null)
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

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-border/60 p-3 sm:p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="flex size-6 sm:size-7 items-center justify-center rounded-lg bg-muted/60">
            <Bot className="size-3.5 sm:size-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider">Your Bot</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Create a bot on <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary underline">@BotFather</a>,
          paste the token below, and save to activate.
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
            placeholder={status?.hasBotToken ? "Bot token saved" : "Enter bot token from @BotFather..."}
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
              <CheckCircle className="size-3.5" /> {botMsg}
            </span>
          )}
          {botStatus === 'error' && (
            <span className="inline-flex items-center gap-1 text-xs text-destructive">
              <XCircle className="size-3.5" /> {botMsg}
            </span>
          )}
        </div>
        {botUsername && webhookSet && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 px-3 py-2">
            <CheckCircle className="size-4 text-emerald-500 shrink-0" />
            <div className="text-xs">
              <span className="font-medium">@{botUsername}</span>
              <span className="text-muted-foreground ml-1">— Webhook active, ready for connections</span>
            </div>
          </div>
        )}

        {botUsername && !webhookSet && (
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2.5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
              <XCircle className="size-3.5" />
              Local mode — set up ngrok to receive live messages
            </div>
            <p className="text-xs text-muted-foreground">
              In development, the bot is saved but needs a public HTTPS URL to receive Telegram updates.
            </p>
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground/70">1. Start ngrok:</p>
              <pre className="text-[11px] bg-background/80 rounded px-2 py-1.5 font-mono select-all">ngrok http 3000</pre>
               <p className="text-xs font-medium text-foreground/70 mt-1">2. Copy the HTTPS URL and add to <code className="text-[11px] bg-background/80 px-1 rounded font-mono">.env.local</code>:</p>
              <pre className="text-[11px] bg-background/80 rounded px-2 py-1.5 font-mono select-all break-all">TELEGRAM_WEBHOOK_URL=https://abc123.ngrok-free.app/api/telegram/webhook</pre>
              <p className="text-xs font-medium text-foreground/70 mt-1">3. Restart server and click <strong>Save & Activate</strong> again. (Your user ID will be appended automatically.)</p>
            </div>
          </div>
        )}
      </div>

      {botUsername && (
        <>
          <div className="flex items-center gap-3 rounded-xl border border-border/60 p-3 sm:p-4">
            <div className={cn(
              "flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full",
              status?.isConnected ? "bg-emerald-500/10" : "bg-muted"
            )}>
              <Smartphone className={cn("size-4 sm:size-5", status?.isConnected ? "text-emerald-500" : "text-muted-foreground")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {status?.isConnected ? "Telegram Connected" : "Not Connected"}
              </p>
              {status?.isConnected && status?.telegramUsername && (
                <p className="text-xs text-muted-foreground truncate">@{status.telegramUsername}</p>
              )}
              {!status?.isConnected && (
                <p className="text-xs text-muted-foreground">Connect your Telegram account</p>
              )}
            </div>
            {status?.isConnected ? (
              <div className="flex items-center gap-2 shrink-0">
                <CheckCircle className="hidden sm:block size-5 text-emerald-500" />
                <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={actionLoading} className="gap-1.5">
                  {actionLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Unlink className="size-3.5" />}
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0" asChild>
                <a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer">
                  <Link2 className="size-3.5" />
                  Open Bot
                </a>
              </Button>
            )}
          </div>

          {!status?.isConnected && (
            <>
              <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-3 sm:p-4 space-y-3">
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Your Connect Code</p>
                <div className="flex items-center justify-center gap-3">
                  {codeLoading ? (
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-mono font-bold tracking-[0.2em] sm:tracking-[0.25em] select-all truncate max-w-full">
                      {connectCode}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { if (connectCode) { navigator.clipboard.writeText(connectCode); toast.success("Code copied!") } }} disabled={!connectCode} className="gap-1.5">
                    <Copy className="size-3.5" />
                    <span className="hidden sm:inline">Copy</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={async () => { setCodeLoading(true); try { const res = await fetch("/api/telegram/code", { method: "POST" }); const data = await res.json(); if (res.ok) { setConnectCode(data.code); toast.success("New code generated") } } catch { toast.error("Failed to regenerate code") } finally { setCodeLoading(false) } }} disabled={codeLoading} className="gap-1.5">
                    <RefreshCw className="size-3.5" />
                    <span className="hidden sm:inline">Regenerate</span>
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p><strong>How to connect:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click <strong>Open Bot</strong> above</li>
                  <li>Send <strong>/start</strong> to the bot</li>
                  <li>Send this code: <strong className="text-foreground font-mono">{connectCode}</strong></li>
                </ol>
              </div>
            </>
          )}

          {status?.isConnected && (
            <div className="rounded-xl border border-border/60 p-3 sm:p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Connection Info</p>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground/60">Telegram User</p>
                  <p className="font-medium truncate">@{status.telegramUsername || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/60">Connected Since</p>
                  <p className="font-medium">{status.connectedAt ? new Date(status.connectedAt).toLocaleDateString() : "—"}</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Tip:</strong> Send messages to the bot to manage projects on the go.
                  Try "Show my projects" or "Create a project called Nano ERP".
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
