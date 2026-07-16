"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, X, SlidersHorizontal, ChevronDown, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUSES = ["Pending", "In Progress", "Delivered", "Revision", "On Hold", "Cancelled"]
const PRIORITIES = ["Low", "Medium", "High", "Urgent"]
const CMS_OPTIONS = ["WordPress", "WooCommerce", "Shopify", "Wix", "Webflow", "Next.js", "React", "Laravel", "PHP", "Custom", "HTML", "Other"]

function MultiSelectFilter({ label, options, selected = [], onChange }) {
  const [open, setOpen] = useState(false)

  const handleToggle = (option) => {
    onChange(
      selected.includes(option)
        ? selected.filter((v) => v !== option)
        : [...selected, option]
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(
        "group relative flex h-9 items-center gap-1.5 rounded-lg border border-input bg-card px-3 text-xs font-medium select-none cursor-pointer transition-all hover:border-muted-foreground/30 hover:bg-accent/50",
        open && "border-primary/50 ring-1 ring-primary/20",
        selected.length > 0 && "border-primary/30"
      )}>
        <span className="text-foreground/80">{label}</span>
        {selected.length > 0 && (
          <span className="flex size-4.5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary ml-auto">
            {selected.length}
          </span>
        )}
        <ChevronDown className={cn(
          "size-3.5 text-muted-foreground/60 shrink-0 transition-transform duration-200",
          open && "rotate-180"
        )} />
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="start" sideOffset={6}>
        {selected.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1 pb-2 border-b border-border/50">
            {selected.map((v) => (
              <Badge key={v} variant="secondary" className="gap-1 text-[11px] px-1.5 py-0 h-5">
                {v}
                <button onClick={() => handleToggle(v)} className="hover:text-foreground cursor-pointer">
                  <X className="size-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="space-y-0.5 max-h-56 overflow-y-auto">
          {options.map((option) => {
            const isSelected = selected.includes(option)
            return (
              <label
                key={option}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm cursor-pointer transition-colors select-none",
                  isSelected ? "bg-primary/5" : "hover:bg-muted"
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggle(option)}
                  className={cn(isSelected && "border-primary")}
                />
                <span className={cn("flex-1", isSelected && "font-medium text-foreground")}>
                  {option}
                </span>
              </label>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function ProjectFilters({ filters = {}, onFilterChange, onSearch, visibility }) {
  const [searchValue, setSearchValue] = useState(filters.search || "")
  const [showFilters, setShowFilters] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearch?.(searchValue), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchValue, onSearch])

  const handleFilterChange = useCallback((key, value) => {
    onFilterChange?.({ ...filters, [key]: value })
  }, [filters, onFilterChange])

  const clearFilters = () => {
    setSearchValue("")
    onFilterChange?.({})
    onSearch?.("")
  }

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== "search" && (Array.isArray(v) ? v.length > 0 : !!v)
  ).length
  const hasFilters = searchValue || activeFilterCount > 0

  const filterItems = [
    ...(filters.status || []).map((v) => ({ key: "status", label: v })),
    ...(filters.priority || []).map((v) => ({ key: "priority", label: v })),
    ...(filters.cms || []).map((v) => ({ key: "cms", label: v })),
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {visibility?.search !== false && (
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by order ID, project name, or URL..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-9 pl-9 pr-8 rounded-lg bg-muted/30 border-input/60 text-sm focus-visible:bg-card transition-colors"
            />
            {searchValue && (
              <button
                onClick={() => { setSearchValue(""); onSearch?.("") }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
        {visibility?.filterPanel !== false && (
          <Button
            variant={showFilters || activeFilterCount > 0 ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "shrink-0 h-9 gap-2 px-3 transition-all cursor-pointer",
              showFilters && "ring-1 ring-primary/30",
              activeFilterCount > 0 && !showFilters && "bg-primary/90 hover:bg-primary shadow-sm"
            )}
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline text-xs font-medium">
              {showFilters ? "Hide filters" : "Filters"}
            </span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary-foreground/20 text-[11px] font-semibold leading-none">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}
      </div>

      {visibility?.filterPanel !== false && (
        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-start gap-2 p-3 rounded-xl border bg-card shadow-sm">
                <MultiSelectFilter
                  label="Status"
                  options={STATUSES}
                  selected={filters.status || []}
                  onChange={(v) => handleFilterChange("status", v)}
                />
                <MultiSelectFilter
                  label="Priority"
                  options={PRIORITIES}
                  selected={filters.priority || []}
                  onChange={(v) => handleFilterChange("priority", v)}
                />
                <MultiSelectFilter
                  label="CMS"
                  options={CMS_OPTIONS}
                  selected={filters.cms || []}
                  onChange={(v) => handleFilterChange("cms", v)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {hasFilters && !showFilters && filterItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-1.5"
        >
          {searchValue && visibility?.search !== false && (
            <Badge variant="secondary" className="gap-1.5 text-xs px-2.5 py-0.5 h-6 shrink-0 rounded-md border border-border/50">
              <Search className="size-3 text-muted-foreground" />
              <span className="max-w-[120px] truncate">{searchValue}</span>
              <button onClick={() => { setSearchValue(""); onSearch?.("") }} className="ml-0.5 hover:text-foreground cursor-pointer">
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {filterItems.map((item) => (
            <Badge
              key={`${item.key}-${item.label}`}
              variant="secondary"
              className="gap-1.5 text-xs px-2.5 py-0.5 h-6 shrink-0 rounded-md border border-border/50"
            >
              <span className="text-muted-foreground/70 capitalize">{item.key}:</span>
              <span className="font-medium">{item.label}</span>
              <button
                onClick={() => handleFilterChange(item.key, (filters[item.key] || []).filter((v) => v !== item.label))}
                className="ml-0.5 hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
          >
            <RotateCcw className="size-3" />
            Clear all
          </Button>
        </motion.div>
      )}
    </div>
  )
}
