"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { getStats } from "@/actions/projectActions"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import StatsCards from "@/components/dashboard/StatsCards"
import RevenueSummary from "@/components/dashboard/RevenueSummary"
import RecentProjects from "@/components/dashboard/RecentProjects"
import RecentUpdates from "@/components/dashboard/RecentUpdates"
import StatusChart from "@/components/dashboard/StatusChart"
import MonthlyProgressChart from "@/components/dashboard/MonthlyProgressChart"
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from "date-fns"
import { getMonthRange } from "@/lib/dateUtils"

const statusColors = {
  Pending: "#eab308",
  "In Progress": "#6366f1",
  Delivered: "#10b981",
  "On Hold": "#f97316",
  Cancelled: "#ef4444",
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const now = new Date()
  const [filterMode, setFilterMode] = useState("month")
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(now),
    to: endOfMonth(now),
  })
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [revenueData, setRevenueData] = useState(null)
  const [recentProjects, setRecentProjects] = useState([])
  const [recentUpdates, setRecentUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDay] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("monthStartDay")
      return saved ? Number(saved) : 1
    }
    return 1
  })

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login")
  }, [status, router])

  useEffect(() => {
    const fetchStats = (params) => {
      setLoading(true)
      getStats(params)
        .then((data) => {
          setStats({
            totalProjects: data.total,
            runningProjects: data.running,
            completedProjects: data.completed,
            pendingProjects: data.pending,
            onHoldProjects: data.onHold,
          })

          const grouped = (data.chartData?.byStatus || [])
            .filter((s) => s._id)
            .map((s) => ({
              status: s._id,
              count: s.count,
              color: statusColors[s._id] || "#6b7280",
            }))
          setChartData(grouped)

          const priceMap = {}
          ;(data.priceByStatus || []).forEach((p) => {
            priceMap[p._id] = p.total
          })
          const delivered = priceMap["Delivered"] || 0
          const cancelled = priceMap["Cancelled"] || 0
          const total = Object.values(priceMap).reduce((a, b) => a + b, 0)
          const inProgress = total - delivered - cancelled
          const fee = delivered * 0.2
          setRevenueData({ total, delivered, inProgress, cancelled, fee, net: delivered - fee })

          if (dateRange?.from && dateRange?.to) {
            const progressMap = {}
            ;(data.chartData?.monthlyProgress || []).forEach((d) => {
              const key = `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`
              progressMap[key] = d.count
            })
            const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
            const monthly = days.map((day) => {
              const key = format(day, "yyyy-MM-dd")
              return { date: key, count: progressMap[key] || 0 }
            })
            setMonthlyData(monthly)
          }

          setRecentProjects(data.recentProjects || [])
          setRecentUpdates(data.recentUpdates || [])
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }

    if (filterMode === "all") {
      fetchStats({ all: true, monthStartDay: startDay })
    } else if (filterMode === "month") {
      fetchStats({
        selectedMonth,
        selectedYear,
        monthStartDay: startDay,
      })
    } else if (filterMode === "range" && dateRange?.from && dateRange?.to) {
      const fromStart = new Date(dateRange.from)
      fromStart.setHours(0, 0, 0, 0)
      const toEnd = new Date(dateRange.to)
      toEnd.setHours(23, 59, 59, 999)
      fetchStats({
        from: fromStart.toISOString(),
        to: toEnd.toISOString(),
        monthStartDay: startDay,
      })
    }
  }, [filterMode, selectedMonth, selectedYear, startDay, dateRange?.from, dateRange?.to])

  if (status === "loading") return null

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
            Welcome back, {session?.user?.name}
          </h1>
          <p className="text-sm text-muted-foreground">Dashboard overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            <Button
              variant={filterMode === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterMode("month")}
              className="rounded-md px-2 sm:px-3 text-xs sm:text-sm"
            >
              Month
            </Button>
            <Button
              variant={filterMode === "range" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterMode("range")}
              className="rounded-md px-2 sm:px-3 text-xs sm:text-sm"
            >
              Range
            </Button>
            <Button
              variant={filterMode === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterMode("all")}
              className="rounded-md px-2 sm:px-3 text-xs sm:text-sm"
            >
              All
            </Button>
          </div>
          {filterMode === "month" && (
            <div className="flex gap-2">
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-[120px] sm:w-[150px]">
                  <SelectValue placeholder="Month">
                    {format(new Date(2024, selectedMonth - 1), "MMM")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {format(new Date(2024, m - 1), "MMMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-[90px] sm:w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: new Date().getFullYear() - 2021 + 1 }, (_, i) => 2022 + i).map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {filterMode === "range" && (
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          )}
          <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
            {filterMode === "all"
              ? "All projects"
              : filterMode === "month"
                ? (() => {
                    const { from, to } = getMonthRange(selectedYear, selectedMonth, startDay)
                    return `${format(from, "MMM d")} — ${format(to, "MMM d, yyyy")}`
                  })()
                : filterMode === "range" && dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "MMM d")} — ${format(dateRange.to, "MMM d, yyyy")}`
                  : ""}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[72px] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-[300px] rounded-xl bg-muted animate-pulse" />
            <div className="h-[300px] rounded-xl bg-muted animate-pulse" />
          </div>
          <div className="h-[200px] rounded-xl bg-muted animate-pulse" />
          <div className="h-[200px] rounded-xl bg-muted animate-pulse" />
        </div>
      ) : (
        <>
          <StatsCards stats={stats} />
          <RevenueSummary data={revenueData} highlight="net" />
          <div className="grid gap-6 lg:grid-cols-2">
            <StatusChart data={chartData} />
            <MonthlyProgressChart data={monthlyData} />
          </div>
          <RecentProjects projects={recentProjects} />
          <RecentUpdates updates={recentUpdates} />
        </>
      )}
    </div>
  )
}