"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import { fetchProjects } from "@/lib/features/projectSlice"
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
import DashboardScreenOptions, { getDefaultDashboardVisibility, filterUpdatesByVisibility } from "@/components/dashboard/DashboardScreenOptions"
import { Calendar, ArrowLeftRight, List } from "lucide-react"
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from "date-fns"
import { getMonthRange, getMonthFromDate, getEffectiveMonthYear } from "@/lib/dateUtils"

const statusColors = {
  Pending: "#eab308",
  "In Progress": "#6366f1",
  Delivered: "#10b981",
  Revision: "#a855f7",
  "On Hold": "#f97316",
  Cancelled: "#ef4444",
}

function getUserSharePct(project, userId) {
  const isOwner = project.owner === userId
  if (isOwner) {
    const t = (project.assignee || []).reduce((s, a) => s + (a.percentage || 0), 0)
    return Math.max(0, 100 - t)
  }
  const entry = (project.assignee || []).find(a => a.user === userId)
  return entry ? (entry.percentage || 0) : 0
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const dispatch = useDispatch()
  const { items: allProjects, loading: projectsLoading, fetched } = useSelector((s) => s.projects)

  const now = new Date()
  const [filterMode, setFilterMode] = useState("month")
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(now),
    to: endOfMonth(now),
  })
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window !== "undefined") {
      const day = Number(localStorage.getItem("monthStartDay")) || 1
      return getMonthFromDate(new Date(), day).month
    }
    return now.getMonth() + 1
  })
  const [selectedYear, setSelectedYear] = useState(() => {
    if (typeof window !== "undefined") {
      const day = Number(localStorage.getItem("monthStartDay")) || 1
      return getMonthFromDate(new Date(), day).year
    }
    return now.getFullYear()
  })
  const [allUpdates, setAllUpdates] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [startDay] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("monthStartDay")
      return saved ? Number(saved) : 1
    }
    return 1
  })

  const [visibility, setVisibility] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dashboardScreenOptions")
        if (saved) return { ...getDefaultDashboardVisibility(), ...JSON.parse(saved) }
      } catch {}
    }
    return getDefaultDashboardVisibility()
  })

  useEffect(() => {
    try {
      localStorage.setItem("dashboardScreenOptions", JSON.stringify(visibility))
    } catch {}
  }, [visibility])

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login")
  }, [status, router])

  const workspaceId = useSelector((s) => s.workspaces?.currentWorkspaceId)

  useEffect(() => {
    dispatch(fetchProjects())
  }, [dispatch, workspaceId])

  useEffect(() => {
    getStats({ workspaceId: workspaceId || undefined })
      .then((data) => {
        setAllUpdates(data.recentUpdates || [])
      })
      .catch((err) => console.error("Failed to fetch updates:", err))
  }, [workspaceId])

  useEffect(() => {
    if (!projectsLoading && fetched) {
      setDataLoading(false)
    }
  }, [projectsLoading, fetched])

  const userId = session?.user?.id

  const filtered = useMemo(() => {
    let list = [...allProjects]

    if (filterMode === "month") {
      list = list.filter((p) => {
        const eff = getEffectiveMonthYear(p, startDay)
        return eff.month === selectedMonth && eff.year === selectedYear
      })
    } else if (filterMode === "range" && (dateRange?.from || dateRange?.to)) {
      list = list.filter((p) => {
        const pd = p.currentProjectDate ? new Date(p.currentProjectDate) : (p.createdAt ? new Date(p.createdAt) : null)
        if (!pd) return false
        if (dateRange.from && pd < dateRange.from) return false
        if (dateRange.to && pd > dateRange.to) return false
        return true
      })
    }

    list.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
      return dateB - dateA
    })

    return list
  }, [allProjects, filterMode, selectedMonth, selectedYear, dateRange, startDay])

  const { stats, chartData, revenueData, monthlyData, recentProjects, filteredProjectIds } = useMemo(() => {
    let running = 0, completed = 0, pending = 0, onHold = 0, revision = 0
    const statusMap = {}
    const priceMap = {}
    const myPriceMap = {}
    let myFeeDelivered = 0
    const dayMap = {}

    filtered.forEach((p) => {
      if (p.status === 'In Progress') running++
      else if (p.status === 'Delivered') completed++
      else if (p.status === 'Pending') pending++
      else if (p.status === 'On Hold') onHold++
      else if (p.status === 'Revision') revision++

      if (p.status) {
        statusMap[p.status] = (statusMap[p.status] || 0) + 1
        priceMap[p.status] = (priceMap[p.status] || 0) + (p.price || 0)
      }
      if (userId && p.status) {
        const sharePct = getUserSharePct(p, userId)
        const myPrice = p.price ? (p.price * sharePct / 100) : 0
        myPriceMap[p.status] = (myPriceMap[p.status] || 0) + myPrice
        if (p.status === 'Delivered' && p.fiverrFeeEnabled !== false) {
          myFeeDelivered += myPrice
        }
      }
      if (p.currentProjectDate) {
        const d = new Date(p.currentProjectDate)
        const key = format(d, "yyyy-MM-dd")
        dayMap[key] = (dayMap[key] || 0) + 1
      }
    })

    const chartData = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
      color: statusColors[status] || "#6b7280",
    }))

    const delivered = myPriceMap["Delivered"] || 0
    const cancelled = myPriceMap["Cancelled"] || 0
    const total = Object.values(myPriceMap).reduce((a, b) => a + b, 0)
    const inProgress = total - delivered - cancelled
    const globalFiverrFee = typeof window !== "undefined" ? localStorage.getItem("fiverrFeeEnabled") !== "false" : true
    const fee = globalFiverrFee ? myFeeDelivered * 0.2 : 0

    let monthlyData = []
    if (filterMode === "range" && dateRange?.from && dateRange?.to) {
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
      monthlyData = days.map((day) => {
        const key = format(day, "yyyy-MM-dd")
        return { date: key, count: dayMap[key] || 0 }
      })
    } else if (filterMode === "month") {
      const { from, to } = getMonthRange(selectedYear, selectedMonth, startDay)
      const days = eachDayOfInterval({ start: from, end: to })
      monthlyData = days.map((day) => {
        const key = format(day, "yyyy-MM-dd")
        return { date: key, count: dayMap[key] || 0 }
      })
    }

    const filteredProjectIds = new Set(filtered.map(p => p._id))

    return {
      stats: {
        totalProjects: filtered.length,
        runningProjects: running,
        completedProjects: completed,
        pendingProjects: pending,
        onHoldProjects: onHold,
        revisionProjects: revision,
      },
      chartData,
      revenueData: {
        total,
        delivered,
        inProgress,
        cancelled,
        fee,
        net: delivered - fee,
      },
      monthlyData,
      recentProjects: filtered.slice(0, 10),
      filteredProjectIds,
    }
  }, [filtered, userId, filterMode, dateRange, selectedYear, selectedMonth, startDay])

  const recentUpdates = useMemo(() => {
    return allUpdates.filter(u => {
      const pid = u.project?._id || u.project
      return filteredProjectIds.has(pid)
    })
  }, [allUpdates, filteredProjectIds])

  if (status === "loading") return null

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
              Welcome back, {session?.user?.name}
            </h1>
            <p className="text-sm text-muted-foreground">Dashboard overview</p>
          </div>
          <div className="hidden sm:flex sm:flex-row sm:items-center sm:gap-2">
            <DashboardScreenOptions visibility={visibility} onChange={setVisibility} />
            {visibility.filterBar !== false && (
              <div className="flex rounded-lg border p-0.5 bg-muted/30">
                <Button
                  variant={filterMode === "month" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilterMode("month")}
                  className="flex-1 sm:flex-none rounded-md px-2.5 text-xs"
                >
                  <span className="hidden sm:inline">Month</span>
                </Button>
                <Button
                  variant={filterMode === "range" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilterMode("range")}
                  className="flex-1 sm:flex-none rounded-md px-2.5 text-xs"
                >
                  <span className="hidden sm:inline">Range</span>
                </Button>
                <Button
                  variant={filterMode === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilterMode("all")}
                  className="flex-1 sm:flex-none rounded-md px-2.5 text-xs"
                >
                  <span className="hidden sm:inline">All</span>
                </Button>
              </div>
            )}
            {visibility.filterBar !== false && filterMode === "month" && (
              <div className="flex gap-1.5 sm:w-auto">
                <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                  <SelectTrigger className="sm:w-[100px] h-8">
                    <SelectValue placeholder={format(new Date(2024, selectedMonth - 1), "MMM")} />
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
                  <SelectTrigger className="sm:w-[85px] h-8">
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
            {visibility.filterBar !== false && filterMode === "range" && (
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            )}
            <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
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
          <div className="flex sm:hidden flex-col gap-2 w-full">
            <div className="flex items-center gap-2 w-full">
              <DashboardScreenOptions visibility={visibility} onChange={setVisibility} />
              {visibility.filterBar !== false && (
                <div className="flex flex-1 rounded-lg border p-0.5 bg-muted/30">
                  <Button
                    variant={filterMode === "month" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterMode("month")}
                    className="flex-1 rounded-md px-2.5 text-xs"
                  >
                    <Calendar className="size-4" />
                  </Button>
                  <Button
                    variant={filterMode === "range" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterMode("range")}
                    className="flex-1 rounded-md px-2.5 text-xs"
                  >
                    <ArrowLeftRight className="size-4" />
                  </Button>
                  <Button
                    variant={filterMode === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterMode("all")}
                    className="flex-1 rounded-md px-2.5 text-xs"
                  >
                    <List className="size-4" />
                  </Button>
                </div>
              )}
            </div>
            {visibility.filterBar !== false && filterMode !== "all" && (
              <div className="flex items-center gap-2">
                {filterMode === "month" && (
                  <div className="flex gap-1.5 w-full">
                    <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                      <SelectTrigger className="flex-1 h-8">
                        <SelectValue placeholder={format(new Date(2024, selectedMonth - 1), "MMM")} />
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
                      <SelectTrigger className="flex-1 h-8">
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
              </div>
            )}
          </div>
        </div>

      {dataLoading ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[60px] sm:h-[100px] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`h-[68px] sm:h-[72px] rounded-xl bg-muted animate-pulse ${i > 1 ? 'hidden sm:block' : ''} ${i > 2 ? 'hidden lg:block' : ''} ${i > 4 ? 'hidden xl:block' : ''}`} />
            ))}
          </div>
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <div className="h-[260px] sm:h-[300px] rounded-xl bg-muted animate-pulse" />
            <div className="h-[260px] sm:h-[300px] rounded-xl bg-muted animate-pulse" />
          </div>
          <div className="h-[180px] sm:h-[200px] rounded-xl bg-muted animate-pulse" />
          <div className="h-[180px] sm:h-[200px] rounded-xl bg-muted animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {visibility.statsCards !== false && (
            <div className="animate-fade-in-up stagger-1"><StatsCards stats={stats} visibility={visibility} /></div>
          )}
          {visibility.revenueSummary !== false && (
            <div className="animate-fade-in-up stagger-2"><RevenueSummary data={revenueData} highlight="net" showFiverrFee={localStorage.getItem("fiverrFeeEnabled") !== "false"} visibility={visibility} /></div>
          )}
          {(visibility.statusChart !== false || visibility.monthlyChart !== false) && (
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 animate-fade-in-up stagger-3">
              {visibility.statusChart !== false && <StatusChart data={chartData} />}
              {visibility.monthlyChart !== false && <MonthlyProgressChart data={monthlyData} />}
            </div>
          )}
          {visibility.recentProjects !== false && (
            <div className="animate-fade-in-up stagger-4"><RecentProjects projects={recentProjects} visibility={visibility} /></div>
          )}
          {visibility.recentUpdates !== false && (
            <div className="animate-fade-in-up stagger-5"><RecentUpdates updates={filterUpdatesByVisibility(recentUpdates, visibility)} /></div>
          )}
        </div>
      )}
    </div>
  )
}
