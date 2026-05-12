"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import toast from "react-hot-toast"
import { ESCALATION_TARGETS } from "@/lib/email-status"

export interface EscalationSignal {
  type: "delai" | "insatisfaction" | "complexe" | "menace" | "mediateur"
  description: string
  quote?: string
}

export interface EscalationData {
  should_escalate: boolean
  urgency_level: "immediate" | "high" | "normal" | "none"
  signals_detected: EscalationSignal[]
  recommended_target: string
  recommended_target_label: string
  suggested_message: string
  delay_days_exceeded: number | null
  estimated_amount: number | null
  legal_threat: boolean
  explanation: string
}

interface Props {
  escalation: EscalationData
  emailId: number
  onEscalated?: () => void
}

const URGENCY_CONFIG = {
  immediate: { bg: "#FEF2F2", border: "#FECACA", color: "#DC2626", icon: "🚨", label: "Escalade immédiate requise",  pulse: true  },
  high:      { bg: "#FEF3C7", border: "#FDE68A", color: "#D97706", icon: "⚠️", label: "Escalade recommandée",       pulse: false },
  normal:    { bg: "#EFF6FF", border: "#BFDBFE", color: "#2563EB", icon: "ℹ️", label: "Escalade possible",          pulse: false },
  none:      { bg: "#F9FAFB", border: "#E5E7EB", color: "#6B7280", icon: "✓",  label: "Pas d'escalade nécessaire",  pulse: false },
}

const SIGNAL_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  delai:          { icon: "🕐", color: "#D97706", label: "Délai dépassé"        },
  insatisfaction: { icon: "😤", color: "#DC2626", label: "Insatisfaction client" },
  complexe:       { icon: "🔍", color: "#7C3AED", label: "Cas complexe"         },
  menace:         { icon: "⚖️", color: "#DC2626", label: "Menace légale"        },
  mediateur:      { icon: "🏛️", color: "#0891B2", label: "Médiation requise"   },
}

