"use client"

import { useEffect, useState, useMemo } from "react"
import { Shield } from "lucide-react"
import { type TableColumn } from "react-data-table-component"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import AppDataTable from "@/components/ui/AppDataTable"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const ROLE_COLOR: Record<string, string> = {
  conseiller: "bg-blue-100 text-blue-800",
  manager:    "bg-amber-100 text-amber-800",
  admin:      "bg-red-100 text-red-800",
}

interface SpatieRole {
  id: number
  name: string
  permissions: { id: number; name: string }[]
}

interface SpatiePermission {
  id: number
  name: string
}

interface PermUser {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  roles: SpatieRole[]
  permissions: SpatiePermission[]
}

interface PermData {
  roles: SpatieRole[]
  permissions: SpatiePermission[]
  users: PermUser[]
}

// ── Modals ───────────────────────────────────────────────────────────────────

function RoleModal({
  user, roles, onClose, onSaved,
}: {
  user: PermUser
  roles: SpatieRole[]
  onClose: () => void
  onSaved: () => void
}) {
  const current = user.roles[0]?.name ?? user.role ?? "conseiller"
  const [selected, setSelected] = useState(current)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSave() {
    if (selected === current) { onClose(); return }
    setSaving(true)
    try {
      await api.post("/permissions/assign-role", { user_id: user.id, role: selected })
      onSaved()
    } catch {
      setError("Erreur lors de l'assignation du rôle.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
    }}>
      <div style={{
        background: "#fff", borderRadius: "12px", padding: "28px",
        width: "380px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "#00205B" }}>
          Modifier le rôle
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#6B7280" }}>
          {user.first_name} {user.last_name}
        </p>

        <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
          Rôle
        </label>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          style={{
            width: "100%", padding: "9px 12px", borderRadius: "8px",
            border: "1px solid #D1D5DB", fontSize: "14px", marginBottom: "20px",
          }}
        >
          {roles.map(r => (
            <option key={r.id} value={r.name}>
              {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
            </option>
          ))}
        </select>

        {error && <p style={{ color: "#DC2626", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement…" : "Confirmer"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function PermissionsModal({
  user, allPerms, onClose, onSaved,
}: {
  user: PermUser
  allPerms: SpatiePermission[]
  onClose: () => void
  onSaved: () => void
}) {
  const directPerms = new Set(user.permissions.map(p => p.name))
  const [checked, setChecked] = useState<Set<string>>(new Set(directPerms))
  const [saving, setSaving] = useState(false)

  function toggle(name: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const toGive   = [...checked].filter(p => !directPerms.has(p))
      const toRevoke = [...directPerms].filter(p => !checked.has(p))

      await Promise.all([
        ...toGive.map(p => api.post("/permissions/assign", { user_id: user.id, permission: p })),
        ...toRevoke.map(p => api.post("/permissions/revoke", { user_id: user.id, permission: p })),
      ])
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const grouped = useMemo(() => {
    const map: Record<string, SpatiePermission[]> = {}
    for (const p of allPerms) {
      const [cat] = p.name.split(" ").reverse()
      const key = p.name.includes("emails") ? "Emails"
        : p.name.includes("call report") ? "Appels"
        : p.name.includes("users") ? "Utilisateurs"
        : p.name.includes("log") || p.name.includes("permission") ? "Administration"
        : p.name.includes("chatbot") || p.name.includes("dashboard") || p.name.includes("analytics") ? "Général"
        : "Autre"
      if (!map[key]) map[key] = []
      map[key].push(p)
    }
    return map
  }, [allPerms])

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
    }}>
      <div style={{
        background: "#fff", borderRadius: "12px", padding: "28px",
        width: "500px", maxHeight: "80vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "#00205B" }}>
          Gérer les permissions
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#6B7280" }}>
          {user.first_name} {user.last_name} — permissions directes uniquement
        </p>

        {Object.entries(grouped).map(([category, perms]) => (
          <div key={category} style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: "8px" }}>
              {category}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {perms.map(p => (
                <label key={p.id} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  fontSize: "13px", cursor: "pointer", padding: "6px 8px",
                  borderRadius: "6px", background: checked.has(p.name) ? "#EBF4FF" : "transparent",
                }}>
                  <input
                    type="checkbox"
                    checked={checked.has(p.name)}
                    onChange={() => toggle(p.name)}
                    style={{ accentColor: "#0066CC" }}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PermissionsPage() {
  const router = useRouter()
  const [data, setData] = useState<PermData | null>(null)
  const [loading, setLoading] = useState(true)
  const [roleModal, setRoleModal]   = useState<PermUser | null>(null)
  const [permModal, setPermModal]   = useState<PermUser | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored) {
        const u = JSON.parse(stored)
        if (u.role !== "admin") { router.replace("/dashboard"); return }
      }
    } catch {}
    loadData()
  }, [router])

  async function loadData() {
    setLoading(true)
    try {
      const res = await api.get<any>("/permissions")
      setData(res?.data ?? res)
    } catch {
      // silent — table shows empty state
    } finally {
      setLoading(false)
    }
  }

  // ── Roles table ────────────────────────────────────────────────────────────
  const roleColumns = useMemo<TableColumn<SpatieRole>[]>(() => [
    {
      name: "Rôle",
      cell: (row) => (
        <Badge className={cn("border-0 capitalize", ROLE_COLOR[row.name] ?? "bg-gray-100 text-gray-700")}>
          {row.name}
        </Badge>
      ),
      grow: 0.6,
    },
    {
      name: "Permissions",
      cell: (row) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", padding: "6px 0" }}>
          {row.permissions.map(p => (
            <span key={p.id} style={{
              fontSize: "11px", padding: "2px 6px", borderRadius: "20px",
              background: "#F0F4FF", color: "#3B4FCC", fontWeight: 500,
            }}>
              {p.name}
            </span>
          ))}
        </div>
      ),
      grow: 3,
    },
  ], [])

  // ── Users table ────────────────────────────────────────────────────────────
  const userColumns = useMemo<TableColumn<PermUser>[]>(() => [
    {
      name: "Utilisateur",
      cell: (row) => (
        <div className="py-1">
          <div className="font-medium text-sm">{row.first_name} {row.last_name}</div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
        </div>
      ),
      grow: 1.5,
    },
    {
      name: "Rôle Spatie",
      cell: (row) => {
        const r = row.roles[0]?.name ?? row.role
        return (
          <Badge className={cn("border-0 capitalize", ROLE_COLOR[r] ?? "bg-gray-100 text-gray-700")}>
            {r}
          </Badge>
        )
      },
      grow: 0.7,
    },
    {
      name: "Permissions directes",
      cell: (row) => row.permissions.length === 0
        ? <span className="text-xs text-muted-foreground italic">Aucune</span>
        : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", padding: "6px 0" }}>
            {row.permissions.slice(0, 3).map(p => (
              <span key={p.id} style={{
                fontSize: "11px", padding: "2px 6px", borderRadius: "20px",
                background: "#FFF7ED", color: "#C2410C", fontWeight: 500,
              }}>
                {p.name}
              </span>
            ))}
            {row.permissions.length > 3 && (
              <span style={{ fontSize: "11px", color: "#9CA3AF" }}>+{row.permissions.length - 3}</span>
            )}
          </div>
        ),
      grow: 2,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div style={{ display: "flex", gap: "6px" }}>
          <Button size="sm" variant="outline" className="h-7 text-xs"
            onClick={() => setRoleModal(row)}>
            Rôle
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs"
            onClick={() => setPermModal(row)}>
            Permissions
          </Button>
        </div>
      ),
      grow: 1,
    },
  ], [])

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
          <Shield className="h-5 w-5 text-red-700" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Gestion des permissions</h1>
          <p className="text-muted-foreground text-sm">Rôles, permissions et droits utilisateurs.</p>
        </div>
      </div>

      {/* Roles table */}
      <Card className="border-border/50">
        <CardContent className="p-0 pt-0">
          <AppDataTable<SpatieRole>
            columns={roleColumns}
            data={data?.roles ?? []}
            title="Rôles et permissions associées"
            loading={loading}
            searchable={false}
          />
        </CardContent>
      </Card>

      {/* Users table */}
      <AppDataTable<PermUser>
        columns={userColumns}
        data={data?.users ?? []}
        title={`Utilisateurs — ${data?.users?.length ?? 0} membre${(data?.users?.length ?? 0) > 1 ? "s" : ""}`}
        loading={loading}
        searchable
      />

      {/* Modals */}
      {roleModal && (
        <RoleModal
          user={roleModal}
          roles={data?.roles ?? []}
          onClose={() => setRoleModal(null)}
          onSaved={() => { setRoleModal(null); loadData() }}
        />
      )}
      {permModal && (
        <PermissionsModal
          user={permModal}
          allPerms={data?.permissions ?? []}
          onClose={() => setPermModal(null)}
          onSaved={() => { setPermModal(null); loadData() }}
        />
      )}
    </div>
  )
}
