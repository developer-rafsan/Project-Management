"use client"

import { useEffect } from "react"
import { ServerError } from "@/components/shared/ServerError"

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Root error boundary:", error)
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
        description="Our server is currently unavailable. Please try again later."
        onRetry={reset}
      />
    )
  }

  return (
    <ServerError
      fullPage
      message="Something went wrong"
      description={error?.message || "An unexpected error occurred. Please try again."}
      onRetry={reset}
    />
  )
}
