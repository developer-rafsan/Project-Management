"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RefreshCw, WifiOff } from "lucide-react"

export function ServerError({
  message = "Server is not responding",
  description = "The server is currently unavailable. Please check your connection and try again.",
  onRetry,
  fullPage = false,
  className,
}) {
  const content = (
    <div
      data-slot="server-error"
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center",
        fullPage ? "min-h-[60vh]" : "py-16",
        className
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <WifiOff className="size-8 text-destructive" />
      </div>
      <div className="max-w-sm space-y-1.5">
        <p className="text-lg font-semibold tracking-tight">{message}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="size-4" />
          Try Again
        </Button>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        {content}
      </div>
    )
  }

  return content
}
