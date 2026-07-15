"use client"

import { useEffect } from "react"
import { ServerError } from "@/components/shared/ServerError"

export default function DashboardError({ error, reset }) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  const isServerError =
    error?.message?.toLowerCase().includes("server error") ||
    error?.message?.toLowerCase().includes("internal server") ||
    error?.message?.toLowerCase().includes("fetch") ||
    error?.message?.toLowerCase().includes("network") ||
    !error?.message

  if (isServerError) {
    return (
      <ServerError
        fullPage
        message="Server is down"
        description="Unable to load dashboard data. The server may be unavailable. Please try again."
        onRetry={reset}
      />
    )
  }

  return (
    <ServerError
      fullPage
      message="Something went wrong"
      description={error?.message || "An unexpected error occurred while loading the dashboard."}
      onRetry={reset}
    />
  )
}
