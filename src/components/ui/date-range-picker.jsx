"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

function DateRangePicker({ value, onChange, className }) {
  const date = value?.from ? format(value.from, "MMM d, yyyy") : ""
  const dateTo = value?.to ? format(value.to, "MMM d, yyyy") : ""
  const display = value?.from ? `${date} — ${dateTo || "..."}` : "Pick a date range"

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full sm:w-[240px] justify-start text-left font-normal text-sm",
          !value?.from && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="mr-2 size-4 shrink-0" />
        <span className="truncate">{display}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          initialFocus
          numberOfMonths={2}
          captionLayout="dropdown"
          fromYear={2022}
          toYear={new Date().getFullYear()}
          classNames={{
            month_caption: "flex justify-center pt-1 relative items-center w-full gap-[10px]",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DateRangePicker }
