"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Users, Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, X, Eye, EyeOff,
} from "lucide-react"
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

// ── Types ──────────────────────────────────────────────────────────────────

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  equipe: string | null
  is_active: boolean
  last_login_at: string | null
  avatar: string | null
  created_at: string
}

interface FormData {
  first_name: string
  last_name: string
  email: string
  role: string
  equipe: string
  password: string
  is_active: boolean
  avatar: string
}

const BLANK_FORM: FormData = {
  first_name: "",
  last_name: "",
  email: "",
  role: "conseiller",
  equipe: "",
  password: "",
  is_active: true,
  avatar: "",
}

// ── Role config ─────────────────────────────────────────────────────────────

const ROLE_CFG: Record<string, { label: string; color: string }> = {
  conseiller: { label: "Conseiller",     color: "bg-blue-100 text-blue-800"   },
  manager:    { label: "Manager",        color: "bg-violet-100 text-violet-800" },
  admin:      { label: "Administrateur", color: "bg-red-100 text-red-800"     },
}

// ── Avatar ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#0066CC", "#003D99", "#7c3aed", "#059669", "#d97706", "#dc2626"]

function UserAvatar({ user }: { user: User }) {
  const initials = `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase()
  const color = AVATAR_COLORS[user.id % AVATAR_COLORS.length]

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={`${user.first_name} ${user.last_name}`}
        className="h-8 w-8 rounded-full object-cover shrink-0"
      />
    )
  }

  return (
    <div
      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ background: color }}
    >
      {initials}
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers]   = useState<User[]>([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters + refresh key
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [refreshKey, setRefreshKey] = useState(0)
  const PER_PAGE = 20

  // Create/Edit modal
  const [modalOpen, setModalOpen]   = useState(false)
  const [modalMode, setModalMode]   = useState<"create" | "edit">("create")
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [form, setForm]             = useState<FormData>(BLANK_FORM)
  const [showPw, setShowPw]         = useState(false)
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState("")

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting]         = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) })
        if (search)              params.set("search",    search)
        if (roleFilter !== "all") params.set("role",      roleFilter)
        if (statusFilter !== "all")
          params.set("is_active", statusFilter === "active" ? "true" : "false")

        const data = await api.get<any>(`/users?${params}`)
        if (!cancelled) {
          setUsers(data?.data ?? [])
          setTotal(data?.total ?? 0)
        }
      } catch {}
      finally { if (!cancelled) setLoading(false) }
    }

    fetch()
    return () => { cancelled = true }
  }, [page, search, roleFilter, statusFilter, refreshKey])

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openCreate() {
    setForm(BLANK_FORM)
    setModalMode("create")
    setEditTarget(null)
    setFormError("")
    setShowPw(false)
    setModalOpen(true)
  }

  function openEdit(user: User) {
    setForm({
      first_name: user.first_name,
      last_name:  user.last_name,
      email:      user.email,
      role:       user.role,
      equipe:     user.equipe ?? "",
      password:   "",
      is_active:  user.is_active,
      avatar:     user.avatar ?? "",
    })
    setModalMode("edit")
    setEditTarget(user)
    setFormError("")
    setShowPw(false)
    setModalOpen(true)
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    setFormError("")
    try {
      const payload: Record<string, any> = {
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        email:      form.email.trim(),
        role:       form.role,
        equipe:     form.equipe.trim() || null,
        is_active:  form.is_active,
        avatar:     form.avatar.trim() || null,
      }

      if (modalMode === "create") {
        payload.password = form.password
        await api.post("/users", payload)
      } else {
        if (form.password) payload.password = form.password
        await api.put(`/users/${editTarget!.id}`, payload)
      }

      setModalOpen(false)
      setRefreshKey(k => k + 1)
    } catch (e: any) {
      setFormError(e.message ?? "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle active ──────────────────────────────────────────────────────────

  async function handleToggle(user: User) {
    try {
      await api.put(`/users/${user.id}/toggle-active`, {})
      setUsers(prev =>
        prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u)
      )
    } catch {}
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.del(`/users/${deleteTarget.id}`)
      setDeleteTarget(null)
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
      setTotal(t => t - 1)
    } catch {}
    finally { setDeleting(false) }
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  // ── Columns ─────────────────────────────────────────────────────────────────

  const columns = useMemo<TableColumn<User>[]>(() => [
    {
      name: "Nom",
      cell: (row) => (
        <div className="flex items-center gap-2.5 py-1">
          <UserAvatar user={row} />
          <span className="font-medium text-foreground text-sm whitespace-nowrap">
            {row.first_name} {row.last_name}
          </span>
        </div>
      ),
      grow: 2,
    },
    {
      name: "Email",
      cell: (row) => <span className="text-muted-foreground text-sm">{row.email}</span>,
      grow: 2,
    },
    {
      name: "Rôle",
      cell: (row) => {
        const cfg = ROLE_CFG[row.role] ?? { label: row.role, color: "bg-gray-100 text-gray-700" }
        return <Badge className={cn("text-xs border-0", cfg.color)}>{cfg.label}</Badge>
      },
      grow: 1,
    },
    {
      name: "Équipe",
      cell: (row) => <span className="text-muted-foreground text-sm">{row.equipe ?? "—"}</span>,
      grow: 1,
    },
    {
      name: "Statut",
      cell: (row) => row.is_active
        ? <Badge className="text-xs border-0 bg-green-100 text-green-800">Actif</Badge>
        : <Badge className="text-xs border-0 bg-gray-100 text-gray-600">Inactif</Badge>,
      grow: 0.8,
    },
    {
      name: "Connexion",
      cell: (row) => (
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {row.last_login_at
            ? format(new Date(row.last_login_at), "dd/MM/yyyy HH:mm", { locale: fr })
            : "Jamais"}
        </span>
      ),
      grow: 1,
    },
    {
      name: "Actions",
      allowOverflow: true,
      right: true,
      cell: (row) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Modifier"
            onClick={() => openEdit(row)}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className={cn("h-7 w-7", row.is_active ? "text-green-600" : "text-muted-foreground")}
            title={row.is_active ? "Désactiver" : "Activer"}
            onClick={(e) => { e.stopPropagation(); handleToggle(row) }}
          >
            {row.is_active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Supprimer"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
      grow: 0.8,
    },
  ], [openEdit, handleToggle]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">{total} utilisateur{total > 1 ? "s" : ""} au total</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 h-9"
              />
            </div>
            <div className="min-w-[160px]">
              <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1) }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="conseiller">Conseiller</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px]">
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <AppDataTable<User>
        columns={columns}
        data={users}
        loading={loading}
        searchable={false}
        paginationServer
        paginationTotalRows={total}
        onChangePage={(p) => setPage(p)}
        paginationDefaultPage={page}
        paginationResetDefaultPage={refreshKey > 0}
      />

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {modalMode === "create" ? "Ajouter un utilisateur" : "Modifier l'utilisateur"}
              </h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {/* Prénom + Nom */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Prénom <span className="text-destructive">*</span></label>
                  <Input
                    value={form.first_name}
                    onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                    placeholder="Prénom"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nom <span className="text-destructive">*</span></label>
                  <Input
                    value={form.last_name}
                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    placeholder="Nom"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="prenom.nom@laposte.fr"
                />
              </div>

              {/* Rôle + Équipe */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Rôle <span className="text-destructive">*</span></label>
                  <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conseiller">Conseiller</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Équipe</label>
                  <Input
                    value={form.equipe}
                    onChange={e => setForm(f => ({ ...f, equipe: e.target.value }))}
                    placeholder="Ex : Équipe A"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Mot de passe{" "}
                  {modalMode === "create"
                    ? <span className="text-destructive">*</span>
                    : <span className="text-muted-foreground text-xs font-normal">(laisser vide pour conserver)</span>
                  }
                </label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder={modalMode === "create" ? "Minimum 8 caractères" : "Nouveau mot de passe…"}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPw(v => !v)}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Avatar URL */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">URL Avatar <span className="text-muted-foreground text-xs font-normal">(optionnel)</span></label>
                <Input
                  value={form.avatar}
                  onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))}
                  placeholder="https://…"
                />
              </div>

              {/* Toggle actif */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Compte actif</span>
                <button
                  type="button"
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                    form.is_active ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  aria-label="Activer/Désactiver le compte"
                >
                  <span
                    className={cn(
                      "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                      form.is_active ? "translate-x-[18px]" : "translate-x-0.5"
                    )}
                  />
                </button>
                <span className="text-xs text-muted-foreground">
                  {form.is_active ? "Actif" : "Inactif"}
                </span>
              </div>

              {/* Error */}
              {formError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                  {formError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.first_name || !form.last_name || !form.email || (modalMode === "create" && !form.password)}
              >
                {saving ? "Enregistrement…" : modalMode === "create" ? "Créer l'utilisateur" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-background rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Supprimer l&apos;utilisateur</h2>
            <p className="text-sm text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer{" "}
              <strong className="text-foreground">
                {deleteTarget.first_name} {deleteTarget.last_name}
              </strong>{" "}?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Suppression…" : "Supprimer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
