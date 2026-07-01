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

export default function ProjectFilters({ filters = {}, onFilterChange, onSearch }) {
  const [searchValue, setSearchValue] = useState(filters.search || "")
  const debounceRef = useRef(null)

  const handleFilterChange = useCallback((key, value) => {
    onFilterChange?.({ ...filters, [key]: value || undefined })
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
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search projects..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto">
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

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 shrink-0">
            <X className="size-4" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}
      </div>
    </div>
  )
}