export default function EscalationAlert({ escalation, emailId, onEscalated }: Props) {
  const [expanded,    setExpanded]    = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [dismissed,   setDismissed]   = useState(false)
  const [target,      setTarget]      = useState(
    escalation.recommended_target !== "none" ? escalation.recommended_target : ""
  )
  const [note,        setNote]        = useState(escalation.suggested_message ?? "")
  const [loading,     setLoading]     = useState(false)

  if (dismissed || !escalation?.should_escalate) return null

  const urgency  = URGENCY_CONFIG[escalation.urgency_level] ?? URGENCY_CONFIG.normal
  const signals  = escalation.signals_detected ?? []

  async function handleEscalate() {
    if (!target || !note.trim()) { toast.error("Complétez le service et le motif"); return }
    setLoading(true)
    try {
      await api.post(`/emails/${emailId}/escalate`, { escalated_to: target, internal_note: note })
      toast.success("🚨 Dossier escaladé avec succès")
      setDismissed(true)
      onEscalated?.()
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Erreur lors de l'escalade")
    } finally { setLoading(false) }
  }

  return (
    <>
      <style>{`
        @keyframes ea-border-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.35); }
          50%      { box-shadow: 0 0 0 7px rgba(220,38,38,0); }
        }
        @keyframes ea-badge-pulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
      `}</style>
      <div style={{
        borderRadius: 14, border: `1.5px solid ${urgency.border}`,
        background: urgency.bg, overflow: "hidden", marginBottom: 16,
        animation: urgency.pulse ? "ea-border-pulse 2s ease-in-out infinite" : "none",
      }}>
        {/* Header */}
        <div
          onClick={() => setExpanded(v => !v)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", cursor: "pointer",
            borderBottom: expanded ? `1px solid ${urgency.border}` : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{urgency.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: urgency.color }}>
                {urgency.label}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: urgency.color + "BB" }}>
                {signals.length} signal(s) — {escalation.recommended_target_label || "Vérification recommandée"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {escalation.legal_threat && (
              <span style={{
                background: "#DC2626", color: "#fff", fontSize: 11, fontWeight: 700,
                padding: "3px 8px", borderRadius: 6,
                animation: "ea-badge-pulse 1.5s infinite",
              }}>⚖️ MENACE LÉGALE</span>
            )}
            <button
              onClick={e => { e.stopPropagation(); setDismissed(true) }}
              style={{ background: "none", border: "none", color: urgency.color + "80", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
              title="Ignorer"
            >×</button>
            <span style={{ color: urgency.color, fontSize: 11, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 200ms", display: "inline-block" }}>▼</span>
          </div>
        </div>

        {/* Body */}
        {expanded && (
          <div style={{ padding: "14px 16px" }}>
            {/* Explication IA */}
            <div style={{
              padding: "10px 14px", background: "rgba(255,255,255,0.65)", borderRadius: 10,
              marginBottom: 14, fontSize: 13, color: "#374151", lineHeight: 1.6,
              border: "1px solid rgba(255,255,255,0.8)",
            }}>
              <strong>💡 Analyse PostSmart IA :</strong> {escalation.explanation}
            </div>

            {/* Signaux */}
            {signals.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Signaux détectés
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {signals.map((sig, i) => {
                    const sc = SIGNAL_ICONS[sig.type] ?? SIGNAL_ICONS.complexe
                    return (
                      <div key={i} style={{
                        background: "rgba(255,255,255,0.7)",
                        border: `1px solid ${sc.color}25`,
                        borderLeft: `3px solid ${sc.color}`,
                        borderRadius: 8, padding: "8px 12px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span>{sc.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: sc.color }}>{sc.label}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: "#4B5563" }}>{sig.description}</p>
                        {sig.quote && (
                          <p style={{
                            margin: "4px 0 0", fontSize: 11, color: "#9CA3AF",
                            fontStyle: "italic", borderLeft: `2px solid ${sc.color}50`, paddingLeft: 8,
                          }}>
                            "{sig.quote}"
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Badges infos */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {escalation.delay_days_exceeded && (
                <span style={{ background: "#FEF3C7", color: "#D97706", fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 8, border: "1px solid #FDE68A" }}>
                  🕐 {escalation.delay_days_exceeded}j de retard
                </span>
              )}
              {escalation.estimated_amount && (
                <span style={{ background: "#F5F3FF", color: "#7C3AED", fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 8, border: "1px solid #DDD6FE" }}>
                  💶 Montant estimé : {escalation.estimated_amount}€
                </span>
              )}
            </div>

            {/* Actions */}
            {!showForm ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowForm(true)} style={{
                  flex: 1, padding: "10px 16px", background: urgency.color, color: "#fff",
                  border: "none", borderRadius: 10, cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  🚨 Escalader maintenant
                </button>
                <button onClick={() => setDismissed(true)} style={{
                  padding: "10px 16px", background: "rgba(255,255,255,0.6)",
                  color: "#6B7280", border: "1px solid #E5E7EB",
                  borderRadius: 10, cursor: "pointer", fontSize: 13,
                }}>
                  Ignorer
                </button>
              </div>
            ) : (
              /* Formulaire rapide */
              <div style={{ background: "rgba(255,255,255,0.85)", borderRadius: 10, padding: 14, border: "1px solid rgba(255,255,255,0.9)", display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#00205B" }}>Confirmer l'escalade</p>

                <div>
                  <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 600, color: "#374151" }}>
                    Escalader vers <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <select value={target} onChange={e => setTarget(e.target.value)} style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB",
                    fontSize: 13, background: "#fff", boxSizing: "border-box",
                  }}>
                    <option value="">Choisir le service…</option>
                    {ESCALATION_TARGETS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 600, color: "#374151" }}>
                    Motif <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <textarea
                    value={note} onChange={e => setNote(e.target.value)}
                    rows={3}
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB",
                      fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleEscalate}
                    disabled={!target || !note.trim() || loading}
                    style={{
                      flex: 1, padding: "10px 16px",
                      background: !target || !note.trim() || loading ? "#E5E7EB" : urgency.color,
                      color: !target || !note.trim() || loading ? "#9CA3AF" : "#fff",
                      border: "none", borderRadius: 10,
                      cursor: !target || !note.trim() || loading ? "not-allowed" : "pointer",
                      fontSize: 13, fontWeight: 600,
                    }}
                  >
                    {loading ? "⏳ En cours…" : "✓ Confirmer l'escalade"}
                  </button>
                  <button onClick={() => setShowForm(false)} style={{
                    padding: "10px 16px", background: "#fff", color: "#6B7280",
                    border: "1px solid #E5E7EB", borderRadius: 10, cursor: "pointer", fontSize: 13,
                  }}>Annuler</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
