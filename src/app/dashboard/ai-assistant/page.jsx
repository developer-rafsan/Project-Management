"use client"

import { useState, useEffect } from "react"
import { Bot, Settings, MessageSquareText, Radio } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AIChat } from "@/components/ai/AIChat"
import { Channels } from "@/components/ai/Channels"
import { AISettings } from "@/components/ai/AISettings"

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
      <div className="mb-3 sm:mb-4 shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="size-5 sm:size-6 text-primary" />
          AI Assistant
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Your intelligent project management assistant</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} orientation={orientation} className="flex-1 flex-col lg:flex-row gap-3 lg:gap-4 min-h-0">
        <TabsList variant="line" className="h-fit py-1 flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible lg:min-w-[160px] shrink-0">
          <TabsTrigger value="ai-chat" className="px-3 py-2 shrink-0">
            <MessageSquareText className="size-4" /> AI Chat
          </TabsTrigger>
          <TabsTrigger value="channels" className="px-3 py-2 shrink-0">
            <Radio className="size-4" /> Channels
          </TabsTrigger>
          <TabsTrigger value="settings" className="px-3 py-2 shrink-0">
            <Settings className="size-4" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-chat" className="flex-1 min-h-0">
          {activeTab === "ai-chat" && <AIChat />}
        </TabsContent>
        <TabsContent value="channels" className="flex-1 min-h-0 overflow-y-auto">
          {activeTab === "channels" && <Channels />}
        </TabsContent>
        <TabsContent value="settings" className="flex-1 min-h-0 overflow-y-auto">
          {activeTab === "settings" && <AISettings />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
