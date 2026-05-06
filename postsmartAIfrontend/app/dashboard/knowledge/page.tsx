"use client"

import { useState, useEffect, useCallback } from "react"
import {
  BookOpen, Search, Plus, Trash2, Eye, Filter,
  AlertCircle, Check, X, Tag, FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

interface KbDoc {
  id: number
  title: string
  description: string
  type: "procedure" | "offre" | "cgv" | "reglementation"
  content: string
  tags: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Paginator {
  current_page: number
  data: KbDoc[]
  last_page: number
  total: number
}

const TYPE_CONFIG = {
  procedure:    { label: "Procédure",    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  offre:        { label: "Offre",        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  cgv:          { label: "CGV",          className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  reglementation: { label: "Réglementation", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
}

const TYPE_OPTIONS = Object.entries(TYPE_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }))

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}

export default function KnowledgePage() {
  const [docs, setDocs]         = useState<KbDoc[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState("")
  const [page, setPage]         = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal]       = useState(0)
  const [search, setSearch]     = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  const [viewDoc, setViewDoc]     = useState<KbDoc | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<KbDoc | null>(null)
  const [deleting, setDeleting]   = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    title: "", description: "", type: "procedure" as KbDoc["type"],
    content: "", tags: "",
  })
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState("")

  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored) setUserRole(JSON.parse(stored)?.role ?? "")
    } catch {}
  }, [])

  const canCreate = userRole === "admin" || userRole === "manager"

  const fetchDocs = useCallback(async (p: number, type: string, q: string) => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({ per_page: "30", page: String(p) })
      if (type !== "all") params.set("type", type)
      if (q.trim()) params.set("search", q.trim())
      const data = await api.get<Paginator>(`/knowledge-base?${params}`)
      setDocs(data.data)
      setLastPage(data.last_page)
      setTotal(data.total)
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchDocs(page, typeFilter, search), 300)
    return () => clearTimeout(timer)
  }, [page, typeFilter, search, fetchDocs])

  function handleTypeChange(val: string) {
    setTypeFilter(val)
    setPage(1)
  }
  function handleSearchChange(val: string) {
    setSearch(val)
    setPage(1)
  }

  async function handleDelete() {
    if (!deleteDoc) return
    setDeleting(true)
    setDeleteError("")
    try {
      await api.del(`/knowledge-base/${deleteDoc.id}`)
      setDeleteDoc(null)
      fetchDocs(page, typeFilter, search)
    } catch (err: any) {
      setDeleteError(err.message || "Erreur lors de la suppression.")
    } finally {
      setDeleting(false)
    }
  }

  async function handleCreate() {
    if (!form.title.trim() || !form.description.trim() || !form.content.trim()) return
    setSaving(true)
    setSaveError("")
    try {
      const tags = form.tags.trim()
        ? form.tags.split(",").map(t => t.trim()).filter(Boolean)
        : []
      await api.post("/knowledge-base", {
        title: form.title,
        description: form.description,
        type: form.type,
        content: form.content,
        tags,
        is_active: true,
      })
      setShowCreate(false)
      setForm({ title: "", description: "", type: "procedure", content: "", tags: "" })
      setPage(1)
      fetchDocs(1, typeFilter, search)
    } catch (err: any) {
      setSaveError(err.message || "Erreur lors de la création.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Base de connaissances</h1>
          <p className="text-muted-foreground">
            Procédures, offres, CGV et réglementations disponibles pour les conseillers.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => { setShowCreate(true); setSaveError("") }} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document…"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {TYPE_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!loading && !error && (
        <p className="text-sm text-muted-foreground">
          {total} document{total !== 1 ? "s" : ""}
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/8 border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground text-sm gap-2">
          <span className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          Chargement…
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground text-sm">Aucun document trouvé</p>
            <p className="text-xs text-muted-foreground">
              {search.trim() || typeFilter !== "all"
                ? "Essayez d'autres filtres."
                : canCreate ? "Ajoutez votre premier document." : "Aucun document disponible pour l'instant."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map(doc => {
            const tc = TYPE_CONFIG[doc.type] ?? TYPE_CONFIG.procedure
            return (
              <Card
                key={doc.id}
                className="border-border/50 flex flex-col hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <Badge className={cn("text-xs font-medium border-0 shrink-0", tc.className)}>
                      {tc.label}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold text-foreground leading-snug mt-2 line-clamp-2">
                    {doc.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <p className="text-xs text-muted-foreground line-clamp-3">{doc.description}</p>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.slice(0, 4).map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 4 && (
                        <span className="text-[10px] text-muted-foreground px-1">+{doc.tags.length - 4}</span>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground">{formatDate(doc.created_at)}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline" size="sm" className="flex-1 h-8 text-xs"
                      onClick={() => setViewDoc(doc)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Consulter
                    </Button>
                    {canCreate && (
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                        onClick={() => { setDeleteDoc(doc); setDeleteError("") }}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && lastPage > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} / {lastPage}</span>
          <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}>
            Suivant
          </Button>
        </div>
      )}

      {/* View modal */}
      <Dialog open={!!viewDoc} onOpenChange={open => !open && setViewDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-2 text-base leading-snug">
              <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              {viewDoc?.title}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 flex-wrap text-xs">
              {viewDoc && (
                <Badge className={cn("text-[10px] border-0", TYPE_CONFIG[viewDoc.type]?.className ?? "")}>
                  {TYPE_CONFIG[viewDoc.type]?.label ?? viewDoc.type}
                </Badge>
              )}
              {viewDoc && <span>{formatDate(viewDoc.created_at)}</span>}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{viewDoc?.description}</p>
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
              {viewDoc?.content}
            </pre>
          </div>
          {viewDoc?.tags && viewDoc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {viewDoc.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create modal */}
      <Dialog open={showCreate} onOpenChange={open => !open && setShowCreate(false)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Ajouter un document
            </DialogTitle>
            <DialogDescription>
              Ajoutez une procédure, offre, CGV ou réglementation à la base de connaissances.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Titre <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Titre du document"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Type</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as KbDoc["type"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Description <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Courte description du document"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="min-h-[72px] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Contenu <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Contenu complet du document…"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                className="min-h-[140px] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Tags{" "}
                <span className="text-muted-foreground font-normal text-xs">(séparés par des virgules)</span>
              </label>
              <Input
                placeholder="colissimo, recommandé, suivi…"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              />
            </div>

            {saveError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {saveError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)} disabled={saving}>
              <X className="h-3.5 w-3.5 mr-1" />
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={saving || !form.title.trim() || !form.description.trim() || !form.content.trim()}
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Enregistrement…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Enregistrer
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteDoc} onOpenChange={open => !open && setDeleteDoc(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              Supprimer ce document ?
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le document{" "}
              <span className="font-medium text-foreground">"{deleteDoc?.title}"</span>{" "}
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
            <Button variant="outline" size="sm" onClick={() => setDeleteDoc(null)} disabled={deleting}>
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
