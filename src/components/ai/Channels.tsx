"use client"

import { useState, useEffect } from "react"
import { Smartphone, MessageCircle, Users, Gamepad2, ArrowLeft, CheckCircle2, Plug, Loader2, Bot, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"
import { TelegramSettings } from "@/components/ai/TelegramSettings"

interface TelegramStatus {
  isConnected: boolean
  telegramUsername?: string | null
  botUsername?: string | null
}

const CHANNELS = [
  { id: "telegram", label: "Telegram", icon: Smartphone, desc: "Connect via Telegram bot for on-the-go project management", active: true },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, desc: "Coming soon — WhatsApp integration", active: false },
  { id: "teams", label: "Microsoft Teams", icon: Users, desc: "Coming soon — Teams collaboration", active: false },
  { id: "discord", label: "Discord", icon: Gamepad2, desc: "Coming soon — Discord community", active: false },
]

export function Channels() {
  const [selected, setSelected] = useState<string | null>(null)
  const [status, setStatus] = useState<TelegramStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/telegram/status")
      const data = await res.json()
      setStatus(data)
    } catch {
      setStatus({ isConnected: false })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [])

  useEffect(() => {
    if (!status?.isConnected && !loading) {
      const interval = setInterval(async () => {
        if (document.hidden) return
        try {
          const res = await fetch("/api/telegram/status")
          const data = await res.json()
          setStatus(data)
          if (data.isConnected) clearInterval(interval)
        } catch {}
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [loading, status?.isConnected])

  if (selected === "telegram") {
    return (
      <div className="flex flex-col h-full animate-fade-in-up">
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => { setSelected(null); fetchStatus() }} className="gap-1.5 h-8 px-2 -ml-2 rounded-lg">
            <ArrowLeft className="size-4" />
            <span className="text-xs font-medium">Channels</span>
          </Button>
          <div className="flex items-center gap-2 py-1 px-3 rounded-lg bg-primary/5 border border-primary/10">
            <Smartphone className="size-4 text-primary" />
            <span className="text-sm font-medium">Telegram</span>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <TelegramSettings />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-md bg-primary/10">
            <Plug className="size-3 text-primary" />
          </span>
          Communication Channels
        </h2>
        <p className="text-xs text-muted-foreground ml-7">
          Connect AI Assistant to your preferred messaging platforms for remote project management.
        </p>
      </div>

      <div className="grid gap-3">
        {CHANNELS.map((ch) => {
          const channelStatus = !ch.active ? "soon"
            : loading ? "loading"
            : status?.isConnected ? "connected"
            : "disconnected"

          return (
            <button
              key={ch.id}
              onClick={() => ch.active && setSelected(ch.id)}
              disabled={!ch.active}
              className={cn(
                "group relative flex items-center gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 text-left w-full transition-all duration-200",
                ch.active
                  ? "border-border/60 bg-card/30 hover:bg-accent hover:border-border cursor-pointer hover:shadow-sm hover:translate-y-[-1px] active:translate-y-0"
                  : "border-border/20 bg-muted/20 cursor-not-allowed opacity-40"
              )}
            >
              <div className={cn(
                "flex size-9 sm:size-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300",
                channelStatus === "connected" ? "bg-emerald-500/10" : "bg-gradient-to-br from-primary/10 to-primary/5"
              )}>
                <ch.icon className={cn(
                  "size-4.5 sm:size-5 transition-colors",
                  channelStatus === "connected" ? "text-emerald-500" : "text-primary"
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn("text-sm font-medium", !ch.active && "text-muted-foreground/40")}>
                    {ch.label}
                  </p>
                  {channelStatus === "soon" && (
                    <span className="inline-flex items-center text-[10px] h-4 px-1.5 rounded-full border border-dashed text-muted-foreground/40 border-muted-foreground/20 font-medium">
                      Soon
                    </span>
                  )}
                </div>
                <p className={cn("text-xs mt-0.5", ch.active ? "text-muted-foreground" : "text-muted-foreground/20")}>
                  {ch.desc}
                </p>
                {channelStatus === "connected" && status?.telegramUsername && (
                  <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    Connected as @{status.telegramUsername}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {channelStatus === "loading" && (
                  <Loader2 className="size-3.5 sm:size-4 animate-spin text-muted-foreground" />
                )}
                {channelStatus === "connected" && (
                  <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 sm:px-3 py-0.5 sm:py-1 border border-emerald-500/20">
                    <CheckCircle2 className="size-3 sm:size-3.5 text-emerald-500" />
                    <span className="text-[10px] sm:text-xs font-semibold text-emerald-500">Connected</span>
                  </div>
                )}
                {channelStatus === "disconnected" && (
                  <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 sm:px-3 py-1 sm:py-1.5 border border-primary/15">
                    <Plug className="size-3 sm:size-3.5 text-primary" />
                    <span className="text-[10px] sm:text-xs font-semibold text-primary">Connect</span>
                  </div>
                )}
                {channelStatus === "soon" && (
                  <ChevronRight className="size-3.5 sm:size-4 text-muted-foreground/20" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {status?.isConnected && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
          <div className="hidden sm:flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
            <Bot className="size-4 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400">Telegram Connected</p>
            <p className="text-[11px] sm:text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
              Connected to @{status.botUsername}. Send messages to manage projects on the go.
            </p>
          </div>
        </div>
      )}

      {!status?.isConnected && !loading && (
        <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/20 p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
          <div className="hidden sm:flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/60">
            <Plug className="size-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">No Channels Connected</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground/60 mt-0.5">
              Connect a messaging platform to manage your projects from anywhere.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
