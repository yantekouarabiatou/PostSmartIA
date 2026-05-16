"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface CoachReport {
  overall_grade: string
  overall_label: string
  overall_message: string
  strengths: { title: string; detail: string }[]
  improvements: { title: string; tip: string; priority: "high" | "medium" | "low" }[]
  weekly_tip: string
  top_service_type: string | null
  avg_score_trend: "stable" | "improving" | "declining"
  total_analyzed: number
}

const GRADE_COLOR: Record<string, string> = {
  A: "#059669", B: "#0066CC", C: "#D97706", D: "#DC2626", "N/A": "#9CA3AF",
}
const GRADE_BG: Record<string, string> = {
  A: "#ECFDF5", B: "#EBF4FF", C: "#FFFBEB", D: "#FEF2F2", "N/A": "#F9FAFB",
}
const TREND_ICON: Record<string, string> = {
  improving: "📈", stable: "➡️", declining: "📉",
}
const PRIORITY_COLOR: Record<string, string> = {
  high: "#DC2626", medium: "#D97706", low: "#059669",
}

export default function CoachWidget() {
  const [report, setReport] = useState<CoachReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    setError("")
    try {
      const data = await api.get<CoachReport>("/ai/coach-report")
      setReport(data)
      setOpen(true)
    } catch {
      setError("Impossible de charger le rapport coach.")
    } finally {
      setLoading(false)
    }
  }

  const grade = report?.overall_grade ?? "?"
  const gradeColor = GRADE_COLOR[grade] ?? "#9CA3AF"
  const gradeBg    = GRADE_BG[grade]    ?? "#F9FAFB"

  return (
    <div style={{
      background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16,
      overflow: "hidden", fontFamily: "Inter, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #00205B, #0066CC)",
        padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: "rgba(255,204,0,0.2)", border: "1px solid rgba(255,204,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
        }}>🎓</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>Mode Coach IA</h3>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            Analyse de vos 30 derniers mails traités
          </p>
        </div>
        {report && (
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: gradeBg, border: `2px solid ${gradeColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 900, color: gradeColor,
          }}>
            {grade}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px" }}>
        {!report && !loading && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6B7280" }}>
              Obtenez votre rapport personnalisé basé sur votre activité récente.
            </p>
            <button
              onClick={load}
              style={{
                background: "#00205B", color: "#fff", border: "none", borderRadius: 10,
                padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              🎓 Analyser mes performances
            </button>
            {error && <p style={{ marginTop: 8, fontSize: 12, color: "#DC2626" }}>{error}</p>}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#6B7280", fontSize: 13 }}>
            <div style={{
              width: 32, height: 32, border: "3px solid #E5E7EB", borderTop: "3px solid #0066CC",
              borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
            }} />
            L'IA analyse vos performances…
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {report && open && (
          <div>
            {/* Message global */}
            <div style={{
              background: gradeBg, borderRadius: 10, padding: "12px 14px", marginBottom: 14,
              border: `1px solid ${gradeColor}20`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: gradeColor }}>{report.overall_label}</span>
                {report.avg_score_trend && (
                  <span style={{ fontSize: 12 }}>{TREND_ICON[report.avg_score_trend]}</span>
                )}
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#9CA3AF" }}>
                  {report.total_analyzed} mails analysés
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                {report.overall_message}
              </p>
            </div>

            {/* Points forts */}
            {report.strengths.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#059669" }}>✅ Points forts</p>
                {report.strengths.map((s, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#374151", marginBottom: 4, paddingLeft: 8 }}>
                    <strong>{s.title}</strong> — {s.detail}
                  </div>
                ))}
              </div>
            )}

            {/* Axes d'amélioration */}
            {report.improvements.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#D97706" }}>💡 À améliorer</p>
                {report.improvements.map((imp, i) => (
                  <div key={i} style={{
                    fontSize: 12, marginBottom: 6, padding: "6px 10px", borderRadius: 8,
                    background: "#F9FAFB", borderLeft: `3px solid ${PRIORITY_COLOR[imp.priority]}`,
                  }}>
                    <strong style={{ color: "#1A1A2E" }}>{imp.title}</strong>
                    <p style={{ margin: "2px 0 0", color: "#6B7280" }}>{imp.tip}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Conseil de la semaine */}
            {report.weekly_tip && (
              <div style={{
                background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10,
                padding: "10px 12px", marginBottom: 12,
              }}>
                <p style={{ margin: 0, fontSize: 12, color: "#92400E" }}>
                  💡 <strong>Conseil de la semaine :</strong> {report.weekly_tip}
                </p>
              </div>
            )}

            <button
              onClick={load}
              style={{
                width: "100%", background: "#F3F4F6", color: "#374151",
                border: "none", borderRadius: 8, padding: "8px", fontSize: 12,
                cursor: "pointer", fontWeight: 500,
              }}
            >
              🔄 Actualiser le rapport
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
