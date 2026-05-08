"use client"

import { useEffect, useState, useCallback } from "react"
import { RefreshCw, Search, Sparkles, Archive, RotateCcw, Check, X, ChevronDown, ChevronUp } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import toast, { Toaster } from "react-hot-toast"
import { format, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import QualityScore from "@/components/ui/quality-score"
import MailDiff from "@/components/ui/mail-diff"
import dynamic from "next/dynamic"

const exportEmailToPdf = dynamic(() => import("@/lib/export-pdf").then(m => m.exportEmailToPdf), { ssr: false })

// ── Types ────────────────────────────────────────────────────────────────────

interface Email {
  id: number
  from_name: string | null
  from_email: string
  subject: string
  body_text: string | null
  received_at: string
  is_read: boolean
  status: "unread" | "read" | "processing" | "resolved" | "archived"
  ai_service_type: string | null
  ai_response: string | null
  ai_quality_score_json: Record<string, number> | null
  validated_response: string | null
  validated_at: string | null
  archived_at: string | null
  source: "imap" | "form" | "manual"
}

interface Analysis {
  service_type: string
  urgency: string
  tone: string
  client_name: string | null
  dossier_number: string | null
  main_request: string
  key_points: string[]
  suggested_actions: string[]
}

interface AiResult {
  email: Email
  analysis: Analysis
  response: { subject: string; body: string; quality_score: Record<string, number>; tone: string; warnings: string[] }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SERVICE_COLOR: Record<string, string> = {
  suivi_colis:         "#0066CC",
  reclamation:         "#DC2626",
  info_offre:          "#0F6E56",
  escalade_mediateur:  "#7C3AED",
  handicap:            "#D97706",
  formulaire:          "#0891B2",
  autre:               "#6B7280",
}

const SERVICE_LABEL: Record<string, string> = {
  suivi_colis:        "Suivi colis",
  reclamation:        "Réclamation",
  info_offre:         "Info / Offre",
  escalade_mediateur: "Escalade",
  handicap:           "Handicap",
  formulaire:         "Formulaire",
  autre:              "Autre",
}

const TABS = [
  { key: "all",        label: "Tous" },
  { key: "unread",     label: "Non lus" },
  { key: "processing", label: "En cours" },
  { key: "resolved",   label: "Résolus" },
  { key: "archived",   label: "Archivés" },
  { key: "form",       label: "Formulaires", isSource: true },
]

function initials(name: string | null, email: string) {
  if (name) return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

function relativeDate(dt: string) {
  try { return formatDistanceToNow(new Date(dt), { addSuffix: true, locale: fr }) }
  catch { return dt }
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? "#059669" : value >= 50 ? "#D97706" : "#DC2626"
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: "#6B7280" }}>{label}</span>
        <span style={{ fontWeight: 600, color }}>{value}/100</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "#E5E7EB" }}>
        <div style={{ height: "100%", borderRadius: 3, width: `${value}%`, background: color, transition: "width .4s" }} />
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function IncomingPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Email | null>(null)
  const [tab, setTab] = useState("all")
  const [search, setSearch] = useState("")
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [editedSubject, setEditedSubject] = useState("")
  const [editedBody, setEditedBody] = useState("")
  const [analysisOpen, setAnalysisOpen] = useState(true)
  const [showDiff, setShowDiff] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tab !== "all" && !TABS.find(t => t.key === tab && t.isSource)) params.set("status", tab)
      if (TABS.find(t => t.key === tab && t.isSource)) params.set("source", tab)
      if (search) params.set("search", search)
      params.set("per_page", "30")
      const res = await api.get<any>(`/emails?${params}`)
      const items: Email[] = res?.data ?? []
      setEmails(items)
      setTotal(res?.total ?? items.length)
      setUnreadCount(items.filter(e => e.status === "unread").length)
    } catch { toast.error("Impossible de charger les mails") }
    finally { setLoading(false) }
  }, [tab, search])

  useEffect(() => { load() }, [load])

  async function selectEmail(email: Email) {
    setSelected(email)
    setAiResult(null)
    setEditedSubject("")
    setEditedBody("")
    if (isMobile) setShowDetail(true)
    if (email.status === "unread") {
      try {
        await api.put(`/emails/${email.id}/read`)
        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, status: "read", is_read: true } : e))
      } catch {}
    }
  }

  async function handleAnalyze() {
    if (!selected) return
    setAnalyzing(true)
    try {
      const res = await api.post<AiResult>(`/emails/${selected.id}/analyze`, {})
      setAiResult(res)
      setEditedSubject(res.response.subject ?? "")
      setEditedBody(res.response.body ?? "")
      setSelected(res.email)
      setEmails(prev => prev.map(e => e.id === res.email.id ? res.email : e))
      toast.success("Analyse et réponse générées !")
    } catch (e: any) { toast.error(e.message ?? "Erreur lors de l'analyse") }
    finally { setAnalyzing(false) }
  }

  async function handleValidate(action: "validate" | "reject") {
    if (!selected) return
    try {
      const body: any = { action }
      if (action === "validate") body.validated_response = editedBody
      const res = await api.post<Email>(`/emails/${selected.id}/validate`, body)
      setSelected(res)
      setEmails(prev => prev.map(e => e.id === res.id ? res : e))
      if (action === "validate") {
        toast.success("Réponse validée ! Mail résolu.")
        setAiResult(null)
      } else {
        toast("Réponse rejetée.", { icon: "⚠️" })
        setAiResult(null)
      }
    } catch (e: any) { toast.error(e.message ?? "Erreur") }
  }

  async function handleArchive(id: number, unarchive = false) {
    try {
      const path = unarchive ? `/emails/${id}/unarchive` : `/emails/${id}/archive`
      await api.post(path, {})
      toast.success(unarchive ? "Mail désarchivé." : "Mail archivé.")
      setSelected(null)
      setAiResult(null)
      load()
    } catch (e: any) { toast.error(e.message ?? "Erreur") }
  }

  // ── Left panel ──────────────────────────────────────────────────────────────
  const listPanel = (
    <div style={{
      width: isMobile ? "100%" : 380, flexShrink: 0,
      display: "flex", flexDirection: "column",
      borderRight: "1px solid #E5E7EB", height: "calc(100vh - 64px)",
      background: "#fff",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 10px", borderBottom: "1px solid #F0F0F0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#00205B" }}>Boîte de réception</span>
            {unreadCount > 0 && (
              <span style={{
                background: "#FFCC00", color: "#00205B", borderRadius: 20,
                fontSize: 11, fontWeight: 700, padding: "1px 7px",
              }}>{unreadCount}</span>
            )}
          </div>
          <button onClick={load} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 4 }}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              fontSize: 12, padding: "4px 10px", borderRadius: 20, border: "none", cursor: "pointer",
              background: tab === t.key ? "#00205B" : "#F0F4FF",
              color: tab === t.key ? "#fff" : "#0066CC", fontWeight: 500,
            }}>{t.label}</button>
          ))}
        </div>
        {/* Search */}
        <div style={{ marginTop: 8, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            style={{
              width: "100%", padding: "7px 10px 7px 30px", borderRadius: 8,
              border: "1px solid #E5E7EB", fontSize: 13, background: "#F5F7FA",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && emails.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>Chargement…</div>
        ) : emails.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>Aucun mail</div>
        ) : emails.map(email => {
          const isSelected = selected?.id === email.id
          const isUnread = email.status === "unread"
          const svcColor = SERVICE_COLOR[email.ai_service_type ?? ""] ?? "#6B7280"
          const avatarLetters = initials(email.from_name, email.from_email)

          return (
            <div
              key={email.id}
              onClick={() => selectEmail(email)}
              style={{
                padding: "12px 14px", cursor: "pointer", position: "relative",
                borderBottom: "1px solid #F5F5F5",
                background: isSelected ? "#EBF4FF" : isUnread ? "#F8FBFF" : "#fff",
                borderLeft: isSelected ? "3px solid #0066CC" : "3px solid transparent",
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: svcColor, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff",
                }}>{avatarLetters}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: isUnread ? 700 : 500, color: "#1A1A2E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                      {email.from_name || email.from_email}
                    </span>
                    <span style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap", marginLeft: 6 }}>
                      {relativeDate(email.received_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: isUnread ? "#00205B" : "#374151", fontWeight: isUnread ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                    {email.subject}
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginTop: 2 }}>
                    {email.body_text?.slice(0, 120)}
                  </div>
                  <div style={{ marginTop: 5, display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {email.ai_service_type && (
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 20, background: svcColor + "20", color: svcColor, fontWeight: 600 }}>
                        {SERVICE_LABEL[email.ai_service_type] ?? email.ai_service_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isUnread && (
                <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 8, height: 8, borderRadius: "50%", background: "#0066CC" }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  // ── Right panel ─────────────────────────────────────────────────────────────
  const detailPanel = selected ? (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", overflowY: "auto", background: "#F5F7FA" }}>
      {isMobile && (
        <button onClick={() => setShowDetail(false)} style={{ padding: "10px 16px", background: "#00205B", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", textAlign: "left" }}>
          ← Retour
        </button>
      )}

      {/* Statuses */}
      {selected.status === "resolved" && (
        <div style={{ background: "#D1FAE5", borderBottom: "1px solid #A7F3D0", padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <Check size={16} color="#059669" />
          <span style={{ fontSize: 13, color: "#065F46", fontWeight: 600 }}>
            Ce mail a été traité et résolu
            {selected.validated_at && ` · ${format(new Date(selected.validated_at), "dd/MM/yyyy HH:mm", { locale: fr })}`}
          </span>
        </div>
      )}
      {selected.status === "archived" && (
        <div style={{ background: "#F3F4F6", borderBottom: "1px solid #E5E7EB", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#6B7280" }}>📦 Mail archivé</span>
          <button onClick={() => handleArchive(selected.id, true)} style={{ fontSize: 12, color: "#0066CC", background: "none", border: "none", cursor: "pointer" }}>Désarchiver</button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "#fff", padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#00205B" }}>{selected.subject}</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {selected.ai_service_type && (
            <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: (SERVICE_COLOR[selected.ai_service_type] ?? "#6B7280") + "20", color: SERVICE_COLOR[selected.ai_service_type] ?? "#6B7280", fontWeight: 600 }}>
              {SERVICE_LABEL[selected.ai_service_type] ?? selected.ai_service_type}
            </span>
          )}
          <span style={{ fontSize: 12, color: "#6B7280" }}>
            {selected.source === "form" ? "📋 Formulaire" : "📧 Email entrant"}
          </span>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>
            {format(new Date(selected.received_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
          </span>
        </div>
        <div style={{ fontSize: 13, color: "#374151" }}>
          <strong>De :</strong> {selected.from_name ?? ""} &lt;{selected.from_email}&gt;
          &nbsp;&nbsp;<strong>À :</strong> postsmartia@gmail.com
        </div>
      </div>

      {/* Body */}
      <div style={{ background: "#fff", margin: "12px 16px", borderRadius: 10, padding: "20px 24px", border: "1px solid #E5E7EB" }}>
        <pre style={{ margin: 0, fontFamily: "inherit", fontSize: 15, lineHeight: 1.7, color: "#1A1A2E", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {selected.body_text}
        </pre>
      </div>

      {/* Resolved: show validated response */}
      {selected.status === "resolved" && selected.validated_response && (
        <div style={{ margin: "0 16px 12px", borderRadius: 10, padding: 20, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#065F46" }}>✅ Réponse validée</p>
          <pre style={{ margin: 0, fontFamily: "inherit", fontSize: 14, lineHeight: 1.6, color: "#1A1A2E", whiteSpace: "pre-wrap" }}>
            {selected.validated_response}
          </pre>
          <button onClick={() => handleArchive(selected.id)} style={{ marginTop: 12, fontSize: 12, padding: "6px 14px", borderRadius: 8, background: "#E5E7EB", border: "none", cursor: "pointer", color: "#374151" }}>
            📦 Archiver ce dossier
          </button>
        </div>
      )}

      {/* AI response panel */}
      {(aiResult || selected.ai_response) && !analyzing && selected.status !== "resolved" && (
        <div style={{ margin: "0 16px 12px", borderRadius: 12, padding: 20, background: "#F8FAFF", border: "1px solid #C7D9F5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FFCC00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#00205B" }}>IA</div>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#00205B" }}>Réponse générée par PostSmart IA</span>
          </div>

          {/* Quality scores */}
          {(aiResult?.response.quality_score || selected.ai_quality_score_json) && (
            <div style={{ marginBottom: 16 }}>
              <QualityScore scores={aiResult?.response.quality_score ?? selected.ai_quality_score_json ?? {}} />
            </div>
          )}

          {/* Analysis accordion */}
          {aiResult?.analysis && (
            <div style={{ marginBottom: 16, borderRadius: 8, border: "1px solid #E0EAFF", overflow: "hidden" }}>
              <button onClick={() => setAnalysisOpen(v => !v)} style={{
                width: "100%", padding: "10px 14px", background: "#EEF4FF", border: "none",
                cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                fontSize: 13, fontWeight: 600, color: "#00205B",
              }}>
                Analyse détectée
                {analysisOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {analysisOpen && (
                <div style={{ padding: "12px 14px", fontSize: 13, color: "#374151" }}>
                  <p style={{ margin: "0 0 6px" }}><strong>Demande :</strong> {aiResult.analysis.main_request}</p>
                  {aiResult.analysis.key_points?.length > 0 && (
                    <ul style={{ margin: "0 0 6px", paddingLeft: 18 }}>
                      {aiResult.analysis.key_points.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  )}
                  {aiResult.analysis.suggested_actions?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {aiResult.analysis.suggested_actions.map((a, i) => (
                        <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#EEF4FF", color: "#0066CC", fontWeight: 500 }}>{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Editable response */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Objet</label>
            <input value={editedSubject} onChange={e => setEditedSubject(e.target.value)} style={{
              width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box",
            }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Corps du mail</label>
            <textarea value={editedBody} onChange={e => setEditedBody(e.target.value)} rows={10} style={{
              width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #D1D5DB",
              fontSize: 14, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit",
            }} />
          </div>

          {/* Diff toggle */}
          {aiResult && (
            <div style={{ marginBottom: 8 }}>
              <button
                onClick={() => setShowDiff(v => !v)}
                style={{
                  fontSize: 12, padding: "5px 12px", borderRadius: 8,
                  border: "1px solid #C7D9F5",
                  background: showDiff ? "#EBF4FF" : "#fff",
                  color: "#0066CC", cursor: "pointer", fontWeight: 500,
                }}
              >
                {showDiff ? "Masquer" : "Voir"} les modifications IA
              </button>
              <MailDiff
                original={aiResult.response.body}
                improved={editedBody}
                show={showDiff}
              />
            </div>
          )}

          {/* Validation buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => handleValidate("validate")} style={{
              flex: 1, padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "#059669", color: "#fff", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <Check size={15} /> Valider et marquer comme résolu
            </button>
            <button onClick={() => handleValidate("reject")} style={{
              padding: "10px 16px", borderRadius: 8, border: "1px solid #DC2626", cursor: "pointer",
              background: "#FEF2F2", color: "#DC2626", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <X size={15} /> Rejeter
            </button>
          </div>
        </div>
      )}

      {/* Actions bar */}
      <div style={{ background: "#fff", borderTop: "1px solid #E5E7EB", padding: "12px 20px", display: "flex", gap: 10, flexWrap: "wrap", position: "sticky", bottom: 0 }}>
        {selected.status !== "resolved" && selected.status !== "archived" && (
          <button onClick={handleAnalyze} disabled={analyzing} style={{
            padding: "9px 18px", borderRadius: 8, border: "none", cursor: analyzing ? "wait" : "pointer",
            background: "#0066CC", color: "#fff", fontWeight: 600, fontSize: 13,
            display: "flex", alignItems: "center", gap: 6, opacity: analyzing ? 0.7 : 1,
          }}>
            <Sparkles size={15} />
            {analyzing ? "Analyse en cours…" : "✨ Analyser & Générer une réponse"}
          </button>
        )}
        {selected.status !== "archived" && (
          <button onClick={() => handleArchive(selected.id)} style={{
            padding: "9px 16px", borderRadius: 8, border: "1px solid #D1D5DB", cursor: "pointer",
            background: "#fff", color: "#374151", fontWeight: 500, fontSize: 13,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Archive size={14} /> Archiver
          </button>
        )}
        {(selected.status === "resolved" || selected.status === "archived") && (
          <button
            onClick={() => exportEmailToPdf(selected)}
            style={{
              padding: "9px 16px", borderRadius: 8, border: "1px solid #7C3AED", cursor: "pointer",
              background: "#fff", color: "#7C3AED", fontWeight: 500, fontSize: 13,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            📄 Exporter PDF
          </button>
        )}
        <button onClick={load} style={{
          padding: "9px 14px", borderRadius: 8, border: "1px solid #0066CC", cursor: "pointer",
          background: "#fff", color: "#0066CC", fontWeight: 500, fontSize: 13,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <RotateCcw size={14} /> Actualiser
        </button>
      </div>
    </div>
  ) : (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 64px)", background: "#F5F7FA" }}>
      <div style={{ textAlign: "center", color: "#9CA3AF" }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>✉️</div>
        <p style={{ fontSize: 15, fontWeight: 500 }}>Sélectionnez un mail pour commencer</p>
      </div>
    </div>
  )

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>
        {(!isMobile || !showDetail) && listPanel}
        {(!isMobile || showDetail) && detailPanel}
      </div>
    </>
  )
}
