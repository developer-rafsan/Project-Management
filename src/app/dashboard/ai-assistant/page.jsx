"use client"

import { Bot, Smartphone, Settings, MessageSquareText } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AIChat } from "@/components/ai/AIChat"
import { TelegramSettings } from "@/components/ai/TelegramSettings"
import { AISettings } from "@/components/ai/AISettings"

export default function AIAssistantPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="size-6 text-primary" />
          AI Assistant
        </h1>
        <p className="text-sm text-muted-foreground">Your intelligent project management assistant</p>
      </div>

      <Tabs defaultValue="ai-chat" orientation="vertical" className="flex-1 flex gap-4 min-h-0">
        <TabsList variant="line" className="h-fit py-1 min-w-[160px]">
          <TabsTrigger value="ai-chat" className="justify-start px-3 py-2">
            <MessageSquareText className="size-4" /> AI Chat
          </TabsTrigger>
          <TabsTrigger value="telegram" className="justify-start px-3 py-2">
            <Smartphone className="size-4" /> Telegram
          </TabsTrigger>
          <TabsTrigger value="settings" className="justify-start px-3 py-2">
            <Settings className="size-4" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-chat" className="flex-1 min-h-0">
          <AIChat />
        </TabsContent>

        <TabsContent value="telegram" className="flex-1 min-h-0">
          <TelegramSettings />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 min-h-0">
          <AISettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
