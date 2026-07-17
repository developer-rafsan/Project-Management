"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Loader2, Save, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { PROVIDER_MODELS, PROVIDER_LABELS, getProviderModels } from "@/lib/config"

interface Settings {
  enabled: boolean
  provider: string
  model: string
  temperature: number
  maxTokens: number
  promptTemplate: string
}

export function AISettings() {
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    provider: "deepseek",
    model: "deepseek-v4-flash",
    temperature: 0.3,
    maxTokens: 1024,
    promptTemplate: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
        <div>
          <p className="text-sm font-medium">Enable AI Assistant</p>
          <p className="text-xs text-muted-foreground">Allow AI to process your requests</p>
        </div>
        <button
          onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enabled ? 'bg-primary' : 'bg-input'}`}
        >
          <span className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${settings.enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
        </button>
      </div>

      <div className="space-y-4 rounded-xl border border-border/60 p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Model Settings</p>
        <div className="grid gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block">Provider</label>
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
          <div>
            <label className="text-xs font-medium mb-1 block">Model</label>
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
          <div>
            <label className="text-xs font-medium mb-1 block">Temperature ({settings.temperature})</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => setSettings((s) => ({ ...s, temperature: Number(e.target.value) }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Max Tokens</label>
            <Input
              type="number"
              min={64}
              max={16384}
              value={settings.maxTokens}
              onChange={(e) => setSettings((s) => ({ ...s, maxTokens: Number(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-border/60 p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">System Prompt</p>
        <textarea
          value={settings.promptTemplate}
          onChange={(e) => setSettings((s) => ({ ...s, promptTemplate: e.target.value }))}
          rows={5}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
          placeholder="Custom system prompt for the AI..."
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Settings
        </Button>
        <Button variant="outline" onClick={handleReset} className="gap-1.5">
          <RotateCcw className="size-4" /> Reset
        </Button>
      </div>
    </div>
  )
}
