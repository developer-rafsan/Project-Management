"use client"

import { useMemo } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Monitor, ChevronDown } from "lucide-react"

const GROUPS = [
  {
    label: "Header",
    items: [
      { id: "greeting", label: "Welcome Header", default: true },
      { id: "filterBar", label: "Filter Controls", default: true },
    ],
  },
  {
    label: "Sections",
    items: [
      { id: "statsCards", label: "Stats Cards", default: true },
      { id: "revenueSummary", label: "Revenue Summary", default: true },
      { id: "statusChart", label: "Status Chart", default: true },
      { id: "monthlyChart", label: "Monthly Chart", default: true },
      { id: "recentProjects", label: "Recent Projects", default: true },
      { id: "recentUpdates", label: "Recent Updates", default: true },
    ],
  },
  {
    label: "Stat Cards",
    items: [
      { id: "statTotal", label: "Total Projects", default: true },
      { id: "statRunning", label: "In Progress", default: true },
      { id: "statDelivered", label: "Delivered", default: true },
      { id: "statPending", label: "Pending", default: true },
      { id: "statOnHold", label: "On Hold", default: true },
      { id: "statRevision", label: "Revision", default: true },
    ],
  },
  {
    label: "Revenue Cards",
    items: [
      { id: "revTotal", label: "Total Revenue", default: true },
      { id: "revDelivered", label: "Delivered Revenue", default: true },
      { id: "revInProgress", label: "In Progress Revenue", default: true },
      { id: "revCancelled", label: "Cancelled Revenue", default: true },
      { id: "revFee", label: "Fiverr Fee", default: true },
      { id: "revNet", label: "Net Revenue", default: true },
    ],
  },
  {
    label: "Recent Projects",
    items: [
      { id: "rpOrderId", label: "Order ID", default: true },
      { id: "rpName", label: "Project Name", default: true },
      { id: "rpStatus", label: "Status", default: true },
      { id: "rpPriority", label: "Priority", default: true },
      { id: "rpDate", label: "Start Date", default: true },
    ],
  },
  {
    label: "Activity Types",
    items: [
      { id: "updateStatusChange", label: "Status Change", default: true },
      { id: "updateMonthTransfer", label: "Month Transfer", default: true },
      { id: "updatePersonTransfer", label: "Person Transfer", default: true },
      { id: "updateProjectCreated", label: "Project Created", default: true },
      { id: "updateProjectUpdated", label: "Project Updated", default: true },
      { id: "updateProjectDeleted", label: "Project Deleted", default: true },
    ],
  },
]

const typeToVisKey = {
  status_change: "updateStatusChange",
  month_transfer: "updateMonthTransfer",
  person_transfer: "updatePersonTransfer",
  project_created: "updateProjectCreated",
  project_updated: "updateProjectUpdated",
  project_deleted: "updateProjectDeleted",
}

export function filterUpdatesByVisibility(updates, visibility) {
  return updates.filter((u) => visibility[typeToVisKey[u.type]] !== false)
}

function getFlatItems() {
  return GROUPS.flatMap((g) => g.items)
}

export function getDefaultDashboardVisibility() {
  const defaults = {}
  getFlatItems().forEach((o) => { defaults[o.id] = o.default })
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

export default function DashboardScreenOptions({ visibility, onChange }) {
  const activeCount = useMemo(() =>
    getFlatItems().filter((o) => visibility[o.id]).length,
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
      <PopoverContent side="top" align="end" className="w-64 p-0 overflow-hidden rounded-xl" sideOffset={8}>
        <div className="max-h-[70vh] overflow-y-auto">
          {GROUPS.map((group) => {
            const allOn = group.items.every((o) => visibility[o.id])
            return (
              <div key={group.label} className="border-b border-border/40 last:border-b-0">
                <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                  <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">{group.label}</p>
                  <button
                    onClick={() => {
                      const next = {}
                      group.items.forEach((o) => { next[o.id] = !allOn })
                      onChange({ ...visibility, ...next })
                    }}
                    className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors cursor-pointer"
                  >
                    {allOn ? "All" : "Off"}
                  </button>
                </div>
                <div className="px-2 pb-2 grid grid-cols-2 gap-0.5">
                  {group.items.map((o) => {
                    const isOn = visibility[o.id]
                    return (
                      <button
                        key={o.id}
                        onClick={() => toggle(o.id)}
                        className={cn(
                          "group flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-left transition-all cursor-pointer select-none",
                          isOn
                            ? "bg-primary/[0.04] text-foreground font-medium"
                            : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/60"
                        )}
                      >
                        <Checkbox checked={isOn} />
                        {o.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
