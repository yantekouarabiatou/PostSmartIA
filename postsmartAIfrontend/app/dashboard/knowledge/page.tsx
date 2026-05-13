"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Search, Plus, Trash2, Eye, Tag, FileText, X, Check, AlertCircle, Copy, Zap } from "lucide-react"
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

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  procedure:      { label: "Procédure",       color: "#1d4ed8", bg: "#eff6ff", dot: "#3b82f6" },
  offre:          { label: "Offre",           color: "#15803d", bg: "#f0fdf4", dot: "#22c55e" },
  cgv:            { label: "CGV",             color: "#b91c1c", bg: "#fef2f2", dot: "#ef4444" },
  reglementation: { label: "Réglementation",  color: "#c2410c", bg: "#fff7ed", dot: "#f97316" },
}

const SIDEBAR_ITEMS = [
  { key: "all",           label: "Tous les documents", icon: "📚" },
  { key: "procedure",     label: "Procédures",          icon: "📋" },
  { key: "offre",         label: "Offres",              icon: "🎁" },
  { key: "cgv",           label: "CGV",                 icon: "📄" },
  { key: "reglementation",label: "Réglementations",     icon: "⚖️" },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}

export default function KnowledgePage() {
  const router = useRouter()
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

  const [copied, setCopied]   = useState(false)
  const [injected, setInjected] = useState(false)
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
      const params = new URLSearchParams({ per_page: "20", page: String(p) })
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

  function handleTypeChange(key: string) {
    setTypeFilter(key)
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
        title: form.title, description: form.description,
        type: form.type, content: form.content, tags, is_active: true,
      })
      setShowCreate(false)
      setForm({ title: "", description: "", type: "procedure", content: "", tags: "" })
      fetchDocs(1, typeFilter, search)
      setPage(1)
    } catch (err: any) {
      setSaveError(err.message || "Erreur lors de la création.")
    } finally {
      setSaving(false)
    }
  }

  function handleCopy(doc: KbDoc) {
    navigator.clipboard.writeText(doc.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleInject(doc: KbDoc) {
    navigator.clipboard.writeText(doc.content).then(() => {
      sessionStorage.setItem("kb_inject", doc.content)
      setInjected(true)
      setTimeout(() => {
        setViewDoc(null)
        router.push("/dashboard/generate")
      }, 800)
    })
  }

  const tc = viewDoc ? (TYPE_CONFIG[viewDoc.type] ?? TYPE_CONFIG.procedure) : null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        .kb-root * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .kb-root { display: flex; min-height: 100vh; background: #f5f7fb; }

        /* Sidebar */
        .kb-sidebar {
          width: 220px; flex-shrink: 0;
          background: #fff;
          border-right: 1px solid #e5e7eb;
          padding: 1.5rem 0;
          display: flex; flex-direction: column; gap: 0.25rem;
        }
        .kb-sidebar-title {
          font-size: 0.7rem; font-weight: 700; color: #9ca3af;
          text-transform: uppercase; letter-spacing: 0.07em;
          padding: 0 1.25rem; margin-bottom: 0.5rem;
        }
        .kb-sidebar-item {
          display: flex; align-items: center; gap: 0.7rem;
          padding: 0.55rem 1.25rem;
          font-size: 0.875rem; font-weight: 500; color: #374151;
          cursor: pointer; border-radius: 0; transition: background 0.12s, color 0.12s;
          border: none; background: transparent; width: 100%; text-align: left;
        }
        .kb-sidebar-item:hover { background: #f3f4f6; }
        .kb-sidebar-item.active { background: #eff6ff; color: #1d4ed8; font-weight: 600; }
        .kb-sidebar-item .kb-sidebar-icon { font-size: 1rem; }
        .kb-sidebar-item .kb-sidebar-count {
          margin-left: auto; font-size: 0.7rem; font-weight: 600;
          background: #e5e7eb; color: #6b7280; border-radius: 20px;
          padding: 0.1rem 0.5rem;
        }
        .kb-sidebar-item.active .kb-sidebar-count { background: #dbeafe; color: #1d4ed8; }

        /* Main */
        .kb-main { flex: 1; padding: 2rem 1.75rem; display: flex; flex-direction: column; gap: 1.5rem; overflow: auto; }

        .kb-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .kb-title { font-size: 1.5rem; font-weight: 700; color: #111827; }
        .kb-subtitle { font-size: 0.875rem; color: #6b7280; margin-top: 0.2rem; }

        .btn-add {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: #00205B; color: #fff;
          font-size: 0.85rem; font-weight: 600;
          padding: 0.55rem 1.1rem; border-radius: 9px; border: none; cursor: pointer;
          transition: background 0.15s, transform 0.12s;
        }
        .btn-add:hover { background: #001845; transform: translateY(-1px); }

        /* Search */
        .kb-search-wrap { position: relative; }
        .kb-search-icon { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: #9ca3af; }
        .kb-search {
          width: 100%; padding: 0.6rem 0.85rem 0.6rem 2.4rem;
          border: 1.5px solid #e5e7eb; border-radius: 9px;
          font-size: 0.875rem; color: #111827; background: #fff;
          outline: none; transition: border-color 0.15s;
        }
        .kb-search:focus { border-color: #00205B; }

        /* Count */
        .kb-count { font-size: 0.8rem; color: #9ca3af; }

        /* Grid */
        .kb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }

        .kb-card {
          background: #fff; border-radius: 14px;
          border: 1.5px solid #e5e7eb;
          padding: 1.25rem;
          display: flex; flex-direction: column; gap: 0.75rem;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .kb-card:hover { border-color: #00205B; box-shadow: 0 4px 16px rgba(0,32,91,0.08); }

        .kb-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
        .kb-card-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: #eff6ff; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .kb-type-badge {
          font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.55rem;
          border-radius: 20px; flex-shrink: 0;
        }
        .kb-card-title { font-size: 0.9rem; font-weight: 700; color: #111827; line-height: 1.35; }
        .kb-card-desc { font-size: 0.78rem; color: #6b7280; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .kb-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
        .kb-tag { font-size: 0.68rem; padding: 0.15rem 0.5rem; background: #f3f4f6; color: #6b7280; border-radius: 4px; }
        .kb-card-date { font-size: 0.72rem; color: #9ca3af; }
        .kb-card-actions { display: flex; gap: 0.5rem; margin-top: auto; }
        .btn-consult {
          flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem;
          padding: 0.45rem; border-radius: 8px;
          border: 1.5px solid #e5e7eb; background: #fff;
          font-size: 0.78rem; font-weight: 600; color: #374151;
          cursor: pointer; transition: border-color 0.12s, background 0.12s;
        }
        .btn-consult:hover { border-color: #00205B; color: #00205B; background: #eff6ff; }
        .btn-del {
          width: 34px; height: 34px; border-radius: 8px;
          border: 1.5px solid #fecaca; background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.12s; color: #dc2626;
        }
        .btn-del:hover { background: #fef2f2; }

        /* Pagination */
        .kb-pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; }
        .btn-page {
          padding: 0.4rem 1rem; border-radius: 8px;
          border: 1.5px solid #e5e7eb; background: #fff;
          font-size: 0.8rem; font-weight: 600; color: #374151;
          cursor: pointer; transition: background 0.12s;
        }
        .btn-page:hover:not(:disabled) { background: #f3f4f6; }
        .btn-page:disabled { opacity: 0.4; cursor: not-allowed; }
        .kb-page-info { font-size: 0.82rem; color: #9ca3af; }

        /* Empty / loading */
        .kb-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; padding: 4rem 0; text-align: center; }
        .kb-empty-icon { width: 48px; height: 48px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .kb-loading { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 4rem 0; color: #9ca3af; font-size: 0.875rem; }
        .spinner { width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top-color: #6b7280; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Modal overlay */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 1rem;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .modal {
          background: #fff; border-radius: 16px;
          width: 100%; max-width: 640px;
          max-height: 88vh; overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          animation: slideUp 0.2s ease;
        }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        .modal-sm { max-width: 420px; }
        .modal-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding: 1.5rem 1.5rem 0;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 1rem;
        }
        .modal-title { font-size: 1.05rem; font-weight: 700; color: #111827; }
        .modal-subtitle { font-size: 0.8rem; color: #6b7280; margin-top: 0.2rem; }
        .modal-close {
          width: 32px; height: 32px; border-radius: 8px;
          border: 1.5px solid #e5e7eb; background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #6b7280; flex-shrink: 0;
          transition: background 0.12s;
        }
        .modal-close:hover { background: #f3f4f6; }
        .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.1rem; }
        .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #f3f4f6; display: flex; gap: 0.6rem; justify-content: flex-end; }

        /* Content box */
        .content-box {
          background: #f8f9fa; border: 1.5px solid #e5e7eb; border-radius: 10px;
          padding: 1rem 1.1rem;
        }
        .content-pre { white-space: pre-wrap; font-size: 0.875rem; color: #111827; font-family: 'Inter', sans-serif; line-height: 1.65; }

        /* Action buttons in modal */
        .modal-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .btn-copy {
          display: inline-flex; align-items: center; gap: 0.45rem;
          padding: 0.5rem 1rem; border-radius: 9px;
          border: 1.5px solid #e5e7eb; background: #fff;
          font-size: 0.82rem; font-weight: 600; color: #374151;
          cursor: pointer; transition: all 0.12s;
        }
        .btn-copy:hover { border-color: #00205B; color: #00205B; background: #eff6ff; }
        .btn-copy.done { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }
        .btn-inject {
          display: inline-flex; align-items: center; gap: 0.45rem;
          padding: 0.5rem 1rem; border-radius: 9px;
          border: none; background: #FFCC00; color: #111827;
          font-size: 0.82rem; font-weight: 600;
          cursor: pointer; transition: all 0.12s;
        }
        .btn-inject:hover { background: #f5c400; transform: translateY(-1px); }
        .btn-inject.done { background: #16a34a; color: #fff; }

        /* Form fields */
        .form-label { font-size: 0.83rem; font-weight: 600; color: #374151; display: block; margin-bottom: 0.4rem; }
        .form-input, .form-textarea, .form-select {
          width: 100%; padding: 0.6rem 0.85rem;
          border: 1.5px solid #e5e7eb; border-radius: 9px;
          font-size: 0.875rem; color: #111827; background: #fff;
          outline: none; transition: border-color 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .form-input:focus, .form-textarea:focus, .form-select:focus { border-color: #00205B; }
        .form-textarea { resize: vertical; min-height: 80px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 500px) { .form-grid { grid-template-columns: 1fr; } }

        /* Buttons */
        .btn-outline {
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.5rem 1rem; border-radius: 8px;
          border: 1.5px solid #e5e7eb; background: #fff;
          font-size: 0.82rem; font-weight: 600; color: #374151;
          cursor: pointer; transition: background 0.12s;
        }
        .btn-outline:hover { background: #f3f4f6; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.5rem 1rem; border-radius: 8px;
          border: none; background: #00205B; color: #fff;
          font-size: 0.82rem; font-weight: 600;
          cursor: pointer; transition: background 0.12s;
        }
        .btn-primary:hover { background: #001845; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-danger {
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.5rem 1rem; border-radius: 8px;
          border: none; background: #dc2626; color: #fff;
          font-size: 0.82rem; font-weight: 600;
          cursor: pointer; transition: background 0.12s;
        }
        .btn-danger:hover { background: #b91c1c; }
        .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

        .err-msg { font-size: 0.78rem; color: #dc2626; display: flex; align-items: center; gap: 0.35rem; }

        @media (max-width: 700px) {
          .kb-sidebar { display: none; }
          .kb-main { padding: 1.25rem; }
        }
      `}</style>

      <div className="kb-root">
        {/* Sidebar */}
        <aside className="kb-sidebar">
          <div className="kb-sidebar-title">Catégories</div>
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.key}
              className={`kb-sidebar-item${typeFilter === item.key ? " active" : ""}`}
              onClick={() => handleTypeChange(item.key)}
            >
              <span className="kb-sidebar-icon">{item.icon}</span>
              {item.label}
              {item.key === "all" && !loading && (
                <span className="kb-sidebar-count">{total}</span>
              )}
            </button>
          ))}
        </aside>

        {/* Main */}
        <div className="kb-main">
          {/* Header */}
          <div className="kb-header">
            <div>
              <div className="kb-title">Base de connaissances</div>
              <div className="kb-subtitle">Procédures, offres, CGV et réglementations La Poste.</div>
            </div>
            {canCreate && (
              <button className="btn-add" onClick={() => { setShowCreate(true); setSaveError("") }}>
                <Plus size={15} /> Ajouter
              </button>
            )}
          </div>

          {/* Search */}
          <div className="kb-search-wrap">
            <Search size={15} className="kb-search-icon" />
            <input
              className="kb-search"
              placeholder="Rechercher un document…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {!loading && !error && (
            <div className="kb-count">{total} document{total !== 1 ? "s" : ""}</div>
          )}

          {error && (
            <div className="err-msg" style={{ padding: "0.75rem", background: "#fef2f2", borderRadius: 9, border: "1.5px solid #fecaca" }}>
              <AlertCircle size={14} />{error}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="kb-loading">
              <span className="spinner" />
              Chargement…
            </div>
          ) : docs.length === 0 ? (
            <div className="kb-empty">
              <div className="kb-empty-icon"><BookOpen size={22} color="#9ca3af" /></div>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>Aucun document trouvé</div>
                <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: 4 }}>
                  {search.trim() || typeFilter !== "all"
                    ? "Essayez d'autres filtres."
                    : canCreate ? "Ajoutez votre premier document." : "Aucun document disponible pour l'instant."}
                </div>
              </div>
            </div>
          ) : (
            <div className="kb-grid">
              {docs.map(doc => {
                const t = TYPE_CONFIG[doc.type] ?? TYPE_CONFIG.procedure
                return (
                  <div key={doc.id} className="kb-card">
                    <div className="kb-card-top">
                      <div className="kb-card-icon">
                        <FileText size={18} color="#1d4ed8" />
                      </div>
                      <span
                        className="kb-type-badge"
                        style={{ color: t.color, background: t.bg }}
                      >
                        {t.label}
                      </span>
                    </div>
                    <div className="kb-card-title">{doc.title}</div>
                    <div className="kb-card-desc">{doc.description}</div>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="kb-tags">
                        {doc.tags.slice(0, 4).map(tag => (
                          <span key={tag} className="kb-tag">{tag}</span>
                        ))}
                        {doc.tags.length > 4 && (
                          <span className="kb-tag">+{doc.tags.length - 4}</span>
                        )}
                      </div>
                    )}
                    <div className="kb-card-date">{formatDate(doc.created_at)}</div>
                    <div className="kb-card-actions">
                      <button className="btn-consult" onClick={() => { setViewDoc(doc); setCopied(false); setInjected(false) }}>
                        <Eye size={14} /> Consulter
                      </button>
                      {canCreate && (
                        <button
                          className="btn-del"
                          title="Supprimer"
                          onClick={() => { setDeleteDoc(doc); setDeleteError("") }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && lastPage > 1 && (
            <div className="kb-pagination">
              <button className="btn-page" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
              <span className="kb-page-info">Page {page} / {lastPage}</span>
              <button className="btn-page" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}>Suivant →</button>
            </div>
          )}
        </div>
      </div>

      {/* ── View modal ─────────────────────────────────────────── */}
      {viewDoc && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setViewDoc(null) }}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">{viewDoc.title}</div>
                <div className="modal-subtitle">
                  <span
                    style={{
                      display: "inline-block", marginRight: 8,
                      fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.5rem",
                      borderRadius: 20,
                      color: tc?.color, background: tc?.bg,
                    }}
                  >
                    {tc?.label}
                  </span>
                  {formatDate(viewDoc.created_at)}
                </div>
              </div>
              <button className="modal-close" onClick={() => setViewDoc(null)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{viewDoc.description}</p>

              <div className="content-box">
                <pre className="content-pre">{viewDoc.content}</pre>
              </div>

              {viewDoc.tags && viewDoc.tags.length > 0 && (
                <div className="kb-tags">
                  {viewDoc.tags.map(tag => (
                    <span key={tag} className="kb-tag" style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }}>
                      <Tag size={10} style={{ display: "inline", marginRight: 2 }} />{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button
                  className={`btn-copy${copied ? " done" : ""}`}
                  onClick={() => handleCopy(viewDoc)}
                >
                  {copied ? <><Check size={14} /> Copié !</> : <><Copy size={14} /> Copier le contenu</>}
                </button>
                <button
                  className={`btn-inject${injected ? " done" : ""}`}
                  onClick={() => handleInject(viewDoc)}
                >
                  {injected ? <><Check size={14} /> Injection…</> : <><Zap size={14} /> Injecter dans le chat</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create modal ───────────────────────────────────────── */}
      {showCreate && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">Ajouter un document</div>
                <div className="modal-subtitle">Procédure, offre, CGV ou réglementation.</div>
              </div>
              <button className="modal-close" onClick={() => setShowCreate(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div>
                  <label className="form-label">Titre <span style={{ color: "#dc2626" }}>*</span></label>
                  <input
                    className="form-input"
                    placeholder="Titre du document"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as KbDoc["type"] }))}
                  >
                    <option value="procedure">Procédure</option>
                    <option value="offre">Offre</option>
                    <option value="cgv">CGV</option>
                    <option value="reglementation">Réglementation</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Description <span style={{ color: "#dc2626" }}>*</span></label>
                <textarea
                  className="form-textarea"
                  placeholder="Courte description"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ minHeight: 72 }}
                />
              </div>
              <div>
                <label className="form-label">Contenu <span style={{ color: "#dc2626" }}>*</span></label>
                <textarea
                  className="form-textarea"
                  placeholder="Contenu complet du document…"
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  style={{ minHeight: 140 }}
                />
              </div>
              <div>
                <label className="form-label">
                  Tags <span style={{ color: "#9ca3af", fontWeight: 400 }}>(séparés par des virgules)</span>
                </label>
                <input
                  className="form-input"
                  placeholder="colissimo, recommandé, suivi…"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                />
              </div>
              {saveError && <div className="err-msg"><AlertCircle size={13} />{saveError}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowCreate(false)} disabled={saving}>
                <X size={13} /> Annuler
              </button>
              <button
                className="btn-primary"
                onClick={handleCreate}
                disabled={saving || !form.title.trim() || !form.description.trim() || !form.content.trim()}
              >
                {saving
                  ? <><span className="spinner" style={{ borderTopColor: "#fff" }} /> Enregistrement…</>
                  : <><Check size={13} /> Enregistrer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete modal ───────────────────────────────────────── */}
      {deleteDoc && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteDoc(null) }}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div>
                <div className="modal-title" style={{ color: "#dc2626" }}>Supprimer ce document ?</div>
                <div className="modal-subtitle">
                  Cette action est irréversible. Le document <strong>"{deleteDoc.title}"</strong> sera supprimé définitivement.
                </div>
              </div>
              <button className="modal-close" onClick={() => setDeleteDoc(null)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              {deleteError && <div className="err-msg"><AlertCircle size={13} />{deleteError}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setDeleteDoc(null)} disabled={deleting}>
                <X size={13} /> Annuler
              </button>
              <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting
                  ? <><span className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Suppression…</>
                  : <><Trash2 size={13} /> Supprimer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
