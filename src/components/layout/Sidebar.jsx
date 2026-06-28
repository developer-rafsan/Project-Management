"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderKanban,
  Kanban,
  LogOut,
  X,
} from "lucide-react"

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
]

export default function Sidebar({ isOpen, onToggle }) {
  const pathname = usePathname()

  const content = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Kanban className="h-6 w-6 text-emerald-400" />
          <span className="text-lg font-bold text-white">NanoPiCode</span>
        </Link>
        <button
          onClick={onToggle}
          className="flex items-center justify-center rounded-md p-1 text-zinc-400 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-sm font-medium",
                  "text-zinc-400 hover:text-white hover:bg-white/10",
                  isActive && "bg-white/10 text-white shadow-sm"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full justify-start gap-3 text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
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
            className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border-r border-white/10 backdrop-blur-xl lg:hidden"
          >
            {content}
          </motion.aside>
        )}
      </AnimatePresence>

      <aside className="hidden lg:flex inset-y-0 left-0 w-64 flex-col bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border-r border-white/10">
        {content}
      </aside>
    </>
  )
}
