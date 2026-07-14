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
import { Badge } from "@/components/ui/badge"
import { Search, X, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUSES = ["Pending", "In Progress", "Delivered", "Revision", "On Hold", "Cancelled"]
const PRIORITIES = ["Low", "Medium", "High", "Urgent"]
const CMS_OPTIONS = ["WordPress", "WooCommerce", "Shopify", "Wix", "Webflow", "Next.js", "React", "Laravel", "PHP", "Custom", "HTML", "Other"]

export default function ProjectFilters({ filters = {}, onFilterChange, onSearch }) {
  const [searchValue, setSearchValue] = useState(filters.search || "")
  const [showFilters, setShowFilters] = useState(false)
  const debounceRef = useRef(null)

  const handleFilterChange = useCallback((key, value) => {
    onFilterChange?.({ ...filters, [key]: value || undefined })
  }, [filters, onFilterChange])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearch?.(searchValue), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchValue, onSearch])

  const clearFilters = () => {
    setSearchValue("")
    onFilterChange?.({})
    onSearch?.("")
  }

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== "search" && v).length
  const hasFilters = searchValue || activeFilterCount > 0

  const FilterBadge = ({ label, onRemove }) => (
    <Badge variant="secondary" className="gap-1 text-xs px-2 py-0 h-6 shrink-0">
      {label}
      <button onClick={onRemove} className="hover:text-foreground cursor-pointer">
        <X className="size-3" />
      </button>
    </Badge>
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search projects..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Button
          variant={showFilters || activeFilterCount > 0 ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={cn("shrink-0 h-9 gap-1.5", (showFilters || activeFilterCount > 0) && "bg-primary/90 hover:bg-primary")}
        >
          <Filter className="size-4" />
          {activeFilterCount > 0 && (
            <span className="text-xs font-medium">{activeFilterCount}</span>
          )}
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0 h-9 gap-1">
            <X className="size-4" />
            <span className="hidden sm:inline text-xs">Clear</span>
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-lg border bg-muted/30">
          <Select value={filters.status || ""} onValueChange={(v) => handleFilterChange("status", v)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.priority || ""} onValueChange={(v) => handleFilterChange("priority", v)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.cms || ""} onValueChange={(v) => handleFilterChange("cms", v)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="CMS" />
            </SelectTrigger>
            <SelectContent>
              {CMS_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {hasFilters && !showFilters && (
        <div className="flex flex-wrap items-center gap-1">
          {activeFilterCount === 0 && searchValue && (
            <FilterBadge label={`"${searchValue}"`} onRemove={() => { setSearchValue(""); onSearch?.("") }} />
          )}
          {filters.status && (
            <FilterBadge label={`${filters.status}`} onRemove={() => handleFilterChange("status", "")} />
          )}
          {filters.priority && (
            <FilterBadge label={`${filters.priority}`} onRemove={() => handleFilterChange("priority", "")} />
          )}
          {filters.cms && (
            <FilterBadge label={`${filters.cms}`} onRemove={() => handleFilterChange("cms", "")} />
          )}
        </div>
      )}
    </div>
  )
}
