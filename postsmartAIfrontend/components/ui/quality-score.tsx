"use client"

import { useEffect, useState } from "react"

interface Scores {
  clarity?: number
  empathy?: number
  compliance?: number
  overall?: number
  [key: string]: number | undefined
}

interface QualityScoreProps {
  scores: Scores
  showGlobal?: boolean
}

function scoreColor(v: number) {
  if (v >= 75) return "#059669"
  if (v >= 50) return "#D97706"
  return "#DC2626"
}

function AnimBar({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  const [cur, setCur] = useState(0)

  useEffect(() => {
    setCur(0)
    const timeout = setTimeout(() => {
      const steps = 60
      const inc = value / steps
      let step = 0
      const timer = setInterval(() => {
        step++
        setCur(prev => {
          const next = Math.min(prev + inc, value)
          return Math.round(next)
        })
        if (step >= steps) clearInterval(timer)
      }, 1200 / steps)
      return () => clearInterval(timer)
    }, delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  const color = scoreColor(value)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "#4B5563", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color, minWidth: 42, textAlign: "right", transition: "color 300ms" }}>
          {cur}<span style={{ fontSize: 11, fontWeight: 400 }}>/100</span>
        </span>
      </div>
      <div style={{ height: 8, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 99, width: `${cur}%`, background: color,
          transition: "width 50ms linear, background 300ms",
          boxShadow: cur > 0 ? `0 0 8px ${color}55` : "none",
        }} />
      </div>
    </div>
  )
}

function QualityRing({ value, color, size = 40 }: { value: number; color: string; size?: number }) {
  const [cur, setCur] = useState(0)
  const r = size / 2 - 4
  const circ = 2 * Math.PI * r

  useEffect(() => {
    setCur(0)
    const steps = 70
    const inc = value / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      setCur(prev => Math.min(prev + inc, value))
      if (step >= steps) clearInterval(timer)
    }, 1400 / steps)
    return () => clearInterval(timer)
  }, [value])

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth="3.5" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={circ}
        strokeDashoffset={circ - (circ * cur / 100)}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 50ms linear" }}
      />
    </svg>
  )
}

const METRIC_LABELS: Record<string, string> = {
  clarity:    "📝 Clarté",
  empathy:    "💙 Empathie",
  compliance: "✅ Conformité",
}

export default function QualityScore({ scores, showGlobal = true }: QualityScoreProps) {
  if (!scores || Object.keys(scores).length === 0) return null

  const overall = scores.overall ??
    Math.round(((scores.clarity ?? 0) + (scores.empathy ?? 0) + (scores.compliance ?? 0)) / 3)

  const globalColor = scoreColor(overall)
  const globalLabel = overall >= 75 ? "Excellent" : overall >= 50 ? "Correct" : "À améliorer"

  const metrics: { key: string; label: string; delay: number }[] = [
    { key: "clarity",    label: "📝 Clarté",    delay: 0   },
    { key: "empathy",    label: "💙 Empathie",   delay: 200 },
    { key: "compliance", label: "✅ Conformité", delay: 400 },
  ]

  return (
    <div style={{ background: "#F8FAFF", border: "1px solid #C7D9F5", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#00205B" }}>Score de qualité IA</span>
        {showGlobal && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: `${globalColor}18`, borderRadius: 20, padding: "4px 12px",
          }}>
            <QualityRing value={overall} color={globalColor} size={36} />
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: globalColor }}>{overall}/100</p>
              <p style={{ margin: 0, fontSize: 11, color: globalColor }}>{globalLabel}</p>
            </div>
          </div>
        )}
      </div>
      {metrics.map((m, i) =>
        scores[m.key] !== undefined ? (
          <AnimBar key={m.key} label={m.label} value={scores[m.key] as number} delay={m.delay} />
        ) : null
      )}
    </div>
  )
}
