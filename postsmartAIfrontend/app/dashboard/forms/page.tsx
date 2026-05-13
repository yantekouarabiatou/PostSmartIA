"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { type TableColumn } from "react-data-table-component"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import AppDataTable from "@/components/ui/AppDataTable"
import { cn } from "@/lib/utils"
import toast, { Toaster } from "react-hot-toast"
import { formatDistanceToNow, format } from "date-fns"
import { fr } from "date-fns/locale"
import { Sparkles, Archive, X, Check, Send, Clock, AlertTriangle } from "lucide-react"

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  unread:     "bg-blue-100 text-blue-800",
  read:       "bg-gray-100 text-gray-700",
  processing: "bg-yellow-100 text-yellow-800",
  resolved:   "bg-green-100 text-green-800",
  archived:   "bg-gray-200 text-gray-500",
}
const STATUS_LABEL: Record<string, string> = {
  unread:     "Non lu",
  read:       "Lu",
  processing: "En cours",
  resolved:   "Résolu",
  archived:   "Archivé",
}

const WORKFLOW_STEPS = [
  { key: "reception",  label: "Réception" },
  { key: "analyse",    label: "Analyse IA" },
  { key: "redaction",  label: "Rédaction" },
  { key: "envoi",      label: "Envoi" },
  { key: "archivage",  label: "Archivage" },
]

