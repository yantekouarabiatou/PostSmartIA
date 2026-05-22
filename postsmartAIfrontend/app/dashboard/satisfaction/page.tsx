"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import toast, { Toaster } from "react-hot-toast"

// ── Types ─────────────────────────────────────────────────────────────────────

interface FeedbackStats {
  period_days:        number
  total:              number
  positive:           number
  negative:           number
  improvement_score:  number | null
  correction_count:   number
  top_rejection_tags: Array<{ tag: string; count: number }>
  weekly_trend:       Array<{ week: string; positive: number; negative: number }>
  recent_corrections: Array<{
    id: number; email_id: number; subject: string | null
    from_email: string | null; user: string | null
    correction: string; created_at: string
  }>
}

const TAG_LABELS: Record<string, string> = {
  ton_incorrect:         "Ton incorrect",
  information_manquante: "Info manquante",
  hors_charte:           "Hors charte",
  trop_long:             "Trop long",
  trop_formel:           "Trop formel",
  erreur_factuelle:      "Erreur factuelle",
  autre:                 "Autre",
}

const PERIODS = [
  { value: 7,  label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
]

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 75 ? "#059669" : score >= 50 ? "#D97706" : "#DC2626"
  const bg    = score >= 75 ? "#ECFDF5" : score >= 50 ? "#FFFBEB" : "#FEF2F2"
  const label = score >= 75 ? "Excellent" : score >= 50 ? "Correct" : "À améliorer"

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 140, height: 140, borderRadius: "50%",
        background: `conic-gradient(${color} ${score * 3.6}deg, #E5E7EB ${score * 3.6}deg)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 12px", position: "relative",
      }}>
        <div style={{
          width: 110, height: 110, borderRadius: "50%",
          background: "#fff", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>/100</span>
        </div>
      </div>
      <span style={{
        display: "inline-block", padding: "4px 14px", borderRadius: 20,
        background: bg, color, fontSize: 13, fontWeight: 600,
      }}>{label}</span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SatisfactionPage() {
  const [stats, setStats]     = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays]       = useState(30)
  const [showCorrections, setShowCorrections] = useState(false)

  async function load(d: number) {
    setLoading(true)
    try {
      const data = await api.get<FeedbackStats>(`/feedback/stats?days=${d}`)
      setStats(data)
    } catch (e: any) {
      toast.error(e?.message ?? "Impossible de charger les données")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(days) }, [days])

  const positiveRate = stats && stats.total > 0
    ? Math.round((stats.positive / stats.total) * 100)
    : null

  const maxWeekTotal = stats
    ? Math.max(...stats.weekly_trend.map(w => w.positive + w.negative), 1)
    : 1

  return (
    <>
      <Toaster position="top-right" />
      <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#00205B" }}>
              ⭐ Satisfaction &amp; Qualité IA
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "#6B7280" }}>
              Suivi des feedbacks conseillers sur les réponses générées par PostSmart IA
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setDays(p.value)}
                style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                  background: days === p.value ? "#00205B" : "#F3F4F6",
                  color: days === p.value ? "#fff" : "#374151",
                }}
              >{p.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 80, textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>Chargement…</div>
        ) : stats ? (
          <>
            {/* KPI Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
              {[
                { icon: "📊", label: "Feedbacks total",     value: stats.total,              color: "#0066CC",  sub: `sur ${days} jours` },
                { icon: "👍", label: "Positifs",            value: stats.positive,            color: "#059669",  sub: positiveRate != null ? `${positiveRate}% de satisfaction` : "—" },
                { icon: "👎", label: "Négatifs",            value: stats.negative,            color: "#DC2626",  sub: stats.total > 0 ? `${100 - (positiveRate ?? 0)}% d'insatisfaction` : "—" },
                { icon: "✏️",  label: "Corrections soumises",value: stats.correction_count,   color: "#7C3AED",  sub: "réponses IA corrigées" },
              ].map((kpi, i) => (
                <div key={i} style={{
                  background: "#fff", borderRadius: 12, padding: "18px 20px",
                  border: "1px solid #E5E7EB", borderTop: `4px solid ${kpi.color}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{kpi.icon}</span>
                    <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{kpi.label}</span>
                  </div>
                  <p style={{ margin: "0 0 3px", fontSize: 30, fontWeight: 800, color: kpi.color, lineHeight: 1 }}>{kpi.value}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF" }}>{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Score gauge + trend */}
            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, marginBottom: 24 }}>

              {/* Gauge */}
              <div style={{ background: "#fff", borderRadius: 12, padding: "24px 20px", border: "1px solid #E5E7EB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <p style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 600, color: "#00205B", textAlign: "center" }}>Score d'amélioration IA</p>
                {stats.improvement_score != null ? (
                  <ScoreGauge score={stats.improvement_score} />
                ) : (
                  <p style={{ color: "#9CA3AF", fontSize: 13 }}>Pas assez de données</p>
                )}
                <p style={{ marginTop: 14, fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>
                  Basé sur le ratio feedbacks positifs / total
                </p>
              </div>

              {/* Positive/Negative bar */}
              <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E5E7EB" }}>
                <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "#00205B" }}>Répartition des feedbacks</p>
                {stats.total === 0 ? (
                  <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucun feedback sur la période.</p>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: "#6B7280", width: 80, textAlign: "right" }}>Positifs</span>
                      <div style={{ flex: 1, height: 22, background: "#F0FDF4", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                        <div style={{
                          height: "100%", width: `${(stats.positive / stats.total) * 100}%`,
                          background: "#059669", borderRadius: 6, transition: "width .5s",
                          display: "flex", alignItems: "center", paddingLeft: 8,
                        }}>
                          {stats.positive > 0 && <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{stats.positive}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                      <span style={{ fontSize: 12, color: "#6B7280", width: 80, textAlign: "right" }}>Négatifs</span>
                      <div style={{ flex: 1, height: 22, background: "#FEF2F2", borderRadius: 6, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${(stats.negative / stats.total) * 100}%`,
                          background: "#DC2626", borderRadius: 6, transition: "width .5s",
                          display: "flex", alignItems: "center", paddingLeft: 8,
                        }}>
                          {stats.negative > 0 && <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{stats.negative}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Weekly trend mini-chart */}
                    {stats.weekly_trend.length > 0 && (
                      <>
                        <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#374151" }}>Tendance hebdomadaire</p>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
                          {stats.weekly_trend.map((w, i) => {
                            const total = w.positive + w.negative
                            const posH = total > 0 ? Math.round((w.positive / maxWeekTotal) * 56) : 0
                            const negH = total > 0 ? Math.round((w.negative / maxWeekTotal) * 56) : 0
                            return (
                              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 56, gap: 1, width: "100%" }}>
                                  {negH > 0 && <div style={{ height: negH, background: "#FCA5A5", borderRadius: "3px 3px 0 0" }} />}
                                  {posH > 0 && <div style={{ height: posH, background: "#6EE7B7", borderRadius: "3px 3px 0 0" }} />}
                                </div>
                                <span style={{ fontSize: 9, color: "#9CA3AF" }}>{w.week}</span>
                              </div>
                            )
                          })}
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                          <span style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#6EE7B7", display: "inline-block" }} /> Positifs
                          </span>
                          <span style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#FCA5A5", display: "inline-block" }} /> Négatifs
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Bottom row: rejection tags + corrections */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              {/* Top rejection tags */}
              <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E5E7EB" }}>
                <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "#00205B" }}>
                  🏷️ Principaux motifs de rejet
                </p>
                {stats.top_rejection_tags.length === 0 ? (
                  <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucun motif enregistré.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {stats.top_rejection_tags.map((t, i) => {
                      const maxCount = stats.top_rejection_tags[0]?.count ?? 1
                      return (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                            <span style={{ color: "#374151", fontWeight: 500 }}>{TAG_LABELS[t.tag] ?? t.tag}</span>
                            <span style={{ color: "#DC2626", fontWeight: 700 }}>{t.count}</span>
                          </div>
                          <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3 }}>
                            <div style={{
                              height: "100%", borderRadius: 3,
                              width: `${(t.count / maxCount) * 100}%`,
                              background: "#DC2626", opacity: 0.7,
                              transition: "width .4s",
                            }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Recent corrections */}
              <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E5E7EB" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#00205B" }}>
                    ✏️ Corrections récentes
                  </p>
                  {stats.recent_corrections.length > 0 && (
                    <button
                      onClick={() => setShowCorrections(v => !v)}
                      style={{ fontSize: 12, color: "#0066CC", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                    >
                      {showCorrections ? "Réduire" : "Voir tout"}
                    </button>
                  )}
                </div>
                {stats.recent_corrections.length === 0 ? (
                  <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucune correction soumise.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: showCorrections ? "none" : 240, overflow: "hidden" }}>
                    {stats.recent_corrections.map((c, i) => (
                      <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                            {c.subject ?? c.from_email ?? `Mail #${c.email_id}`}
                          </span>
                          <span style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0, marginLeft: 6 }}>
                            {new Date(c.created_at).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        {c.user && (
                          <span style={{ fontSize: 11, color: "#6B7280", display: "block", marginBottom: 4 }}>
                            Par : {c.user}
                          </span>
                        )}
                        <p style={{
                          margin: 0, fontSize: 12, color: "#374151", lineHeight: 1.5,
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}>
                          {c.correction}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}
