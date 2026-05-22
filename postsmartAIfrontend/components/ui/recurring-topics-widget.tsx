"use client"

import { useEffect, useState, useCallback } from "react"
import { api } from "@/lib/api"

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServiceTopic {
  type: string
  label: string
  color: string
  current: number
  prev: number
  trend: number
}

interface WordCloudItem {
  word: string
  count: number
  weight: number
}

interface RecurringTopicsData {
  period: string
  current_range: [string, string]
  prev_range: [string, string]
  services: ServiceTopic[]
  word_cloud: WordCloudItem[]
  alerts: Array<{ type: string; label: string; count: number; percent: number }>
  timeline: Array<{ label: string; count: number }>
  total_current: number
}

type Period = "week" | "month" | "quarter"

const PERIOD_LABELS: Record<Period, string> = {
  week: "Cette semaine",
  month: "Ce mois",
  quarter: "Ce trimestre",
}

// ── WordCloud ─────────────────────────────────────────────────────────────────

function WordCloud({ words }: { words: WordCloudItem[] }) {
  if (!words.length)
    return (
      <div style={{ textAlign: "center", padding: "32px", color: "#9CA3AF", fontSize: "13px" }}>
        Aucun sujet détecté pour cette période
      </div>
    )

  const maxCount = Math.max(...words.map((w) => w.count), 1)

  function fontSize(weight: number) {
    if (weight >= 80) return "22px"
    if (weight >= 60) return "17px"
    if (weight >= 40) return "14px"
    if (weight >= 20) return "12px"
    return "11px"
  }

  function fontColor(weight: number) {
    if (weight >= 80) return "#00205B"
    if (weight >= 60) return "#0066CC"
    if (weight >= 40) return "#374151"
    return "#9CA3AF"
  }

  function bgColor(weight: number) {
    if (weight >= 80) return "#DBEAFE"
    if (weight >= 60) return "#EBF4FF"
    if (weight >= 40) return "#F3F4F6"
    return "#F9FAFB"
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 0",
        minHeight: "100px",
      }}
    >
      {words.map((w) => (
        <span
          key={w.word}
          title={`${w.word} — ${w.count} occurrence${w.count > 1 ? "s" : ""}`}
          style={{
            fontSize: fontSize(w.weight),
            color: fontColor(w.weight),
            background: bgColor(w.weight),
            padding: "3px 10px",
            borderRadius: "20px",
            fontWeight: w.weight >= 60 ? "600" : "400",
            cursor: "default",
            transition: "transform 0.15s",
            display: "inline-block",
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.transform = "scale(1.08)")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.transform = "scale(1)")}
        >
          {w.word}
        </span>
      ))}
    </div>
  )
}

// ── MiniTimeline ──────────────────────────────────────────────────────────────

