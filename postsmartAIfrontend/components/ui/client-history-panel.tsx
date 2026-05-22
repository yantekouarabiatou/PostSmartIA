"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimelineItem {
  id: number
  subject: string | null
  received_at: string | null
  status: string
  service_type: string | null
  quality_score: number | null
  escalated: boolean
  source: string
}

interface Topic {
  type: string
  label: string
  count: number
}

interface ClientHistoryData {
  client_email: string
  from_name: string | null
  total_contacts: number
  is_sensitive: boolean
  sensitivity_reasons: string[]
  first_contact: string | null
  last_contact: string | null
  avg_score: number | null
  topics: Topic[]
  escalation_count: number
  timeline: TimelineItem[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  unread:    { bg: "#EBF4FF", color: "#0066CC", label: "Non lu"    },
  read:      { bg: "#F3F4F6", color: "#6B7280", label: "Lu"        },
  processing:{ bg: "#FFFBEB", color: "#D97706", label: "En cours"  },
  resolved:  { bg: "#ECFDF5", color: "#059669", label: "Résolu"    },
  archived:  { bg: "#F3F4F6", color: "#9CA3AF", label: "Archivé"   },
  pending:   { bg: "#FEF3C7", color: "#D97706", label: "En attente"},
  partial:   { bg: "#FFF7ED", color: "#EA580C", label: "Partiel"   },
  escalated: { bg: "#F5F3FF", color: "#7C3AED", label: "Escaladé"  },
}

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}

function ScoreDot({ score }: { score: number | null }) {
  if (score === null) return null
  const color = score >= 80 ? "#059669" : score >= 60 ? "#D97706" : "#DC2626"
  return (
    <span
      style={{
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
      title={`Score : ${score}/100`}
    />
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  fromEmail: string | null | undefined
  fromName?: string | null
  onSelectEmail?: (id: number) => void
}

export default function ClientHistoryPanel({ fromEmail, fromName, onSelectEmail }: Props) {
  const [data, setData] = useState<ClientHistoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!fromEmail) { setData(null); return }
    setLoading(true)
    setData(null)
    api
      .get<ClientHistoryData>(`/emails/client-history?email=${encodeURIComponent(fromEmail)}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fromEmail])

  if (!fromEmail) return null

  if (loading) {
    return (
      <div
        style={{
          background: "#F9FAFB",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          padding: "16px",
          fontSize: "13px",
          color: "#9CA3AF",
          textAlign: "center",
        }}
      >
        Chargement de l'historique client…
      </div>
    )
  }

  if (!data || data.total_contacts === 0) {
    return (
      <div
        style={{
          background: "#F9FAFB",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          padding: "16px",
        }}
      >
        <p style={{ margin: 0, fontSize: "12px", color: "#9CA3AF", textAlign: "center" }}>
          Premier contact avec {fromName ?? fromEmail}
        </p>
      </div>
    )
  }

  const displayedTimeline = expanded ? data.timeline : data.timeline.slice(0, 4)

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid",
        borderColor: data.is_sensitive ? "#FCA5A5" : "#E5E7EB",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "14px 16px",
          background: data.is_sensitive ? "#FEF2F2" : "#F9FAFB",
          borderBottom: "1px solid",
          borderColor: data.is_sensitive ? "#FCA5A5" : "#E5E7EB",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#00205B" }}>
                {data.from_name ?? data.client_email}
              </span>
              {data.is_sensitive && (
                <span
                  style={{
                    background: "#DC2626",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: "600",
                    padding: "2px 7px",
                    borderRadius: "10px",
                    letterSpacing: "0.3px",
                  }}
                >
                  CLIENT SENSIBLE
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>{data.client_email}</p>
          </div>

          <div style={{ textAlign: "right" }}>
            <p
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: "700",
                color: "#0066CC",
                lineHeight: 1,
              }}
            >
              {data.total_contacts}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#9CA3AF" }}>
              contact{data.total_contacts > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Sensitivity reasons */}
        {data.is_sensitive && data.sensitivity_reasons.length > 0 && (
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {data.sensitivity_reasons.map((r, i) => (
              <span
                key={i}
                style={{
                  background: "#FEE2E2",
                  color: "#991B1B",
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "6px",
                }}
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          borderBottom: "1px solid #F3F4F6",
        }}
      >
        {[
          { label: "1er contact",  value: fmtDate(data.first_contact) },
          { label: "Score moy.",   value: data.avg_score !== null ? `${data.avg_score}/100` : "—" },
          { label: "Escalade(s)",  value: String(data.escalation_count) },
        ].map(({ label, value }, i) => (
          <div
            key={i}
            style={{
              padding: "10px 12px",
              borderRight: i < 2 ? "1px solid #F3F4F6" : "none",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#00205B" }}>
              {value}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#9CA3AF" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Topics ── */}
      {data.topics.length > 0 && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "11px",
              fontWeight: "600",
              color: "#6B7280",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Sujets
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {data.topics.map((t) => (
              <span
                key={t.type}
                style={{
                  background: "#EBF4FF",
                  color: "#0066CC",
                  fontSize: "11px",
                  fontWeight: "500",
                  padding: "3px 9px",
                  borderRadius: "10px",
                }}
              >
                {t.label} ({t.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Timeline ── */}
      <div style={{ padding: "12px 16px" }}>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "11px",
            fontWeight: "600",
            color: "#6B7280",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Échanges précédents
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {displayedTimeline.map((item, i) => {
            const st = STATUS_COLORS[item.status] ?? { bg: "#F3F4F6", color: "#6B7280", label: item.status }
            return (
              <div
                key={item.id}
                onClick={() => onSelectEmail?.(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 10px",
                  background: "#F9FAFB",
                  borderRadius: "8px",
                  cursor: onSelectEmail ? "pointer" : "default",
                  transition: "background 0.15s",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (onSelectEmail)
                    (e.currentTarget as HTMLElement).style.background = "#EBF4FF"
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#F9FAFB"
                }}
              >
                {/* Timeline dot */}
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: item.escalated ? "#7C3AED" : st.color,
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#374151",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.subject ?? "(sans objet)"}
                  </p>
                  <p style={{ margin: "1px 0 0", fontSize: "10px", color: "#9CA3AF" }}>
                    {fmtDate(item.received_at)}
                    {item.service_type ? ` · ${item.service_type}` : ""}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                  <ScoreDot score={item.quality_score} />
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "600",
                      padding: "2px 7px",
                      borderRadius: "6px",
                      background: st.bg,
                      color: st.color,
                    }}
                  >
                    {st.label}
                  </span>
                  {item.escalated && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "600",
                        padding: "2px 7px",
                        borderRadius: "6px",
                        background: "#F5F3FF",
                        color: "#7C3AED",
                      }}
                    >
                      ⚡ Escaladé
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {data.timeline.length > 4 && (
          <button
            onClick={() => setExpanded((p) => !p)}
            style={{
              width: "100%",
              marginTop: "8px",
              padding: "6px",
              background: "transparent",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#0066CC",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            {expanded
              ? "Réduire"
              : `Voir ${data.timeline.length - 4} échange${data.timeline.length - 4 > 1 ? "s" : ""} de plus`}
          </button>
        )}
      </div>
    </div>
  )
}
