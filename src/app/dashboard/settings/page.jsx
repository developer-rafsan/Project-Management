"use client"

import { useState, useEffect, useCallback } from "react"
import { useTheme } from "@/components/layout/ThemeProvider"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

import { getSettings, updateSettings } from "@/actions/settingsActions"
import {
  Sun, Moon, Palette, List, LayoutGrid, CalendarDays,
  DollarSign, Percent, Monitor, Eye, Radio, Cpu,
} from "lucide-react"
import { Channels } from "@/components/ai/Channels"
import { AISettings } from "@/components/ai/AISettings"
import { toast } from "sonner"

const TABS = [
  { id: "general", label: "General", icon: Palette },
  { id: "channels", label: "AI Channels", icon: Radio },
  { id: "ai-config", label: "AI Configuration", icon: Cpu },
]

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        checked ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`pointer-events-none block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const [viewMode, setViewMode] = useState("list")
  const [monthStartDay, setMonthStartDay] = useState(1)
  const [fiverrFeeEnabled, setFiverrFeeEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState("general")

  useEffect(() => {
    getSettings()
      .then((data) => {
        setViewMode(data.viewMode)
        setMonthStartDay(data.monthStartDay)
        setFiverrFeeEnabled(data.fiverrFeeEnabled)
        localStorage.setItem("projectViewMode", data.viewMode)
        localStorage.setItem("monthStartDay", String(data.monthStartDay))
        localStorage.setItem("fiverrFeeEnabled", String(data.fiverrFeeEnabled))
      })
      .catch(() => {
        const savedView = localStorage.getItem("projectViewMode")
        if (savedView === "list" || savedView === "grid") setViewMode(savedView)
        const savedDay = localStorage.getItem("monthStartDay")
        if (savedDay) setMonthStartDay(Number(savedDay))
        const savedFiverrFee = localStorage.getItem("fiverrFeeEnabled")
        if (savedFiverrFee !== null) setFiverrFeeEnabled(savedFiverrFee === "true")
      })
  }, [])

  const syncToApi = useCallback(async (data) => {
    try {
      await updateSettings(data)
    } catch {
      toast.error("Failed to save setting")
    }
  }, [])

  const handleViewModeChange = (mode) => {
    setViewMode(mode)
    localStorage.setItem("projectViewMode", mode)
    syncToApi({ viewMode: mode })
  }

  const handleMonthStartDayChange = (delta) => {
    const next = Math.min(28, Math.max(1, monthStartDay + delta))
    if (next === monthStartDay) return
    setMonthStartDay(next)
    localStorage.setItem("monthStartDay", String(next))
    syncToApi({ monthStartDay: next })
  }

  const handleMonthStartDayInput = (e) => {
    const val = Number(e.target.value)
    if (val >= 1 && val <= 28) {
      setMonthStartDay(val)
      localStorage.setItem("monthStartDay", String(val))
      syncToApi({ monthStartDay: val })
    }
  }

  const handleFiverrFeeToggle = () => {
    const next = !fiverrFeeEnabled
    setFiverrFeeEnabled(next)
    localStorage.setItem("fiverrFeeEnabled", String(next))
    syncToApi({ fiverrFeeEnabled: next })
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="text-xs text-muted-foreground">Customize your workspace, AI, and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible hide-scrollbar shrink-0 lg:w-48">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all whitespace-nowrap shrink-0",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="hidden lg:inline">{tab.label}</span>
                <span className="lg:hidden">{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex-1 min-w-0 overflow-y-auto">
          {activeTab === "general" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
                    <Palette className="size-3.5 text-primary" />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Appearance</h3>
                </div>
                <div className="rounded-xl border border-border/10 bg-card shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                        {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Theme</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">{theme === "dark" ? "Dark mode" : "Light mode"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { if (theme !== "light") toggleTheme() }} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${theme === "light" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                        <Sun className="size-3.5" /> Light
                      </button>
                      <button onClick={() => { if (theme !== "dark") toggleTheme() }} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${theme === "dark" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                        <Moon className="size-3.5" /> Dark
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex size-6 items-center justify-center rounded-md bg-blue-500/10">
                    <Monitor className="size-3.5 text-blue-500" />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Workspace</h3>
                </div>
                <div className="rounded-xl border border-border/10 bg-card shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                        <Eye className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Project View</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">List or grid layout</p>
                      </div>
                    </div>
                    <div className="flex rounded-lg border p-0.5 bg-muted/20">
                      <button onClick={() => handleViewModeChange("list")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                        <List className="size-3.5" /> List
                      </button>
                      <button onClick={() => handleViewModeChange("grid")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                        <LayoutGrid className="size-3.5" /> Grid
                      </button>
                    </div>
                  </div>
                  <div className="h-px bg-border/10 mx-4" />
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                        <CalendarDays className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Month Start</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">Day the month starts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleMonthStartDayChange(-1)} className="size-8 rounded-lg border border-input/50 bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-input transition-all cursor-pointer">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                      </button>
                      <Input type="number" min={1} max={28} value={monthStartDay} onChange={handleMonthStartDayInput} className="h-8 w-14 text-center text-xs font-semibold tabular-nums rounded-lg border-input/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <button onClick={() => handleMonthStartDayChange(1)} className="size-8 rounded-lg border border-input/50 bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-input transition-all cursor-pointer">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex size-6 items-center justify-center rounded-md bg-emerald-500/10">
                    <DollarSign className="size-3.5 text-emerald-500" />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Finance</h3>
                </div>
                <div className="rounded-xl border border-border/10 bg-card shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                        <Percent className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Fiverr Fee (20%)</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">{fiverrFeeEnabled ? "Applied to revenue" : "Turned off"}</p>
                      </div>
                    </div>
                    <Toggle checked={fiverrFeeEnabled} onChange={handleFiverrFeeToggle} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "channels" && <Channels />}
          {activeTab === "ai-config" && <AISettings />}
        </div>
      </div>

    </div>
  )
}