function getWorkflowStep(status: string): number {
  if (status === "archived") return 4
  if (status === "resolved") return 3
  if (status === "processing") return 2
  if (status === "read") return 1
  return 0
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormEmail {
  id: number
  from_name: string | null
  from_email: string
  subject: string
  body_text: string | null
  received_at: string
  status: string
  ai_quality_score_json: Record<string, number> | null
  ai_response: string | null
  validated_response: string | null
  validated_at: string | null
}

interface AiResult {
  email: FormEmail
  analysis: any
  response: { subject: string; body: string; quality_score: Record<string, number> }
}

// ── Deadline helper ───────────────────────────────────────────────────────────

function getDeadlineStatus(receivedAt: string) {
  const hours = (Date.now() - new Date(receivedAt).getTime()) / 3_600_000
  if (hours > 20) return { label: "Urgent — >20h", color: "#dc2626", bg: "#fef2f2", icon: "🔴" }
  if (hours > 12) return { label: "À traiter — >12h", color: "#d97706", bg: "#fffbeb", icon: "🟡" }
  return { label: "Dans les délais", color: "#16a34a", bg: "#f0fdf4", icon: "🟢" }
}

// ── Score badge ───────────────────────────────────────────────────────────────

function OverallScore({ score }: { score: Record<string, number> | null }) {
  if (!score) return <span className="text-xs text-muted-foreground italic">—</span>
  const overall = score.overall ?? Math.round(Object.values(score).reduce((a, b) => a + b, 0) / Object.values(score).length)
  const color = overall >= 75 ? "bg-green-100 text-green-800" : overall >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
  return <Badge className={cn("border-0 text-xs", color)}>{overall}/100</Badge>
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ form, onClose, onRefresh }: { form: FormEmail; onClose: () => void; onRefresh: () => void }) {
  const [aiResult, setAiResult]       = useState<AiResult | null>(null)
  const [analyzing, setAnalyzing]     = useState(false)
  const [sending, setSending]         = useState(false)
  const [editedBody, setEditedBody]   = useState(form.ai_response ?? "")
  const [editedSubject, setEditedSubject] = useState(form.subject ?? "")

  const step = getWorkflowStep(form.status)
  const deadline = getDeadlineStatus(form.received_at)

  async function handleAnalyze() {
    setAnalyzing(true)
    try {
      const res = await api.post<AiResult>(`/emails/${form.id}/analyze`, {})
      setAiResult(res)
      setEditedSubject(res.response.subject ?? editedSubject)
      setEditedBody(res.response.body ?? "")
      toast.success("Analyse générée !")
    } catch (e: any) { toast.error(e.message ?? "Erreur") }
    finally { setAnalyzing(false) }
  }

  async function handleValidate(action: "validate" | "reject") {
    try {
      const body: any = { action }
      if (action === "validate") body.validated_response = editedBody
      await api.post(`/emails/${form.id}/validate`, body)
      toast.success(action === "validate" ? "Réponse validée !" : "Réponse rejetée.")
      onRefresh()
      onClose()
    } catch (e: any) { toast.error(e.message ?? "Erreur") }
  }

  async function handleSendToClient() {
    setSending(true)
    try {
      await api.post(`/emails/${form.id}/validate`, { action: "validate", validated_response: editedBody })
      await api.post(`/emails/${form.id}/send-to-client`, { subject: editedSubject, body: editedBody })
      toast.success("Réponse validée et envoyée au client !")
      onRefresh()
      onClose()
    } catch (e: any) { toast.error(e.message ?? "Erreur lors de l'envoi") }
    finally { setSending(false) }
  }

  async function handleArchive() {
    try {
      await api.post(`/emails/${form.id}/archive`, {})
      toast.success("Formulaire archivé.")
      onRefresh()
      onClose()
    } catch (e: any) { toast.error(e.message ?? "Erreur") }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 700, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", fontFamily: "'Inter', sans-serif" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#00205B", borderRadius: "16px 16px 0 0" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#fff" }}>{form.subject}</p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              {form.from_name ?? form.from_email} · {format(new Date(form.received_at), "dd/MM/yyyy HH:mm", { locale: fr })}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.8)", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Workflow stepper */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {WORKFLOW_STEPS.map((s, i) => {
              const done = i < step
              const active = i === step
              return (
                <div key={s.key} style={{ display: "flex", alignItems: "center", flex: i < WORKFLOW_STEPS.length - 1 ? 1 : "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: done ? "#16a34a" : active ? "#00205B" : "#e5e7eb",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700,
                      color: done || active ? "#fff" : "#9ca3af",
                      transition: "background 0.2s",
                    }}>
                      {done ? <Check size={13} /> : i + 1}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: active ? "#00205B" : done ? "#16a34a" : "#9ca3af", whiteSpace: "nowrap" }}>
                      {s.label}
                    </span>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: done ? "#16a34a" : "#e5e7eb", margin: "0 4px", marginBottom: 20, transition: "background 0.2s" }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Deadline badge */}
        <div style={{ padding: "10px 24px", background: deadline.bg, borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
          <span>{deadline.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: deadline.color }}>{deadline.label}</span>
          <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto" }}>
            <Clock size={11} style={{ display: "inline", marginRight: 3 }} />
            Reçu {formatDistanceToNow(new Date(form.received_at), { addSuffix: true, locale: fr })}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          <div style={{ background: "#f8faff", borderRadius: 10, padding: 16, marginBottom: 20, border: "1px solid #e0eaff" }}>
            <pre style={{ margin: 0, fontFamily: "inherit", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "#1a1a2e" }}>
              {form.body_text}
            </pre>
          </div>

          {/* AI result */}
          {(aiResult || form.ai_response) && (
            <div style={{ background: "#f8faff", border: "1px solid #c7d9f5", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14, color: "#00205B" }}>Réponse PostSmart IA</p>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Objet</label>
                <input
                  value={editedSubject}
                  onChange={e => setEditedSubject(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13, boxSizing: "border-box", fontFamily: "inherit", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Corps du mail</label>
                <textarea
                  value={editedBody || form.ai_response || ""}
                  onChange={e => setEditedBody(e.target.value)}
                  rows={8}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", outline: "none" }}
                />
              </div>

              {/* 3 action buttons */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={handleSendToClient}
                  disabled={sending}
                  style={{ flex: 1, minWidth: 160, padding: "9px 14px", borderRadius: 8, border: "none", cursor: sending ? "not-allowed" : "pointer", background: sending ? "#9ca3af" : "#00205B", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  {sending
                    ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Envoi…</>
                    : <><Send size={14} /> Valider et envoyer au client</>}
                </button>
                <button
                  onClick={() => handleValidate("validate")}
                  style={{ padding: "9px 14px", borderRadius: 8, border: "1.5px solid #16a34a", cursor: "pointer", background: "#f0fdf4", color: "#16a34a", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <Check size={14} /> Valider seulement
                </button>
                <button
                  onClick={() => handleValidate("reject")}
                  style={{ padding: "9px 14px", borderRadius: 8, border: "1.5px solid #dc2626", cursor: "pointer", background: "#fef2f2", color: "#dc2626", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <X size={14} /> Rejeter
                </button>
              </div>
            </div>
          )}

          {/* Secondary actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {form.status !== "resolved" && form.status !== "archived" && (
              <Button size="sm" onClick={handleAnalyze} disabled={analyzing}>
                <Sparkles className="h-4 w-4 mr-1" />
                {analyzing ? "Analyse…" : "Générer une réponse IA"}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleArchive}>
              <Archive className="h-4 w-4 mr-1" /> Archiver
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FormsPage() {
  const [forms, setForms]     = useState<FormEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<FormEmail | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<any>("/emails?source=form&per_page=100")
      setForms(res?.data ?? [])
    } catch { toast.error("Impossible de charger les formulaires") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const columns = useMemo<TableColumn<FormEmail>[]>(() => [
    {
      name: "Expéditeur",
      cell: (row) => (
        <div className="py-1">
          <div className="font-medium text-sm">{row.from_name ?? row.from_email}</div>
          <div className="text-xs text-muted-foreground">{row.from_email}</div>
        </div>
      ),
      grow: 1.2,
    },
    {
      name: "Objet",
      cell: (row) => <span className="text-sm line-clamp-2">{row.subject}</span>,
      grow: 2,
    },
    {
      name: "Délai",
      cell: (row) => {
        const d = getDeadlineStatus(row.received_at)
        return (
          <span style={{ fontSize: 11, fontWeight: 600, color: d.color, background: d.bg, padding: "2px 8px", borderRadius: 20 }}>
            {d.icon} {d.label}
          </span>
        )
      },
      grow: 1,
    },
    {
      name: "Statut",
      cell: (row) => (
        <Badge className={cn("border-0 text-xs", STATUS_COLOR[row.status] ?? "bg-gray-100 text-gray-700")}>
          {STATUS_LABEL[row.status] ?? row.status}
        </Badge>
      ),
      grow: 0.7,
    },
    {
      name: "Score IA",
      cell: (row) => <OverallScore score={row.ai_quality_score_json} />,
      grow: 0.5,
    },
    {
      name: "",
      cell: (row) => (
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelected(row)}>Voir</Button>
      ),
      grow: 0.4,
    },
  ], [])

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <div className="p-6 lg:p-8 space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Formulaires clients</h1>
          <p className="text-muted-foreground">Demandes soumises via le formulaire en ligne.</p>
        </div>

        {/* SLA Banner */}
        <div style={{ background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, fontFamily: "'Inter', sans-serif" }}>
          <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Engagement de service : 24h</span>
            <span style={{ fontSize: 12, color: "#b45309", marginLeft: 8 }}>
              Chaque demande client doit recevoir une réponse dans les 24 heures. Les formulaires en rouge dépassent 20h.
            </span>
          </div>
        </div>

        <AppDataTable<FormEmail>
          columns={columns}
          data={forms}
          title={`${forms.length} formulaire${forms.length > 1 ? "s" : ""}`}
          loading={loading}
          searchable
          onRowClicked={row => setSelected(row)}
        />
      </div>

      {selected && (
        <DetailModal
          form={selected}
          onClose={() => setSelected(null)}
          onRefresh={load}
        />
      )}
    </>
  )
}
