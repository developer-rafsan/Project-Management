"use client"

import { useState, useEffect, useCallback } from "react"
import { Sliders, Cpu, Coins, Sparkles, Loader2, RefreshCw, Save, ChevronDown, FlaskConical, Gauge, Brain, Zap, Bot, Palette, Variable, ScrollText } from "lucide-react"
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
}

const DEFAULT_SETTINGS: Settings = {
  provider: "openrouter",
  model: "deepseek/deepseek-v4-flash-free",
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: "You are an expert project management assistant. Help users manage their team, projects, and tasks efficiently.",
  enabled: true,
  totalTokensUsed: 0,
  totalTokensLimit: 7000000,
  sessionTimeout: 30,
  maxHistory: 50,
  rateLimit: 60,
  tokenLimit: 7000000,
}

const MODEL_OPTIONS = [
  { value: "deepseek/deepseek-v4-flash-free", label: "DeepSeek V4 Flash" },
  { value: "openai/o3-mini", label: "OpenAI o3-mini" },
  { value: "google/gemini-2.5-flash-preview", label: "Gemini 2.5 Flash" },
  { value: "deepseek/deepseek-v3-free", label: "DeepSeek V3" },
  { value: "qwen/qwen-2.5-72b-instruct", label: "Qwen 2.5 72B" },
]

const PROMPT_PRESETS = [
  { label: "Expert PM", value: "You are an expert project management assistant. Help users manage their team, projects, and tasks efficiently." },
  { label: "Concise", value: "You are a concise project assistant. Give short, direct answers. Focus on facts and action items." },
  { label: "Creative", value: "You are a creative project advisor. Offer innovative solutions and think outside the box for project challenges." },
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
  const [advancedOpen, setAdvancedOpen] = useState(false)

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

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Settings saved successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings")
    } finally {
      setSaving(false)
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
    <div className="space-y-5 max-w-2xl pb-4">
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
            <div className="relative flex size-8 sm:size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <Sliders className="size-4 sm:size-4.5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Configuration</h3>
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

      <div className="rounded-xl border border-border/30 bg-gradient-to-br from-card/60 via-card/30 to-card/5 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
            <Coins className="size-3 text-emerald-500" />
          </div>
          <h4 className="text-xs font-semibold">Token Usage</h4>
        </div>
        <UsageBar used={settings.totalTokensUsed ?? 0} limit={settings.totalTokensLimit ?? 7000000} />
      </div>

      <div className="rounded-xl border border-border/30 bg-gradient-to-br from-card/60 via-card/30 to-card/5 overflow-hidden">
        <div className="p-4 sm:p-5 space-y-5">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
              <Brain className="size-3 text-primary" />
            </div>
            <h4 className="text-xs font-semibold">Model Configuration</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Provider</label>
              <Select
                value={settings.provider}
                onValueChange={(v) => setSettings((s) => ({ ...s, provider: v }))}
              >
                <SelectTrigger className="h-9 text-xs rounded-lg border-border/40 bg-card/50">
                  <SelectValue className="flex text-xs" />
                </SelectTrigger>
                <SelectContent className="min-w-[180px]">
                  <SelectItem className="text-xs" value="openrouter">
                    <div className="flex items-center gap-2">
                      <Cpu className="size-3.5" />
                      OpenRouter
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
                <SelectTrigger className="h-9 text-xs rounded-lg border-border/40 bg-card/50">
                  <SelectValue className="flex text-xs" />
                </SelectTrigger>
                <SelectContent className="min-w-[200px]">
                  {MODEL_OPTIONS.map((opt) => (
                    <SelectItem className="text-xs" key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Temperature</label>
                <p className="text-[10px] text-muted-foreground/40 mt-0.5">Controls randomness in responses</p>
              </div>
              <Badge variant="outline" className="text-xs font-mono px-2 py-0.5 rounded-md border-border/40 bg-card/30 min-w-[48px] text-center" render={undefined}>
                {settings.temperature.toFixed(2)}
              </Badge>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={settings.temperature}
              onChange={(e) => setSettings((s) => ({ ...s, temperature: parseFloat(e.target.value) }))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted/50 accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-primary/30 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
              aria-label="Temperature"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/40">
              <span>Precise</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Max Tokens</label>
            <div className="flex gap-2 flex-wrap">
              {MAX_TOKENS_PRESETS.map((val) => (
                <button
                  key={val}
                  onClick={() => setSettings((s) => ({ ...s, maxTokens: val }))}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
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

        <div className="border-t border-border/20">
          <div
            className="flex items-center justify-between px-4 sm:px-5 py-3 cursor-pointer select-none hover:bg-muted/20 transition-colors"
            onClick={() => setAdvancedOpen(!advancedOpen)}
          >
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-muted/50">
                <Sliders className="size-3 text-muted-foreground" />
              </div>
              <span className="text-xs font-semibold">Advanced Settings</span>
            </div>
            <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-200", advancedOpen && "rotate-180")} />
          </div>
          {advancedOpen && (
            <div className="px-4 sm:px-5 pb-5 space-y-4 animate-fade-in-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Session Timeout (min)</label>
                  <Input
                    type="number"
                    min={5}
                    max={1440}
                    value={settings.sessionTimeout ?? 30}
                    onChange={(e) => setSettings((s) => ({ ...s, sessionTimeout: parseInt(e.target.value) || 30 }))}
                    className="h-9 text-xs rounded-lg border-border/30 bg-card/50"
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
                    className="h-9 text-xs rounded-lg border-border/30 bg-card/50"
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
                    className="h-9 text-xs rounded-lg border-border/30 bg-card/50"
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
                    className="h-9 text-xs rounded-lg border-border/30 bg-card/50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/30 bg-gradient-to-br from-card/60 via-card/30 to-card/5 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-violet-500/5">
              <ScrollText className="size-3 text-violet-500" />
            </div>
            <h4 className="text-xs font-semibold">System Prompt</h4>
          </div>
          <Select
            value={settings.systemPrompt}
            onValueChange={(v) => setSettings((s) => ({ ...s, systemPrompt: v }))}
          >
            <SelectTrigger className="h-7 text-[10px] rounded-lg border-border/30 bg-card/50 w-[120px]">
              <FlaskConical className="size-3 mr-1" />
              <SelectValue className="flex text-[10px]" placeholder="Presets" />
            </SelectTrigger>
            <SelectContent className="min-w-[160px]">
              {PROMPT_PRESETS.map((p) => (
                <SelectItem className="text-xs" key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <textarea
          value={settings.systemPrompt}
          onChange={(e) => setSettings((s) => ({ ...s, systemPrompt: e.target.value }))}
          rows={4}
          className="w-full resize-y min-h-[80px] max-h-[200px] rounded-xl border border-border/30 bg-card/40 px-3.5 py-2.5 text-xs leading-relaxed shadow-inner focus-visible:outline-none focus-visible:border-primary/30 focus-visible:ring-1 focus-visible:ring-primary/15 transition-all placeholder:text-muted-foreground/30"
          placeholder="Enter system prompt..."
        />
      </div>
    </div>
  )
}


