"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Sidebar from "@/components/layout/Sidebar"
import Navbar from "@/components/layout/Navbar"
import { getSettings, syncSettingsToLocalStorage } from "@/actions/settingsActions"

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const setupChecked = useRef(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    getSettings()
      .then((data) => syncSettingsToLocalStorage(data))
      .catch(() => {})
  }, [status])

  useEffect(() => {
    if (status !== "authenticated" || setupChecked.current) return
    setupChecked.current = true
    fetch("/api/profile")
      .then((res) => res.json())
      .then((user) => {
        if (!user.setupComplete && pathname !== "/setup") {
          router.replace("/setup")
        }
      })
      .catch(() => {})
  }, [status, pathname, router])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 flex flex-col overflow-hidden p-0 sm:p-0">
          <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                className="h-full"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
          <footer className="shrink-0 border-t border-border py-3 text-center text-[10px] text-muted-foreground">
            Crafted by{" "}
            <span className="font-medium text-primary">NanoPiCode</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
