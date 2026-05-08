"use client"

import { useMemo } from "react"
import { diffWords } from "diff"

interface MailDiffProps {
  original: string | null | undefined
  improved: string | null | undefined
  show?: boolean
}

export default function MailDiff({ original, improved, show = true }: MailDiffProps) {
  const parts = useMemo(() => {
    if (!original || !improved) return []
    return diffWords(original, improved)
  }, [original, improved])

  if (!show || !original || !improved) return null

  const addedWords   = parts.filter(p => p.added).reduce((a, p) => a + p.value.split(" ").length, 0)
  const removedWords = parts.filter(p => p.removed).reduce((a, p) => a + p.value.split(" ").length, 0)

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#00205B" }}>
          ✏️ Modifications apportées par l&apos;IA
        </span>
        <div style={{ display: "flex", gap: 12, marginLeft: "auto" }}>
          {[
            { color: "#059669", bg: "#DCFCE7", label: "Ajouté" },
            { color: "#DC2626", bg: "#FEE2E2", label: "Supprimé" },
          ].map(({ color, bg, label }) => (
            <span key={label} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, background: bg, border: `1px solid ${color}`, borderRadius: 2 }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Original */}
        <div>
          <div style={{ padding: "6px 12px", background: "#FEE2E2", borderRadius: "8px 8px 0 0", fontSize: 12, fontWeight: 600, color: "#DC2626" }}>
            ← Original
          </div>
          <div style={{ padding: 14, background: "#FFF5F5", border: "1px solid #FECACA", borderRadius: "0 0 8px 8px", fontSize: 13, lineHeight: 1.7, minHeight: 120, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {parts.map((p, i) => {
              if (p.added) return null
              return (
                <span key={i} style={p.removed ? {
                  background: "#FEE2E2", textDecoration: "line-through",
                  color: "#DC2626", borderRadius: 3, padding: "1px 2px",
                } : {}}>
                  {p.value}
                </span>
              )
            })}
          </div>
        </div>

        {/* Version IA */}
        <div>
          <div style={{ padding: "6px 12px", background: "#DCFCE7", borderRadius: "8px 8px 0 0", fontSize: 12, fontWeight: 600, color: "#059669" }}>
            ✓ Version IA
          </div>
          <div style={{ padding: 14, background: "#F0FFF4", border: "1px solid #BBF7D0", borderRadius: "0 0 8px 8px", fontSize: 13, lineHeight: 1.7, minHeight: 120, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {parts.map((p, i) => {
              if (p.removed) return null
              return (
                <span key={i} style={p.added ? {
                  background: "#DCFCE7", color: "#059669",
                  fontWeight: 500, borderRadius: 3, padding: "1px 2px",
                } : {}}>
                  {p.value}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: "#6B7280" }}>
        <span>➕ {addedWords} mot{addedWords !== 1 ? "s" : ""} ajouté{addedWords !== 1 ? "s" : ""}</span>
        <span>➖ {removedWords} mot{removedWords !== 1 ? "s" : ""} supprimé{removedWords !== 1 ? "s" : ""}</span>
      </div>
    </div>
  )
}
