"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Search, X, Check, ChevronDown } from "lucide-react"
import { api } from "@/lib/api"
import toast, { Toaster } from "react-hot-toast"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Template {
  id: number
  title: string
  category: string
  service_type: string | null
  content: string
  is_active: boolean
  use_count: number
  created_by: number | null
  creator?: { id: number; first_name: string; last_name: string } | null
  created_at: string
}

interface AuthUser { id: number; role: string }

const BLANK_FORM = { title: "", category: "general", service_type: "", content: "" }

const CATEGORIES = [
  { value: "general",     label: "Général" },
  { value: "reclamation", label: "Réclamation" },
  { value: "suivi_colis", label: "Suivi colis" },
  { value: "info_offre",  label: "Info / Offre" },
  { value: "handicap",    label: "Handicap" },
  { value: "escalade",    label: "Escalade" },
]

const SERVICE_TYPES = [
  { value: "",                    label: "Tous les services" },
  { value: "suivi_colis",         label: "Suivi colis" },
  { value: "reclamation",         label: "Réclamation" },
  { value: "info_offre",          label: "Info / Offre" },
  { value: "info_generale",       label: "Info générale" },
  { value: "escalade_mediateur",  label: "Escalade médiateur" },
  { value: "handicap",            label: "Handicap" },
  { value: "formulaire",          label: "Formulaire" },
  { value: "formation",           label: "Formation" },
]

