"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "w-full",
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_grid: "w-full border-collapse space-x-1",
        nav: "flex items-center gap-1",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        chevron: "size-4",
        weekdays: "flex",
        weekday: "w-8 rounded-md text-[0.8rem] font-normal text-muted-foreground",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-accent"
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100"
        ),
        today: "bg-accent text-accent-foreground",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        range_start: "day-range-start rounded-l-md",
        range_end: "day-range-end rounded-r-md",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-1 h-7 w-7 p-0"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-1 h-7 w-7 p-0"
        ),
        ...classNames,
      }}
      {...props}
    />
  )
}

export { Calendar }
