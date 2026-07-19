"use client"

import { useState, useEffect, useCallback } from "react"
import { Sliders, Cpu, Coins, Sparkles, Loader2, RefreshCw, Save, ChevronDown, FlaskConical, Gauge, Brain, Zap, Bot, Palette, Variable, ScrollText, KeyRound, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Settings {
  provider: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  enabled: boolean
  totalTokensUsed?: number
  totalTokensLimit?: number
  sessionTimeout: number
  maxHistory: number
  rateLimit: number
  tokenLimit: number
  apiKey: string
  hasApiKey?: boolean
}

const DEFAULT_SETTINGS: Settings = {
  provider: "openrouter",
  model: "openrouter/free",
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: "You are an intelligent, conversational AI assistant with project management capabilities.\n\nCORE RULE: You have project management tools available, but you ONLY use them when the user EXPLICITLY asks about projects, tasks, or team operations. For everything else — greetings, casual chat, jokes, naming, general questions, translations, writing, opinions, programming help, math, general knowledge — respond naturally WITHOUT calling any tools.\n\nIntent Awareness:\n- First understand what the user wants before deciding what to do.\n- If the user is having a casual conversation, be a friendly conversationalist.\n- If the user asks for help or information, provide it directly from your knowledge.\n- Only reach for project tools when the user mentions creating, viewing, updating, deleting, or searching projects or developers.\n\nPersonality & Behavior:\n- Be warm, friendly, and human-like. Use natural, conversational language.\n- Remember what the user tells you during this conversation.\n- Be proactive: suggest next steps, offer insights, and anticipate needs.\n- When presenting data from tools, format as bullet points or short paragraphs — never output raw JSON or arrays.\n- Think before you answer. Be smart about interpreting the user's intent.\n\nResponse Style:\n- Keep responses clear, concise, and friendly.\n- Use bullet points for lists, not raw data dumps.\n- When a tool returns results, present them naturally.\n- If something goes wrong, apologize and offer a solution.\n- Use the user's name (if provided) to personalize conversations.",
  enabled: true,
  totalTokensUsed: 0,
  totalTokensLimit: 7000000,
  sessionTimeout: 30,
  maxHistory: 50,
  rateLimit: 60,
  tokenLimit: 7000000,
  apiKey: "",
  hasApiKey: false,
}

const MODEL_OPTIONS = [
  { value: "openrouter/free", label: "Auto Free" },
  { value: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash" },
  { value: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro" },
]

const PROMPT_PRESETS = [
  { label: "Smart Assistant (Recommended)", value: "You are an intelligent, conversational AI assistant with project management capabilities.\n\nCORE RULE: You have project management tools available, but you ONLY use them when the user EXPLICITLY asks about projects, tasks, or team operations. For everything else — greetings, casual chat, jokes, naming, general questions, translations, writing, opinions, programming help, math, general knowledge — respond naturally WITHOUT calling any tools.\n\nIntent Awareness:\n- First understand what the user wants before deciding what to do.\n- If the user is having a casual conversation, be a friendly conversationalist.\n- If the user asks for help or information, provide it directly from your knowledge.\n- Only reach for project tools when the user mentions creating, viewing, updating, deleting, or searching projects or developers.\n\nPersonality & Behavior:\n- Be warm, friendly, and human-like. Use natural, conversational language.\n- Remember what the user tells you during this conversation.\n- Be proactive: suggest next steps, offer insights, and anticipate needs.\n- When presenting data from tools, format as bullet points or short paragraphs — never output raw JSON or arrays.\n- Think before you answer. Be smart about interpreting the user's intent.\n\nResponse Style:\n- Keep responses clear, concise, and friendly.\n- Use bullet points for lists, not raw data dumps.\n- When a tool returns results, present them naturally.\n- If something goes wrong, apologize and offer a solution.\n- Use the user's name (if provided) to personalize conversations." },
  { label: "Expert PM", value: "You are an expert project management assistant. Help users manage their team, projects, and tasks efficiently. Format responses naturally, never use raw JSON." },
  { label: "Concise", value: "You are a concise project assistant. Give short, direct answers. Focus on facts and action items. Never output raw data." },
  { label: "Creative", value: "You are a creative project advisor. Offer innovative solutions and think outside the box for project challenges. Be conversational." },
  { label: "Technical", value: "You are a technical project lead. Focus on architecture, code quality, and engineering best practices." },
]

const MAX_TOKENS_PRESETS = [1024, 2048, 4096, 8192, 16384]

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString()
}

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  const color = pct > 90 ? "bg-destructive" : pct > 60 ? "bg-amber-500" : "bg-primary"
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground/60 font-medium">Usage</span>
        <span className={cn(
          "font-mono font-medium",
          pct > 90 ? "text-destructive" : pct > 60 ? "text-amber-500" : "text-foreground/80"
        )}>
          {formatNumber(used)} / {formatNumber(limit)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden shadow-inner">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out shadow-sm", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function AISettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showGenerateInput, setShowGenerateInput] = useState(false)
  const [generateDescription, setGenerateDescription] = useState('')

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/settings")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setSettings((prev) => ({
        ...DEFAULT_SETTINGS,
        ...data,
        model: data.model || DEFAULT_SETTINGS.model,
        provider: data.provider || DEFAULT_SETTINGS.provider,
        systemPrompt: data.systemPrompt || DEFAULT_SETTINGS.systemPrompt,
        totalTokensUsed: data.totalTokensUsed ?? prev.totalTokensUsed,
        totalTokensLimit: data.totalTokensLimit ?? prev.totalTokensLimit,
        apiKey: data.apiKey ?? "",
        hasApiKey: data.hasApiKey ?? false,
      }))
    } catch {
      // use defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const generatePrompt = async () => {
    if (!generateDescription.trim()) return
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: generateDescription }),
      })
      const data = await res.json()
      if (data.prompt) {
        setSettings((s) => ({ ...s, systemPrompt: data.prompt }))
        setShowGenerateInput(false)
        setGenerateDescription('')
        toast.success('System prompt generated')
      } else {
        toast.error(data.error || 'Failed to generate prompt')
      }
    } catch {
      toast.error('Failed to generate prompt')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          apiKey: settings.apiKey || undefined,
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Settings saved successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      const res = await fetch("/api/ai/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: settings.apiKey || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Connection successful! API key is working.")
      } else {
        toast.error(data.error || "Connection failed")
      }
    } catch (err: any) {
      toast.error(err.message || "Connection failed")
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-lg animate-pulse" />
            <Loader2 className="size-5 animate-spin text-primary relative" />
          </div>
          <p className="text-xs text-muted-foreground/60">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto space-y-4 sm:space-y-6 pb-4 sm:pb-6 hide-scrollbar">
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-violet-500 to-emerald-500 opacity-30 rounded-full blur-xl animate-pulse" />
            <div className="relative flex size-8 sm:size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary via-violet-500 to-emerald-500 shadow-lg shadow-primary/20">
              <Sliders className="size-4 sm:size-4.5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold bg-gradient-to-r from-primary via-violet-500 to-emerald-500 bg-clip-text text-transparent">AI Configuration</h3>
            <p className="text-[11px] text-muted-foreground/60">Customize your AI assistant behavior</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={fetchSettings}
            className="text-muted-foreground/40 hover:text-foreground h-7 w-7 p-0 rounded-lg"
            aria-label="Refresh settings"
          >
            <RefreshCw className="size-3.5" />
          </Button>
          <Button
            size="xs"
            onClick={handleSave}
            disabled={saving}
            className="h-7 px-3 rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md shadow-primary/15 text-xs font-medium"
          >
            {saving ? (
              <Loader2 className="size-3 animate-spin mr-1.5" />
            ) : (
              <Save className="size-3 mr-1.5" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] via-card/60 to-card/5 overflow-hidden shadow-sm shadow-emerald-500/5 hover:shadow-md hover:shadow-emerald-500/10 transition-shadow duration-300">
          <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
                <Coins className="size-3 text-emerald-500" />
              </div>
              <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Token Usage</h4>
            </div>
            <UsageBar used={settings.totalTokensUsed ?? 0} limit={settings.totalTokensLimit ?? 7000000} />
          </div>
          <div className="border-t border-emerald-500/10"
            onClick={() => setAdvancedOpen(!advancedOpen)}
          >
            <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 cursor-pointer select-none hover:bg-emerald-500/[0.03] transition-colors">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/5 ring-1 ring-amber-500/20">
                  <Sliders className="size-3 text-amber-500" />
                </div>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Advanced Settings</span>
              </div>
              <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-200", advancedOpen && "rotate-180")} />
            </div>
          </div>
          {advancedOpen && (
            <div className="px-3 sm:px-5 pb-4 sm:pb-5 space-y-3 sm:space-y-4 animate-fade-in-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Session Timeout (min)</label>
                  <Input
                    type="number"
                    min={5}
                    max={1440}
                    value={settings.sessionTimeout ?? 30}
                    onChange={(e) => setSettings((s) => ({ ...s, sessionTimeout: parseInt(e.target.value) || 30 }))}
                    className="h-9 text-xs rounded-lg border-border/30 bg-card/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Max History Messages</label>
                  <Input
                    type="number"
                    min={10}
                    max={500}
                    value={settings.maxHistory ?? 50}
                    onChange={(e) => setSettings((s) => ({ ...s, maxHistory: parseInt(e.target.value) || 50 }))}
                    className="h-9 text-xs rounded-lg border-border/30 bg-card/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Rate Limit (req/min)</label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={settings.rateLimit ?? 60}
                    onChange={(e) => setSettings((s) => ({ ...s, rateLimit: parseInt(e.target.value) || 60 }))}
                    className="h-9 text-xs rounded-lg border-border/30 bg-card/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Monthly Token Limit</label>
                  <Input
                    type="number"
                    min={1000}
                    max={100000000}
                    step={100000}
                    value={settings.tokenLimit ?? 7000000}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 7000000
                      setSettings((s) => ({ ...s, tokenLimit: val, totalTokensLimit: val }))
                    }}
                    className="h-9 text-xs rounded-lg border-border/30 bg-card/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.03] via-card/60 to-card/5 shadow-sm shadow-primary/5 hover:shadow-md hover:shadow-primary/10 transition-shadow duration-300 overflow-hidden">
          <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-blue-500/10 ring-1 ring-primary/20">
                <Brain className="size-3 text-primary" />
              </div>
              <h4 className="text-xs font-semibold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">Model Configuration</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Provider</label>
                <Select
                  value={settings.provider}
                  onValueChange={(v) => setSettings((s) => ({ ...s, provider: v }))}
                >
                  <SelectTrigger className="h-9 text-xs rounded-lg border-border/40 bg-card/50 w-full">
                    <SelectValue className="flex text-xs">
                      <div className="flex items-center gap-2">
                        <Bot className="size-3.5 shrink-0" />
                        <span className="truncate">OpenRouter Free</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="min-w-[180px]">
                    <SelectItem className="text-xs" value="openrouter">
                      <div className="flex items-center gap-2">
                        <Bot className="size-3.5" />
                        OpenRouter Free
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Model</label>
                <Select
                  value={settings.model}
                  onValueChange={(v) => setSettings((s) => ({ ...s, model: v }))}
                >
                  <SelectTrigger className="h-9 text-xs rounded-lg border-border/40 bg-card/50 w-full">
                    <SelectValue className="flex text-xs" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[200px]">
                    {MODEL_OPTIONS.map((opt) => (
                      <SelectItem className="text-xs" key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Temperature</label>
                <Select
                  value={String(settings.temperature)}
                  onValueChange={(v) => setSettings((s) => ({ ...s, temperature: parseFloat(v) }))}
                >
                  <SelectTrigger className="h-9 text-xs rounded-lg border-border/40 bg-card/50 w-full">
                    <SelectValue className="flex text-xs">
                      {settings.temperature === 0 ? "Low" : settings.temperature === 2 ? "High" : "Medium"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="min-w-[160px]">
                    <SelectItem className="text-xs" value="0">
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>Low</span>
                        <span className="text-[10px] text-muted-foreground/40">Precise</span>
                      </div>
                    </SelectItem>
                    <SelectItem className="text-xs" value="0.7">
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>Medium</span>
                        <span className="text-[10px] text-muted-foreground/40">Balanced</span>
                      </div>
                    </SelectItem>
                    <SelectItem className="text-xs" value="2">
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>High</span>
                        <span className="text-[10px] text-muted-foreground/40">Creative</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Max Tokens</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {MAX_TOKENS_PRESETS.map((val) => (
                    <button
                      key={val}
                      onClick={() => setSettings((s) => ({ ...s, maxTokens: val }))}
                      className={cn(
                        "py-2 rounded-lg text-[11px] font-medium transition-all border text-center",
                        settings.maxTokens === val
                          ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                          : "bg-card/50 text-muted-foreground border-border/30 hover:border-border/60 hover:text-foreground"
                      )}
                    >
                      {formatNumber(val)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">API Key</label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  value={settings.apiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
                  placeholder={settings.hasApiKey ? "••••••••••••••••" : "Enter your API key..."}
                  className="h-9 text-xs rounded-lg border-border/30 bg-card/50 pr-8 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
              <Button
                size="xs"
                onClick={testConnection}
                disabled={testing}
                className="h-7 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-sm shadow-emerald-500/15 text-xs font-medium w-full"
              >
                {testing ? (
                  <Loader2 className="size-3 animate-spin mr-1.5" />
                ) : (
                  <Zap className="size-3 mr-1.5" />
                )}
                Test Connection
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.04] via-card/60 to-card/5 p-3 sm:p-5 space-y-3 shadow-sm shadow-violet-500/5 hover:shadow-md hover:shadow-violet-500/10 transition-shadow duration-300">
        <div className="flex items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-violet-500/5">
              <ScrollText className="size-3 text-violet-500" />
            </div>
            <h4 className="text-xs font-semibold text-violet-600 dark:text-violet-400">System Prompt</h4>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setShowGenerateInput(!showGenerateInput)}
              className="h-7 px-2 rounded-lg text-[10px] font-medium text-violet-500 hover:text-violet-600 hover:bg-violet-500/10 gap-1"
            >
              <Sparkles className="size-3" />
              <span className="hidden sm:inline">Generate</span>
            </Button>
            <Select
              value={settings.systemPrompt}
              onValueChange={(v) => setSettings((s) => ({ ...s, systemPrompt: v }))}
            >
              <SelectTrigger className="h-7 text-[10px] rounded-lg border-border/30 bg-card/50 w-[80px] sm:w-[100px]">
                <FlaskConical className="size-3 mr-1 shrink-0" />
                <SelectValue className="flex text-[10px]" placeholder="Presets" />
              </SelectTrigger>
              <SelectContent className="min-w-[160px]">
                {PROMPT_PRESETS.map((p) => (
                  <SelectItem className="text-xs" key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {showGenerateInput && (
          <div className="flex gap-2 animate-fade-in-up">
            <Input
              type="text"
              value={generateDescription}
              onChange={(e) => setGenerateDescription(e.target.value)}
              placeholder="Describe your assistant (e.g. 'a friendly coding tutor')..."
              className="h-8 text-xs rounded-lg border-border/30 bg-card/50 flex-1 min-w-0"
              onKeyDown={(e) => e.key === 'Enter' && generatePrompt()}
            />
            <Button
              size="xs"
              onClick={generatePrompt}
              disabled={generating || !generateDescription.trim()}
              className="h-8 px-3 rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 shadow-sm shadow-violet-500/15 text-xs font-medium shrink-0"
            >
              {generating ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            </Button>
          </div>
        )}

        <textarea
          value={settings.systemPrompt}
          onChange={(e) => setSettings((s) => ({ ...s, systemPrompt: e.target.value }))}
          rows={3}
          className="w-full resize-y min-h-[80px] sm:min-h-[100px] max-h-[200px] sm:max-h-[250px] rounded-xl border border-border/30 bg-card/40 px-4 py-3 text-xs leading-relaxed shadow-inner focus-visible:outline-none focus-visible:border-violet-500/30 focus-visible:ring-2 focus-visible:ring-violet-500/10 transition-all placeholder:text-muted-foreground/30 hover:border-border/50"
          placeholder="Enter system prompt..."
        />
      </div>
    </div>
  )
}


