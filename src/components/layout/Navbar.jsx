"use client"

import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useTheme } from "@/components/layout/ThemeProvider"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Menu,
  Search,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Kanban,
} from "lucide-react"

const pageTitles = {
  "/dashboard": "Dashboard",
  "/dashboard/projects": "Projects",
  "/dashboard/projects/new": "Create Project",
}

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/projects/new", label: "Create Project", icon: PlusCircle },
]

export default function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()

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
                onClick={() => signOut({ callbackUrl: "/login" })}
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
        >
          <Search className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-8 w-8 rounded-full p-0" />}>
            <Avatar>
              <AvatarImage
                src={session?.user?.image}
                alt={session?.user?.name || "User"}
              />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session?.user?.email || ""}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
