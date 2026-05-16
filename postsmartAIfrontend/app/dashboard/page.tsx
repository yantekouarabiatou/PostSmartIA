"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { api } from "@/lib/api"
import { DrawerBackground } from "@/components/DrawerBackground"
import CoachWidget from "@/components/ui/coach-widget"
import DailySummaryWidget from "@/components/ui/daily-summary-widget"

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardData {
  user: { name: string; role: string; email: string }
  metrics: {
    emails_today: number
    total_emails: number
    pending: number
    unread: number
    avg_score: number
    score_count: number
    time_saved: number
    calls_today: number
    calls_total: number
  }
  last_7_days: Array<{ date: string; day: string; emails: number; calls: number; pending: number }>
  by_service: Array<{ type: string; label: string; total: number; color: string; percent: number }>
  status_counts: Record<string, number>
  leaderboard: Array<{
    id: number
    name: string
    role: string
    avatar: string
    emails: number
    calls: number
    avg_score: number
    total: number
    last_login: string
  }>
  alerts: Array<{ type: string; icon: string; color: string; bg: string; message: string; action: string }>
  recent_activity: Array<{ type: string; icon: string; color: string; title: string; sub: string; status: string; time: string }>
  is_admin: boolean
}

// ── AnimatedCounter ───────────────────────────────────────────────────────────

function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target) return
    const steps = 50
    const inc = target / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      setValue(prev => Math.min(Math.round(prev + inc), target))
      if (step >= steps) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target, duration])
  return <>{value}</>
}

// ── MetricCard ────────────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  unit = "",
  color,
  bg,
  sublabel,
  onClick,
}: {
  icon: string
  label: string
  value: number | string
  unit?: string
  color: string
  bg: string
  sublabel?: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: "16px",
        padding: "20px",
        borderTop: `3px solid ${color}`,
        cursor: onClick ? "pointer" : "default",
        transition: "all 200ms",
        fontFamily: "Inter, sans-serif",
      }}
      onMouseEnter={e => {
        if (!onClick) return
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = "0 8px 24px rgba(0,32,91,0.12)"
        el.style.transform = "translateY(-3px)"
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = "none"
        el.style.transform = "translateY(0)"
      }}
    >
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          marginBottom: "14px",
        }}
      >
        {icon}
      </div>
      <p style={{ margin: 0, fontSize: "30px", fontWeight: "700", color, lineHeight: 1 }}>
        {typeof value === "number" ? (
          <>
            <AnimatedCounter target={value} />
            {unit}
          </>
        ) : (
          <>
            {value}
            {unit}
          </>
        )}
      </p>
      <p style={{ margin: "6px 0 0", fontSize: "13px", fontWeight: "600", color: "#00205B" }}>{label}</p>
      {sublabel && (
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9CA3AF" }}>{sublabel}</p>
      )}
    </div>
  )
}

// ── CustomTooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: "#00205B",
        borderRadius: "10px",
        padding: "10px 14px",
        border: "none",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      }}
    >
      <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#FFCC00", fontWeight: "600" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ margin: "2px 0", fontSize: "12px", color: "#fff" }}>
          <span style={{ color: p.color }}>●</span> {p.name} : <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchDashboard = useCallback(async () => {
    try {
      const result = await api.get<DashboardData>("/dashboard")
      setData(result)
    } catch (err) {
      console.error("Dashboard error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 60000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Bonjour"
    if (h < 18) return "Bon après-midi"
    return "Bonsoir"
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid #E5E7EB",
            borderTop: "4px solid #0066CC",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "#6B7280", fontSize: "14px", fontFamily: "Inter, sans-serif" }}>
          Chargement du tableau de bord...
        </p>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  const { metrics, last_7_days, by_service, status_counts, leaderboard, alerts, recent_activity, user, is_admin } =
    data ?? ({} as Partial<DashboardData>)

  const firstName = user?.name?.split(" ")[0] ?? "Conseiller"

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto", fontFamily: "Inter, sans-serif" }}>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#00205B",
          borderRadius: "20px",
          padding: "32px",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <DrawerBackground />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255,204,0,0.15)",
                  border: "1px solid rgba(255,204,0,0.3)",
                  borderRadius: "20px",
                  padding: "4px 12px",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#FFCC00",
                    display: "inline-block",
                    animation: "pulse 2s infinite",
                  }}
                />
                <span style={{ fontSize: "12px", color: "#FFCC00", fontWeight: "500" }}>
                  Tableau de bord en direct
                </span>
              </div>
              <h1
                style={{
                  color: "#fff",
                  fontSize: "26px",
                  fontWeight: "700",
                  margin: "0 0 6px",
                  lineHeight: 1.2,
                }}
              >
                {getGreeting()},{" "}
                <span style={{ color: "#FFCC00" }}>{firstName} 👋</span>
              </h1>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: 0 }}>
                {new Date().toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {" · "}
                {(metrics?.pending ?? 0) > 0
                  ? `${metrics!.pending} mail(s) en attente`
                  : "Aucun mail en attente ✓"}
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link
                href="/dashboard/incoming"
                style={{
                  background: "#FFCC00",
                  color: "#00205B",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 20px",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  textDecoration: "none",
                  transition: "all 150ms",
                }}
              >
                📧 Traiter un mail
              </Link>
              <Link
                href="/dashboard/call-report"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: "12px",
                  padding: "12px 20px",
                  fontWeight: "500",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  textDecoration: "none",
                  transition: "all 150ms",
                }}
              >
                📞 Nouveau compte-rendu
              </Link>
            </div>
          </div>

          {/* Mini-stats hero */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "12px",
              marginTop: "24px",
            }}
          >
            {[
              { label: "Traités aujourd'hui", value: metrics?.emails_today ?? 0, icon: "📧" },
              {
                label: "Score moyen",
                value: metrics?.avg_score ? `${metrics.avg_score}/100` : "—",
                icon: "⭐",
              },
              { label: "Appels du jour", value: metrics?.calls_today ?? 0, icon: "📞" },
              { label: "Non lus", value: metrics?.unread ?? 0, icon: "🔵" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <p style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#FFCC00" }}>
                  {item.icon} {item.value}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Alertes temps réel ────────────────────────────────────────────────── */}
      {alerts && alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
          {alerts.map((alert, i) => (
            <div
              key={i}
              onClick={() => router.push(alert.action)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                background: alert.bg,
                border: `1px solid ${alert.color}30`,
                borderLeft: `4px solid ${alert.color}`,
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 150ms",
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)")}
              onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.transform = "translateX(0)")}
            >
              <span style={{ fontSize: "20px" }}>{alert.icon}</span>
              <span style={{ flex: 1, fontSize: "13px", fontWeight: "500", color: alert.color }}>
                {alert.message}
              </span>
              <span style={{ fontSize: "12px", color: alert.color, opacity: 0.7 }}>Voir →</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Métriques principales ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <MetricCard
          icon="📧"
          label="Total mails traités"
          value={metrics?.total_emails ?? 0}
          color="#0066CC"
          bg="#EBF4FF"
          sublabel={`${metrics?.emails_today ?? 0} aujourd'hui`}
          onClick={() => router.push("/dashboard/incoming")}
        />
        <MetricCard
          icon="⭐"
          label="Score qualité moyen"
          value={metrics?.avg_score ?? 0}
          unit="/100"
          color={
            (metrics?.avg_score ?? 0) >= 75
              ? "#059669"
              : (metrics?.avg_score ?? 0) >= 50
              ? "#D97706"
              : "#DC2626"
          }
          bg={
            (metrics?.avg_score ?? 0) >= 75
              ? "#ECFDF5"
              : (metrics?.avg_score ?? 0) >= 50
              ? "#FFFBEB"
              : "#FEF2F2"
          }
          sublabel={
            (metrics?.score_count ?? 0) > 0
              ? `Sur ${metrics!.score_count} mail(s) analysé(s)`
              : "Aucun mail analysé"
          }
        />
        <MetricCard
          icon="⏱️"
          label="Temps économisé"
          value={metrics?.time_saved ?? 0}
          unit=" min"
          color="#7C3AED"
          bg="#F5F3FF"
          sublabel="Estimé (15 min/mail, 10 min/appel)"
        />
        <MetricCard
          icon="📞"
          label="Comptes-rendus d'appel"
          value={metrics?.calls_total ?? 0}
          color="#0891B2"
          bg="#ECFEFF"
          sublabel={`${metrics?.calls_today ?? 0} aujourd'hui`}
          onClick={() => router.push("/dashboard/call-report")}
        />
        <MetricCard
          icon="📬"
          label="En attente de traitement"
          value={metrics?.pending ?? 0}
          color={
            (metrics?.pending ?? 0) > 10
              ? "#DC2626"
              : (metrics?.pending ?? 0) > 5
              ? "#D97706"
              : "#059669"
          }
          bg={
            (metrics?.pending ?? 0) > 10
              ? "#FEF2F2"
              : (metrics?.pending ?? 0) > 5
              ? "#FFFBEB"
              : "#ECFDF5"
          }
          sublabel={`${metrics?.unread ?? 0} non lus`}
          onClick={() => router.push("/dashboard/incoming")}
        />
      </div>

      {/* ── Graphiques ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {/* Activité 7 jours — pleine largeur */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            padding: "24px",
            gridColumn: "1 / -1",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#00205B" }}>
                📈 Activité des 7 derniers jours
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#9CA3AF" }}>
                Mails et appels traités par jour
              </p>
            </div>
            <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
              <span style={{ color: "#0066CC", fontWeight: "500" }}>● Mails</span>
              <span style={{ color: "#0891B2", fontWeight: "500" }}>● Appels</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={last_7_days ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="emails"
                stroke="#0066CC"
                strokeWidth={2.5}
                dot={{ r: 5, fill: "#0066CC", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                name="Mails"
              />
              <Line
                type="monotone"
                dataKey="calls"
                stroke="#0891B2"
                strokeWidth={2.5}
                dot={{ r: 5, fill: "#0891B2", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                name="Appels"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition par type de service */}
        <div
          style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", padding: "24px" }}
        >
          <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "600", color: "#00205B" }}>
            📊 Répartition par type
          </h3>
          {by_service && by_service.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {by_service.map((item, i) => (
                <div key={i}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}
                  >
                    <span style={{ fontSize: "13px", color: "#374151", fontWeight: "500" }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: "12px", color: item.color, fontWeight: "700" }}>
                      {item.total} ({item.percent}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: "8px",
                      background: "#F3F4F6",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${item.percent}%`,
                        background: item.color,
                        borderRadius: "4px",
                        transition: "width 1s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: "13px" }}
            >
              Aucune donnée disponible
            </div>
          )}
        </div>

        {/* Statuts en temps réel */}
        <div
          style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", padding: "24px" }}
        >
          <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "600", color: "#00205B" }}>
            🔄 Statuts en temps réel
          </h3>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
          >
            {[
              { key: "unread",     label: "Non lus",    icon: "🔵", color: "#0066CC", bg: "#EBF4FF" },
              { key: "processing", label: "En cours",   icon: "⚙️", color: "#D97706", bg: "#FEF3C7" },
              { key: "pending",    label: "En attente", icon: "⏳", color: "#7C3AED", bg: "#F5F3FF" },
              { key: "escalated",  label: "Escaladés",  icon: "🚨", color: "#DC2626", bg: "#FEF2F2" },
              { key: "resolved",   label: "Résolus",    icon: "✅", color: "#059669", bg: "#ECFDF5" },
              { key: "archived",   label: "Archivés",   icon: "📦", color: "#6B7280", bg: "#F3F4F6" },
            ].map(s => (
              <div
                key={s.key}
                onClick={() => router.push(`/dashboard/incoming?filter=${s.key}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  background: s.bg,
                  borderRadius: "10px",
                  border: `1px solid ${s.color}20`,
                  cursor: "pointer",
                  transition: "all 150ms",
                }}
                onMouseEnter={e =>
                  ((e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)")
                }
                onMouseLeave={e =>
                  ((e.currentTarget as HTMLDivElement).style.transform = "scale(1)")
                }
              >
                <span style={{ fontSize: "18px" }}>{s.icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: s.color, lineHeight: 1 }}>
                    <AnimatedCounter target={status_counts?.[s.key] ?? 0} />
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: s.color, opacity: 0.8 }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Classement conseillers (admin/manager) ──────────────────────────────── */}
      {is_admin && leaderboard && leaderboard.length > 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#00205B" }}>
                🏆 Classement des conseillers
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#9CA3AF" }}>
                Basé sur le volume traité et le score qualité
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/users")}
              style={{
                background: "#EBF4FF",
                color: "#0066CC",
                border: "none",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Voir tous →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {leaderboard.map((advisor, i) => (
              <div
                key={advisor.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px 16px",
                  background: i === 0 ? "#FFFBEB" : i === 1 ? "#F9FAFB" : i === 2 ? "#FFF8F0" : "#fff",
                  borderRadius: "12px",
                  border: `1px solid ${
                    i === 0 ? "#FDE68A" : i === 1 ? "#E5E7EB" : i === 2 ? "#FED7AA" : "#F3F4F6"
                  }`,
                  transition: "all 150ms",
                }}
              >
                {/* Rang */}
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                    fontSize: i < 3 ? "16px" : "13px",
                    background:
                      i === 0 ? "#FFCC00" : i === 1 ? "#E5E7EB" : i === 2 ? "#FED7AA" : "#F3F4F6",
                    color: i === 0 ? "#00205B" : i === 1 ? "#374151" : i === 2 ? "#92400E" : "#6B7280",
                  }}
                >
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </div>

                {/* Avatar */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#00205B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#FFCC00",
                    flexShrink: 0,
                  }}
                >
                  {advisor.avatar}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1A1A2E",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {advisor.name}
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#9CA3AF" }}>
                    Dernière connexion : {advisor.last_login}
                  </p>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: "20px", flexShrink: 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0066CC" }}>
                      {advisor.emails}
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>Mails</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0891B2" }}>
                      {advisor.calls}
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>Appels</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: "700",
                        color:
                          advisor.avg_score >= 75
                            ? "#059669"
                            : advisor.avg_score >= 50
                            ? "#D97706"
                            : "#DC2626",
                      }}
                    >
                      {advisor.avg_score > 0 ? `${advisor.avg_score}/100` : "—"}
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>Score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Coach IA + Résumé du jour ─────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <CoachWidget />
        <DailySummaryWidget />
      </div>

      {/* ── Activité récente ──────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#00205B" }}>
            🕐 Activité récente
          </h3>
          <Link
            href="/dashboard/history"
            style={{
              background: "#EBF4FF",
              color: "#0066CC",
              border: "none",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: "500",
              textDecoration: "none",
            }}
          >
            Voir tout →
          </Link>
        </div>

        {recent_activity && recent_activity.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {recent_activity.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  transition: "background 150ms",
                  cursor: "default",
                }}
                onMouseEnter={e =>
                  ((e.currentTarget as HTMLDivElement).style.background = "#F9FAFB")
                }
                onMouseLeave={e =>
                  ((e.currentTarget as HTMLDivElement).style.background = "transparent")
                }
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: item.color + "15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#1A1A2E",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.title}
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#9CA3AF" }}>{item.sub}</p>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "3px",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "#9CA3AF", whiteSpace: "nowrap" }}>
                    {item.time}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "600",
                      padding: "1px 7px",
                      borderRadius: "6px",
                      background: "#F3F4F6",
                      color: "#6B7280",
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#9CA3AF", fontSize: "13px" }}
          >
            Aucune activité récente
          </div>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", padding: "16px", fontSize: "12px", color: "#9CA3AF" }}>
        PostSmart IA © 2026 — La Poste × EY × Microsoft
        {" · "}
        <span onClick={fetchDashboard} style={{ color: "#0066CC", cursor: "pointer" }}>
          Actualiser
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}
