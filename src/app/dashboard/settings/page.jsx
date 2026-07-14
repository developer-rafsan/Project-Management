"use client"

import { useState, useEffect, useCallback } from "react"
import { useTheme } from "@/components/layout/ThemeProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getSettings, updateSettings } from "@/actions/settingsActions"
import {
  Sun, Moon, Palette, List, LayoutGrid, CalendarDays,
  DollarSign, Percent, Monitor, Eye,
} from "lucide-react"
import { toast } from "sonner"

function Toggle({ checked, onChange, label }) {
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
    <div className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="size-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0 self-center">
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
  const [saving, setSaving] = useState(false)

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
    <div className="max-w-3xl mx-auto pb-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize how your workspace looks and behaves
        </p>
      </div>

      {/* Appearance */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Palette className="size-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appearance</h2>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-5 divide-y divide-border/50">
            <SettingRow
              icon={theme === "dark" ? Moon : Sun}
              title="Theme Mode"
              description={theme === "dark" ? "Dark mode is active" : "Light mode is active"}
            >
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => { if (theme !== "light") toggleTheme() }}
                  className={`size-8 rounded-lg ${theme === "light" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" : "text-muted-foreground"}`}
                >
                  <Sun className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => { if (theme !== "dark") toggleTheme() }}
                  className={`size-8 rounded-lg ${theme === "dark" ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" : "text-muted-foreground"}`}
                >
                  <Moon className="size-4" />
                </Button>
              </div>
            </SettingRow>
          </CardContent>
        </Card>
      </section>

      {/* Workspace */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Monitor className="size-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workspace</h2>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-5 divide-y divide-border/50">
            <SettingRow
              icon={Eye}
              title="Project View"
              description="Change how projects appear in the list"
            >
              <div className="flex rounded-lg border p-0.5 bg-muted/30">
                <button
                  onClick={() => handleViewModeChange("list")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="size-3.5" />
                  List
                </button>
                <button
                  onClick={() => handleViewModeChange("grid")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="size-3.5" />
                  Grid
                </button>
              </div>
            </SettingRow>

            <Separator />

            <SettingRow
              icon={CalendarDays}
              title="Month Start Day"
              description="Set which day the month starts counting from"
            >
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMonthStartDayChange(-1)}
                  className="size-8 rounded-lg border border-input bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div className="relative w-16">
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={monthStartDay}
                    onChange={handleMonthStartDayInput}
                    className="h-8 text-center text-sm font-semibold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <button
                  onClick={() => handleMonthStartDayChange(1)}
                  className="size-8 rounded-lg border border-input bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </SettingRow>
          </CardContent>
        </Card>
      </section>

      {/* Finance */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <DollarSign className="size-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Finance</h2>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-5 divide-y divide-border/50">
            <SettingRow
              icon={Percent}
              title="Fiverr Fee (20%)"
              description={fiverrFeeEnabled ? "Fee is applied to project revenue" : "Fee is turned off for all projects"}
            >
              <Toggle checked={fiverrFeeEnabled} onChange={handleFiverrFeeToggle} />
            </SettingRow>
          </CardContent>
        </Card>
      </section>

      {/* Footer hint */}
      <p className="text-center text-xs text-muted-foreground">
        Changes are saved automatically
      </p>
    </div>
  )
}
