"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface TagCount { tag: string; count: number }
interface WeekData { week: string; positive: number; negative: number }
interface Correction {
  id: number
  email_id: number
  subject: string | null
  from_email: string | null
  user: string | null
  correction: string
  created_at: string
}
interface FeedbackStats {
  period_days: number
  total: number
  positive: number
  negative: number
  improvement_score: number | null
  correction_count: number
  top_rejection_tags: TagCount[]
  weekly_trend: WeekData[]
  recent_corrections: Correction[]
}

const TAG_LABELS: Record<string, string> = {
  ton_incorrect:        "Ton incorrect",
  information_manquante:"Info manquante",
  hors_charte:          "Hors charte",
  trop_long:            "Trop long",
  trop_formel:          "Trop formel",
  erreur_factuelle:     "Erreur factuelle",
  autre:                "Autre",
}

const PERIOD_OPTIONS = [
  { value: 7,  label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
]

export default function FeedbackStatsWidget() {
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [showCorrections, setShowCorrections] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get<FeedbackStats>(`/feedback/stats?days=${days}`)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [days])

  if (loading) {
    return (
      <div style={{ padding: "24px 0", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
        Chargement des statistiques…
      </div>
    )
  }

  if (!stats || stats.total === 0) {
    return (
      <div style={{
        borderRadius: 12, border: "1px solid #E5E7EB", padding: 24,
        background: "#fff", textAlign: "center", color: "#6B7280", fontSize: 13,
      }}>
        Aucun feedback enregistré sur cette période.
      </div>
    )
  }

  const positiveRate = stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0
  const scoreColor = positiveRate >= 75 ? "#059669" : positiveRate >= 50 ? "#D97706" : "#DC2626"
  const maxTagCount = stats.top_rejection_tags[0]?.count ?? 1
  const maxWeekValue = Math.max(...stats.weekly_trend.map(w => w.positive + w.negative), 1)

  return (
    <div style={{ borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px", borderBottom: "1px solid #F3F4F6",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            ⭐
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111827" }}>Feedback IA — Qualité des réponses</p>
            <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>{stats.total} avis collectés</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {PERIOD_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setDays(o.value)} style={{
              padding: "5px 12px", borderRadius: 6, border: "1px solid",
              borderColor: days === o.value ? "#7C3AED" : "#E5E7EB",
              background: days === o.value ? "#EDE9FE" : "#fff",
              color: days === o.value ? "#7C3AED" : "#6B7280",
              fontSize: 12, fontWeight: days === o.value ? 600 : 400, cursor: "pointer",
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px" }}>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {/* Score amélioration */}
          <div style={{ borderRadius: 10, background: "#F9FAFB", border: "1px solid #E5E7EB", padding: "14px 16px", textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Score IA</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: scoreColor }}>{stats.improvement_score ?? "–"}%</p>
            <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF" }}>de satisfaction</p>
          </div>
          {/* Positifs */}
          <div style={{ borderRadius: 10, background: "#ECFDF5", border: "1px solid #BBF7D0", padding: "14px 16px", textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>👍 Positifs</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#059669" }}>{stats.positive}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#6B7280" }}>{positiveRate}% du total</p>
          </div>
          {/* Négatifs */}
          <div style={{ borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", padding: "14px 16px", textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#7F1D1D", textTransform: "uppercase", letterSpacing: "0.05em" }}>👎 Négatifs</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#DC2626" }}>{stats.negative}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#6B7280" }}>{100 - positiveRate}% du total</p>
          </div>
          {/* Corrections */}
          <div style={{ borderRadius: 10, background: "#EFF6FF", border: "1px solid #BFDBFE", padding: "14px 16px", textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>Corrections</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#1D4ED8" }}>{stats.correction_count}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#6B7280" }}>proposées</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* Top rejection tags */}
          {stats.top_rejection_tags.length > 0 && (
            <div>
              <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#374151" }}>Principaux motifs de rejet</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stats.top_rejection_tags.map(({ tag, count }) => (
                  <div key={tag}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: "#374151" }}>{TAG_LABELS[tag] ?? tag}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>{count}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 4, background: "#F3F4F6", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 4,
                        width: `${Math.round((count / maxTagCount) * 100)}%`,
                        background: "linear-gradient(90deg, #7C3AED, #A78BFA)",
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly trend mini-chart */}
          {stats.weekly_trend.length > 0 && (
            <div>
              <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#374151" }}>Tendance hebdomadaire</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
                {stats.weekly_trend.map((w, i) => {
                  const total = w.positive + w.negative
                  const totalH = total > 0 ? Math.round((total / maxWeekValue) * 72) : 0
                  const posH = total > 0 ? Math.round((w.positive / total) * totalH) : 0
                  const negH = totalH - posH
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 72, width: "100%" }}>
                        {total > 0 && (
                          <div style={{ width: "100%", borderRadius: "3px 3px 0 0", overflow: "hidden" }}>
                            {posH > 0 && <div style={{ height: posH, background: "#059669" }} />}
                            {negH > 0 && <div style={{ height: negH, background: "#DC2626" }} />}
                          </div>
                        )}
                        {total === 0 && <div style={{ height: 3, background: "#E5E7EB", borderRadius: 2 }} />}
                      </div>
                      <span style={{ fontSize: 9, color: "#9CA3AF", whiteSpace: "nowrap" }}>{w.week}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: "#059669" }} />
                  <span style={{ fontSize: 11, color: "#6B7280" }}>Positifs</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: "#DC2626" }} />
                  <span style={{ fontSize: 11, color: "#6B7280" }}>Négatifs</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent corrections */}
        {stats.recent_corrections.length > 0 && (
          <div>
            <button
              onClick={() => setShowCorrections(v => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                cursor: "pointer", padding: 0, marginBottom: 12,
                fontSize: 13, fontWeight: 600, color: "#374151",
              }}
            >
              <span>Corrections récentes proposées</span>
              <span style={{ fontSize: 10, background: "#EDE9FE", color: "#7C3AED", borderRadius: 20, padding: "1px 7px", fontWeight: 700 }}>
                {stats.recent_corrections.length}
              </span>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>{showCorrections ? "▲" : "▼"}</span>
            </button>

            {showCorrections && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stats.recent_corrections.map(c => (
                  <div key={c.id} style={{
                    borderRadius: 8, border: "1px solid #E5E7EB", padding: "12px 14px", background: "#FAFAFA",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                        {c.subject ?? `Mail #${c.email_id}`}
                      </span>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                        {c.user} · {new Date(c.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#4B5563", lineHeight: 1.6, fontStyle: "italic" }}>
                      "{c.correction}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
