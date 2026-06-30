"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { getStats } from "@/actions/projectActions"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import StatsCards from "@/components/dashboard/StatsCards"
import RevenueSummary from "@/components/dashboard/RevenueSummary"
import RecentProjects from "@/components/dashboard/RecentProjects"
import RecentUpdates from "@/components/dashboard/RecentUpdates"
import StatusChart from "@/components/dashboard/StatusChart"
import MonthlyProgressChart from "@/components/dashboard/MonthlyProgressChart"
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from "date-fns"

const statusColors = {
  Pending: "#eab308",
  "In Progress": "#6366f1",
  "Waiting Client": "#a855f7",
  Delivered: "#10b981",
  "On Hold": "#f97316",
  Cancelled: "#ef4444",
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const now = new Date()
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(now),
    to: endOfMonth(now),
  })
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [revenueData, setRevenueData] = useState(null)
  const [recentProjects, setRecentProjects] = useState([])
  const [recentUpdates, setRecentUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login")
  }, [status, router])

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return
    setLoading(true)
    const fromStart = new Date(dateRange.from)
    fromStart.setHours(0, 0, 0, 0)
    const toEnd = new Date(dateRange.to)
    toEnd.setHours(23, 59, 59, 999)
    getStats({
      from: fromStart.toISOString(),
      to: toEnd.toISOString(),
    })
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

        setRecentProjects(data.recentProjects || [])
        setRecentUpdates(data.recentUpdates || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dateRange?.from, dateRange?.to])

  if (status === "loading") return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {session?.user?.name}
          </h1>
          <p className="text-muted-foreground">
            {dateRange?.from && dateRange?.to
              ? `${format(dateRange.from, "MMM d, yyyy")} — ${format(dateRange.to, "MMM d, yyyy")}`
              : ""}
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
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