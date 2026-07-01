"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useDispatch } from "react-redux"
import { clearProjects } from "@/lib/features/projectSlice"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { version } from "../../../package.json"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  LayoutDashboard,
  FolderKanban,
  Kanban,
  LogOut,
  X,
  StickyNote,
  Settings,
} from "lucide-react"

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/notes", label: "Notes", icon: StickyNote },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: null, label: "Logout", icon: LogOut, logout: true },
]

export default function Sidebar({ isOpen, onToggle }) {
  const [logoutOpen, setLogoutOpen] = useState(false)
  const pathname = usePathname()
  const dispatch = useDispatch()

  const content = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15">
            <Kanban className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <span className="text-base font-bold text-foreground">NanoPiCode</span>
            <p className="text-[10px] text-muted-foreground leading-tight">Project Manager</p>
          </div>
        </Link>
        <button
          onClick={onToggle}
          className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent lg:hidden transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col py-3 px-3">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Menu
        </p>
        <nav className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            if (item.logout) {
              return (
                <button
                  key="logout"
                  onClick={() => setLogoutOpen(true)}
                  className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              )
            }

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary" />
                  )}
                  <Icon className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-border px-3 pb-3 pt-2">
        <p className="text-[10px] font-medium text-primary/70 text-center uppercase">NanoPiCode V{version}</p>
      </div>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                dispatch(clearProjects())
                signOut({ callbackUrl: "/login" })
              }}
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-border lg:hidden"
          >
            {content}
          </motion.aside>
        )}
      </AnimatePresence>

      <aside className="hidden lg:flex inset-y-0 left-0 w-64 flex-col bg-sidebar border-r border-border">
        {content}
      </aside>
    </>
  )
}