const CATEGORY_COLOR: Record<string, { bg: string; text: string }> = {
  general:      { bg: "#F3F4F6", text: "#374151" },
  reclamation:  { bg: "#FEE2E2", text: "#991B1B" },
  suivi_colis:  { bg: "#DBEAFE", text: "#1E40AF" },
  info_offre:   { bg: "#D1FAE5", text: "#065F46" },
  handicap:     { bg: "#FEF3C7", text: "#92400E" },
  escalade:     { bg: "#EDE9FE", text: "#5B21B6" },
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [templates, setTemplates]       = useState<Template[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState("")
  const [filterService, setFilterService] = useState("")
  const [user, setUser]                 = useState<AuthUser | null>(null)
  const [selected, setSelected]         = useState<Template | null>(null)
  const [showForm, setShowForm]         = useState(false)
  const [editing, setEditing]           = useState<Template | null>(null)
  const [form, setForm]                 = useState(BLANK_FORM)
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState<number | null>(null)

  const isManagerOrAdmin = user?.role === "manager" || user?.role === "admin"

  useEffect(() => {
    const stored = localStorage.getItem("auth_user")
    if (stored) { try { setUser(JSON.parse(stored)) } catch {} }
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterService) params.set("service_type", filterService)
      if (search) params.set("search", search)
      const data = await api.get<Template[]>(`/templates?${params}`)
      setTemplates(Array.isArray(data) ? data : [])
    } catch { toast.error("Impossible de charger les modèles") }
    finally { setLoading(false) }
  }

  useEffect(() => { loadTemplates() }, [filterService, search])

  function openCreate() {
    setEditing(null)
    setForm(BLANK_FORM)
    setShowForm(true)
  }

  function openEdit(t: Template) {
    setEditing(t)
    setForm({ title: t.title, category: t.category, service_type: t.service_type ?? "", content: t.content })
    setShowForm(true)
    setSelected(null)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Le titre et le contenu sont requis.")
      return
    }
    setSaving(true)
    try {
      const payload = {
        title:        form.title.trim(),
        category:     form.category,
        service_type: form.service_type || null,
        content:      form.content.trim(),
      }
      if (editing) {
        await api.put(`/templates/${editing.id}`, payload)
        toast.success("Modèle mis à jour.")
      } else {
        await api.post("/templates", payload)
        toast.success("Modèle créé.")
      }
      setShowForm(false)
      loadTemplates()
    } catch (e: any) { toast.error(e?.message ?? "Erreur lors de la sauvegarde") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce modèle ?")) return
    setDeleting(id)
    try {
      await api.del(`/templates/${id}`)
      toast.success("Modèle supprimé.")
      if (selected?.id === id) setSelected(null)
      loadTemplates()
    } catch (e: any) { toast.error(e?.message ?? "Erreur lors de la suppression") }
    finally { setDeleting(null) }
  }

  async function handleToggleActive(t: Template) {
    try {
      await api.put(`/templates/${t.id}`, { is_active: !t.is_active })
      toast.success(t.is_active ? "Modèle désactivé." : "Modèle activé.")
      loadTemplates()
    } catch (e: any) { toast.error(e?.message ?? "Erreur") }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box",
    fontFamily: "inherit", outline: "none",
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <div style={{ display: "flex", height: "calc(100vh - 64px)", background: "#F5F7FA", fontFamily: "Inter, sans-serif" }}>

        {/* ── Left: list ── */}
        <div style={{ width: selected ? 400 : "100%", flexShrink: 0, display: "flex", flexDirection: "column", borderRight: selected ? "1px solid #E5E7EB" : "none", background: "#fff" }}>

          {/* Header */}
          <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid #F0F0F0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#00205B" }}>📋 Modèles de réponses</h1>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6B7280" }}>
                  Sélectionnez et personnalisez vos réponses types
                </p>
              </div>
              {isManagerOrAdmin && (
                <button onClick={openCreate} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: "#00205B", color: "#fff", fontWeight: 600, fontSize: 13,
                }}>
                  <Plus size={15} /> Nouveau modèle
                </button>
              )}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  style={{ ...inputStyle, paddingLeft: 28 }}
                />
              </div>
              <div style={{ position: "relative" }}>
                <select
                  value={filterService}
                  onChange={e => setFilterService(e.target.value)}
                  style={{ ...inputStyle, width: "auto", paddingRight: 28, appearance: "none", cursor: "pointer" }}
                >
                  {SERVICE_TYPES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6B7280" }} />
              </div>
            </div>
          </div>

          {/* Template cards */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>Chargement…</div>
            ) : templates.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <p style={{ color: "#9CA3AF", fontSize: 14 }}>
                  {search || filterService ? "Aucun résultat" : "Aucun modèle pour l'instant"}
                </p>
                {isManagerOrAdmin && !search && !filterService && (
                  <button onClick={openCreate} style={{
                    marginTop: 12, padding: "9px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: "#00205B", color: "#fff", fontWeight: 600, fontSize: 13,
                  }}>Créer le premier modèle</button>
                )}
              </div>
            ) : templates.map(t => {
              const catColor = CATEGORY_COLOR[t.category] ?? CATEGORY_COLOR.general
              const isActive = selected?.id === t.id
              return (
                <div
                  key={t.id}
                  onClick={() => setSelected(isActive ? null : t)}
                  style={{
                    padding: "14px 20px", cursor: "pointer", borderBottom: "1px solid #F5F5F5",
                    background: isActive ? "#EBF4FF" : "#fff",
                    borderLeft: isActive ? "3px solid #0066CC" : "3px solid transparent",
                    opacity: t.is_active ? 1 : 0.55,
                    transition: "background 120ms",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 5px", fontSize: 14, fontWeight: 600, color: "#00205B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.title}
                      </p>
                      <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 10, background: catColor.bg, color: catColor.text, fontWeight: 500 }}>
                          {CATEGORIES.find(c => c.value === t.category)?.label ?? t.category}
                        </span>
                        {t.service_type && (
                          <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 10, background: "#F0FDF4", color: "#059669", fontWeight: 500 }}>
                            {t.service_type.replace(/_/g, " ")}
                          </span>
                        )}
                        {!t.is_active && (
                          <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 10, background: "#F3F4F6", color: "#9CA3AF" }}>Inactif</span>
                        )}
                        {t.use_count > 0 && (
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>utilisé {t.use_count}×</span>
                        )}
                      </div>
                    </div>
                    {isManagerOrAdmin && (
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openEdit(t)}
                          title="Modifier"
                          style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #E5E7EB", cursor: "pointer", background: "#F9FAFB", color: "#374151", display: "flex" }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={deleting === t.id}
                          title="Supprimer"
                          style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #FECACA", cursor: "pointer", background: "#FEF2F2", color: "#DC2626", display: "flex", opacity: deleting === t.id ? 0.6 : 1 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Right: preview ── */}
        {selected && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Preview header */}
            <div style={{ padding: "18px 24px", background: "#fff", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#00205B" }}>{selected.title}</h2>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {(() => {
                    const cc = CATEGORY_COLOR[selected.category] ?? CATEGORY_COLOR.general
                    return (
                      <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 10, background: cc.bg, color: cc.text, fontWeight: 500 }}>
                        {CATEGORIES.find(c => c.value === selected.category)?.label ?? selected.category}
                      </span>
                    )
                  })()}
                  {selected.service_type && (
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 10, background: "#F0FDF4", color: "#059669", fontWeight: 500 }}>
                      {selected.service_type.replace(/_/g, " ")}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>Utilisé {selected.use_count} fois</span>
                  {selected.creator && (
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                      · Créé par {selected.creator.first_name} {selected.creator.last_name}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {isManagerOrAdmin && (
                  <>
                    <button onClick={() => handleToggleActive(selected)} style={{
                      padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: "1px solid #D1D5DB", background: "#fff",
                      color: selected.is_active ? "#DC2626" : "#059669",
                    }}>
                      {selected.is_active ? "Désactiver" : "Activer"}
                    </button>
                    <button onClick={() => openEdit(selected)} style={{
                      padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: "1px solid #0066CC", background: "#EBF4FF", color: "#0066CC",
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <Pencil size={13} /> Modifier
                    </button>
                  </>
                )}
                <button onClick={() => setSelected(null)} style={{
                  padding: "8px", borderRadius: 8, border: "1px solid #E5E7EB", cursor: "pointer", background: "#fff", display: "flex",
                }}>
                  <X size={15} color="#6B7280" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", background: "#F5F7FA" }}>
              <div style={{ background: "#fff", borderRadius: 12, padding: "22px 24px", border: "1px solid #E5E7EB" }}>
                <pre style={{
                  margin: 0, fontFamily: "inherit", fontSize: 14, lineHeight: 1.8,
                  color: "#1A1A2E", whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {selected.content}
                </pre>
              </div>
              <p style={{ marginTop: 12, fontSize: 12, color: "#9CA3AF" }}>
                💡 Ce modèle peut être utilisé directement depuis la page « Mails entrants » en cliquant sur « 📋 Modèles ».
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: create / edit ── */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setShowForm(false)}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "28px 28px 24px",
            width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,32,91,0.18)", fontFamily: "Inter, sans-serif",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#00205B" }}>
                {editing ? "✏️ Modifier le modèle" : "➕ Nouveau modèle"}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}>
                <X size={18} />
              </button>
            </div>

            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Titre <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <input
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Accusé de réception — Réclamation"
              style={{ ...inputStyle, marginBottom: 16 }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Catégorie</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ ...inputStyle }}
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Type de service (optionnel)</label>
                <select
                  value={form.service_type}
                  onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}
                  style={{ ...inputStyle }}
                >
                  {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Contenu <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={12}
              placeholder="Rédigez votre modèle de réponse ici…"
              style={{ ...inputStyle, resize: "vertical", marginBottom: 22 }}
            />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowForm(false)} style={{
                padding: "10px 20px", borderRadius: 8, border: "1px solid #D1D5DB", cursor: "pointer",
                background: "#fff", color: "#374151", fontSize: 13,
              }}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: "10px 22px", borderRadius: 8, border: "none", cursor: saving ? "wait" : "pointer",
                background: "#00205B", color: "#fff", fontWeight: 600, fontSize: 13,
                display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.7 : 1,
              }}>
                {saving ? "Enregistrement…" : <><Check size={14} /> {editing ? "Enregistrer" : "Créer le modèle"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
