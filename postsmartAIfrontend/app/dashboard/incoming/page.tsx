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
import AudioReader from "@/components/ui/audio-reader"
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge"
import { EmailStatus, EmailPriority, STATUS_CONFIG, ESCALATION_TARGETS } from "@/lib/email-status"
import EscalationAlert, { type EscalationData } from "@/components/ui/escalation-alert"

async function exportEmailToPdf(email: any) {
  const { exportEmailToPdf: fn } = await import("../../../lib/export-pdf")
  return fn(email)
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Email {
  id: number
  from_name: string | null
  from_email: string
  subject: string
  body_text: string | null
  received_at: string
  is_read: boolean
  status: EmailStatus
  priority: EmailPriority
  ai_service_type: string | null
  ai_response: string | null
  ai_quality_score_json: Record<string, number> | null
  validated_response: string | null
  validated_at: string | null
  archived_at: string | null
  source: "imap" | "form" | "manual"
  internal_note: string | null
  follow_up_at: string | null
  escalated_to: string | null
  resolved_points: string[] | null
  open_points: string[] | null
  is_follow_up_overdue: boolean
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
  detected_language?: string
  language_name?: string
  is_foreign_language?: boolean
  french_translation?: string | null
}

interface AiResult {
  email: Email
  analysis: Analysis
  response: { subject: string; body: string; quality_score: Record<string, number>; tone: string; warnings: string[] }
  escalation?: EscalationData
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
  { key: "all",        label: "Tous",         countKey: "all" },
  { key: "unread",     label: "Non lus",      countKey: "unread" },
  { key: "processing", label: "En cours",     countKey: null },
  { key: "pending",    label: "En attente",   countKey: "pending" },
  { key: "partial",    label: "Partiels",     countKey: "partial" },
  { key: "escalated",  label: "Escaladés",    countKey: "escalated" },
  { key: "resolved",   label: "Résolus",      countKey: "resolved" },
  { key: "archived",   label: "Archivés",     countKey: "archived" },
  { key: "form",       label: "Formulaires",  countKey: null, isSource: true },
]

interface StatusCounts {
  all: number; unread: number; pending: number; partial: number
  escalated: number; resolved: number; archived: number
}

function initials(name: string | null, email: string) {
  if (name) return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

function relativeDate(dt: string) {
  try { return formatDistanceToNow(new Date(dt), { addSuffix: true, locale: fr }) }
  catch { return dt }
}

// ── Stats types ───────────────────────────────────────────────────────────────

interface EmailStats {
  emails_today:    number
  total_processed: number
  avg_score:       number
  avg_score_week:  number
  score_count:     number
  time_saved:      number
  pending:         number
  unread:          number
}

// ── StatsPanel ────────────────────────────────────────────────────────────────

function StatsPanel({ stats, visible, onHide }: { stats: EmailStats | null; visible: boolean; onHide: () => void }) {
  const [counters, setCounters] = useState({
    emails_today:    0,
    total_processed: 0,
    avg_score:       0,
    time_saved:      0,
  })

  useEffect(() => {
    if (!visible || !stats) return
    const steps    = 50
    const interval = 1200 / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      const p = step / steps
      setCounters({
        emails_today:    Math.round(stats.emails_today    * p),
        total_processed: Math.round(stats.total_processed * p),
        avg_score:       Math.round(stats.avg_score       * p),
        time_saved:      Math.round(stats.time_saved      * p),
      })
      if (step >= steps) clearInterval(timer)
    }, interval)
    return () => clearInterval(timer)
  }, [visible, stats])

  if (!visible || !stats) return null

  const scoreColor = (s: number) => s >= 75 ? "#059669" : s >= 50 ? "#D97706" : "#DC2626"
  const scoreBg    = (s: number) => s >= 75 ? "#ECFDF5" : s >= 50 ? "#FFFBEB" : "#FEF2F2"

  const cards = [
    {
      icon:     "📧",
      label:    "Mails traités aujourd'hui",
      value:    counters.emails_today,
      unit:     "",
      color:    "#0066CC",
      bg:       "#EBF4FF",
      sublabel: `${stats.pending} en attente`,
    },
    {
      icon:     "✅",
      label:    "Total traités",
      value:    counters.total_processed,
      unit:     "",
      color:    "#059669",
      bg:       "#ECFDF5",
      sublabel: "Depuis le début",
    },
    {
      icon:     "⭐",
      label:    "Score qualité moyen",
      value:    (stats?.score_count ?? 0) > 0 ? counters.avg_score : "—",
      unit:     (stats?.score_count ?? 0) > 0 ? "/100" : "",
      color:    stats && stats.avg_score >= 75 ? "#059669"
              : stats && stats.avg_score >= 50 ? "#D97706"
              : stats && stats.avg_score > 0   ? "#DC2626"
              : "#9CA3AF",
      bg:       stats && stats.avg_score >= 75 ? "#ECFDF5"
              : stats && stats.avg_score >= 50 ? "#FFFBEB"
              : stats && stats.avg_score > 0   ? "#FEF2F2"
              : "#F9FAFB",
      sublabel: (stats?.score_count ?? 0) > 0
        ? `Sur ${stats!.score_count} mail(s) analysé(s)`
        : "Générez un mail pour voir le score",
    },
    {
      icon:     "⏱️",
      label:    "Temps économisé",
      value:    counters.time_saved,
      unit:     " min",
      color:    "#7C3AED",
      bg:       "#F5F3FF",
      sublabel: "Estimé (15 min/mail)",
    },
  ]

  return (
    <div style={{ margin: "0 16px 12px", animation: "slideUp 400ms ease" }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 4, height: 20, background: "#FFCC00", borderRadius: 2 }} />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#00205B", fontFamily: "Inter, sans-serif" }}>
            Vos statistiques en temps réel
          </h3>
        </div>
        <button onClick={onHide} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>
          ×
        </button>
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        {cards.map((card, i) => (
          <div
            key={i}
            style={{
              background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12,
              padding: "14px 14px", borderTop: `3px solid ${card.color}`,
              transition: "all 200ms",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,32,91,0.10)"
              ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none"
              ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 9, background: card.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, marginBottom: 10,
            }}>
              {card.icon}
            </div>
            <p style={{ margin: "0 0 2px", fontSize: 24, fontWeight: 700, color: card.color, fontFamily: "Inter, sans-serif", lineHeight: 1.1 }}>
              {card.value}{card.unit}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 11.5, fontWeight: 500, color: "#00205B", fontFamily: "Inter, sans-serif" }}>
              {card.label}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9CA3AF", fontFamily: "Inter, sans-serif" }}>
              {card.sublabel}
            </p>
          </div>
        ))}
      </div>

      {/* Unread alert */}
      {stats.unread > 0 && (
        <div style={{
          marginTop: 10, padding: "9px 14px",
          background: "#FEF3C7", border: "1px solid #FDE68A",
          borderRadius: 10, display: "flex", alignItems: "center", gap: 8,
          fontSize: 13, color: "#92400E", fontFamily: "Inter, sans-serif",
        }}>
          <span>⚠️</span>
          <span><strong>{stats.unread}</strong> mail(s) non lu(s) en attente de traitement</span>
        </div>
      )}
    </div>
  )
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

