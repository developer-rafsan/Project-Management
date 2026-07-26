"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Monitor, SlidersHorizontal, RotateCcw, Eye, EyeOff, X } from "lucide-react"

const GROUPS = [
  {
    label: "Header",
    items: [
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

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}

export default function DashboardScreenOptions({ visibility, onChange }) {
  const totalItems = getFlatItems().length
  const activeCount = useMemo(() =>
    getFlatItems().filter((o) => visibility[o.id]).length,
  [visibility])

  const toggle = (id) => {
    onChange({ ...visibility, [id]: !visibility[id] })
  }

  const resetDefaults = () => {
    onChange(getDefaultDashboardVisibility())
  }

  return (
    <Sheet>
      <SheetTrigger className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 hover:bg-accent/50 transition-all select-none cursor-pointer group">
        <Monitor className="size-4" />
        <span className="hidden sm:inline">Screen</span>
        <span className="flex size-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary leading-none">
          {activeCount}
        </span>
      </SheetTrigger>
      <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-sm p-0 gap-0 min-h-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              Screen Options
            </SheetTitle>
            <SheetClose className="inline-flex items-center justify-center size-6 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-accent transition-colors cursor-pointer">
              <X className="size-4" />
            </SheetClose>
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            {activeCount} of {totalItems} items visible
          </p>
        </SheetHeader>
        <ScrollArea className="flex-1 min-h-0 px-3 py-2">
          <div className="space-y-1">
            {GROUPS.map((group) => {
              const allOn = group.items.every((o) => visibility[o.id])
              const someOn = group.items.some((o) => visibility[o.id])
              return (
                <div key={group.label}>
                  <div className="flex items-center justify-between px-2 py-2 mt-2 first:mt-0">
                    <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.12em]">
                      {group.label}
                    </p>
                    <button
                      onClick={() => {
                        const next = {}
                        group.items.forEach((o) => { next[o.id] = !allOn })
                        onChange({ ...visibility, ...next })
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] transition-colors cursor-pointer",
                        someOn
                          ? "text-muted-foreground/40 hover:text-muted-foreground/70"
                          : "text-muted-foreground/20"
                      )}
                    >
                      {allOn ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                      {allOn ? "All" : "Off"}
                    </button>
                  </div>
                  <div className="rounded-lg bg-muted/30 border border-border/30 overflow-hidden divide-y divide-border/20">
                    {group.items.map((o) => {
                      const isOn = visibility[o.id]
                      return (
                        <div
                          key={o.id}
                          onClick={() => toggle(o.id)}
                          className={cn(
                            "flex items-center justify-between px-3 py-2.5 cursor-pointer select-none transition-colors",
                            isOn
                              ? "bg-background/80"
                              : "bg-transparent opacity-60 hover:opacity-100"
                          )}
                        >
                          <span className={cn(
                            "text-xs transition-colors",
                            isOn ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {o.label}
                          </span>
                          <Toggle checked={isOn} onChange={() => toggle(o.id)} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
        <SheetFooter className="px-4 py-3 border-t border-border/50">
          <button
            onClick={resetDefaults}
            className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg border border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent hover:border-border transition-all cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            Reset to Default
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
