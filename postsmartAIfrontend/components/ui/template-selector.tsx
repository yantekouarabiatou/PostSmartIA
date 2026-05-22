"use client"

import { useEffect, useState } from "react"
import { Search, X, ChevronRight } from "lucide-react"
import { api } from "@/lib/api"

interface Template {
  id: number
  title: string
  category: string
  service_type: string | null
  content: string
  use_count: number
}

interface TemplateSelectorProps {
  serviceType?: string | null
  onSelect: (content: string) => void
  onClose: () => void
}

const CATEGORY_LABEL: Record<string, string> = {
  general:      "Général",
  reclamation:  "Réclamation",
  suivi_colis:  "Suivi colis",
  info_offre:   "Info / Offre",
  handicap:     "Handicap",
  escalade:     "Escalade",
}

export default function TemplateSelector({ serviceType, onSelect, onClose }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")
  const [applying, setApplying]   = useState<number | null>(null)
  const [preview, setPreview]     = useState<Template | null>(null)

  useEffect(() => {
    async function fetchTemplates() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (serviceType) params.set("service_type", serviceType)
        const data = await api.get<Template[]>(`/templates?${params}`)
        setTemplates(Array.isArray(data) ? data : [])
      } catch {}
      finally { setLoading(false) }
    }
    fetchTemplates()
  }, [serviceType])

  const filtered = templates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (CATEGORY_LABEL[t.category] ?? t.category).toLowerCase().includes(search.toLowerCase())
  )

  async function handleSelect(template: Template) {
    setApplying(template.id)
    try { await api.post(`/templates/${template.id}/use`, {}) } catch {}
    onSelect(template.content)
    setApplying(null)
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)", display: "flex",
      alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 16,
        width: "100%", maxWidth: 700, maxHeight: "82vh",
        boxShadow: "0 20px 60px rgba(0,32,91,0.18)",
        display: "flex", flexDirection: "column", overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 700, color: "#00205B" }}>
              📋 Modèles de réponses
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>
              {serviceType ? `Filtrés pour : ${serviceType.replace(/_/g, " ")}` : "Tous les modèles actifs"}
              {" — "}cliquez sur un modèle pour prévisualiser
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 22px", borderBottom: "1px solid #F0F0F0", position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 34, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un modèle…"
            autoFocus
            style={{
              width: "100%", padding: "7px 10px 7px 28px", borderRadius: 8,
              border: "1px solid #E5E7EB", fontSize: 13, background: "#F9FAFB",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Body: list + preview */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Template list */}
          <div style={{
            width: preview ? 260 : "100%", flexShrink: 0,
            overflowY: "auto",
            borderRight: preview ? "1px solid #E5E7EB" : "none",
          }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>Chargement…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                {search ? "Aucun résultat" : "Aucun modèle disponible"}
              </div>
            ) : filtered.map(t => (
              <div
                key={t.id}
                onClick={() => setPreview(t)}
                style={{
                  padding: "12px 18px", cursor: "pointer",
                  borderBottom: "1px solid #F5F5F5",
                  background: preview?.id === t.id ? "#EBF4FF" : "#fff",
                  borderLeft: preview?.id === t.id ? "3px solid #0066CC" : "3px solid transparent",
                  transition: "background 120ms",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#00205B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.title}
                    </p>
                    <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 10, background: "#EEF4FF", color: "#0066CC", fontWeight: 500 }}>
                        {CATEGORY_LABEL[t.category] ?? t.category}
                      </span>
                      {t.use_count > 0 && (
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>utilisé {t.use_count}×</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} color="#9CA3AF" style={{ marginTop: 2, flexShrink: 0 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Preview pane */}
          {preview && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
                <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#00205B" }}>{preview.title}</p>
                <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 10, background: "#EEF4FF", color: "#0066CC" }}>
                    {CATEGORY_LABEL[preview.category] ?? preview.category}
                  </span>
                  {preview.service_type && (
                    <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 10, background: "#F0FDF4", color: "#059669" }}>
                      {preview.service_type.replace(/_/g, " ")}
                    </span>
                  )}
                  {preview.use_count > 0 && (
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>utilisé {preview.use_count}×</span>
                  )}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
                <pre style={{
                  margin: 0, fontFamily: "inherit", fontSize: 13, lineHeight: 1.75,
                  color: "#374151", whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {preview.content}
                </pre>
              </div>
              <div style={{ padding: "12px 18px", borderTop: "1px solid #E5E7EB", background: "#FAFAFA" }}>
                <button
                  onClick={() => handleSelect(preview)}
                  disabled={applying === preview.id}
                  style={{
                    width: "100%", padding: "10px 16px", borderRadius: 8, border: "none",
                    cursor: applying === preview.id ? "wait" : "pointer",
                    background: "#0066CC", color: "#fff", fontWeight: 600, fontSize: 13,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    opacity: applying === preview.id ? 0.7 : 1,
                  }}
                >
                  {applying === preview.id ? "Application…" : "✓ Utiliser ce modèle"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
