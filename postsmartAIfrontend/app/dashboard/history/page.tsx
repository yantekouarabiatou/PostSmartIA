"use client"

import { useState, useEffect, useCallback } from "react"
import {
  History, Search, Eye, Trash2, Mail, Clock, Filter,
  ChevronLeft, ChevronRight, AlertCircle, Check, X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
async function exportHistoryEmailToPdf(record: EmailRecord) {
  if (typeof window === 'undefined') return
  const mod = await import("../../../lib/export-pdf")
  return mod.exportHistoryEmailToPdf(record)
}

interface EmailRecord {
  id: number
  client_email: string
  client_name: string | null
  subject: string
  content: string
  status: "draft" | "sent" | "modified"
  created_at: string
  updated_at: string
}

interface Paginator {
  current_page: number
  data: EmailRecord[]
  last_page: number
  total: number
  per_page: number
}

const STATUS_CONFIG = {
  draft:    { label: "Brouillon", className: "bg-muted text-muted-foreground" },
  sent:     { label: "Envoyé",    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  modified: { label: "Modifié",   className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

export default function HistoryPage() {
  const [records, setRecords]   = useState<EmailRecord[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState("")
  const [page, setPage]         = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal]       = useState(0)
  const [search, setSearch]     = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [viewItem, setViewItem]     = useState<EmailRecord | null>(null)
  const [deleteItem, setDeleteItem] = useState<EmailRecord | null>(null)
  const [deleting, setDeleting]     = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const fetchHistory = useCallback(async (p: number, status: string) => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({ page: String(p), per_page: "15" })
      if (status !== "all") params.set("status", status)
      const data = await api.get<Paginator>(`/email-histories?${params}`)
      setRecords(data.data)
      setLastPage(data.last_page)
      setTotal(data.total)
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory(page, statusFilter)
  }, [page, statusFilter, fetchHistory])

  function handleStatusChange(val: string) {
    setStatusFilter(val)
    setPage(1)
  }

  const filtered = search.trim()
    ? records.filter(r =>
        r.subject.toLowerCase().includes(search.toLowerCase()) ||
        r.client_email.toLowerCase().includes(search.toLowerCase()) ||
        (r.client_name ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : records

  async function handleDelete() {
    if (!deleteItem) return
    setDeleting(true)
    setDeleteError("")
    try {
      await api.del(`/email-histories/${deleteItem.id}`)
      setDeleteItem(null)
      fetchHistory(page, statusFilter)
    } catch (err: any) {
      setDeleteError(err.message || "Erreur lors de la suppression.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Historique des emails</h1>
        <p className="text-muted-foreground">
          Retrouvez tous les emails générés et sauvegardés depuis PostAssist.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par sujet, email ou nom client…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillons</SelectItem>
              <SelectItem value="sent">Envoyés</SelectItem>
              <SelectItem value="modified">Modifiés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!loading && !error && (
        <p className="text-sm text-muted-foreground">
          {search.trim()
            ? `${filtered.length} résultat${filtered.length !== 1 ? "s" : ""} filtré${filtered.length !== 1 ? "s" : ""}`
            : `${total} email${total !== 1 ? "s" : ""} au total`
          }
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/8 border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Table card */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <History className="h-4 w-4 text-primary" />
            Emails générés
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
              <span className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              Chargement…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground text-sm">Aucun email trouvé</p>
                <p className="text-xs text-muted-foreground">
                  {search.trim() ? "Essayez un autre terme de recherche." : "Générez votre premier email pour le voir ici."}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map(record => {
                const sc = STATUS_CONFIG[record.status] ?? STATUS_CONFIG.draft
                return (
                  <div
                    key={record.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-medium text-foreground truncate">{record.subject}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{record.client_name ?? record.client_email}</span>
                        {record.client_name && (
                          <>
                            <span>·</span>
                            <span className="truncate">{record.client_email}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge className={cn("text-xs font-medium shrink-0 border-0", sc.className)}>
                      {sc.label}
                    </Badge>
                    <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(record.created_at)}
                      </span>
                      <span>{formatTime(record.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => setViewItem(record)}
                        title="Voir"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { setDeleteItem(record); setDeleteError("") }}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && !error && lastPage > 1 && !search.trim() && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} / {lastPage}</span>
          <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}>
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* View modal */}
      <Dialog open={!!viewItem} onOpenChange={open => !open && setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-primary" />
              {viewItem?.subject}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 text-xs flex-wrap">
              <span>
                Destinataire : {viewItem?.client_name
                  ? `${viewItem.client_name} (${viewItem.client_email})`
                  : viewItem?.client_email}
              </span>
              {viewItem && (
                <>
                  <span>·</span>
                  <Badge className={cn("text-[10px] border-0", STATUS_CONFIG[viewItem.status]?.className ?? "")}>
                    {STATUS_CONFIG[viewItem.status]?.label ?? viewItem.status}
                  </Badge>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-lg bg-muted/50 border border-border mt-2">
            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
              {viewItem?.content}
            </pre>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {viewItem && `Créé le ${formatDate(viewItem.created_at)} à ${formatTime(viewItem.created_at)}`}
            </div>
            {viewItem && (
              <Button
                variant="outline" size="sm"
                onClick={() => exportHistoryEmailToPdf(viewItem)}
                className="gap-1.5 text-xs"
              >
                📄 Exporter PDF
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteItem} onOpenChange={open => !open && setDeleteItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              Supprimer cet email ?
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L'email{" "}
              <span className="font-medium text-foreground">"{deleteItem?.subject}"</span>{" "}
              sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {deleteError}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteItem(null)} disabled={deleting}>
              <X className="h-3.5 w-3.5 mr-1" />
              Annuler
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Suppression…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Confirmer
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
