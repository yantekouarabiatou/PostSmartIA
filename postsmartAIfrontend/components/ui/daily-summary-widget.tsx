"use client"

import { useState } from "react"
import { api } from "@/lib/api"

interface DailySummary {
  headline: string
  mood: "excellent" | "good" | "average" | "tough"
  mood_emoji: string
  highlights: string[]
  watch_out: string | null
  tomorrow_tip: string
  motivation_quote: string
  stats: {
    emails_today: number
    calls_today: number
    avg_score: number
    pending: number
    escalated: number
    time_saved: number
  }
}

const MOOD_CONFIG = {
  excellent: { bg: "#ECFDF5", border: "#BBF7D0", text: "#059669" },
  good:      { bg: "#EBF4FF", border: "#BFDBFE", text: "#0066CC" },
  average:   { bg: "#FFFBEB", border: "#FDE68A", text: "#D97706" },
  tough:     { bg: "#FEF2F2", border: "#FECACA", text: "#DC2626" },
}

export default function DailySummaryWidget() {
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const hour = new Date().getHours()
  const isAfternoon = hour >= 16

  async function load() {
    setLoading(true)
    setError("")
    try {
      const data = await api.get<DailySummary>("/ai/daily-summary")
      setSummary(data)
    } catch {
      setError("Impossible de générer le résumé.")
    } finally {
      setLoading(false)
    }
  }

  const mood = summary?.mood ?? "good"
  const colors = MOOD_CONFIG[mood]

  return (
    <div style={{
      background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16,
      overflow: "hidden", fontFamily: "Inter, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: summary ? colors.bg : "#F9FAFB",
        borderBottom: `1px solid ${summary ? colors.border : "#E5E7EB"}`,
        padding: "14px 18px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 22 }}>{summary?.mood_emoji ?? (isAfternoon ? "🌅" : "☀️")}</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#00205B" }}>
            {summary?.headline ?? (isAfternoon ? "Résumé de fin de journée" : "Bilan de la journée")}
          </h3>
          {summary && (
            <p style={{ margin: 0, fontSize: 11, color: "#6B7280" }}>Généré par IA • Aujourd'hui</p>
          )}
        </div>
      </div>

      <div style={{ padding: "14px 18px" }}>
        {!summary && !loading && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6B7280" }}>
              {isAfternoon
                ? "Fin de journée approche — consultez votre bilan personnalisé."
                : "Générez votre résumé de journée en cours."}
            </p>
            <button
              onClick={load}
              style={{
                background: "linear-gradient(135deg, #00205B, #0066CC)",
                color: "#fff", border: "none", borderRadius: 10,
                padding: "9px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              {isAfternoon ? "🌅 Mon bilan du jour" : "☀️ Résumé en cours"}
            </button>
            {error && <p style={{ marginTop: 8, fontSize: 12, color: "#DC2626" }}>{error}</p>}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "16px 0", color: "#6B7280", fontSize: 12 }}>
            <div style={{
              width: 28, height: 28, border: "3px solid #E5E7EB", borderTop: "3px solid #0066CC",
              borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px",
            }} />
            L'IA prépare votre résumé…
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {summary && (
          <div>
            {/* Mini stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
              {[
                { icon: "📧", val: summary.stats.emails_today, label: "Mails" },
                { icon: "📞", val: summary.stats.calls_today,  label: "Appels" },
                { icon: "⏱️", val: `${summary.stats.time_saved}min`, label: "Économisés" },
              ].map((s, i) => (
                <div key={i} style={{
                  textAlign: "center", background: "#F9FAFB",
                  borderRadius: 8, padding: "8px 4px",
                }}>
                  <div style={{ fontSize: 16 }}>{s.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#00205B" }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Points forts */}
            {summary.highlights.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                {summary.highlights.map((h, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#374151", marginBottom: 4, display: "flex", gap: 6 }}>
                    <span style={{ color: "#059669", flexShrink: 0 }}>✓</span> {h}
                  </div>
                ))}
              </div>
            )}

            {/* Vigilance */}
            {summary.watch_out && (
              <div style={{
                background: "#FFFBEB", border: "1px solid #FDE68A",
                borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 12, color: "#92400E",
              }}>
                ⚠️ {summary.watch_out}
              </div>
            )}

            {/* Conseil demain */}
            <div style={{
              background: "#F0FDF4", borderRadius: 8, padding: "8px 10px",
              marginBottom: 10, fontSize: 12, color: "#166534",
            }}>
              🌟 <strong>Demain :</strong> {summary.tomorrow_tip}
            </div>

            {/* Citation */}
            <div style={{ fontSize: 11, color: "#9CA3AF", fontStyle: "italic", textAlign: "center", marginBottom: 10 }}>
              "{summary.motivation_quote}"
            </div>

            <button
              onClick={load}
              style={{
                width: "100%", background: "#F3F4F6", color: "#374151",
                border: "none", borderRadius: 8, padding: "7px", fontSize: 11,
                cursor: "pointer", fontWeight: 500,
              }}
            >
              🔄 Actualiser
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
