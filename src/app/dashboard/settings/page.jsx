"use client"

import { useState, useEffect, useCallback } from "react"
import { useTheme } from "@/components/layout/ThemeProvider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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

function SettingRow({ icon: Icon, title, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">
        {children}
      </div>
    </div>
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
        <div className="flex flex-row lg:flex-col gap-0.5 overflow-x-auto lg:overflow-x-visible hide-scrollbar shrink-0 lg:w-40">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap shrink-0",
                  isActive
                    ? "bg-primary/10 text-primary lg:bg-transparent lg:text-primary lg:border-l-2 lg:border-primary lg:rounded-none lg:pl-[9px]"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent lg:hover:bg-transparent lg:border-l-2 lg:border-transparent lg:rounded-none lg:pl-[9px]"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="hidden lg:inline">{tab.label}</span>
                <span className="lg:hidden">{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex-1 min-w-0 overflow-y-auto">
          {activeTab === "general" && (
            <div className="space-y-3">
              <Card>
                <CardContent className="p-3 divide-y divide-border/50">
                  <SettingRow icon={theme === "dark" ? Moon : Sun} title="Theme" description={theme === "dark" ? "Dark mode" : "Light mode"}>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="icon-sm" onClick={() => { if (theme !== "light") toggleTheme() }} className={`size-7 rounded-md ${theme === "light" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" : "text-muted-foreground"}`}>
                        <Sun className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => { if (theme !== "dark") toggleTheme() }} className={`size-7 rounded-md ${theme === "dark" ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" : "text-muted-foreground"}`}>
                        <Moon className="size-3.5" />
                      </Button>
                    </div>
                  </SettingRow>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 divide-y divide-border/50">
                  <SettingRow icon={Eye} title="Project View" description="List or grid">
                    <div className="flex rounded-md border p-0.5 bg-muted/30">
                      <button onClick={() => handleViewModeChange("list")} className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-all cursor-pointer ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>
                        <List className="size-3" /> List
                      </button>
                      <button onClick={() => handleViewModeChange("grid")} className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-all cursor-pointer ${viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>
                        <LayoutGrid className="size-3" /> Grid
                      </button>
                    </div>
                  </SettingRow>
                  <Separator />
                  <SettingRow icon={CalendarDays} title="Month Start" description="Day the month starts">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleMonthStartDayChange(-1)} className="size-7 rounded-md border border-input bg-background flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                      </button>
                      <Input type="number" min={1} max={28} value={monthStartDay} onChange={handleMonthStartDayInput} className="h-7 w-12 text-center text-xs font-semibold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <button onClick={() => handleMonthStartDayChange(1)} className="size-7 rounded-md border border-input bg-background flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                      </button>
                    </div>
                  </SettingRow>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <SettingRow icon={Percent} title="Fiverr Fee (20%)" description={fiverrFeeEnabled ? "Applied to revenue" : "Turned off"}>
                    <Toggle checked={fiverrFeeEnabled} onChange={handleFiverrFeeToggle} />
                  </SettingRow>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "channels" && <Channels />}
          {activeTab === "ai-config" && <AISettings />}
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-3 shrink-0">
        Changes saved automatically
      </p>
    </div>
  )
}
