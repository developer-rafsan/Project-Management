"use client"

import { useState, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useSelector, useDispatch } from "react-redux"
import { clearProjects } from "@/lib/features/projectSlice"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Menu,
  Search,
  LogOut,
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Kanban,
  Hash,
  StickyNote,
  Settings,
} from "lucide-react"

const pageTitles = {
  "/dashboard": "Dashboard",
  "/dashboard/projects": "Projects",
  "/dashboard/projects/new": "Create Project",
  "/dashboard/notes": "Notes",
  "/dashboard/settings": "Settings",
}

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/projects/new", label: "Create Project", icon: PlusCircle },
  { href: "/dashboard/notes", label: "Notes", icon: StickyNote },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef(null)
  const dispatch = useDispatch()
  const projects = useSelector((s) => s.projects?.items || [])

  const title =
    Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ||
    "Dashboard"

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <Sheet>
        <SheetTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden")}>
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950">
            <SheetHeader className="flex h-16 flex-row items-center gap-2 border-b border-white/10 px-6">
              <Kanban className="h-6 w-6 text-emerald-400" />
              <SheetTitle className="text-lg font-bold text-white">
                NanoPiCode
              </SheetTitle>
            </SheetHeader>
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
                onClick={() => {
                  dispatch(clearProjects())
                  signOut({ callbackUrl: "/login" })
                }}
                className="w-full justify-start gap-3 text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <h1 className="text-lg font-semibold">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          aria-label="Search"
          onClick={() => {
            setSearchQuery("")
            setSearchOpen(true)
            setTimeout(() => searchInputRef.current?.focus(), 100)
          }}
        >
          <Search className="h-5 w-5" />
        </Button>

        <Avatar className="size-8 cursor-default">
          <AvatarImage
            src={session?.user?.image}
            alt={session?.user?.name || "User"}
          />
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Project by Order ID</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              ref={searchInputRef}
              placeholder="Type order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  const match = projects.find((p) =>
                    p.orderId?.toLowerCase().includes(searchQuery.trim().toLowerCase())
                  )
                  if (match) {
                    setSearchOpen(false)
                    router.push(`/dashboard/projects/${match._id}`)
                  }
                }
              }}
            />
            <div className="max-h-60 overflow-y-auto space-y-1">
              {searchQuery.trim() &&
                projects
                  .filter((p) =>
                    p.orderId?.toLowerCase().includes(searchQuery.trim().toLowerCase())
                  )
                  .slice(0, 10)
                  .map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                      onClick={() => {
                        setSearchOpen(false)
                        router.push(`/dashboard/projects/${p._id}`)
                      }}
                    >
                      <Hash className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="font-mono text-xs">{p.orderId || "-"}</span>
                      <span className="text-muted-foreground truncate">{p.projectName}</span>
                    </button>
                  ))}
              {searchQuery.trim() && projects.filter((p) =>
                p.orderId?.toLowerCase().includes(searchQuery.trim().toLowerCase())
              ).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">No projects found</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
