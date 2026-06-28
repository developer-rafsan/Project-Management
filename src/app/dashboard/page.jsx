"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { getStats } from "@/actions/projectActions"
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

const statusColors = {
  Pending: "#eab308",
  "In Progress": "#6366f1",
  "Waiting Client": "#a855f7",
  Delivered: "#10b981",
  "On Hold": "#f97316",
  Cancelled: "#ef4444",
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1
const YEARS = Array.from({ length: CURRENT_YEAR - 2022 + 1 }, (_, i) => 2022 + i)

function getAvailableMonths(selectedYear) {
  if (selectedYear < CURRENT_YEAR) return Array.from({ length: 12 }, (_, i) => i + 1)
  return Array.from({ length: CURRENT_MONTH }, (_, i) => i + 1)
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const handleYearChange = (v) => {
    const y = Number(v)
    const validMonths = getAvailableMonths(y)
    setYear(y)
    if (!validMonths.includes(month)) {
      setMonth(validMonths[validMonths.length - 1])
    }
  }
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
    setLoading(true)
    getStats({ month, year })
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

        const daysInMonth = data.chartData?.daysInMonth || new Date(year, month, 0).getDate()
        const progressMap = {}
        ;(data.chartData?.monthlyProgress || []).forEach((d) => {
          progressMap[d.day] = d.count
        })
        const monthly = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const date = new Date(year, month - 1, day).toISOString().split("T")[0]
          return { date, count: progressMap[day] || 0 }
        })
        setMonthlyData(monthly)

        setRecentProjects(data.recentProjects || [])
        setRecentUpdates(data.recentUpdates || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [month, year])

  if (status === "loading") return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {session?.user?.name}
          </h1>
          <p className="text-muted-foreground">
            {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue>{MONTH_NAMES[month - 1]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {getAvailableMonths(year).map((m) => (
                <SelectItem key={m} value={String(m)}>{MONTH_NAMES[m - 1]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.filter((y) => y <= CURRENT_YEAR).map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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