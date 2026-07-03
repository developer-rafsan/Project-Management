"use client"

import { SessionProvider } from "next-auth/react"
import { Provider as ReduxProvider } from "react-redux"
import { store } from "@/lib/store"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NotificationProvider } from "@/components/layout/NotificationProvider"

export function Providers({ children }) {
  return (
    <ReduxProvider store={store}>
      <SessionProvider>
        <ThemeProvider>
          <TooltipProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </SessionProvider>
    </ReduxProvider>
  )
}
