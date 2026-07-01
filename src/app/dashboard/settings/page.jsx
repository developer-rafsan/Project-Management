"use client"

import { useState, useEffect } from "react"
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
import { Sun, Moon, List, LayoutGrid } from "lucide-react"

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const [viewMode, setViewMode] = useState("list")
  const [monthStartDay, setMonthStartDay] = useState(1)

  useEffect(() => {
    const savedView = localStorage.getItem("projectViewMode")
    if (savedView === "list" || savedView === "grid") setViewMode(savedView)

    const savedDay = localStorage.getItem("monthStartDay")
    if (savedDay) setMonthStartDay(Number(savedDay))
  }, [])

  const handleViewModeChange = (mode) => {
    setViewMode(mode)
    localStorage.setItem("projectViewMode", mode)
  }

  const handleMonthStartDayChange = (e) => {
    const val = Number(e.target.value)
    if (val >= 1 && val <= 28) {
      setMonthStartDay(val)
      localStorage.setItem("monthStartDay", String(val))
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Customize your experience</p>
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
          <CardTitle>Project View</CardTitle>
          <CardDescription>Choose how projects are displayed in the list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {viewMode === "list" ? "List View" : "Grid View"}
            </span>
            <div className="flex rounded-lg border p-0.5">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange("list")}
                className="rounded-md px-3 gap-2"
              >
                <List className="size-4" />
                List
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange("grid")}
                className="rounded-md px-3 gap-2"
              >
                <LayoutGrid className="size-4" />
                Grid
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Month Start Day</CardTitle>
          <CardDescription>
            Set the day from which a month starts counting (e.g., 25 means Dec 25 &ndash; Jan 24 counts as January)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Day of month</span>
            <Input
              type="number"
              min={1}
              max={28}
              value={monthStartDay}
              onChange={handleMonthStartDayChange}
              className="w-20 text-center"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}