"use client"

import { useMemo } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Monitor, ChevronDown } from "lucide-react"

export const SCREEN_OPTIONS = [
  { id: "title", label: "Title", default: true, section: "data" },
  { id: "status", label: "Status", default: true, section: "data" },
  { id: "priority", label: "Priority", default: false, section: "data" },
  { id: "website", label: "Website", default: true, section: "data" },
  { id: "price", label: "Price", default: true, section: "data" },
  { id: "progress", label: "Progress", default: true, section: "data" },
  { id: "cms", label: "CMS", default: false, section: "data" },
  { id: "date", label: "Date", default: true, section: "data" },
  { id: "serial", label: "S/N", default: false, section: "data" },
  { id: "orderId", label: "Order ID", default: false, section: "data" },
  { id: "tags", label: "Tags", default: false, section: "data" },
  { id: "owner", label: "Owner", default: false, section: "data" },
  { id: "createdBy", label: "Created By", default: false, section: "data" },
  { id: "assignee", label: "Contributors", default: false, section: "data" },
  { id: "description", label: "Description", default: false, section: "data" },
  { id: "figma", label: "Figma", default: false, section: "data" },
  { id: "references", label: "References", default: false, section: "data" },
  { id: "search", label: "Search", default: true, section: "filter" },
  { id: "filterPanel", label: "Filters", default: true, section: "filter" },
  { id: "monthFilter", label: "Month Filter", default: true, section: "filter" },
  { id: "header", label: "Title Bar", default: true, section: "ui" },
  { id: "bulkActionBar", label: "Bulk Action Bar", default: true, section: "ui" },
  { id: "pagination", label: "Pagination", default: true, section: "ui" },
]

const DATA_GROUPS = [
  { label: "Info", ids: ["title", "status", "priority", "date", "serial"] },
  { label: "Details", ids: ["orderId", "cms", "tags", "description"] },
  { label: "People", ids: ["owner", "createdBy", "assignee"] },
  { label: "Links", ids: ["website", "figma", "references"] },
  { label: "Finance", ids: ["price", "progress"] },
  { label: "Interface", ids: ["header", "bulkActionBar", "pagination"], section: "ui" },
]

const UI_GROUPS = [
  { label: "Toolbar", ids: ["search", "filterPanel", "monthFilter"] },
  { label: "Interface", ids: ["header", "bulkActionBar", "pagination"] },
]

export function getDefaultVisibility() {
  const defaults = {}
  SCREEN_OPTIONS.forEach((o) => { defaults[o.id] = o.default })
  return defaults
}

function Checkbox({ checked }) {
  return (
    <span className={cn(
      "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-all duration-150",
      checked
        ? "border-primary bg-primary text-primary-foreground shadow-sm"
        : "border-input bg-transparent group-hover:border-muted-foreground/40"
    )}>
      {checked && (
        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </span>
  )
}

export default function DisplayOptions({ visibility, onChange }) {
  const activeCount = useMemo(() =>
    SCREEN_OPTIONS.filter((o) => visibility[o.id]).length,
  [visibility])

  const toggle = (id) => {
    onChange({ ...visibility, [id]: !visibility[id] })
  }

  return (
    <Popover>
      <PopoverTrigger className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all select-none cursor-pointer group">
        <Monitor className="size-3.5" />
        <span className="hidden sm:inline">Screen</span>
        <span className="sm:hidden">Scrn</span>
        {activeCount > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary leading-none">
            {activeCount}
          </span>
        )}
        <ChevronDown className="size-3.5 opacity-60 group-data-open:rotate-180 transition-transform" />
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-72 p-0 overflow-hidden rounded-xl" sideOffset={8}>
        <div className="max-h-[70vh] overflow-y-auto">
          {DATA_GROUPS.map((group) => {
            const items = SCREEN_OPTIONS.filter((o) => group.ids.includes(o.id))
            if (items.length === 0) return null
            return (
              <div key={group.label} className="border-b border-border/40 last:border-b-0">
                <div className="px-3 pt-2.5 pb-1">
                  <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">{group.label}</p>
                </div>
                <div className="px-2 pb-2 grid grid-cols-2 gap-0.5">
                  {items.map((col) => {
                    const isOn = visibility[col.id]
                    return (
                      <button
                        key={col.id}
                        onClick={() => toggle(col.id)}
                        className={cn(
                          "group flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-left transition-all cursor-pointer select-none",
                          isOn
                            ? "bg-primary/[0.04] text-foreground font-medium"
                            : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/60"
                        )}
                      >
                        <Checkbox checked={isOn} />
                        {col.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {UI_GROUPS.map((group) => (
            <div key={group.label} className="border-b border-border/40 last:border-b-0">
              <div className="px-3 pt-2.5 pb-1">
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">{group.label}</p>
              </div>
              <div className="px-2 pb-2.5 grid grid-cols-2 gap-0.5">
                {group.ids.map((id) => {
                  const option = SCREEN_OPTIONS.find((o) => o.id === id)
                  if (!option) return null
                  const isOn = visibility[option.id]
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggle(option.id)}
                      className={cn(
                        "group flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-left transition-all cursor-pointer select-none",
                        isOn
                          ? "bg-primary/[0.04] text-foreground font-medium"
                          : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/60"
                      )}
                    >
                      <Checkbox checked={isOn} />
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
