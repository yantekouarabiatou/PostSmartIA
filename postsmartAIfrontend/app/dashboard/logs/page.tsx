"use client"

import { useEffect, useState, useMemo } from "react"
import { Shield } from "lucide-react"
import { type TableColumn } from "react-data-table-component"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AppDataTable from "@/components/ui/AppDataTable"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  login:         { label: "Connexion",       color: "bg-blue-100 text-blue-800"     },
  logout:        { label: "Déconnexion",     color: "bg-slate-100 text-slate-700"   },
  login_failed:  { label: "Échec connexion", color: "bg-red-100 text-red-800"       },
  create:        { label: "Création",        color: "bg-green-100 text-green-800"   },
  update:        { label: "Modification",    color: "bg-orange-100 text-orange-800" },
  delete:        { label: "Suppression",     color: "bg-red-100 text-red-800"       },
  mail_processed:{ label: "Mail traité",     color: "bg-violet-100 text-violet-800" },
  call_report:   { label: "Compte-rendu",    color: "bg-cyan-100 text-cyan-800"     },
}

function getActionCfg(action: string) {
  return ACTION_CONFIG[action] ?? { label: action, color: "bg-gray-100 text-gray-700" }
}

const ACTION_OPTIONS = [
  { value: "all",          label: "Toutes les actions" },
  { value: "login",        label: "Connexion"          },
  { value: "logout",       label: "Déconnexion"        },
  { value: "login_failed", label: "Échec connexion"    },
  { value: "create",       label: "Création"           },
  { value: "update",       label: "Modification"       },
  { value: "delete",       label: "Suppression"        },
  { value: "mail_processed", label: "Mail traité"      },
  { value: "call_report",  label: "Compte-rendu"       },
]

interface LogEntry {
  id: number
  user: { first_name: string; last_name: string; email: string } | null
  action: string
  description: string
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

function parseUA(ua: string | null): string {
  if (!ua) return "—"
  if (ua.includes("Edg"))     return "Edge"
  if (ua.includes("Chrome"))  return "Chrome"
  if (ua.includes("Firefox")) return "Firefox"
  if (ua.includes("Safari"))  return "Safari"
  return ua.slice(0, 18) + "…"
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters
  const [page, setPage] = useState(1)
  const [action, setAction] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo]     = useState("")
  const PER_PAGE = 50

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) })
        if (action !== "all") params.set("action", action)
        if (dateFrom) params.set("date_from", dateFrom)
        if (dateTo)   params.set("date_to",   dateTo)

        const data = await api.get<any>(`/logs?${params}`)
        if (!cancelled) {
          setLogs(data?.data ?? [])
          setTotal(data?.total ?? 0)
        }
      } catch {}
      finally { if (!cancelled) setLoading(false) }
    }

    fetch()
    return () => { cancelled = true }
  }, [page, action, dateFrom, dateTo])

  function resetFilters() {
    setAction("all")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  const hasFilters = action !== "all" || !!dateFrom || !!dateTo
  const totalPages = Math.ceil(total / PER_PAGE)

  // ── Columns ─────────────────────────────────────────────────────────────────

  const columns = useMemo<TableColumn<LogEntry>[]>(() => [
    {
      name: "Utilisateur",
      cell: (row) => row.user ? (
        <div className="py-1">
          <div className="font-medium text-foreground text-sm whitespace-nowrap">
            {row.user.first_name} {row.user.last_name}
          </div>
          <div className="text-xs text-muted-foreground">{row.user.email}</div>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground italic">Anonyme</span>
      ),
      grow: 1.5,
    },
    {
      name: "Action",
      cell: (row) => {
        const cfg = getActionCfg(row.action)
        return <Badge className={cn("text-xs border-0 whitespace-nowrap", cfg.color)}>{cfg.label}</Badge>
      },
      grow: 0.8,
    },
    {
      name: "Description",
      cell: (row) => (
        <span className="text-xs text-muted-foreground line-clamp-2">{row.description}</span>
      ),
      grow: 2.5,
    },
    {
      name: "IP",
      cell: (row) => (
        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
          {row.ip_address ?? "—"}
        </span>
      ),
      grow: 0.8,
    },
    {
      name: "Navigateur",
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {parseUA(row.user_agent)}
        </span>
      ),
      grow: 0.7,
    },
    {
      name: "Date",
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {format(new Date(row.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
        </span>
      ),
      grow: 1,
    },
  ], [])

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Journaux d&apos;activité</h1>
        <p className="text-muted-foreground">
          Historique complet des actions réalisées sur la plateforme.
        </p>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Type d&apos;action
              </label>
              <Select value={action} onValueChange={v => { setAction(v); setPage(1) }}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Du</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPage(1) }}
                className="h-9"
              />
            </div>

            <div className="min-w-[150px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Au</label>
              <Input
                type="date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPage(1) }}
                className="h-9"
              />
            </div>

            {hasFilters && (
              <Button variant="outline" size="sm" className="h-9 self-end" onClick={resetFilters}>
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <AppDataTable<LogEntry>
        columns={columns}
        data={logs}
        title={`Logs d'activité — ${total} entrée${total > 1 ? "s" : ""}`}
        loading={loading}
        searchable={false}
        paginationServer
        paginationTotalRows={total}
        onChangePage={(p) => setPage(p)}
        paginationDefaultPage={page}
      />
    </div>
  )
}
