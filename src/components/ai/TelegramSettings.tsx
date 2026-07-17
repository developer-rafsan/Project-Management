"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Smartphone, CheckCircle, XCircle, Loader2, Link2, Unlink, WebhookIcon } from "lucide-react"
import { toast } from "sonner"

interface TelegramStatus {
  isConnected: boolean
  telegramUsername?: string | null
  connectedAt?: string | null
}

const BOT_USERNAME = "nanopicodex_bot"

export function TelegramSettings() {
  const [status, setStatus] = useState<TelegramStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [webhookLoading, setWebhookLoading] = useState(false)

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

  useEffect(() => {
    fetchStatus()
  }, [])

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

  const handleSetupWebhook = async () => {
    setWebhookLoading(true)
    try {
      const res = await fetch("/api/telegram/setup-webhook", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to setup webhook")
      toast.success("Webhook set up successfully! Bot is now active.")
    } catch (err: any) {
      toast.error(err.message || "Failed to setup webhook")
    } finally {
      setWebhookLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 p-4">
        <div className={cn(
          "flex size-10 items-center justify-center rounded-full",
          status?.isConnected ? "bg-emerald-500/10" : "bg-muted"
        )}>
          <Smartphone className={cn("size-5", status?.isConnected ? "text-emerald-500" : "text-muted-foreground")} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {status?.isConnected ? "Telegram Connected" : "Not Connected"}
          </p>
          {status?.isConnected && status?.telegramUsername && (
            <p className="text-xs text-muted-foreground">@{status.telegramUsername}</p>
          )}
          {!status?.isConnected && (
            <p className="text-xs text-muted-foreground">Connect to manage projects via Telegram</p>
          )}
        </div>
        {status?.isConnected ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="size-5 text-emerald-500" />
            <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={actionLoading} className="gap-1.5">
              {actionLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Unlink className="size-3.5" />}
              Disconnect
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noopener noreferrer">
              <Link2 className="size-3.5" />
              Open Bot
            </a>
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border/60 p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bot Setup</p>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10">
            <WebhookIcon className="size-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Webhook</p>
            <p className="text-xs text-muted-foreground">
              Register this server with Telegram to receive messages
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSetupWebhook}
            disabled={webhookLoading}
            className="gap-1.5 shrink-0"
          >
            {webhookLoading ? <Loader2 className="size-3.5 animate-spin" /> : <WebhookIcon className="size-3.5" />}
            Setup Webhook
          </Button>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <strong>How to connect:</strong>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Click <strong>Setup Webhook</strong> above (required once)</li>
            <li>Click <strong>Open Bot</strong> to start chatting on Telegram</li>
            <li>Send <strong>/start</strong> to see welcome message</li>
            <li>Go to Dashboard → AI Assistant → Settings and connect your Telegram account</li>
          </ol>
        </div>
      </div>

      {status?.isConnected && (
        <div className="rounded-xl border border-border/60 p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Connection Info</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground/60">Username</p>
              <p className="font-medium">{status.telegramUsername || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground/60">Connected Since</p>
              <p className="font-medium">
                {status.connectedAt ? new Date(status.connectedAt).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 mt-2">
            <p className="text-xs text-muted-foreground">
              <strong>Tip:</strong> Send messages to the bot to manage projects on the go.
              Try "Show my projects" or "Create a project called Nano ERP".
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ")
}