function MiniTimeline({ timeline }: { timeline: Array<{ label: string; count: number }> }) {
  const max = Math.max(...timeline.map((t) => t.count), 1)
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "48px" }}>
      {timeline.map((t, i) => (
        <div
          key={i}
          title={`${t.label} : ${t.count} mail${t.count > 1 ? "s" : ""}`}
          style={{
            flex: 1,
            background: "#0066CC",
            opacity: 0.15 + (t.count / max) * 0.85,
            borderRadius: "3px 3px 0 0",
            height: `${Math.max(4, (t.count / max) * 100)}%`,
            cursor: "default",
            transition: "opacity 0.2s",
          }}
        />
      ))}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function RecurringTopicsWidget() {
  const [data, setData] = useState<RecurringTopicsData | null>(null)
  const [period, setPeriod] = useState<Period>("month")
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<"cloud" | "chart">("chart")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<RecurringTopicsData>(
        `/dashboard/recurring-topics?period=${period}&compare=true`
      )
      setData(res)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        padding: "24px",
        marginBottom: "24px",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#00205B" }}>
            📊 Sujets récurrents
          </h3>
          {data && (
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#9CA3AF" }}>
              {data.total_current} mail{data.total_current > 1 ? "s" : ""} —{" "}
              {data.current_range[0]} → {data.current_range[1]}
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Period selector */}
          <div style={{ display: "flex", gap: "4px" }}>
            {(["week", "month", "quarter"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "500",
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: period === p ? "#0066CC" : "#E5E7EB",
                  background: period === p ? "#0066CC" : "#fff",
                  color: period === p ? "#fff" : "#6B7280",
                  transition: "all 0.15s",
                }}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div
            style={{
              display: "flex",
              background: "#F3F4F6",
              borderRadius: "8px",
              padding: "2px",
            }}
          >
            {(["chart", "cloud"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "500",
                  cursor: "pointer",
                  border: "none",
                  background: tab === t ? "#fff" : "transparent",
                  color: tab === t ? "#00205B" : "#9CA3AF",
                  boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {t === "chart" ? "Barres" : "Nuage"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {data?.alerts && data.alerts.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "16px",
          }}
        >
          {data.alerts.map((a, i) => (
            <div
              key={i}
              style={{
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12px",
                color: "#92400E",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "14px" }}>⚠️</span>
              <strong>{a.label}</strong> représente {a.percent}% du volume ({a.count} mails)
            </div>
          ))}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px", color: "#9CA3AF", fontSize: "13px" }}>
          Chargement…
        </div>
      )}

      {/* ── Content ── */}
      {!loading && data && (
        <>
          {tab === "cloud" ? (
            <WordCloud words={data.word_cloud} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.services.map((s) => {
                const maxVal = Math.max(...data.services.map((x) => x.current), 1)
                const barW = Math.max(2, (s.current / maxVal) * 100)
                const prevBarW = Math.max(2, (s.prev / maxVal) * 100)
                return (
                  <div key={s.type}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "5px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: s.color,
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: "13px", fontWeight: "500", color: "#374151" }}>
                          {s.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#00205B" }}>
                          {s.current}
                        </span>
                        {s.trend !== 0 && (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              color: s.trend > 0 ? "#059669" : "#DC2626",
                              background: s.trend > 0 ? "#ECFDF5" : "#FEF2F2",
                              padding: "1px 6px",
                              borderRadius: "6px",
                            }}
                          >
                            {s.trend > 0 ? "+" : ""}
                            {s.trend}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Current period bar */}
                    <div
                      style={{
                        height: "8px",
                        background: "#F3F4F6",
                        borderRadius: "4px",
                        overflow: "hidden",
                        marginBottom: "3px",
                      }}
                    >
                      <div
                        style={{
                          width: `${barW}%`,
                          height: "100%",
                          background: s.color,
                          borderRadius: "4px",
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>

                    {/* Previous period bar */}
                    {s.prev > 0 && (
                      <div
                        style={{
                          height: "4px",
                          background: "#F3F4F6",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${prevBarW}%`,
                            height: "100%",
                            background: s.color,
                            opacity: 0.35,
                            borderRadius: "4px",
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Legend */}
              {data.services.some((s) => s.prev > 0) && (
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    marginTop: "6px",
                    fontSize: "11px",
                    color: "#9CA3AF",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div
                      style={{
                        width: "16px",
                        height: "6px",
                        background: "#0066CC",
                        borderRadius: "3px",
                      }}
                    />
                    Période actuelle
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div
                      style={{
                        width: "16px",
                        height: "4px",
                        background: "#0066CC",
                        opacity: 0.35,
                        borderRadius: "3px",
                      }}
                    />
                    Période précédente
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Mini timeline ── */}
          {data.timeline.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#6B7280",
                }}
              >
                Volume de mails reçus
              </p>
              <MiniTimeline timeline={data.timeline} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "4px",
                  fontSize: "10px",
                  color: "#9CA3AF",
                }}
              >
                <span>{data.timeline[0]?.label}</span>
                <span>{data.timeline[data.timeline.length - 1]?.label}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
