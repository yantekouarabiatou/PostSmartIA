"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

interface ProfileStats {
  emails_this_month: number
  calls_this_month: number
  avg_quality_score: number
  time_saved_minutes: number
  last_7_days: { date: string; emails: number; calls: number }[]
  by_service: { type: string; count: number }[]
}

interface AuthUser {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  equipe?: string
}

const ROLE_LABEL: Record<string, string> = {
  conseiller: "Conseiller",
  manager: "Manager",
  admin: "Administrateur",
}

const ROLE_COLOR: Record<string, string> = {
  conseiller: "#0066CC",
  manager: "#854F0B",
  admin: "#993C1D",
}

const SERVICE_LABELS: Record<string, string> = {
  suivi_colis:        "Suivi colis",
  reclamation:        "Réclamation",
  info_offre:         "Info / Offre",
  escalade_mediateur: "Escalade",
  handicap:           "Handicap",
  formulaire:         "Formulaire",
  autre:              "Autre",
}

function MetricCard({
  label, value, unit, icon, color, delay = 0,
}: {
  label: string; value: number; unit?: string; icon: string; color: string; delay?: number
}) {
  const [cur, setCur] = useState(0)

  useEffect(() => {
    setCur(0)
    const timeout = setTimeout(() => {
      const steps = 50
      const inc = value / steps
      let step = 0
      const timer = setInterval(() => {
        step++
        setCur(prev => Math.round(Math.min(prev + inc, value)))
        if (step >= steps) clearInterval(timer)
      }, 1000 / steps)
      return () => clearInterval(timer)
    }, delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: 20,
      border: "1px solid #E5E7EB",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: color + "18", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 24, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#00205B", lineHeight: 1 }}>
          {cur}
          <span style={{ fontSize: 14, fontWeight: 500, color: "#6B7280", marginLeft: 3 }}>{unit}</span>
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>{label}</p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [stats, setStats]   = useState<ProfileStats | null>(null)
  const [user, setUser]     = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored) setUser(JSON.parse(stored))
    } catch {}
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const data = await api.get<ProfileStats>("/profile/stats")
      setStats(data)
    } catch {}
    finally { setLoading(false) }
  }

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "?"

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: "#00205B" }}>
        Mon profil
      </h1>
      <p style={{ margin: "0 0 28px", fontSize: 14, color: "#6B7280" }}>
        Vos statistiques d&apos;activité et informations personnelles.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "start" }}>

        {/* Profile card */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: 28,
          border: "1px solid #E5E7EB",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          textAlign: "center",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "#FFCC00", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 26, fontWeight: 800,
            color: "#00205B", margin: "0 auto 16px",
          }}>{initials}</div>
          <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#00205B" }}>
            {user ? `${user.first_name} ${user.last_name}` : "—"}
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6B7280" }}>{user?.email}</p>
          {user?.role && (
            <span style={{
              display: "inline-block", padding: "4px 14px", borderRadius: 20,
              fontSize: 12, fontWeight: 600, color: "#fff",
              background: ROLE_COLOR[user.role] ?? "#0066CC",
            }}>
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
          )}
          {user?.equipe && (
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9CA3AF" }}>
              Équipe : {user.equipe}
            </p>
          )}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #F0F0F0" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>PostSmart IA — La Poste</p>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Metric cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            <MetricCard label="Mails traités ce mois"    value={stats?.emails_this_month ?? 0}  icon="📧" color="#0066CC" delay={0}   />
            <MetricCard label="Appels traités ce mois"   value={stats?.calls_this_month ?? 0}   icon="📞" color="#0891B2" delay={100} />
            <MetricCard label="Score qualité moyen"      value={stats?.avg_quality_score ?? 0}  icon="⭐" color="#059669" delay={200} unit="/100" />
            <MetricCard label="Temps économisé estimé"   value={stats?.time_saved_minutes ?? 0} icon="⚡" color="#7C3AED" delay={300} unit="min"  />
          </div>

          {/* 7-day activity chart */}
          {!loading && (stats?.last_7_days?.length ?? 0) > 0 && (
            <div style={{
              background: "#fff", borderRadius: 14, padding: 24,
              border: "1px solid #E5E7EB",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              <p style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 600, color: "#00205B" }}>
                Activité des 7 derniers jours
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats!.last_7_days} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    tickFormatter={d => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}
                    formatter={(val: number, name: string) => [val, name === "emails" ? "Mails" : "Appels"]}
                    labelFormatter={(d: string) => new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  />
                  <Line type="monotone" dataKey="emails" stroke="#0066CC" strokeWidth={2} dot={{ r: 3 }} name="emails" />
                  <Line type="monotone" dataKey="calls"  stroke="#0891B2" strokeWidth={2} dot={{ r: 3 }} name="calls"  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By-service bar chart */}
          {!loading && (stats?.by_service?.length ?? 0) > 0 && (
            <div style={{
              background: "#fff", borderRadius: 14, padding: 24,
              border: "1px solid #E5E7EB",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              <p style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 600, color: "#00205B" }}>
                Répartition par type de demande
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={stats!.by_service.map(s => ({ ...s, label: SERVICE_LABELS[s.type] ?? s.type }))}
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}
                    formatter={(val: number) => [val, "Emails"]}
                  />
                  <Bar dataKey="count" fill="#0066CC" radius={[4, 4, 0, 0]} name="count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: 48, color: "#9CA3AF", fontSize: 14 }}>
              Chargement des statistiques…
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
