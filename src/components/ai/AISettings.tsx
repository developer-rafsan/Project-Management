"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Sliders, Cpu, Coins, Sparkles, Loader2, RefreshCw, Save, ChevronDown, FlaskConical, Gauge, Brain, Zap, Bot, Palette, Variable, ScrollText, KeyRound, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

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
  model: "google/gemma-4-31b-it:free",
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
  apiKey: "",
  hasApiKey: false,
}

const MODEL_OPTIONS = [
  { value: "google/gemma-4-31b-it:free", label: "google/gemma-4-31b-it:free" },
  { value: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "nvidia/nemotron-3-ultra-550b-a55b:free" },
  { value: "tencent/hy3:free", label: "tencent/hy3:free" },
  { value: "openai/gpt-oss-20b:free", label: "openai/gpt-oss-20b:free" },
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
  const [testing, setTesting] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showGenerateInput, setShowGenerateInput] = useState(false)
  const [generateDescription, setGenerateDescription] = useState('')
  const [providerOpen, setProviderOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [tempOpen, setTempOpen] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const providerRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<HTMLDivElement>(null)
  const tempRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (providerRef.current && !providerRef.current.contains(e.target as Node)) setProviderOpen(false)
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false)
      if (tempRef.current && !tempRef.current.contains(e.target as Node)) setTempOpen(false)
      if (promptRef.current && !promptRef.current.contains(e.target as Node)) setPromptOpen(false)
    }
    if (providerOpen || modelOpen || tempOpen || promptOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [providerOpen, modelOpen, tempOpen, promptOpen])

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
      const body: Record<string, unknown> = {
        provider: settings.provider,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        systemPrompt: settings.systemPrompt,
        enabled: settings.enabled,
        apiKey: settings.apiKey,
      }
      const res = await fetch("/api/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to save")
      setSettings((s) => ({ ...s, hasApiKey: !!result.apiKey }))
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
      const saveBody: Record<string, unknown> = {
        provider: settings.provider,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      }
      if (settings.apiKey) {
        saveBody.apiKey = settings.apiKey
      }
      const saveRes = await fetch("/api/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveBody),
      })
      if (!saveRes.ok) throw new Error("Failed to save before test")
      const res = await fetch("/api/ai/test-key")
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
            <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-lg animate-pulse" />
            <Loader2 className="size-5 animate-spin text-cyan-500 relative" />
          </div>
          <p className="text-xs text-muted-foreground/60">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl space-y-3">
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-500 opacity-30 rounded-full blur-xl animate-pulse" />
            <div className="relative flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/20">
              <Sliders className="size-3.5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">AI Configuration</h3>
            <p className="text-[10px] text-muted-foreground/60">Customize your AI assistant behavior</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="xs" onClick={fetchSettings} className="text-muted-foreground/40 hover:text-foreground h-6 w-6 p-0 rounded-lg" aria-label="Refresh settings">
            <RefreshCw className="size-3" />
          </Button>
          <Button size="xs" onClick={handleSave} disabled={saving} className="h-6 px-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 shadow-md shadow-cyan-500/20 text-[10px] font-medium">
            {saving ? <Loader2 className="size-2.5 animate-spin mr-1" /> : <Save className="size-2.5 mr-1" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] via-card/60 to-card/5 overflow-hidden shadow-sm shadow-emerald-500/5">
          <div className="p-3 space-y-2">
            <UsageBar used={settings.totalTokensUsed ?? 0} limit={settings.totalTokensLimit ?? 7000000} />
          </div>
          <div className="border-t border-emerald-500/10 cursor-pointer select-none hover:bg-emerald-500/[0.03] transition-colors" onClick={() => setAdvancedOpen(!advancedOpen)}>
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Sliders className="size-3 text-amber-500" />
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Advanced Settings</span>
              </div>
              <ChevronDown className={cn("size-3 text-muted-foreground transition-transform duration-200", advancedOpen && "rotate-180")} />
            </div>
          </div>
          {advancedOpen && (
            <div className="px-3 pb-3 space-y-2 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Session Timeout (min)</label>
                  <Input type="number" min={5} max={1440} value={settings.sessionTimeout ?? 30} onChange={(e) => setSettings((s) => ({ ...s, sessionTimeout: parseInt(e.target.value) || 30 }))} className="h-7 text-[11px] rounded-lg border-border/30 bg-card/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Max History</label>
                  <Input type="number" min={10} max={500} value={settings.maxHistory ?? 50} onChange={(e) => setSettings((s) => ({ ...s, maxHistory: parseInt(e.target.value) || 50 }))} className="h-7 text-[11px] rounded-lg border-border/30 bg-card/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Rate Limit (req/min)</label>
                  <Input type="number" min={1} max={1000} value={settings.rateLimit ?? 60} onChange={(e) => setSettings((s) => ({ ...s, rateLimit: parseInt(e.target.value) || 60 }))} className="h-7 text-[11px] rounded-lg border-border/30 bg-card/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Token Limit</label>
                  <Input type="number" min={1000} max={100000000} step={100000} value={settings.tokenLimit ?? 7000000} onChange={(e) => { const val = parseInt(e.target.value) || 7000000; setSettings((s) => ({ ...s, tokenLimit: val, totalTokensLimit: val })) }} className="h-7 text-[11px] rounded-lg border-border/30 bg-card/50" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.04] via-card/60 to-card/5 shadow-sm shadow-cyan-500/5 overflow-hidden">
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Brain className="size-3.5 text-cyan-500" />
              <h4 className="text-[11px] font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">Model Configuration</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Provider</label>
                <Select value={settings.provider} onValueChange={(v) => setSettings((s) => ({ ...s, provider: v }))}>
                  <SelectTrigger className="h-7 text-[11px] rounded-lg border-border/40 bg-card/50 w-full">
                    <SelectValue className="flex text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Bot className="size-3 shrink-0" />
                        <span>OpenRouter</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="min-w-[180px]">
                    <SelectItem className="text-xs" value="openrouter">OpenRouter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Model</label>
                <div className="relative" ref={modelRef}>
                  <button
                    onClick={() => setModelOpen(!modelOpen)}
                    className={cn(
                      "flex items-center justify-between w-full h-7 rounded-lg border px-2.5 text-[11px] font-medium transition-all",
                      modelOpen
                        ? "border-cyan-500/30 bg-cyan-500/5 text-foreground"
                        : "border-border/40 bg-card/50 text-muted-foreground hover:border-border/60"
                    )}
                  >
                    <span className="truncate">{settings.model}</span>
                    <ChevronDown className={cn("size-3 shrink-0 ml-1 transition-transform duration-200", modelOpen && "rotate-180")} />
                  </button>
                  {modelOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-full min-w-[220px] rounded-xl border border-border/20 bg-popover shadow-xl backdrop-blur-2xl p-1.5 z-30 animate-fade-in-up origin-top-left">
                      {MODEL_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSettings((s) => ({ ...s, model: opt.value })); setModelOpen(false) }}
                          className={cn(
                            "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-xs text-left transition-all",
                            settings.model === opt.value
                              ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full shrink-0 ring-1 ring-offset-1 ring-offset-transparent", settings.model === opt.value ? "bg-cyan-500 ring-cyan-500/30" : "bg-muted-foreground/20 ring-transparent")} />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Temperature</label>
                <Select value={String(settings.temperature)} onValueChange={(v) => setSettings((s) => ({ ...s, temperature: parseFloat(v) }))}>
                  <SelectTrigger className="h-7 text-[11px] rounded-lg border-border/40 bg-card/50 w-full">
                    <SelectValue className="flex text-[11px]" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[160px]">
                    <SelectItem className="text-xs" value="0">Low</SelectItem>
                    <SelectItem className="text-xs" value="0.7">Medium</SelectItem>
                    <SelectItem className="text-xs" value="2">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Max Tokens</label>
                <div className="grid grid-cols-5 gap-1">
                  {MAX_TOKENS_PRESETS.map((val) => (
                    <button key={val} onClick={() => setSettings((s) => ({ ...s, maxTokens: val }))} className={cn("py-1.5 rounded-md text-[10px] font-medium transition-all border text-center", settings.maxTokens === val ? "bg-primary/10 text-primary border-primary/20" : "bg-card/50 text-muted-foreground border-border/30 hover:border-border/60")}>
                      {formatNumber(val)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">API Key</label>
              <div className="relative">
                <Input type={showKey ? "text" : "password"} value={settings.apiKey} onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))} placeholder={settings.hasApiKey ? "••••••••••••••••" : "Enter your API key..."} className="h-7 text-[11px] rounded-lg border-border/30 bg-card/50 pr-7" />
                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground">
                  {showKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </button>
              </div>
              <Button size="xs" onClick={testConnection} disabled={testing} className="h-6 px-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-600 text-[10px] font-medium w-full">
                {testing ? <Loader2 className="size-2.5 animate-spin mr-1" /> : <Zap className="size-2.5 mr-1" />}
                Test Connection
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.04] via-card/60 to-card/5 p-3 space-y-2 shadow-sm shadow-cyan-500/5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ScrollText className="size-3 text-cyan-500" />
            <h4 className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">System Prompt</h4>
          </div>
          <div className="flex items-center gap-1">
            <Button size="xs" variant="ghost" onClick={() => setShowGenerateInput(!showGenerateInput)} className="h-6 px-1.5 rounded-lg text-[10px] font-medium text-cyan-500 hover:text-cyan-600 hover:bg-cyan-500/10 gap-1">
              <Sparkles className="size-2.5" />
              <span className="hidden sm:inline">Generate</span>
            </Button>
            <Select value={settings.systemPrompt} onValueChange={(v) => setSettings((s) => ({ ...s, systemPrompt: v }))}>
              <SelectTrigger className="h-6 text-[10px] rounded-lg border-border/30 bg-card/50 w-[70px] sm:w-[90px]">
                <FlaskConical className="size-2.5 mr-1 shrink-0" />
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
            <Input type="text" value={generateDescription} onChange={(e) => setGenerateDescription(e.target.value)} placeholder="Describe your assistant..." className="h-7 text-[11px] rounded-lg border-border/30 bg-card/50 flex-1 min-w-0" onKeyDown={(e) => e.key === 'Enter' && generatePrompt()} />
            <Button size="xs" onClick={generatePrompt} disabled={generating || !generateDescription.trim()} className="h-7 px-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-600 text-[10px] font-medium shrink-0">
              {generating ? <Loader2 className="size-2.5 animate-spin" /> : <Sparkles className="size-2.5" />}
            </Button>
          </div>
        )}

        <textarea value={settings.systemPrompt} onChange={(e) => setSettings((s) => ({ ...s, systemPrompt: e.target.value }))} rows={2} className="w-full min-h-[60px] max-h-[150px] rounded-xl border border-border/30 bg-card/40 px-3 py-2 text-[11px] leading-relaxed shadow-inner focus-visible:outline-none focus-visible:border-cyan-500/30 focus-visible:ring-2 focus-visible:ring-cyan-500/10 placeholder:text-muted-foreground/30" placeholder="Enter system prompt..." />
      </div>
    </div>
  )
}


