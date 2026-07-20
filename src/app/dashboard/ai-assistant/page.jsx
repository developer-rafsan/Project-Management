"use client"

import { Bot, Sparkles } from "lucide-react"
import { AIChat } from "@/components/ai/AIChat"

export default function AIAssistantPage() {
  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="shrink-0 mb-4 sm:mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30" />
            <div className="relative flex size-9 sm:size-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30">
              <Sparkles className="size-4.5 sm:size-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              AI Assistant
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Your intelligent project management assistant</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative rounded-2xl border border-border/10 overflow-hidden shadow-md shadow-violet-500/5 bg-gradient-to-br from-card/40 to-background">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-bl-full pointer-events-none bg-gradient-to-bl from-violet-500/[0.06] to-transparent" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-tr-full pointer-events-none bg-gradient-to-tr from-fuchsia-500/[0.04] to-transparent" />
        <div className="relative h-full">
          <AIChat />
        </div>
      </div>
    </div>
  )
}
