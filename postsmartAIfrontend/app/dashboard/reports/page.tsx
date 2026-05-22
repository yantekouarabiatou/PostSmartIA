"use client"

import { useEffect, useState, useCallback } from "react"
import { api } from "@/lib/api"

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReportData {
  period: string
  period_label: string
  generated_at: string
  kpis: {
    total_emails: number
    resolved: number
    resolution_rate: number
    escalated: number
    avg_score: number | null
    total_feedback: number
    ai_score: number | null
  }
  by_service: Array<{ type: string; label: string; total: number }>
  daily_activity: Array<{ day: string; total: number }>
  top_rejection_tags: Array<{ tag: string; count: number }>
  leaderboard: Array<{ name: string; role: string; emails: number; avg_score: number }>
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

const SERVICE_COLORS: Record<string, string> = {
  suivi_colis:   "#0066CC",
  reclamation:   "#DC2626",
  info_offre:    "#059669",
  handicap:      "#7C3AED",
  info_generale: "#D97706",
  escalade:      "#EA580C",
  formation:     "#0891B2",
  autre:         "#6B7280",
}

const PERIODS = [
  { value: "week",    label: "Cette semaine" },
  { value: "month",   label: "Ce mois" },
  { value: "quarter", label: "Ce trimestre" },
]

// ── Composants locaux ─────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color, icon,
}: {
  label: string; value: string | number; sub?: string
  color: string; icon: string
}) {
  return (
    <div style={{
      borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff",
      padding: "18px 20px", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, width: 4, height: "100%",
        background: color, borderRadius: "12px 0 0 12px",
      }} />
      <div style={{ paddingLeft: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{label}</span>
        </div>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color }}>{value}</p>
        {sub && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9CA3AF" }}>{sub}</p>}
      </div>
    </div>
  )
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>{title}</h3>
      {sub && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6B7280" }}>{sub}</p>}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [period, setPeriod]   = useState("month")
  const [data, setData]       = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const [loadingPdf,  setLoadingPdf]  = useState(false)
  const [loadingXlsx, setLoadingXlsx] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<ReportData>(`/reports/data?period=${period}`)
      setData(res)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])

  async function handlePdf() {
    if (!data) return
    setLoadingPdf(true)
    setExportError(null)
    try {
      const { exportReportToPdf } = await import("@/lib/export-pdf")
      await exportReportToPdf(data as any)
    } catch (e: any) {
      console.error("PDF generation error:", e)
      setExportError(e?.message ?? "Erreur lors de la génération PDF.")
    } finally {
      setLoadingPdf(false)
    }
  }

  async function handleExcel() {
    setLoadingXlsx(true)
    setExportError(null)
    try {
      const token   = localStorage.getItem("auth_token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api"
      const res = await fetch(`${baseUrl}/reports/export/excel?period=${period}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href = url
      a.download = `PostSmartIA_Rapport_${new Date().toISOString().split("T")[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setExportError(e.message ?? "Erreur Excel.")
    } finally {
      setLoadingXlsx(false)
    }
  }

  const maxService = data?.by_service[0]?.total ?? 1
  const maxTag     = data?.top_rejection_tags[0]?.count ?? 1
  const maxDay     = Math.max(...(data?.daily_activity.map(d => d.total) ?? [1]))

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>

      {/* ── En-tête ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16, marginBottom: 28,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#00205B" }}>
            📊 Rapports & Statistiques
          </h1>
          {data && !loading && (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
              {data.period_label} · Généré le {data.generated_at}
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Sélecteur période */}
          <div style={{ display: "flex", gap: 4, background: "#F3F4F6", padding: 4, borderRadius: 8 }}>
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)} style={{
                padding: "6px 14px", borderRadius: 6, border: "none",
                background: period === p.value ? "#fff" : "transparent",
                color: period === p.value ? "#00205B" : "#6B7280",
                fontSize: 13, fontWeight: period === p.value ? 600 : 400,
                cursor: "pointer",
                boxShadow: period === p.value ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}>{p.label}</button>
            ))}
          </div>

          {/* Bouton Export PDF */}
          <button onClick={handlePdf} disabled={loadingPdf || loading} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: "#00205B", color: "#fff", fontWeight: 600, fontSize: 13,
            cursor: loadingPdf || loading ? "wait" : "pointer",
            opacity: loadingPdf || loading ? 0.7 : 1,
          }}>
            {loadingPdf
              ? <><Spin /> Génération…</>
              : <>📄 Export PDF</>}
          </button>

          {/* Bouton Export Excel */}
          <button onClick={handleExcel} disabled={loadingXlsx || loading} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8, border: "1px solid #059669",
            background: "#ECFDF5", color: "#065F46", fontWeight: 600, fontSize: 13,
            cursor: loadingXlsx || loading ? "wait" : "pointer",
            opacity: loadingXlsx || loading ? 0.7 : 1,
          }}>
            {loadingXlsx
              ? <><Spin color="#065F46" /> Génération…</>
              : <>📥 Export Excel</>}
          </button>
        </div>
      </div>

      {exportError && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "#FEF2F2", color: "#DC2626", fontSize: 13 }}>
          {exportError}
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#9CA3AF" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <p style={{ margin: 0, fontSize: 14 }}>Chargement des données…</p>
        </div>
      )}

      {!loading && !data && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#9CA3AF" }}>
          <p style={{ margin: 0, fontSize: 14 }}>Impossible de charger les données.</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* ── KPIs ────────────────────────────────────────────────────────── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 14, marginBottom: 28,
          }}>
            <KpiCard label="Emails reçus"       value={data.kpis.total_emails}    icon="📬" color="#0066CC" />
            <KpiCard label="Emails résolus"      value={data.kpis.resolved}
              sub={`${data.kpis.resolution_rate}% de résolution`}
              icon="✅" color="#059669" />
            <KpiCard label="Escalades"           value={data.kpis.escalated}
              icon="⚡" color={data.kpis.escalated > 0 ? "#DC2626" : "#059669"} />
            <KpiCard label="Score qualité IA"    value={data.kpis.avg_score != null ? `${data.kpis.avg_score}/100` : "—"}
              icon="🎯" color={data.kpis.avg_score != null && data.kpis.avg_score >= 70 ? "#059669" : "#D97706"} />
            <KpiCard label="Score satisfaction"  value={data.kpis.ai_score != null ? `${data.kpis.ai_score}%` : "—"}
              sub={`${data.kpis.total_feedback} avis collectés`}
              icon="⭐" color={data.kpis.ai_score != null && data.kpis.ai_score >= 70 ? "#059669" : "#D97706"} />
            <KpiCard label="Taux non-résolution" value={`${100 - data.kpis.resolution_rate}%`}
              icon="⏳" color={100 - data.kpis.resolution_rate > 30 ? "#DC2626" : "#6B7280"} />
          </div>

          {/* ── Grille 2 colonnes ────────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

            {/* Répartition par service */}
            <div style={{ borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff", padding: "20px 24px" }}>
              <SectionTitle title="Répartition par service" sub={`${data.kpis.total_emails} mails au total`} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.by_service.slice(0, 8).map((svc) => {
                  const pct = Math.round((svc.total / maxService) * 100)
                  const color = SERVICE_COLORS[svc.type] ?? "#6B7280"
                  return (
                    <div key={svc.type}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: "#374151" }}>{svc.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color }}>{svc.total}</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: "#F3F4F6", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 4, width: `${pct}%`,
                          background: color, transition: "width 0.5s ease",
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Activité quotidienne */}
            <div style={{ borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff", padding: "20px 24px" }}>
              <SectionTitle title="Activité quotidienne" sub="Nombre d'emails reçus par jour" />
              {data.daily_activity.length === 0 ? (
                <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucune donnée sur la période.</p>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 130, paddingTop: 8 }}>
                  {data.daily_activity.map((d, i) => {
                    const h = maxDay > 0 ? Math.max(4, Math.round((d.total / maxDay) * 110)) : 4
                    const date = new Date(d.day)
                    const label = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        {d.total > 0 && (
                          <span style={{ fontSize: 8, color: "#9CA3AF", lineHeight: 1 }}>{d.total}</span>
                        )}
                        <div style={{
                          width: "100%", height: h,
                          background: d.total === maxDay ? "#0066CC" : "#BFDBFE",
                          borderRadius: "3px 3px 0 0",
                        }} />
                        {data.daily_activity.length <= 14 && (
                          <span style={{ fontSize: 8, color: "#9CA3AF", whiteSpace: "nowrap" }}>{label}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Grille 2 colonnes (feedback + classement) ───────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: data.leaderboard.length > 0 ? "1fr 1fr" : "1fr", gap: 20, marginBottom: 24 }}>

            {/* Top motifs de rejet */}
            {data.top_rejection_tags.length > 0 && (
              <div style={{ borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff", padding: "20px 24px" }}>
                <SectionTitle title="Motifs de rejet IA" sub="Tags les plus fréquents sur les feedbacks négatifs" />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.top_rejection_tags.map((t) => {
                    const pct = Math.round((t.count / maxTag) * 100)
                    return (
                      <div key={t.tag}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 13, color: "#374151" }}>{TAG_LABELS[t.tag] ?? t.tag}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED" }}>{t.count}</span>
                        </div>
                        <div style={{ height: 7, borderRadius: 4, background: "#F3F4F6", overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 4, width: `${pct}%`,
                            background: "linear-gradient(90deg,#7C3AED,#A78BFA)",
                            transition: "width 0.5s ease",
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Ratio positif/négatif */}
                {data.kpis.total_feedback > 0 && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #F3F4F6" }}>
                    <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6B7280" }}>Score satisfaction global</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 10, borderRadius: 5, background: "#FEE2E2", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${data.kpis.ai_score ?? 0}%`,
                          background: (data.kpis.ai_score ?? 0) >= 70 ? "#059669" : "#D97706",
                          borderRadius: 5, transition: "width 0.5s ease",
                        }} />
                      </div>
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: (data.kpis.ai_score ?? 0) >= 70 ? "#059669" : "#D97706",
                      }}>
                        {data.kpis.ai_score ?? 0}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Classement conseillers */}
            {data.leaderboard.length > 0 && (
              <div style={{ borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff", padding: "20px 24px" }}>
                <SectionTitle title="Performance des conseillers" sub="Classé par volume d'emails traités" />
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>#</th>
                        <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#374151" }}>Conseiller</th>
                        <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: 600, color: "#374151" }}>Mails</th>
                        <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: 600, color: "#374151" }}>Score IA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leaderboard.map((agent, i) => {
                        const scoreColor = agent.avg_score >= 75 ? "#059669" : agent.avg_score >= 50 ? "#D97706" : "#DC2626"
                        return (
                          <tr key={i} style={{ borderTop: "1px solid #F3F4F6" }}>
                            <td style={{ padding: "10px", color: "#9CA3AF", fontWeight: 700 }}>
                              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                            </td>
                            <td style={{ padding: "10px" }}>
                              <div style={{ fontWeight: 600, color: "#111827" }}>{agent.name}</div>
                              <div style={{ fontSize: 11, color: "#9CA3AF", textTransform: "capitalize" }}>{agent.role}</div>
                            </td>
                            <td style={{ padding: "10px", textAlign: "center", fontWeight: 700, color: "#0066CC" }}>
                              {agent.emails}
                            </td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              {agent.avg_score > 0 ? (
                                <span style={{
                                  fontSize: 12, fontWeight: 700, color: scoreColor,
                                  background: scoreColor + "15", padding: "3px 8px",
                                  borderRadius: 20,
                                }}>
                                  {agent.avg_score}/100
                                </span>
                              ) : (
                                <span style={{ color: "#9CA3AF" }}>—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Résumé texte ────────────────────────────────────────────────── */}
          <div style={{
            borderRadius: 12, border: "1px solid #E5E7EB", background: "#FAFAFA",
            padding: "20px 24px",
          }}>
            <SectionTitle title="Synthèse automatique" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {data.by_service[0] && (
                <Pill
                  color="#0066CC"
                  text={`Service dominant : ${data.by_service[0].label} (${data.by_service[0].total} mails)`}
                />
              )}
              {data.kpis.resolution_rate >= 75 ? (
                <Pill color="#059669" text={`Taux de résolution satisfaisant : ${data.kpis.resolution_rate}%`} />
              ) : (
                <Pill color="#D97706" text={`Taux de résolution à améliorer : ${data.kpis.resolution_rate}%`} />
              )}
              {data.kpis.escalated > 0 && (
                <Pill color="#DC2626" text={`${data.kpis.escalated} dossier(s) escaladé(s) sur la période`} />
              )}
              {data.kpis.avg_score != null && (
                <Pill
                  color={data.kpis.avg_score >= 70 ? "#059669" : "#D97706"}
                  text={`Score IA moyen : ${data.kpis.avg_score}/100`}
                />
              )}
              {data.kpis.ai_score != null && data.kpis.total_feedback > 0 && (
                <Pill
                  color={data.kpis.ai_score >= 70 ? "#059669" : "#D97706"}
                  text={`Satisfaction conseillère IA : ${data.kpis.ai_score}% (${data.kpis.total_feedback} avis)`}
                />
              )}
              {data.top_rejection_tags[0] && (
                <Pill
                  color="#7C3AED"
                  text={`Rejet IA le + fréquent : ${TAG_LABELS[data.top_rejection_tags[0].tag] ?? data.top_rejection_tags[0].tag}`}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Pill({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      fontSize: 12, padding: "5px 12px", borderRadius: 20,
      background: color + "15", color, fontWeight: 500,
      border: `1px solid ${color}30`,
    }}>
      {text}
    </span>
  )
}

function Spin({ color = "#fff" }: { color?: string }) {
  return (
    <div style={{
      width: 13, height: 13,
      border: `2px solid ${color}33`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "spin 0.65s linear infinite",
      flexShrink: 0,
      display: "inline-block",
    }} />
  )
}