// ── TranslationPanel ──────────────────────────────────────────────────────────

function TranslationPanel({ languageName, translation }: { languageName: string; translation: string }) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ margin: "0 16px 12px", borderRadius: 10, border: "1px solid #FDE68A", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", padding: "10px 16px", background: "#FFFBEB",
          border: "none", cursor: "pointer", display: "flex",
          justifyContent: "space-between", alignItems: "center",
          fontSize: 13, fontWeight: 600, color: "#92400E",
        }}
      >
        <span>🌍 Traduction en français — mail reçu en {languageName}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div style={{ padding: "14px 16px", background: "#FFFEF0" }}>
          <pre style={{
            margin: 0, fontFamily: "inherit", fontSize: 14, lineHeight: 1.7,
            color: "#374151", whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {translation}
          </pre>
        </div>
      )}
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
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [statsVisible, setStatsVisible] = useState(false)
  const [sending, setSending] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [analysisOpen, setAnalysisOpen] = useState(true)
  const [showDiff, setShowDiff] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [counts, setCounts] = useState<StatusCounts | null>(null)
  const [actionModal, setActionModal] = useState<"pending" | "partial" | "escalate" | null>(null)
  const [pendingNote, setPendingNote] = useState("")
  const [pendingDate, setPendingDate] = useState("")
  const [partialResolved, setPartialResolved] = useState("")
  const [partialOpen, setPartialOpen] = useState("")
  const [partialNote, setPartialNote] = useState("")
  const [escalateTarget, setEscalateTarget] = useState("supervisor")
  const [escalateNote, setEscalateNote] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [escalationData, setEscalationData] = useState<EscalationData | null>(null)

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

  useEffect(() => { load(); fetchCounts() }, [load])

  // Polling sync toutes les 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.post<{ count: number }>("/emails/sync", {})
        setLastSync(new Date())
        if (res.count > 0) {
          load()
          toast.success(`📬 ${res.count} nouveau(x) mail(s) reçu(s) !`, { duration: 5000 })
        }
      } catch {}
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  async function selectEmail(email: Email) {
    setSelected(email)
    setAiResult(null)
    setEscalationData(null)
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

  function toastApiError(e: any, fallback: string) {
    const msg: string = e?.message ?? ""
    if (msg.includes("Network") || msg.includes("fetch") || msg.includes("Failed"))
      toast.error("🔌 Serveur inaccessible — Vérifiez que Laravel est démarré (php artisan serve)", { duration: 6000 })
    else
      toast.error(e?.data?.message ?? e?.message ?? fallback)
  }

  async function handleSendToClient() {
    if (!selected) return
    setSending(true)
    try {
      await api.post(`/emails/${selected.id}/send-to-client`, {
        subject: editedSubject,
        body:    editedBody,
      })
      toast.success("📤 Mail envoyé au client !")
      setAiResult(null)
      setSelected(prev => prev ? { ...prev, status: "resolved" } : null)
      setEmails(prev => prev.map(e => e.id === selected.id ? { ...e, status: "resolved" } : e))
      await fetchStats()
      setStatsVisible(true)
    } catch (e: any) { toastApiError(e, "Erreur lors de l'envoi") }
    finally { setSending(false) }
  }

  async function fetchStats() {
    try {
      const data = await api.get<EmailStats>("/emails/stats")
      setStats(data)
    } catch {}
  }

  async function fetchCounts() {
    try {
      const data = await api.get<StatusCounts>("/emails/counts")
      setCounts(data)
    } catch {}
  }

  async function handleMarkPending() {
    if (!selected) return
    setActionLoading(true)
    try {
      const res = await api.post<Email>(`/emails/${selected.id}/pending`, {
        internal_note: pendingNote || null,
        follow_up_at:  pendingDate || null,
      })
      setSelected(res)
      setEmails(prev => prev.map(e => e.id === res.id ? res : e))
      setActionModal(null)
      setPendingNote(""); setPendingDate("")
      toast.success("⏳ Mail mis en attente.")
      fetchCounts()
    } catch (e: any) { toastApiError(e, "Erreur") }
    finally { setActionLoading(false) }
  }

  async function handleMarkPartial() {
    if (!selected) return
    setActionLoading(true)
    try {
      const toList = (s: string) => s.split("\n").map(l => l.trim()).filter(Boolean)
      const res = await api.post<Email>(`/emails/${selected.id}/partial`, {
        resolved_points: toList(partialResolved),
        open_points:     toList(partialOpen),
        internal_note:   partialNote || null,
      })
      setSelected(res)
      setEmails(prev => prev.map(e => e.id === res.id ? res : e))
      setActionModal(null)
      setPartialResolved(""); setPartialOpen(""); setPartialNote("")
      toast.success("◑ Traitement partiel enregistré.")
      fetchCounts()
    } catch (e: any) { toastApiError(e, "Erreur") }
    finally { setActionLoading(false) }
  }

  async function handleEscalate() {
    if (!selected) return
    setActionLoading(true)
    try {
      const res = await api.post<Email>(`/emails/${selected.id}/escalate`, {
        escalated_to:  escalateTarget,
        internal_note: escalateNote || null,
      })
      setSelected(res)
      setEmails(prev => prev.map(e => e.id === res.id ? res : e))
      setActionModal(null)
      setEscalateTarget("supervisor"); setEscalateNote("")
      toast.success("⬆ Mail escaladé.")
      fetchCounts()
    } catch (e: any) { toastApiError(e, "Erreur") }
    finally { setActionLoading(false) }
  }

  async function handleUpdatePriority(priority: EmailPriority) {
    if (!selected) return
    try {
      const res = await api.put<Email>(`/emails/${selected.id}/priority`, { priority })
      setSelected(res)
      setEmails(prev => prev.map(e => e.id === res.id ? res : e))
      toast.success("Priorité mise à jour.")
    } catch (e: any) { toastApiError(e, "Erreur") }
  }

  async function handleAnalyze() {
    if (!selected) return
    setAnalyzing(true)
    setEscalationData(null)
    try {
      const res = await api.post<AiResult>(`/emails/${selected.id}/analyze`, {})
      setAiResult(res)
      setEditedSubject(res.response.subject ?? "")
      setEditedBody(res.response.body ?? "")
      setSelected(res.email)
      setEmails(prev => prev.map(e => e.id === res.email.id ? res.email : e))
      if (res.escalation?.should_escalate) {
        setEscalationData(res.escalation)
        const urgLabel = res.escalation.urgency_level === "immediate" ? "🚨 Escalade immédiate requise !" : "⚠️ Escalade recommandée"
        toast(urgLabel, { icon: res.escalation.legal_threat ? "⚖️" : "⚠️", duration: 6000 })
      } else {
        toast.success("Analyse et réponse générées !")
      }
      await fetchStats()
      setStatsVisible(true)
    } catch (e: any) { toastApiError(e, "Erreur lors de l'analyse") }
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
        toast.success("✅ Réponse validée — mail marqué comme résolu.")
        setAiResult(null)
        await fetchStats()
        setStatsVisible(true)
      } else {
        toast("Réponse rejetée — mail remis en attente.", { icon: "⚠️" })
        setAiResult(null)
      }
    } catch (e: any) { toastApiError(e, "Erreur lors de la validation") }
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#9CA3AF" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block", animation: "pulse 2s infinite" }} />
              {lastSync ? `Sync ${lastSync.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "Auto 30s"}
            </div>
            <button onClick={load} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 4 }}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} } @keyframes spin { to{transform:rotate(360deg)} }`}</style>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {TABS.map(t => {
            const cnt = t.countKey && counts ? (counts as any)[t.countKey] as number : null
            const active = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                fontSize: 12, padding: "4px 10px", borderRadius: 20, border: "none", cursor: "pointer",
                background: active ? "#00205B" : "#F0F4FF",
                color: active ? "#fff" : "#0066CC", fontWeight: 500,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {t.label}
                {cnt != null && cnt > 0 && (
                  <span style={{
                    background: active ? "rgba(255,255,255,0.25)" : "#0066CC",
                    color: active ? "#fff" : "#fff",
                    borderRadius: 10, fontSize: 10, padding: "0 5px", fontWeight: 700,
                  }}>{cnt}</span>
                )}
              </button>
            )
          })}
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
                  <div style={{ marginTop: 5, display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                    {email.ai_service_type && (
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 20, background: svcColor + "20", color: svcColor, fontWeight: 600 }}>
                        {SERVICE_LABEL[email.ai_service_type] ?? email.ai_service_type}
                      </span>
                    )}
                    <StatusBadge status={email.status} size="sm" />
                    {email.priority && email.priority !== "normal" && (
                      <PriorityBadge priority={email.priority} size="sm" />
                    )}
                    {email.is_follow_up_overdue && (
                      <span style={{ fontSize: 10, color: "#DC2626", fontWeight: 700 }}>⚠ Suivi en retard</span>
                    )}
                  </div>
                </div>
              </div>
              {isUnread && (
                <div style={{ position: "absolute", right: 10, top: 10, width: 8, height: 8, borderRadius: "50%", background: "#0066CC" }} />
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

      {/* Status banners */}
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
      {selected.status === "pending" && (
        <div style={{ background: "#FEF3C7", borderBottom: "1px solid #FDE68A", padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#92400E", fontWeight: 600 }}>
            ⏳ En attente
            {selected.follow_up_at && ` · Relance prévue le ${format(new Date(selected.follow_up_at), "dd/MM/yyyy HH:mm", { locale: fr })}`}
            {selected.is_follow_up_overdue && <span style={{ color: "#DC2626", marginLeft: 8 }}>⚠ Délai dépassé</span>}
          </span>
        </div>
      )}
      {selected.status === "partial" && (
        <div style={{ background: "#E0F2FE", borderBottom: "1px solid #7DD3FC", padding: "10px 20px" }}>
          <span style={{ fontSize: 13, color: "#1e3a5f", fontWeight: 600 }}>◑ Traitement partiel</span>
          {selected.open_points && selected.open_points.length > 0 && (
            <div style={{ marginTop: 4, fontSize: 12, color: "#374151" }}>
              Points ouverts : {selected.open_points.join(" · ")}
            </div>
          )}
        </div>
      )}
      {selected.status === "escalated" && (
        <div style={{ background: "#FFEDD5", borderBottom: "1px solid #FDBA74", padding: "10px 20px" }}>
          <span style={{ fontSize: 13, color: "#9a3412", fontWeight: 600 }}>
            ⬆ Escaladé → {ESCALATION_TARGETS.find(t => t.value === selected.escalated_to)?.label ?? selected.escalated_to}
          </span>
          {selected.internal_note && (
            <div style={{ marginTop: 2, fontSize: 12, color: "#7c2d12" }}>{selected.internal_note}</div>
          )}
        </div>
      )}

      {/* Header */}
      <div style={{ background: "#fff", padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#00205B", flex: 1 }}>{selected.subject}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <StatusBadge status={selected.status} />
            {selected.priority && <PriorityBadge priority={selected.priority} />}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
          {selected.ai_service_type && (
            <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: (SERVICE_COLOR[selected.ai_service_type] ?? "#6B7280") + "20", color: SERVICE_COLOR[selected.ai_service_type] ?? "#6B7280", fontWeight: 600 }}>
              {SERVICE_LABEL[selected.ai_service_type] ?? selected.ai_service_type}
            </span>
          )}
          {aiResult?.analysis?.is_foreign_language && aiResult.analysis.language_name && (
            <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "#FEF3C7", color: "#92400E", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              🌍 {aiResult.analysis.language_name}
            </span>
          )}
          <span style={{ fontSize: 12, color: "#6B7280" }}>
            {selected.source === "form" ? "📋 Formulaire" : "📧 Email entrant"}
          </span>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>
            {format(new Date(selected.received_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 13, color: "#374151" }}>
            <strong>De :</strong> {selected.from_name ?? ""} &lt;{selected.from_email}&gt;
            &nbsp;&nbsp;<strong>À :</strong> postsmartia@gmail.com
          </div>
          {/* Priority quick-change */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>Priorité :</span>
            {(["low","normal","high","urgent"] as EmailPriority[]).map(p => (
              <button key={p} onClick={() => handleUpdatePriority(p)} style={{
                fontSize: 10, padding: "2px 7px", borderRadius: 10, border: "1px solid #E5E7EB",
                cursor: "pointer", fontWeight: 600,
                background: selected.priority === p ? "#00205B" : "#F3F4F6",
                color: selected.priority === p ? "#fff" : "#374151",
              }}>
                {p === "low" ? "↓" : p === "normal" ? "→" : p === "high" ? "↑" : "‼"}{" "}
                {p === "low" ? "Faible" : p === "normal" ? "Normal" : p === "high" ? "Haute" : "Urgent"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: "#fff", margin: "12px 16px", borderRadius: 10, padding: "20px 24px", border: "1px solid #E5E7EB" }}>
        <pre style={{ margin: 0, fontFamily: "inherit", fontSize: 15, lineHeight: 1.7, color: "#1A1A2E", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {selected.body_text}
        </pre>
      </div>

      {/* Traduction française — visible uniquement si mail étranger */}
      {aiResult?.analysis?.is_foreign_language && aiResult.analysis.french_translation && (
        <TranslationPanel
          languageName={aiResult.analysis.language_name ?? aiResult.analysis.detected_language ?? ""}
          translation={aiResult.analysis.french_translation}
        />
      )}

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

      {/* Alerte escalade automatique */}
      {escalationData && (
        <div style={{ margin: "0 16px 4px" }}>
          <EscalationAlert
            escalation={escalationData}
            emailId={selected.id}
            onEscalated={() => {
              setEscalationData(null)
              setAiResult(null)
              load()
              fetchCounts()
              fetchStats()
            }}
          />
        </div>
      )}

      {/* AI response panel */}
      {(aiResult || selected.ai_response) && !analyzing && selected.status !== "resolved" && (
        <div style={{ margin: "0 16px 12px", borderRadius: 12, padding: 20, background: "#F8FAFF", border: "1px solid #C7D9F5" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FFCC00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#00205B" }}>IA</div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#00205B" }}>Réponse générée par PostSmart IA</span>
            </div>
            <StatusBadge status={selected.status} size="sm" />
          </div>

          {/* Avertissement : pas encore résolu */}
          {aiResult && (
            <div style={{
              padding: "10px 14px", background: "#FFFBEB",
              border: "1px solid #FDE68A", borderRadius: 10,
              marginBottom: 14, fontSize: 13, color: "#92400E",
              display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <span>
                Ce mail ne sera marqué comme <strong>résolu</strong> qu'après avoir cliqué sur{" "}
                <strong>"Valider et envoyer"</strong> ou <strong>"Valider sans envoyer"</strong>.
              </span>
            </div>
          )}

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

          {/* Audio reader — lecture de la réponse IA */}
          {editedBody && (
            <AudioReader text={editedBody} autoPlay={!!aiResult} />
          )}

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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => handleSendToClient()} disabled={sending} style={{
              flex: 1, minWidth: 180, padding: "10px 16px", borderRadius: 8, border: "none",
              cursor: sending ? "wait" : "pointer",
              background: "#059669", color: "#fff", fontWeight: 600, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              opacity: sending ? 0.7 : 1,
            }}>
              {sending ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} /> Envoi…</> : <><span>📤</span> Valider et envoyer au client</>}
            </button>
            <button onClick={() => handleValidate("validate")} style={{
              padding: "10px 14px", borderRadius: 8, border: "1px solid #059669", cursor: "pointer",
              background: "#F0FDF4", color: "#059669", fontWeight: 600, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <Check size={14} /> Valider sans envoyer
            </button>
            <button onClick={() => handleValidate("reject")} style={{
              padding: "10px 14px", borderRadius: 8, border: "1px solid #DC2626", cursor: "pointer",
              background: "#FEF2F2", color: "#DC2626", fontWeight: 600, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <X size={14} /> Rejeter
            </button>
          </div>
        </div>
      )}

      {/* Stats panel — visible uniquement après analyse ou validation */}
      <StatsPanel stats={stats} visible={statsVisible} onHide={() => setStatsVisible(false)} />

      {/* Actions bar */}
      <div style={{ background: "#fff", borderTop: "1px solid #E5E7EB", padding: "12px 20px", display: "flex", gap: 8, flexWrap: "wrap", position: "sticky", bottom: 0 }}>
        {selected.status !== "resolved" && selected.status !== "archived" && (
          <button onClick={handleAnalyze} disabled={analyzing} style={{
            padding: "9px 18px", borderRadius: 8, border: "none", cursor: analyzing ? "wait" : "pointer",
            background: "#0066CC", color: "#fff", fontWeight: 600, fontSize: 13,
            display: "flex", alignItems: "center", gap: 6, opacity: analyzing ? 0.7 : 1,
          }}>
            <Sparkles size={15} />
            {analyzing ? "Analyse en cours…" : "✨ Analyser & Générer"}
          </button>
        )}
        {!["resolved","archived","escalated"].includes(selected.status) && (
          <button onClick={() => setActionModal("pending")} style={{
            padding: "9px 14px", borderRadius: 8, border: "1px solid #FCD34D", cursor: "pointer",
            background: "#FFFBEB", color: "#92400E", fontWeight: 500, fontSize: 13,
            display: "flex", alignItems: "center", gap: 5,
          }}>⏳ En attente</button>
        )}
        {!["resolved","archived","escalated"].includes(selected.status) && (
          <button onClick={() => setActionModal("partial")} style={{
            padding: "9px 14px", borderRadius: 8, border: "1px solid #7DD3FC", cursor: "pointer",
            background: "#E0F2FE", color: "#1e3a5f", fontWeight: 500, fontSize: 13,
            display: "flex", alignItems: "center", gap: 5,
          }}>◑ Partiel</button>
        )}
        {!["resolved","archived","escalated"].includes(selected.status) && (
          <button onClick={() => setActionModal("escalate")} style={{
            padding: "9px 14px", borderRadius: 8, border: "1px solid #FDBA74", cursor: "pointer",
            background: "#FFEDD5", color: "#9a3412", fontWeight: 500, fontSize: 13,
            display: "flex", alignItems: "center", gap: 5,
          }}>⬆ Escalader</button>
        )}
        {selected.status !== "archived" && (
          <button onClick={() => handleArchive(selected.id)} style={{
            padding: "9px 14px", borderRadius: 8, border: "1px solid #D1D5DB", cursor: "pointer",
            background: "#fff", color: "#374151", fontWeight: 500, fontSize: 13,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Archive size={14} /> Archiver
          </button>
        )}
        {(selected.status === "resolved" || selected.status === "archived") && (
          <button onClick={() => exportEmailToPdf(selected)} style={{
            padding: "9px 14px", borderRadius: 8, border: "1px solid #7C3AED", cursor: "pointer",
            background: "#fff", color: "#7C3AED", fontWeight: 500, fontSize: 13,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            📄 Exporter PDF
          </button>
        )}
        <button onClick={load} style={{
          padding: "9px 12px", borderRadius: 8, border: "1px solid #0066CC", cursor: "pointer",
          background: "#fff", color: "#0066CC", fontWeight: 500, fontSize: 13,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <RotateCcw size={14} />
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

  const modalStyle: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center",
  }
  const cardStyle: React.CSSProperties = {
    background: "#fff", borderRadius: 16, padding: "28px 28px 24px",
    width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,32,91,0.18)",
    fontFamily: "Inter, sans-serif",
  }
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB",
    fontSize: 13, boxSizing: "border-box", marginBottom: 14, fontFamily: "inherit",
  }
  const taStyle: React.CSSProperties = { ...inputStyle, resize: "vertical" }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>
        {(!isMobile || !showDetail) && listPanel}
        {(!isMobile || showDetail) && detailPanel}
      </div>

      {/* Modal — En attente */}
      {actionModal === "pending" && (
        <div style={modalStyle} onClick={() => setActionModal(null)}>
          <div style={cardStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700, color: "#00205B" }}>⏳ Mettre en attente</h3>
            <label style={labelStyle}>Note interne (optionnel)</label>
            <textarea
              value={pendingNote} onChange={e => setPendingNote(e.target.value)}
              placeholder="Ex : En attente d'un document du client…"
              rows={3} style={taStyle}
            />
            <label style={labelStyle}>Date de relance (optionnel)</label>
            <input
              type="datetime-local" value={pendingDate} onChange={e => setPendingDate(e.target.value)}
              style={inputStyle}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setActionModal(null)} style={{
                padding: "9px 18px", borderRadius: 8, border: "1px solid #D1D5DB", cursor: "pointer",
                background: "#fff", color: "#374151", fontSize: 13,
              }}>Annuler</button>
              <button onClick={handleMarkPending} disabled={actionLoading} style={{
                padding: "9px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                background: "#D97706", color: "#fff", fontWeight: 600, fontSize: 13, opacity: actionLoading ? 0.7 : 1,
              }}>{actionLoading ? "…" : "Confirmer"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Traitement partiel */}
      {actionModal === "partial" && (
        <div style={modalStyle} onClick={() => setActionModal(null)}>
          <div style={cardStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700, color: "#00205B" }}>◑ Traitement partiel</h3>
            <label style={labelStyle}>Points traités (un par ligne)</label>
            <textarea
              value={partialResolved} onChange={e => setPartialResolved(e.target.value)}
              placeholder="Ex :\nRemboursement effectué\nLivraison reprogrammée"
              rows={3} style={taStyle}
            />
            <label style={labelStyle}>Points ouverts (un par ligne)</label>
            <textarea
              value={partialOpen} onChange={e => setPartialOpen(e.target.value)}
              placeholder="Ex :\nAvoir en attente\nContestation en cours"
              rows={3} style={taStyle}
            />
            <label style={labelStyle}>Note interne (optionnel)</label>
            <textarea value={partialNote} onChange={e => setPartialNote(e.target.value)} rows={2} style={taStyle} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setActionModal(null)} style={{
                padding: "9px 18px", borderRadius: 8, border: "1px solid #D1D5DB", cursor: "pointer",
                background: "#fff", color: "#374151", fontSize: 13,
              }}>Annuler</button>
              <button onClick={handleMarkPartial} disabled={actionLoading} style={{
                padding: "9px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                background: "#0369A1", color: "#fff", fontWeight: 600, fontSize: 13, opacity: actionLoading ? 0.7 : 1,
              }}>{actionLoading ? "…" : "Enregistrer"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Escalader */}
      {actionModal === "escalate" && (
        <div style={modalStyle} onClick={() => setActionModal(null)}>
          <div style={cardStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700, color: "#00205B" }}>⬆ Escalader le mail</h3>
            <label style={labelStyle}>Escalader vers</label>
            <select value={escalateTarget} onChange={e => setEscalateTarget(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
              {ESCALATION_TARGETS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <label style={labelStyle}>Contexte / Note interne (optionnel)</label>
            <textarea
              value={escalateNote} onChange={e => setEscalateNote(e.target.value)}
              placeholder="Ex : Client insistant, situation bloquée depuis 5 jours…"
              rows={3} style={taStyle}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setActionModal(null)} style={{
                padding: "9px 18px", borderRadius: 8, border: "1px solid #D1D5DB", cursor: "pointer",
                background: "#fff", color: "#374151", fontSize: 13,
              }}>Annuler</button>
              <button onClick={handleEscalate} disabled={actionLoading} style={{
                padding: "9px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                background: "#EA580C", color: "#fff", fontWeight: 600, fontSize: 13, opacity: actionLoading ? 0.7 : 1,
              }}>{actionLoading ? "…" : "Escalader"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
