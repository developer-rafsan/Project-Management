"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

const STATUSES = ["Pending", "In Progress", "Waiting Client", "Delivered", "On Hold", "Cancelled"]
const PRIORITIES = ["Low", "Medium", "High", "Urgent"]
const CMS_OPTIONS = ["WordPress", "WooCommerce", "Shopify", "Webflow", "Next.js", "React", "Laravel", "PHP", "Custom", "HTML", "Other"]
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1
const YEARS = Array.from({ length: CURRENT_YEAR - 2022 + 1 }, (_, i) => 2022 + i)

function getAvailableMonths(selectedYear) {
  if (!selectedYear || selectedYear < CURRENT_YEAR) return Array.from({ length: 12 }, (_, i) => i + 1)
  return Array.from({ length: CURRENT_MONTH }, (_, i) => i + 1)
}

export default function ProjectFilters({ filters = {}, onFilterChange, onSearch }) {
  const [searchValue, setSearchValue] = useState(filters.search || "")
  const debounceRef = useRef(null)

  const availableMonths = getAvailableMonths(filters.year ? Number(filters.year) : null)

  const handleFilterChange = useCallback((key, value) => {
    const next = { ...filters, [key]: value || undefined }
    if (key === "year" && value) {
      const y = Number(value)
      const m = next.month ? Number(next.month) : 0
      const maxMonth = y >= CURRENT_YEAR ? CURRENT_MONTH : 12
      if (m > maxMonth) {
        next.month = undefined
      }
    }
    onFilterChange?.(next)
  }, [filters, onFilterChange])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearch?.(searchValue)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchValue, onSearch])

  const clearFilters = () => {
    setSearchValue("")
    onFilterChange?.({})
    onSearch?.("")
  }

  const hasFilters = Object.values(filters).some(v => v !== undefined && v !== null && v !== "")

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search projects..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-8"
        />
      </div>

      <Select value={filters.status || ""} onValueChange={(v) => handleFilterChange("status", v)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.priority || ""} onValueChange={(v) => handleFilterChange("priority", v)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.cms || ""} onValueChange={(v) => handleFilterChange("cms", v)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="CMS" />
        </SelectTrigger>
        <SelectContent>
          {CMS_OPTIONS.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.month ? String(filters.month) : ""} onValueChange={(v) => handleFilterChange("month", v ? Number(v) : undefined)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Month">
            {filters.month ? MONTH_NAMES[Number(filters.month) - 1] : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableMonths.map((m) => (
            <SelectItem key={m} value={String(m)}>{MONTH_NAMES[m - 1]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.year ? String(filters.year) : ""} onValueChange={(v) => handleFilterChange("year", v ? Number(v) : undefined)}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {YEARS.filter((y) => y <= CURRENT_YEAR).map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="size-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
