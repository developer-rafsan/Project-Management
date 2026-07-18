"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Loader2, Save, RotateCcw, Eye, EyeOff,
  CheckCircle2, XCircle, KeyRound, Bot,
  Cpu, Gauge, FileText, Power,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { PROVIDER_LABELS, getProviderModels } from "@/lib/config"

interface Settings {
  enabled: boolean
  provider: string
  model: string
  temperature: number
  maxTokens: number
  promptTemplate: string
  apiKey?: string
  hasApiKey?: boolean
}

function Section({ icon: Icon, title, children, className }: {
  icon: any; title: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card/30 p-3 sm:p-4 space-y-3 sm:space-y-4", className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="flex size-6 sm:size-7 items-center justify-center rounded-lg bg-muted/60">
          <Icon className="size-3.5 sm:size-4" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider">{title}</p>
      </div>
      {children}
    </div>
  )
}

export function AISettings() {
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    provider: "openrouter",
    model: "deepseek/deepseek-v4-flash",
    temperature: 0.3,
    maxTokens: 1024,
    promptTemplate: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMsg, setTestMsg] = useState('')

  useEffect(() => {
    fetch("/api/ai/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Settings saved")
      setTestStatus('idle')
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings({
      enabled: true,
      provider: "openrouter",
      model: "deepseek/deepseek-v4-flash",
      temperature: 0.3,
      maxTokens: 1024,
      promptTemplate: "",
    })
    setTestStatus('idle')
    setTestMsg('')
    toast.success("Settings reset to defaults")
  }

  const handleTestKey = async () => {
    if (!settings.apiKey) {
      toast.error("Enter an API key first")
      return
    }
    setTestStatus('testing')
    setTestMsg('')
    try {
      const res = await fetch("/api/ai/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: settings.apiKey }),
      })
      const data = await res.json()
      if (data.success) {
        setTestStatus('success')
        setTestMsg('API key is valid')
      } else {
        setTestStatus('error')
        setTestMsg(data.error || 'Invalid API key')
      }
    } catch {
      setTestStatus('error')
      setTestMsg('Failed to test API key')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 sm:py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground/60">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4 max-w-2xl pb-4">
      <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 p-3 sm:p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "flex size-8 sm:size-9 items-center justify-center rounded-lg transition-colors",
            settings.enabled ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground"
          )}>
            <Power className="size-4 sm:size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">AI Assistant</p>
            <p className="text-xs text-muted-foreground truncate">{settings.enabled ? "Active and ready" : "Currently disabled"}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.enabled}
          onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
          className={cn(
            "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200",
            settings.enabled ? "bg-primary" : "bg-input"
          )}
        >
          <span className={cn(
            "inline-block size-4.5 rounded-full bg-white shadow-sm transition-transform duration-200",
            settings.enabled ? "translate-x-[21px]" : "translate-x-[3px]"
          )} />
        </button>
      </div>

      <Section icon={KeyRound} title="API Key">
        <div className="space-y-2.5">
          <div className={cn(
            "flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 transition-colors",
            "focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20",
            testStatus === 'success' && "border-emerald-500/40",
            testStatus === 'error' && "border-destructive/40"
          )}>
            <KeyRound className="size-4 shrink-0 text-muted-foreground" />
            <input
              type={showKey ? "text" : "password"}
              value={settings.apiKey || ''}
              onChange={(e) => { setSettings((s) => ({ ...s, apiKey: e.target.value })); setTestStatus('idle') }}
              placeholder={settings.apiKey ? "sk-or-..." : "No API key configured"}
              className="flex-1 h-8 border-0 bg-transparent px-0.5 text-sm shadow-none focus-visible:outline-none placeholder:text-muted-foreground/40"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestKey}
              disabled={testStatus === 'testing' || !settings.apiKey}
              className={cn(
                "gap-1.5 h-7 text-xs",
                testStatus === 'success' && "border-emerald-500/30 text-emerald-600 bg-emerald-500/5",
                testStatus === 'error' && "border-destructive/30 text-destructive bg-destructive/5"
              )}
            >
              {testStatus === 'testing' ? (
                <Loader2 className="size-3 animate-spin" />
              ) : testStatus === 'success' ? (
                <CheckCircle2 className="size-3" />
              ) : testStatus === 'error' ? (
                <XCircle className="size-3" />
              ) : (
                <Cpu className="size-3" />
              )}
              {testStatus === 'testing' ? 'Testing...' : 'Test Key'}
            </Button>
            {testStatus === 'success' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                <CheckCircle2 className="size-3" /> {testMsg}
              </span>
            )}
            {testStatus === 'error' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-destructive">
                <XCircle className="size-3" /> {testMsg}
              </span>
            )}
          </div>
        </div>
      </Section>

      <Section icon={Bot} title="Model Settings">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">Provider</label>
            <select
              value={settings.provider}
              onChange={(e) => {
                const provider = e.target.value
                const models = getProviderModels(provider)
                setSettings((s) => ({ ...s, provider, model: models[0]?.value || s.model }))
              }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">Model</label>
            <select
              value={settings.model}
              onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {getProviderModels(settings.provider).map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} {m.free ? "(Free)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[11px] font-medium text-muted-foreground">
              Temperature <span className="text-foreground/60">({settings.temperature.toFixed(1)})</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground/40 w-4 text-center">0</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings((s) => ({ ...s, temperature: Number(e.target.value) }))}
                className="flex-1 h-1.5 accent-primary"
              />
              <span className="text-[10px] text-muted-foreground/40 w-4 text-center">2</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground/30 px-4">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[11px] font-medium text-muted-foreground">
              Max Tokens <span className="text-foreground/60">({settings.maxTokens.toLocaleString()})</span>
            </label>
            <Input
              type="number"
              min={64}
              max={16384}
              value={settings.maxTokens}
              onChange={(e) => setSettings((s) => ({ ...s, maxTokens: Number(e.target.value) }))}
              className="w-full sm:max-w-40"
            />
          </div>
        </div>
      </Section>

      <Section icon={FileText} title="System Prompt">
        <textarea
          value={settings.promptTemplate}
          onChange={(e) => setSettings((s) => ({ ...s, promptTemplate: e.target.value }))}
          rows={4}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-colors placeholder:text-muted-foreground/40"
          placeholder="Custom system prompt for the AI..."
        />
      </Section>

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <Button onClick={handleSave} disabled={saving} className="gap-1.5 h-9">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button variant="outline" onClick={handleReset} className="gap-1.5 h-9">
          <RotateCcw className="size-4" /> Reset Defaults
        </Button>
      </div>
    </div>
  )
}
