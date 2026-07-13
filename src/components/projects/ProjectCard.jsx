"use client"

import { useState, memo, useRef, useCallback } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Copy,
  Trash2,
  ExternalLink,
  Check,
  Globe,
  User,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"

const statusVariants = {
  "Pending": "secondary",
  "In Progress": "default",
  "Delivered": "secondary",
  "On Hold": "destructive",
  "Cancelled": "destructive",
  "Revision": "secondary",
}

const priorityVariants = {
  "Low": "secondary",
  "Medium": "default",
  "High": "outline",
  "Urgent": "destructive",
}

const ProjectCard = memo(function ProjectCard({ project, index, onAction, selected = false, onSelect, selectionMode = false }) {
  const [copied, setCopied] = useState(null)
  const [password, setPassword] = useState(null)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [passwordChecked, setPasswordChecked] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [globalFiverrFee, setGlobalFiverrFee] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("fiverrFeeEnabled")
    setGlobalFiverrFee(saved !== "false")
  }, [])

  const timerRef = useRef(null)
  const movedRef = useRef(false)

  const handleTouchStart = useCallback(() => {
    movedRef.current = false
    timerRef.current = setTimeout(() => {
      onSelect?.()
    }, 500)
  }, [onSelect])

  const handleTouchMove = useCallback(() => {
    movedRef.current = true
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      if (selectionMode && !movedRef.current) {
        onSelect?.()
      }
    }
  }, [selectionMode, onSelect])

  const handleAction = (action) => {
    onAction?.(action, project)
  }

  const fetchPassword = async () => {
    if (password !== null) return
    setLoadingPassword(true)
    try {
      const res = await fetch(`/api/projects/${project._id}/password`)
      const data = await res.json()
      setPassword(typeof data.password === "string" ? data.password : "")
    } catch {
      setPassword("")
    } finally {
      setLoadingPassword(false)
      setPasswordChecked(true)
    }
  }

  const handleCopy = (value, key) => {
    navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200",
        selected
          ? "border-primary/50 ring-1 ring-primary/20 bg-primary/5"
          : selectionMode
            ? "hover:border-primary/30 hover:shadow-md cursor-pointer"
            : "hover:border-primary/30 hover:shadow-md"
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => { if (selectionMode) onSelect?.() }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <CardTitle className="truncate text-sm sm:text-base font-bold">
                <Link
                  href={selectionMode ? "#" : `/dashboard/projects/${project._id}`}
                  className="hover:text-primary transition-colors uppercase"
                  onClick={(e) => { if (selectionMode) { e.preventDefault(); onSelect?.() } }}
                >
                  {project.orderId
                    ? `${project.orderId}_${project.projectName}`
                    : project.projectName}
                </Link>
              </CardTitle>
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(
                  project.orderId
                    ? `${project.orderId}_${project.projectName}`
                    : project.projectName,
                  "title"
                )}}
                className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                title="Copy title"
              >
                {copied === "title" ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
              </button>
              {project.price ? (
                <span className="inline-flex flex-col items-start leading-tight font-semibold text-emerald-500 bg-emerald-500/15 rounded-md px-1.5 py-0.5 ring-1 ring-emerald-500/20 min-w-[48px]">
                  <span className="text-[10px]">${project.price.toFixed(2)}</span>
                  {globalFiverrFee && (
                    <span className={`text-[7px] font-medium ${project.fiverrFeeEnabled !== false ? "text-orange-500" : "text-muted-foreground/50"}`}>
                      {project.fiverrFeeEnabled !== false ? "Fiverr Fee" : "No Fiverr Fee"}
                    </span>
                  )}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {project.status && (
                <Badge variant={statusVariants[project.status] || "secondary"} className="text-[11px] font-semibold px-2 py-0.5">
                  {project.status}
                </Badge>
              )}
              {project.priority && (
                <Badge variant={priorityVariants[project.priority] || "default"} className="text-[11px] font-semibold px-2 py-0.5">
                  {project.priority}
                </Badge>
              )}
              {project.cms && (
                <Badge variant="outline" className="text-[11px] font-semibold px-2 py-0.5">{project.cms}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="-mr-1.5 mt-0.5" />}>
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAction("duplicate")}>
                  <Copy className="size-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => handleAction("delete")}>
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-1.5">
        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-end">
            {project.tags.map((tag, idx) => (
              <Badge key={`${tag}-${idx}`} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {(project.additionalWebsites?.[0] || project.websiteUrl) && (
          <div className="rounded-lg border bg-card p-2.5 space-y-2">
            {(() => {
              const mainSite = project.additionalWebsites?.[0];
              const siteUrl = mainSite?.url || project.websiteUrl || '';
              const siteUsername = mainSite?.username || project.websiteUsername || '';
              const totalSites = project.additionalWebsites?.length || 0;
              return (
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center justify-center size-6 rounded-md bg-primary/10 shrink-0">
                      <Globe className="size-3 text-primary" />
                    </div>
                    <a
                      href={siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline truncate flex-1"
                    >
                      {siteUrl}
                    </a>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleCopy(siteUrl, "url")}
                        title="Copy URL"
                        className="opacity-60 hover:opacity-100 transition-opacity"
                      >
                        {copied === "url" ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                      </Button>
                      <a
                        href={siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }), "opacity-60 hover:opacity-100 transition-opacity")}
                      >
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                  {(totalSites > 1 || project.figmaLinks?.length > 0 || project.referenceLinks?.length > 0) && (
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {totalSites > 1 && <span>{totalSites - 1} extra</span>}
                      {project.figmaLinks?.length > 0 && <span>{project.figmaLinks.length} figma</span>}
                      {project.referenceLinks?.length > 0 && <span>{project.referenceLinks.length} ref</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {siteUsername && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1">
                        <User className="size-3 shrink-0" />
                        <span className="truncate max-w-20">{siteUsername}</span>
                        <button onClick={() => handleCopy(siteUsername, "username")} className="hover:text-foreground transition-colors shrink-0">
                          {copied === "username" ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                        </button>
                      </div>
                    )}
                    {password && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1">
                        <Lock className="size-3 shrink-0" />
                        <span className="font-mono truncate max-w-16">
                          {showPwd ? password : "\u2022\u2022\u2022\u2022\u2022\u2022"}
                        </span>
                        <button onClick={() => setShowPwd(!showPwd)} className="hover:text-foreground transition-colors shrink-0" title={showPwd ? "Hide" : "Show"}>
                          {showPwd ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                        </button>
                        <button onClick={() => handleCopy(password, "password")} className="hover:text-foreground transition-colors shrink-0" title="Copy Password">
                          {copied === "password" ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                        </button>
                      </div>
                    )}
                    {!passwordChecked && !loadingPassword && (
                      <button onClick={fetchPassword} className="text-xs text-muted-foreground hover:text-primary bg-muted/50 rounded-md px-2 py-1 transition-colors">
                        <Lock className="size-3 inline mr-1" />
                        Show Password
                      </button>
                    )}
                    {loadingPassword && (
                      <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
        <div className="pt-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${project.progress ?? 0}%` }} />
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">{project.progress ?? 0}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export default ProjectCard
