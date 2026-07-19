"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Bot, Settings, MessageSquareText, Radio } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AIChat } from "@/components/ai/AIChat"
import { Channels } from "@/components/ai/Channels"
import { AISettings } from "@/components/ai/AISettings"

const TABS = [
  { id: "ai-chat", label: "AI Chat", icon: MessageSquareText },
  { id: "channels", label: "Channels", icon: Radio },
  { id: "settings", label: "Settings", icon: Settings },
]

export default function AIAssistantPage() {
  const [isDesktop, setIsDesktop] = useState(false)
  const [activeTab, setActiveTab] = useState("ai-chat")

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    setIsDesktop(mq.matches)
    const handler = (e) => setIsDesktop(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const orientation = isDesktop ? "vertical" : "horizontal"
  const tabColors = {
    "ai-chat": { glow: "rgba(139, 92, 246, 0.15)", border: "rgba(139, 92, 246, 0.2)", icon: "#8b5cf6", bg: "linear-gradient(135deg, rgba(139,92,246,0.06), transparent)", shadow: "0 4px 24px rgba(139,92,246,0.15)" },
    "channels": { glow: "rgba(6, 182, 212, 0.15)", border: "rgba(6, 182, 212, 0.2)", icon: "#06b6d4", bg: "linear-gradient(135deg, rgba(6,182,212,0.06), transparent)", shadow: "0 4px 24px rgba(6,182,212,0.15)" },
    "settings": { glow: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.2)", icon: "#10b981", bg: "linear-gradient(135deg, rgba(16,185,129,0.06), transparent)", shadow: "0 4px 24px rgba(16,185,129,0.15)" },
  }
  const colors = tabColors[activeTab] || tabColors["ai-chat"]

  return (
    <div className="flex flex-col lg:h-[calc(100vh-10rem)]">
      <div className="mb-4 sm:mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl animate-pulse" style={{ background: colors.glow }} />
            <div className="relative flex size-9 sm:size-10 items-center justify-center rounded-full shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.icon}, ${colors.icon}dd)`, boxShadow: colors.shadow }}>
              <Bot className="size-4.5 sm:size-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              AI Assistant
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Your intelligent project management assistant</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} orientation={orientation} className="flex-1 flex-col lg:flex-row gap-3 lg:gap-5 min-h-0 overflow-hidden">
        <TabsList variant="line" className="h-fit py-1.5 flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible lg:min-w-[180px] shrink-0 gap-1 hide-scrollbar">
          {TABS.map((tab) => {
            const c = tabColors[tab.id]
            const isActive = activeTab === tab.id
            return (
              <TabsTrigger key={tab.id} value={tab.id} className={cn(
                "px-3.5 py-2.5 shrink-0 gap-2.5 text-xs lg:text-sm transition-all duration-200 rounded-lg lg:border-l-2 lg:border-transparent lg:rounded-none",
                isActive ? "font-medium" : "hover:bg-muted/50"
              )} style={isActive ? {
                background: `linear-gradient(135deg, ${c.icon}15, transparent)`,
                borderColor: c.border,
                boxShadow: `0 2px 12px ${c.icon}10`,
                borderLeftColor: c.icon,
              } : undefined}>
                <tab.icon className="size-4" style={isActive ? { color: c.icon } : undefined} />
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <div className="flex-1 min-h-0 relative">
          <div className="absolute inset-0 rounded-2xl border border-border/30 bg-gradient-to-br from-card/60 via-card/30 to-card/5 pointer-events-none shadow-md" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br pointer-events-none transition-opacity duration-500" style={{ background: colors.bg }} />
          <div className="absolute top-0 right-0 w-56 h-56 rounded-bl-full pointer-events-none transition-opacity duration-500" style={{ background: `radial-gradient(circle at top right, ${colors.glow}, transparent 70%)` }} />
          <div className="relative h-full p-4 sm:p-5 lg:p-6 overflow-hidden">
            <TabsContent value="ai-chat" className="h-full animate-fade-in-up">
              {activeTab === "ai-chat" && <AIChat />}
            </TabsContent>
            <TabsContent value="channels" className="h-full animate-fade-in-up">
              <div className="w-full h-full overflow-y-auto">
                {activeTab === "channels" && <Channels />}
              </div>
            </TabsContent>
            <TabsContent value="settings" className="h-full animate-fade-in-up">
              <div className="w-full h-full overflow-y-auto">
                {activeTab === "settings" && <AISettings />}
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
