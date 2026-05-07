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
import { Sparkles, Archive, X, Check } from "lucide-react"

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

function OverallScore({ score }: { score: Record<string, number> | null }) {
  if (!score) return <span className="text-xs text-muted-foreground italic">—</span>
  const overall = score.overall ?? Math.round(Object.values(score).reduce((a, b) => a + b, 0) / Object.values(score).length)
  const color = overall >= 75 ? "bg-green-100 text-green-800" : overall >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
  return <Badge className={cn("border-0 text-xs", color)}>{overall}/100</Badge>
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({
  form, onClose, onRefresh,
}: { form: FormEmail; onClose: () => void; onRefresh: () => void }) {
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  const [analyzing, setAnalyzing]   = useState(false)
  const [editedBody, setEditedBody] = useState("")
  const [editedSubject, setEditedSubject] = useState("")

  async function handleAnalyze() {
    setAnalyzing(true)
    try {
      const res = await api.post<AiResult>(`/emails/${form.id}/analyze`, {})
      setAiResult(res)
      setEditedSubject(res.response.subject ?? "")
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
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#00205B", borderRadius: "16px 16px 0 0" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#fff" }}>{form.subject}</p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              {form.from_name ?? form.from_email} · {format(new Date(form.received_at), "dd/MM/yyyy HH:mm", { locale: fr })}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.8)" }}><X size={20} /></button>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          <div style={{ background: "#F8FAFF", borderRadius: 10, padding: 16, marginBottom: 20, border: "1px solid #E0EAFF" }}>
            <pre style={{ margin: 0, fontFamily: "inherit", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "#1A1A2E" }}>
              {form.body_text}
            </pre>
          </div>

          {/* AI Result */}
          {(aiResult || form.ai_response) && (
            <div style={{ background: "#F8FAFF", border: "1px solid #C7D9F5", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14, color: "#00205B" }}>Réponse PostSmart IA</p>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Objet</label>
                <input value={editedSubject} onChange={e => setEditedSubject(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Réponse</label>
                <textarea value={editedBody || form.ai_response || ""} onChange={e => setEditedBody(e.target.value)} rows={8} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => handleValidate("validate")} style={{ flex: 1, padding: "9px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: "#059669", color: "#fff", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Check size={14} /> Valider
                </button>
                <button onClick={() => handleValidate("reject")} style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #DC2626", cursor: "pointer", background: "#FEF2F2", color: "#DC2626", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <X size={14} /> Rejeter
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
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
      name: "Objet / Demande",
      cell: (row) => <span className="text-sm line-clamp-2">{row.subject}</span>,
      grow: 2,
    },
    {
      name: "Date",
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(row.received_at), { addSuffix: true, locale: fr })}
        </span>
      ),
      grow: 0.8,
    },
    {
      name: "Statut",
      cell: (row) => (
        <Badge className={cn("border-0 text-xs", STATUS_COLOR[row.status] ?? "bg-gray-100 text-gray-700")}>
          {STATUS_LABEL[row.status] ?? row.status}
        </Badge>
      ),
      grow: 0.6,
    },
    {
      name: "Score IA",
      cell: (row) => <OverallScore score={row.ai_quality_score_json} />,
      grow: 0.5,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelected(row)}>Voir</Button>
        </div>
      ),
      grow: 0.5,
    },
  ], [])

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <div className="p-6 lg:p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Formulaires clients</h1>
          <p className="text-muted-foreground">Demandes soumises via le formulaire en ligne.</p>
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
