"use client"

import { useState, useEffect, useCallback } from "react"
import { Bot, Loader2, RefreshCw, QrCode, Link, Globe, Terminal, Eye, EyeOff, CheckCircle2, Wifi, WifiOff, ArrowRight, Copy, KeyRound, User, Server, Clock, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

function formatDate(dateStr: string) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

interface Connection {
  _id: string
  botUsername?: string
  botToken?: string
  phoneNumber?: string
  apiId?: string
  apiHash?: string
  chatId?: string
  webhookUrl?: string
  isConnected: boolean
  status?: string
  connectedAt?: string
  lastActiveAt?: string
  type?: string
}

export function TelegramSettings() {
  const [connection, setConnection] = useState<Connection | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [ngrokOpen, setNgrokOpen] = useState(false)

  const fetchConnection = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/connections")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      const list = Array.isArray(data.connections) ? data.connections : Array.isArray(data) ? data : []
      const active = list.find(
        (c: any) => c.isConnected || c.status === "active" || c.status === "connected"
      ) || list[0] || null
      setConnection(active)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConnection()
    const interval = setInterval(fetchConnection, 15000)
    return () => clearInterval(interval)
  }, [fetchConnection])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await fetch("/api/telegram/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "telegram" }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || err.error || "Connection failed")
      }
      toast.success("Telegram connected successfully!")
      await fetchConnection()
    } catch (err: any) {
      toast.error(err.message || "Failed to connect Telegram")
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!connection) return
    setConnecting(true)
    try {
      const res = await fetch(`/api/telegram/connect`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connection._id }),
      })
      if (!res.ok) throw new Error("Disconnect failed")
      toast.success("Telegram disconnected")
      setConnection(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect")
    } finally {
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-lg animate-pulse" />
            <Loader2 className="size-5 animate-spin text-primary relative" />
          </div>
          <p className="text-xs text-muted-foreground/60">Loading Telegram settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute inset-0 bg-sky-500/20 rounded-full blur-lg" />
            <div className="relative flex size-8 sm:size-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg shadow-sky-500/20">
              <Bot className="size-4 sm:size-4.5 text-white" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Telegram Bot</h4>
            <p className="text-[11px] text-muted-foreground/60">Configure your Telegram bot connection</p>
          </div>
        </div>
        {connection?.isConnected && (
          <Button
            variant="ghost"
            size="xs"
            onClick={fetchConnection}
            className="text-muted-foreground/40 hover:text-foreground h-7 w-7 p-0 rounded-lg"
            aria-label="Refresh connection"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        )}
      </div>

      {connection?.isConnected ? (
        <div className="space-y-3 animate-fade-in-up">
          <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] via-card/60 to-card p-4 sm:p-5">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-md animate-pulse" />
                <div className="relative flex size-12 sm:size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-2 border-emerald-500/25 shadow-md shadow-emerald-500/10">
                  <CheckCircle2 className="size-6 sm:size-7 text-emerald-500" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Connected</h4>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0 rounded-full font-medium" render={undefined}>
                    <span className="inline-block size-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    Active
                  </Badge>
                </div>
                {connection.botUsername && (
                  <p className="text-xs text-foreground/70 mt-1">@{connection.botUsername}</p>
                )}
              </div>
              <Button
                size="xs"
                variant="outline"
                onClick={handleDisconnect}
                disabled={connecting}
                className="h-8 px-3 rounded-lg shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all"
              >
                {connecting ? (
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                ) : (
                  <WifiOff className="size-3.5 mr-1.5" />
                )}
                Disconnect
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-card/50 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/20">
              {[
                { label: "Bot Username", value: connection.botUsername && `@${connection.botUsername}`, icon: User },
                { label: "Bot Token", value: connection.botToken ? "••••••••••••••••" : "—", icon: KeyRound, action: connection.botToken ? () => setShowToken(!showToken) : undefined },
                { label: "Connected Since", value: formatDate(connection.connectedAt || connection.lastActiveAt || connection.connectedAt), icon: Clock },
                { label: "Chat ID", value: connection.chatId || "—", icon: Server },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3.5 bg-card/30">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                    <item.icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">{item.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium truncate">
                        {item.action && !showToken ? "••••••••••••••••" : item.value}
                      </span>
                      {item.action && (
                        <button onClick={item.action} className="text-muted-foreground/30 hover:text-foreground transition-colors shrink-0">
                          {showToken ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in-up">
          <div className="relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-card/60 via-card/30 to-card/5 p-5 sm:p-6">
            <div className="flex flex-col items-center text-center max-w-md mx-auto">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-sky-500/10 rounded-full blur-2xl" />
                <div className="relative flex size-14 sm:size-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 via-sky-500/10 to-transparent border-2 border-sky-500/15 shadow-inner">
                  <WifiOff className="size-6 sm:size-7 text-sky-500" />
                </div>
              </div>
              <h4 className="text-sm font-semibold text-foreground/80 mb-1">Not Connected</h4>
              <p className="text-xs text-muted-foreground/60 mb-5 max-w-[280px]">
                Connect your Telegram bot to chat with the AI assistant and receive notifications directly on Telegram.
              </p>
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={connecting}
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 transition-all text-xs font-medium"
              >
                {connecting ? (
                  <Loader2 className="size-3.5 animate-spin mr-2" />
                ) : (
                  <Wifi className="size-3.5 mr-2" />
                )}
                Connect Telegram Bot
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border/20 bg-card/30 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10">
                <Info className="size-3 text-primary" />
              </div>
              <h5 className="text-xs font-semibold">How to Connect</h5>
            </div>
            <ol className="space-y-2.5 ml-1">
              {[
                { icon: Bot, text: "Create a bot via @BotFather on Telegram and get your token." },
                { icon: KeyRound, text: "Add the bot token to your environment variables (TELEGRAM_BOT_TOKEN)." },
                { icon: Link, text: "Set up a webhook URL pointing to your deployment or use a tunnel like ngrok." },
                { icon: Terminal, text: "Click 'Connect Telegram Bot' above to establish the connection." },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex items-start gap-2 min-w-0">
                    <step.icon className="size-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground/70">{step.text}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
