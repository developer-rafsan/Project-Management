"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

const NotificationContext = createContext()

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider")
  return ctx
}

export function NotificationProvider({ children }) {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const intervalRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.read).length)
    } catch {
      // silent fail
    }
  }, [session])

  useEffect(() => {
    fetchNotifications()
    intervalRef.current = setInterval(fetchNotifications, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchNotifications])

  const markAsRead = useCallback(async (id) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // silent fail
    }
  }, [])

  const setReadStatus = useCallback(async (id, read) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read } : n))
      )
      if (read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } else {
        setUnreadCount((prev) => prev + 1)
      }
    } catch {
      // silent fail
    }
  }, [])

  const getActionLabel = (type) => {
    if (type === "assignee_add_request") return "request"
    if (type === "assignee_remove_request") return "remove request"
    return "transfer"
  }

  const acceptTransfer = useCallback(async (notification) => {
    try {
      const res = await fetch(`/api/notifications/${notification._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      })
      if (!res.ok) throw new Error("Failed to accept")
      const updated = await res.json()
      setNotifications((prev) =>
        prev.map((n) => (n._id === updated._id ? updated : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      toast.success(`${getActionLabel(notification.type).charAt(0).toUpperCase() + getActionLabel(notification.type).slice(1)} accepted`)
      fetchNotifications()
    } catch (err) {
      toast.error(err.message || "Failed to accept")
    }
  }, [fetchNotifications])

  const rejectTransfer = useCallback(async (notification) => {
    try {
      const res = await fetch(`/api/notifications/${notification._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })
      if (!res.ok) throw new Error("Failed to reject")
      const updated = await res.json()
      setNotifications((prev) =>
        prev.map((n) => (n._id === updated._id ? updated : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      toast.success(`${getActionLabel(notification.type).charAt(0).toUpperCase() + getActionLabel(notification.type).slice(1)} rejected`)
      fetchNotifications()
    } catch (err) {
      toast.error(err.message || "Failed to reject")
    }
  }, [fetchNotifications])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        setNotifications,
        unreadCount,
        setUnreadCount,
        fetchNotifications,
        markAsRead,
        setReadStatus,
        acceptTransfer,
        rejectTransfer,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
