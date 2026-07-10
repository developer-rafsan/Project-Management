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
  const [fiverrFeeEnabled, setFiverrFeeEnabled] = useState(true)

  useEffect(() => {
    const savedView = localStorage.getItem("projectViewMode")
    if (savedView === "list" || savedView === "grid") setViewMode(savedView)

    const savedDay = localStorage.getItem("monthStartDay")
    if (savedDay) setMonthStartDay(Number(savedDay))

    const savedFiverrFee = localStorage.getItem("fiverrFeeEnabled")
    if (savedFiverrFee !== null) setFiverrFeeEnabled(savedFiverrFee === "true")
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

  const handleFiverrFeeToggle = () => {
    const next = !fiverrFeeEnabled
    setFiverrFeeEnabled(next)
    localStorage.setItem("fiverrFeeEnabled", String(next))
  }

  return (
    <div className="space-y-3 sm:space-y-6 max-w-full sm:max-w-2xl pb-8 sm:pb-0">
      <div className="animate-fade-in-up stagger-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Customize your experience</p>
      </div>

      <div className="animate-fade-in-up stagger-2">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Appearance</CardTitle>
            <CardDescription>Toggle between light and dark mode</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm font-medium">
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="gap-2 w-full sm:w-auto"
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
      </div>

      <div className="animate-fade-in-up stagger-3">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Project View</CardTitle>
            <CardDescription>Choose how projects are displayed in the list</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm font-medium">
                {viewMode === "list" ? "List View" : "Grid View"}
              </span>
              <div className="flex rounded-lg border p-0.5 w-fit">
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
      </div>

      <div className="animate-fade-in-up stagger-4">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Month Start Day</CardTitle>
            <CardDescription>
              Set the day from which a month starts counting (e.g., 25 means Dec 25 – Jan 24 counts as January)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm font-medium">Day of month</span>
              <Input
                type="number"
                min={1}
                max={28}
                value={monthStartDay}
                onChange={handleMonthStartDayChange}
                className="w-full sm:w-20 text-center"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="animate-fade-in-up stagger-5">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Fiverr Fee</CardTitle>
            <CardDescription>
              Toggle Fiverr Fee (20%) deduction on the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm font-medium">
                {fiverrFeeEnabled ? "Enabled" : "Disabled"}
              </span>
              <Button
                variant={fiverrFeeEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleFiverrFeeToggle}
                className="gap-2 w-full sm:w-auto"
              >
                {fiverrFeeEnabled ? "ON" : "OFF"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}