"use client"

import { useState } from "react"
import { Smartphone, MessageCircle, Users, Gamepad2, ArrowLeft, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TelegramSettings } from "@/components/ai/TelegramSettings"

const CHANNELS = [
  { id: "telegram", label: "Telegram", icon: Smartphone, desc: "Connect via Telegram bot", active: true },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, desc: "Coming soon", active: false },
  { id: "teams", label: "Microsoft Teams", icon: Users, desc: "Coming soon", active: false },
  { id: "discord", label: "Discord", icon: Gamepad2, desc: "Coming soon", active: false },
]

export function Channels() {
  const [selected, setSelected] = useState<string | null>(null)

  if (selected === "telegram") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="gap-1.5 h-7 px-2 -ml-1">
            <ArrowLeft className="size-3.5" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Smartphone className="size-4 text-primary" />
            Telegram
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <TelegramSettings />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Connect AI Assistant to your preferred messaging platforms.</p>
      <div className="grid gap-2.5">
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            onClick={() => ch.active && setSelected(ch.id)}
            disabled={!ch.active}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3 sm:p-4 text-left w-full transition-all duration-200",
              ch.active
                ? "border-border/60 bg-card/30 hover:bg-accent hover:border-border cursor-pointer"
                : "border-border/20 bg-muted/20 cursor-not-allowed opacity-40"
            )}
          >
            <div className={cn(
              "flex size-9 sm:size-10 items-center justify-center rounded-lg shrink-0",
              ch.active ? "bg-primary/10" : "bg-muted/50"
            )}>
              <ch.icon className={cn("size-4 sm:size-5", ch.active ? "text-primary" : "text-muted-foreground/40")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", ch.active ? "text-foreground" : "text-muted-foreground/40")}>
                {ch.label}
              </p>
              <p className={cn("text-xs", ch.active ? "text-muted-foreground" : "text-muted-foreground/20")}>
                {ch.desc}
              </p>
            </div>
            {ch.active && (
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <Radio className="size-3 text-primary" />
              </div>
            )}
            {!ch.active && (
              <span className="text-[10px] font-medium text-muted-foreground/30 px-2 py-0.5 rounded-full border border-border/20 shrink-0">
                Soon
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
