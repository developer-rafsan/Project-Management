"use client"

import { useState, useEffect, useCallback } from "react"
import { Radio, Loader2, Plug, PlugZap, ArrowRight, AlertCircle, RefreshCw, Wifi, WifiOff, Zap, Bot, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { TelegramSettings } from "@/components/ai/TelegramSettings"
import { AIChat } from "@/components/ai/AIChat"

interface Channel {
  id: string
  name: string
  type: string
  status: "connected" | "disconnected" | "connecting"
  description: string
  icon: typeof Radio
  gradient: string
}

const CHANNELS: Channel[] = [
  {
    id: "telegram",
    name: "Telegram",
    type: "telegram",
    status: "disconnected",
    description: "Connect your Telegram bot to chat with the AI assistant directly from Telegram.",
    icon: Radio,
    gradient: "from-sky-500/20 via-sky-500/10 to-transparent",
  },
]

export function Channels() {
  const [channels, setChannels] = useState(CHANNELS)
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null)
  const [showTelegramSettings, setShowTelegramSettings] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/connections")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      const list = Array.isArray(data.connections) ? data.connections : Array.isArray(data) ? data : []

      setConnections(list)

      setChannels((prev) =>
        prev.map((ch) => {
          if (ch.type === "telegram") {
            const hasActive = list.some(
              (c: any) => c.isConnected || c.status === "active" || c.status === "connected"
            )
            return { ...ch, status: hasActive ? "connected" : "disconnected" }
          }
          return ch
        })
      )
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 15000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const handleConnect = async (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId)
    if (!channel) return

    if (channelId === "telegram") {
      setShowTelegramSettings(true)
      setExpandedChannel(channelId)
      return
    }

    setConnecting(channelId)
    try {
      const res = await fetch("/api/telegram/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: channel.type }),
      })
      if (!res.ok) throw new Error("Connection failed")

      toast.success(`${channel.name} connected successfully!`)
      await fetchStatus()
    } catch (err: any) {
      toast.error(err.message || `Failed to connect ${channel.name}`)
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (connection: any) => {
    const channel = channels.find((c) => c.type === connection.type) || channels[0]
    setConnecting(channel.id)
    try {
      const res = await fetch(`/api/telegram/connect`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connection._id || connection.id }),
      })
      if (!res.ok) throw new Error("Disconnect failed")
      toast.success(`Disconnected from ${channel.name}`)
      await fetchStatus()
    } catch (err: any) {
      toast.error(err.message || `Failed to disconnect ${channel.name}`)
    } finally {
      setConnecting(null)
    }
  }

  if (showTelegramSettings) {
    return (
      <div className="h-full flex flex-col">
        <button
          onClick={() => { setShowTelegramSettings(false); setExpandedChannel(null) }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3 w-fit"
        >
          <ArrowRight className="size-3 rotate-180" /> Back to Channels
        </button>
        <TelegramSettings />
      </div>
    )
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
              <div className="relative flex size-8 sm:size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
                <Radio className="size-4 sm:size-4.5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Channels</h3>
              <p className="text-[11px] text-muted-foreground/60">Connect external messaging platforms</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={fetchStatus}
            disabled={loading}
            className="text-muted-foreground/40 hover:text-foreground h-7 w-7 p-0 rounded-lg"
            aria-label="Refresh status"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-lg animate-pulse" />
                <Loader2 className="size-5 animate-spin text-primary relative" />
              </div>
              <p className="text-xs text-muted-foreground/60">Loading channels...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 max-w-2xl">
            {channels.map((channel) => {
              const channelConns = connections.filter(
                (c: any) => c.type === channel.type || c.channelType === channel.type
              )
              const activeConns = channelConns.filter(
                (c: any) => c.isConnected || c.status === "active" || c.status === "connected"
              )

              return (
                <div key={channel.id} className="group">
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer",
                      "hover:shadow-lg hover:shadow-primary/5",
                      channel.status === "connected"
                        ? "border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.04] via-card/80 to-card"
                        : "border-border/40 bg-gradient-to-br from-card/80 to-card/40 hover:border-border/60",
                      expandedChannel === channel.id && "rounded-b-none border-b-0"
                    )}
                    onClick={() => setExpandedChannel(expandedChannel === channel.id ? null : channel.id)}
                  >
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                      channel.gradient
                    )} />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/[0.02] to-transparent rounded-bl-full pointer-events-none" />

                    <div className="relative p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "relative shrink-0",
                          channel.status === "connected" && "after:absolute after:-top-0.5 after:-right-0.5 after:size-2.5 after:rounded-full after:bg-emerald-500 after:ring-2 after:ring-background after:animate-pulse"
                        )}>
                          <div className={cn(
                            "flex size-10 sm:size-11 items-center justify-center rounded-xl transition-all duration-300",
                            channel.status === "connected"
                              ? "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/25 shadow-md shadow-emerald-500/10"
                              : "bg-gradient-to-br from-muted/80 to-muted/30 border border-border/40 group-hover:from-muted group-hover:to-muted/50"
                          )}>
                            <channel.icon className={cn(
                              "size-5 sm:size-5.5 transition-colors",
                              channel.status === "connected" ? "text-emerald-500" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h4 className="text-sm font-semibold">{channel.name}</h4>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-2 py-0 rounded-full font-medium border pointer-events-none",
                                channel.status === "connected"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : "bg-muted/50 text-muted-foreground/60 border-border/40"
                              )}
                              render={undefined}
                            >
                              <span className={cn(
                                "inline-block size-1.5 rounded-full mr-1.5",
                                channel.status === "connected" ? "bg-emerald-500" : "bg-muted-foreground/30"
                              )} />
                              {channel.status === "connected" ? "Connected" : "Disconnected"}
                            </Badge>
                            {activeConns.length > 0 && (
                              <Badge variant="outline" className="text-[10px] px-2 py-0 rounded-full bg-primary/5 text-primary border-primary/15 font-medium pointer-events-none" render={undefined}>
                                <Zap className="size-2.5 mr-1" />
                                {activeConns.length} active
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-1">{channel.description}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {connecting === channel.id ? (
                            <Button size="xs" disabled className="h-8 px-3 rounded-lg">
                              <Loader2 className="size-3.5 animate-spin mr-1.5" />
                              {channel.status === "connected" ? "Disconnecting..." : "Connecting..."}
                            </Button>
                          ) : channel.status === "connected" ? (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (activeConns.length > 0) {
                                  handleDisconnect(activeConns[0])
                                } else {
                                  handleDisconnect({ type: channel.type })
                                }
                              }}
                              className="h-8 px-3 rounded-lg text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all"
                            >
                              <WifiOff className="size-3.5 mr-1.5" />
                              Disconnect
                            </Button>
                          ) : (
                            <Button
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleConnect(channel.id)
                              }}
                              className="h-8 px-3 rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20 transition-all"
                            >
                              <PlugZap className="size-3.5 mr-1.5" />
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedChannel === channel.id && (
                    <div className="border border-t-0 border-border/40 rounded-b-xl bg-gradient-to-b from-muted/20 to-background p-4 sm:p-5 animate-fade-in-up">
                      {channel.id === "telegram" && (
                        <TelegramSettings />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
