"use client"

import { useEffect, useState } from "react"

interface ToneResult {
  label: string
  color: string
  bg: string
  icon: string
  score: number
  tip: string
}

function analyzeTone(text: string): ToneResult {
  const t = text.toLowerCase()
  const words = t.split(/\s+/).length

  const coldWords   = ["malheureusement","impossible","ne peut pas","refusons","interdit","non","négatif","problème","difficile","regret","désolé","indisponible"]
  const warmWords   = ["comprends","empathie","accompagner","aider","ensemble","disponible","soutenir","attention","plaisir","bienvenue","merci","vous assure","confiance"]
  const formalWords = ["madame","monsieur","veuillez","cordialement","sincèrement","nous vous prions","prendre acte","à votre disposition","suite à votre"]
  const aggrWords   = ["inadmissible","scandale","honteux","nul","catastrophe","incompétent","arnaque","inacceptable"]

  let cold   = coldWords.filter(w => t.includes(w)).length
  let warm   = warmWords.filter(w => t.includes(w)).length
  let formal = formalWords.filter(w => t.includes(w)).length
  let aggr   = aggrWords.filter(w => t.includes(w)).length

  if (words < 10) return { label: "En attente…", color: "#9CA3AF", bg: "#F9FAFB", icon: "⏳", score: 0, tip: "Continuez à rédiger pour analyser le ton." }
  if (aggr > 0)   return { label: "Trop négatif", color: "#DC2626", bg: "#FEF2F2", icon: "⚠️", score: 10, tip: "Évitez les formulations négatives — reformulez positivement." }

  const empathyScore = Math.min(100, warm * 15 + formal * 10 - cold * 8)
  const score = Math.max(5, empathyScore)

  if (score >= 75) return { label: "Empathique",    color: "#059669", bg: "#ECFDF5", icon: "🌟", score, tip: "Excellent ! Le ton est chaleureux et professionnel." }
  if (score >= 55) return { label: "Professionnel", color: "#0066CC", bg: "#EBF4FF", icon: "✅", score, tip: "Bon niveau. Ajoutez une formule d'empathie pour renforcer." }
  if (score >= 35) return { label: "Neutre",        color: "#D97706", bg: "#FFFBEB", icon: "😐", score, tip: "Ajoutez « Je comprends votre situation… » pour plus d'empathie." }
  return             { label: "Trop froid",         color: "#DC2626", bg: "#FEF2F2", icon: "❄️", score, tip: "Le ton manque d'empathie. Pensez à vous mettre à la place du client." }
}

export default function ToneGauge({ text }: { text: string }) {
  const [tone, setTone] = useState<ToneResult | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      if (text.trim().length > 20) setTone(analyzeTone(text))
      else setTone(null)
    }, 400)
    return () => clearTimeout(t)
  }, [text])

  if (!tone) return null

  return (
    <div style={{
      borderRadius: 10, border: `1px solid ${tone.color}30`,
      background: tone.bg, padding: "10px 14px",
      display: "flex", alignItems: "center", gap: 12,
      marginTop: 8, transition: "all 300ms",
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{tone.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: tone.color }}>
            Ton détecté : {tone.label}
          </span>
          {tone.score > 0 && (
            <span style={{ fontSize: 11, color: tone.color, fontWeight: 600 }}>{tone.score}/100</span>
          )}
        </div>
        {tone.score > 0 && (
          <div style={{ height: 4, background: "#E5E7EB", borderRadius: 2, marginBottom: 5 }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${tone.score}%`, background: tone.color,
              transition: "width 500ms ease",
            }} />
          </div>
        )}
        <p style={{ margin: 0, fontSize: 11, color: "#6B7280" }}>{tone.tip}</p>
      </div>
    </div>
  )
}
