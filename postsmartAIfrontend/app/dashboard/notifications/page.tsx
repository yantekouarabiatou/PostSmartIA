"use client"

import { useEffect, useState } from "react"
import { Bell, Check, CheckCheck, Clock } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

const TYPE_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  account_created: { label: "Compte créé",     color: "bg-green-100 text-green-800",   emoji: "🎉" },
  mail_processed:  { label: "Mail traité",      color: "bg-violet-100 text-violet-800", emoji: "📬" },
  quality_alert:   { label: "Alerte qualité",   color: "bg-amber-100 text-amber-800",   emoji: "⚠️" },
  login_alert:     { label: "Connexion",        color: "bg-blue-100 text-blue-800",     emoji: "🔐" },
  call_report:     { label: "Compte-rendu",     color: "bg-cyan-100 text-cyan-800",     emoji: "📞" },
}

function getTypeCfg(type: string) {
  return TYPE_CONFIG[type] ?? { label: type, color: "bg-gray-100 text-gray-800", emoji: "🔔" }
}

interface Notification {
  id: number
  type: string
  title: string
  message: string
  is_read: boolean
  read_at: string | null
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const PER_PAGE = 20

  async function load(p = page) {
    setLoading(true)
    try {
      const data = await api.get<any>(`/notifications?page=${p}&per_page=${PER_PAGE}`)
      setNotifications(data.notifications?.data ?? [])
      setTotal(data.notifications?.total ?? 0)
      setUnreadCount(data.unread_count ?? 0)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    load(page)
  }, [page])

  useEffect(() => {
    const interval = setInterval(() => load(page), 30_000)
    return () => clearInterval(interval)
  }, [page])

  async function markRead(id: number) {
    try {
      await api.put(`/notifications/${id}/read`, {})
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  async function markAllRead() {
    try {
      await api.put("/notifications/read-all", {})
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
      setUnreadCount(0)
    } catch {}
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
              : "Toutes vos notifications sont lues"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" />
            Historique des notifications
          </CardTitle>
          <CardDescription>{total} notification{total > 1 ? "s" : ""} au total</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Bell className="h-12 w-12 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground font-medium">Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => {
                const cfg = getTypeCfg(n.type)
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-4 transition-colors",
                      n.is_read
                        ? "border-border/40 bg-background"
                        : "border-primary/20 bg-primary/5"
                    )}
                  >
                    <span className="text-xl mt-0.5 shrink-0 select-none">{cfg.emoji}</span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("text-sm font-semibold", !n.is_read && "text-foreground")}>
                          {n.title}
                        </span>
                        <Badge className={cn("text-xs border-0 shrink-0", cfg.color)}>
                          {cfg.label}
                        </Badge>
                        {!n.is_read && (
                          <Badge className="text-xs border-0 bg-primary/10 text-primary shrink-0">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>

                    {!n.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-7 text-xs gap-1 self-start"
                        onClick={() => markRead(n.id)}
                      >
                        <Check className="h-3 w-3" />
                        Lu
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {page} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
