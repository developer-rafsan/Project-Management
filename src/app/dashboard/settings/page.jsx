"use client"

import { useState, useEffect } from "react"
import { useTheme } from "@/components/layout/ThemeProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sun, Moon, Loader2 } from "lucide-react"
import { toast } from "sonner"

function ordinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const [monthStartDay, setMonthStartDay] = useState("1")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setMonthStartDay(String(data.monthStartDay ?? 1))
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    const day = Number(monthStartDay)
    if (day < 1 || day > 31) {
      toast.error("Day must be between 1 and 31")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthStartDay: day }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Toggle between light and dark mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="gap-2"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
              {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Month Settings</CardTitle>
          <CardDescription>
            Set which day of the month your office month starts. For example, if set to 25, the month runs from the 25th to the 24th of the next month (e.g., Dec 25 - Jan 24 = January month).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Month Start Day</label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={31}
                value={monthStartDay}
                onChange={(e) => setMonthStartDay(e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">of each month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Month runs from the <strong>{monthStartDay}{ordinalSuffix(Number(monthStartDay))}</strong> to the <strong>{Number(monthStartDay) === 1 ? "last day" : `${Number(monthStartDay) - 1}${ordinalSuffix(Number(monthStartDay) - 1)}`}</strong> of the next month.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
