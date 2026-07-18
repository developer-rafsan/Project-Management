"use client"

import { useState, useEffect } from "react"
import { Bot, Settings, MessageSquareText, Radio, Sparkles } from "lucide-react"
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

  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)]">
      <div className="mb-4 sm:mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md" />
            <div className="relative flex size-9 sm:size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-sm">
              <Bot className="size-4.5 sm:size-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">AI Assistant</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Your intelligent project management assistant</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} orientation={orientation} className="flex-1 flex-col lg:flex-row gap-3 lg:gap-5 min-h-0">
        <TabsList variant="line" className="h-fit py-1 flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible lg:min-w-[160px] shrink-0 gap-0.5">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="px-3 py-2.5 shrink-0 gap-2 text-xs lg:text-sm">
              <tab.icon className="size-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 min-h-0 relative">
          <div className="absolute inset-0 rounded-2xl border border-border/30 bg-gradient-to-br from-card/50 to-card/10 pointer-events-none" />
          <div className="relative h-full p-3 sm:p-4">
            <TabsContent value="ai-chat" className="h-full">
              {activeTab === "ai-chat" && <AIChat />}
            </TabsContent>
            <TabsContent value="channels" className="h-full overflow-y-auto">
              {activeTab === "channels" && <Channels />}
            </TabsContent>
            <TabsContent value="settings" className="h-full overflow-y-auto">
              {activeTab === "settings" && <AISettings />}
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
