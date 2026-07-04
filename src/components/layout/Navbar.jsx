"use client"

import { useState, useRef, useEffect } from "react"
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
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { version } from "../../../package.json"
import { useNotifications } from "./NotificationProvider"

import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Menu,
  Search,
  LogOut,
  LayoutDashboard,
  FolderKanban,
  Kanban,
  Hash,
  StickyNote,
  Settings,
  Bell,
  Check,
  X,
  Mail,
  MailOpen,
} from "lucide-react"

const pageTitles = {
  "/dashboard": "Dashboard",
  "/dashboard/projects": "Projects",
  "/dashboard/notes": "Notes",
  "/dashboard/settings": "Settings",
}

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/notes", label: "Notes", icon: StickyNote },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: null, label: "Logout", icon: LogOut, logout: true },
]

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [selectedNotif, setSelectedNotif] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [logoutOpen, setLogoutOpen] = useState(false)
  const searchInputRef = useRef(null)
  const notifRef = useRef(null)
  const bellRef = useRef(null)
  const dispatch = useDispatch()

  useEffect(() => {
    if (!notifOpen) return
    function handleClickOutside(e) {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target) &&
        bellRef.current &&
        !bellRef.current.contains(e.target)
      ) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [notifOpen])
  const projects = useSelector((s) => s.projects?.items || [])

  const title =
    Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ||
    "Dashboard"

  const { notifications, unreadCount, fetchNotifications, acceptTransfer, rejectTransfer, setReadStatus } = useNotifications()

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  function formatRelativeTime(dateStr) {
    const now = Date.now()
    const date = new Date(dateStr).getTime()
    const diff = now - date
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const pendingRequests = notifications.filter(
    (n) => n.type === "assignee_transfer_request" && n.status === "pending"
  )
  const recentNotifs = notifications.slice(0, 20)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <Sheet>
        <SheetTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden")}>
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950">
            <SheetHeader className="flex h-16 flex-row items-center gap-2.5 border-b border-white/10 px-6">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15">
                <Kanban className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-white">
                  NanoPiCode
                </SheetTitle>
                <p className="text-[10px] text-zinc-500 leading-tight">Project Manager</p>
              </div>
            </SheetHeader>
            <div className="flex-1 flex flex-col py-3 px-3">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
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
                        className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
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
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "text-zinc-400 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-emerald-400" />
                        )}
                        <Icon className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? "text-emerald-400" : "text-zinc-500 group-hover:text-white"
                        )} />
                        {item.label}
                      </div>
                    </Link>
                  )
                })}
              </nav>
            </div>
            <div className="border-t border-white/10 px-3 pb-3 pt-2">
              <p className="text-[10px] font-medium text-emerald-400/70 text-center uppercase">NanoPiCode V{version}</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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

      <h1 className="text-lg font-semibold">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground cursor-pointer"
          aria-label="Search"
          onClick={() => {
            setSearchQuery("")
            setSearchOpen(true)
            setTimeout(() => searchInputRef.current?.focus(), 100)
          }}
        >
          <Search className="h-5 w-5" />
        </Button>

        <div className="relative">
          <button
            ref={bellRef}
            className="relative flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/60 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Notifications"
            onClick={() => {
              setNotifOpen((prev) => !prev)
              if (!notifOpen) fetchNotifications()
            }}
          >
            <div className="relative">
              <Bell className={`size-5 transition-transform duration-200 ${notifOpen ? 'rotate-12 scale-110 text-primary' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
          </button>
          {notifOpen && (
            <div ref={notifRef} className="absolute right-0 top-full mt-2 z-50 w-88 rounded-xl border bg-card shadow-xl overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Bell className="size-4 text-primary" />
                    <span className="text-sm font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      onClick={() => {
                        notifications.forEach((n) => {
                          if (!n.read) setReadStatus(n._id, true)
                        })
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-border/40 hide-scrollbar">
                  {recentNotifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4">
                      <Bell className="size-8 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">No notifications yet</p>
                    </div>
                  ) : (
                    recentNotifs.map((n) => (
                      <div
                        key={n._id}
                        className={`relative px-4 py-3 cursor-pointer transition-all duration-150 hover:bg-accent/50 group ${
                          !n.read ? 'bg-gradient-to-r from-red-50/80 to-transparent dark:from-red-950/15' : ''
                        }`}
                        onClick={() => {
                          if (n.type === "assignee_transfer_request" && n.status === "pending") return
                          setSelectedNotif(n)
                          setNotifOpen(false)
                          if (!n.read) setReadStatus(n._id, true)
                        }}
                      >
                        {!n.read && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-red-500" />
                        )}
                        <div className="flex items-start gap-3 pl-1">
                          <div className="relative shrink-0 mt-0.5">
                            <Avatar className="size-9 ring-2 ring-background shadow-sm">
                              <AvatarImage src={n.from?.image} />
                              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                                {n.from?.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm font-semibold leading-tight ${!n.read ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground transition-colors'}`}>
                                {n.title || "Notification"}
                              </p>
                              <button
                                className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setReadStatus(n._id, !n.read)
                                }}
                              >
                                {n.read ? <Mail className="size-3.5" /> : <MailOpen className="size-3.5 text-red-500" />}
                              </button>
                            </div>
                            {n.type === "assignee_transfer_request" && n.status === "pending" ? (
                              <>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                  <span className="font-medium text-foreground/80">{n.from?.name || "Someone"}</span>
                                  {" "}wants to transfer{" "}
                                  <span className="font-medium text-foreground/80">&ldquo;{n.project?.projectName || "project"}&rdquo;</span>
                                  {" "}to you
                                </p>
                                {n.message && (
                                  <p className="text-xs text-muted-foreground/60 mt-1 italic leading-relaxed">
                                    &ldquo;{n.message}&rdquo;
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2.5">
                                  <Button
                                    size="xs"
                                    variant="default"
                                    className="h-7 gap-1 rounded-lg font-medium"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      acceptTransfer(n)
                                      setNotifOpen(false)
                                    }}
                                  >
                                    <Check className="size-3.5" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    className="h-7 gap-1 rounded-lg"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      rejectTransfer(n)
                                      setNotifOpen(false)
                                    }}
                                  >
                                    <X className="size-3.5" />
                                    Reject
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <p className={`text-xs mt-0.5 leading-relaxed ${!n.read ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                                {n.message || "Notification"}
                              </p>
                            )}
                            {n.createdAt && (
                              <p className="text-[10px] text-muted-foreground/50 mt-1.5">
                                {formatRelativeTime(n.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
          )}
        </div>

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

      <Sheet open={!!selectedNotif} onOpenChange={(open) => { if (!open) setSelectedNotif(null) }}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="border-b pb-4 mb-0">
            <SheetTitle className="text-lg flex items-center gap-2">
              <span className={`inline-flex size-2 rounded-full ${!selectedNotif?.read ? 'bg-red-500' : 'bg-muted-foreground/30'}`} />
              {selectedNotif?.title || "Notification"}
            </SheetTitle>
            <SheetDescription />
          </SheetHeader>

          <div className="flex-1 px-4 py-5 space-y-5 overflow-y-auto">
            <div className="flex items-center gap-4">
              <Avatar className="size-12 ring-2 ring-background shadow-md">
                <AvatarImage src={selectedNotif?.from?.image} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {selectedNotif?.from?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-base">{selectedNotif?.from?.name || "Someone"}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Bell className="size-3" />
                  {selectedNotif?.type === "assignee_transfer_request" ? "Transfer Request" :
                   selectedNotif?.type === "assignee_transfer_accepted" ? "Transfer Accepted" :
                   selectedNotif?.type === "assignee_transfer_rejected" ? "Transfer Rejected" : "Notification"}
                </p>
              </div>
            </div>

            {selectedNotif?.project && (
              <div className="rounded-xl border bg-gradient-to-br from-muted/50 to-muted/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-1.5 rounded-full bg-primary/60" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Project</p>
                </div>
                <p className="text-sm font-semibold">
                  {selectedNotif.project.projectName}
                  {selectedNotif.project.orderId && (
                    <span className="text-muted-foreground ml-2 font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded">
                      #{selectedNotif.project.orderId}
                    </span>
                  )}
                </p>
              </div>
            )}

            {selectedNotif?.message && (
              <div className="rounded-xl border bg-gradient-to-br from-muted/50 to-muted/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-1.5 rounded-full bg-primary/60" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message</p>
                </div>
                <p className="text-sm leading-relaxed">{selectedNotif.message}</p>
              </div>
            )}

            {selectedNotif?.createdAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                <span>Received {formatRelativeTime(selectedNotif.createdAt)}</span>
                <span className="size-1 rounded-full bg-muted-foreground/20" />
                <span>{new Date(selectedNotif.createdAt).toLocaleString()}</span>
              </div>
            )}

            <div className="pt-2 border-t">
              <button
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-muted/50"
                onClick={() => {
                  if (selectedNotif) {
                    const newRead = !selectedNotif.read
                    setReadStatus(selectedNotif._id, newRead)
                    setSelectedNotif((prev) => prev ? { ...prev, read: newRead } : null)
                  }
                }}
              >
                {selectedNotif?.read ? <Mail className="size-4" /> : <MailOpen className="size-4 text-red-500" />}
                {selectedNotif?.read ? "Mark as unread" : "Mark as read"}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
