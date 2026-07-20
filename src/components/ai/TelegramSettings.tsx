"use client"

import { useState, useEffect, useCallback } from "react"
import { Bot, Loader2, CheckCircle2, Wifi, WifiOff, KeyRound, User, Server, Clock, Eye, EyeOff, Info, ArrowRight, ExternalLink, RefreshCw } from "lucide-react"
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

export function TelegramSettings() {
  const [botToken, setBotToken] = useState("")
  const [connection, setConnection] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/status")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      if (data.isConnected && data.botConfig) {
        setConnection(data.botConfig)
      } else {
        setConnection(null)
      }
    } catch {
      setConnection(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 15000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const handleSaveBot = async () => {
    if (!botToken.trim()) {
      toast.error("Please enter a bot token")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/telegram/save-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: botToken.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to save bot")
      }
      toast.success(data.message || "Bot connected successfully!")
      setBotToken("")
      await fetchStatus()
    } catch (err: any) {
      toast.error(err.message || "Failed to connect bot")
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/telegram/disconnect", { method: "POST" })
      if (!res.ok) throw new Error("Failed to disconnect")
      toast.success("Telegram disconnected")
      setConnection(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-5 animate-spin text-cyan-500" />
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
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-lg" />
            <div className="relative flex size-8 sm:size-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/20">
              <Bot className="size-4 sm:size-4.5 text-white" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Telegram Bot</h4>
            <p className="text-[11px] text-muted-foreground/60">Configure your Telegram bot connection</p>
          </div>
        </div>
        {connection && (
          <Button variant="ghost" size="xs" onClick={fetchStatus} className="text-muted-foreground/40 hover:text-foreground h-7 w-7 p-0 rounded-lg">
            <RefreshCw className="size-3.5" />
          </Button>
        )}
      </div>

      {connection ? (
        <div className="space-y-3 animate-fade-in-up">
          <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] via-card/60 to-card p-4 sm:p-5 shadow-sm shadow-emerald-500/5">
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
                disabled={saving}
                className="h-8 px-3 rounded-lg shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <WifiOff className="size-3.5 mr-1.5" />}
                Disconnect
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border/30 bg-gradient-to-br from-card/50 to-card/20 overflow-hidden shadow-sm">
            <div className="divide-y divide-border/10">
              {[
                { label: "Bot Username", value: connection.botUsername && `@${connection.botUsername}`, icon: User },
                { label: "Bot Token", value: connection.botToken ? connection.botToken : "—", icon: KeyRound, masked: true },
                { label: "Connected Since", value: formatDate(connection.connectedAt || connection.createdAt), icon: Clock },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3.5 px-4 sm:px-5 py-4 bg-card/30">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br from-muted/80 to-muted/30 border-border/30">
                    <item.icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-0.5">{item.label}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium truncate text-foreground/80">
                        {item.masked && !showToken ? "••••••••••••••••" : item.value}
                      </span>
                      {item.masked && (
                        <button onClick={() => setShowToken(!showToken)} className="text-muted-foreground/30 hover:text-foreground hover:bg-muted/50 p-1 rounded-md transition-all shrink-0">
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
          <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.04] via-card/60 to-card p-5 sm:p-6 shadow-sm shadow-cyan-500/5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20">
                  <KeyRound className="size-4 text-cyan-500" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-foreground/80">Bot Token</h5>
                  <p className="text-[11px] text-muted-foreground/60">Enter your Telegram bot token from @BotFather</p>
                </div>
              </div>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="1234567890:ABCdefGHIjklmNOPqrSTUvwxYZ"
                  className="h-10 text-xs rounded-lg border-border/30 bg-card/50 pr-10 font-mono"
                />
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground transition-colors"
                >
                  {showToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
              <Button
                size="sm"
                onClick={handleSaveBot}
                disabled={saving || !botToken.trim()}
                className="h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all text-xs font-medium"
              >
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin mr-2" />
                ) : (
                  <Wifi className="size-3.5 mr-2" />
                )}
                {saving ? "Connecting..." : "Connect Bot"}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/[0.03] to-card/30 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 ring-1 ring-cyan-500/20">
                <Info className="size-3 text-cyan-500" />
              </div>
              <h5 className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">How to Get Your Token</h5>
            </div>
            <ol className="space-y-2.5 ml-1">
              {[
                { text: "Open Telegram and search for @BotFather", icon: ExternalLink },
                { text: "Send /newbot and follow the instructions", icon: Bot },
                { text: "Copy the HTTP API token (looks like 12345:ABCdef...)", icon: KeyRound },
                { text: "Paste it above and click Connect Bot", icon: ArrowRight },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 text-cyan-600 dark:text-cyan-400 border border-cyan-500/15">
                    {i + 1}
                  </span>
                  <div className="flex items-start gap-2 min-w-0">
                    <step.icon className="size-3.5 text-cyan-400/50 mt-0.5 shrink-0" />
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
