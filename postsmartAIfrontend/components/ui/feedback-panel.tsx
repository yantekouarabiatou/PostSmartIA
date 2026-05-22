"use client"

import { useEffect, useState, useCallback } from "react"
import { api } from "@/lib/api"

interface Feedback {
  id: number
  rating: "positive" | "negative"
  rejection_tags: string[] | null
  correction: string | null
  created_at: string
  updated_at: string
}

const REJECTION_TAGS: { key: string; label: string }[] = [
  { key: "ton_incorrect",        label: "Ton incorrect" },
  { key: "information_manquante", label: "Info manquante" },
  { key: "hors_charte",          label: "Hors charte" },
  { key: "trop_long",            label: "Trop long" },
  { key: "trop_formel",          label: "Trop formel" },
  { key: "erreur_factuelle",     label: "Erreur factuelle" },
  { key: "autre",                label: "Autre" },
]

export default function FeedbackPanel({ emailId }: { emailId: number }) {
  const [existing, setExisting] = useState<Feedback | null>(null)
  const [rating, setRating] = useState<"positive" | "negative" | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [correction, setCorrection] = useState("")
  const [showCorrection, setShowCorrection] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api.get<Feedback | null>(`/emails/${emailId}/feedback`)
      if (data) {
        setExisting(data)
        setRating(data.rating)
        setTags(data.rejection_tags ?? [])
        setCorrection(data.correction ?? "")
        setShowCorrection(!!data.correction)
      }
    } catch {
      // no feedback yet
    } finally {
      setLoading(false)
    }
  }, [emailId])

  useEffect(() => {
    setExisting(null)
    setRating(null)
    setTags([])
    setCorrection("")
    setShowCorrection(false)
    setSaved(false)
    setLoading(true)
    load()
  }, [emailId, load])

  function toggleTag(key: string) {
    setTags(prev => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key])
    setSaved(false)
  }

  async function handleSubmit() {
    if (!rating) return
    setSaving(true)
    try {
      const payload: any = { rating }
      if (rating === "negative") {
        if (tags.length > 0) payload.rejection_tags = tags
        if (correction.trim()) payload.correction = correction.trim()
      }
      const data = await api.post<Feedback>(`/emails/${emailId}/feedback`, payload)
      setExisting(data)
      setSaved(true)
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  const isDirty =
    rating !== existing?.rating ||
    JSON.stringify(tags.sort()) !== JSON.stringify((existing?.rejection_tags ?? []).slice().sort()) ||
    correction.trim() !== (existing?.correction ?? "").trim()

  return (
    <div style={{
      margin: "0 16px 12px",
      borderRadius: 10,
      padding: "14px 16px",
      background: "#FAFAFA",
      border: "1px solid #E5E7EB",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Qualité de la réponse IA</span>
        {saved && !isDirty && (
          <span style={{ fontSize: 11, color: "#059669", fontWeight: 500, background: "#ECFDF5", padding: "2px 8px", borderRadius: 20 }}>
            ✓ Enregistré
          </span>
        )}
        {existing && !isDirty && !saved && (
          <span style={{ fontSize: 11, color: "#6B7280" }}>
            Votre avis du {new Date(existing.updated_at).toLocaleDateString("fr-FR")}
          </span>
        )}
      </div>

      {/* 👍 / 👎 buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => { setRating("positive"); setTags([]); setSaved(false) }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8, border: "2px solid",
            borderColor: rating === "positive" ? "#059669" : "#D1D5DB",
            background: rating === "positive" ? "#ECFDF5" : "#fff",
            color: rating === "positive" ? "#059669" : "#6B7280",
            fontWeight: 600, fontSize: 13, cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: 16 }}>👍</span> Bonne réponse
        </button>
        <button
          onClick={() => { setRating("negative"); setSaved(false) }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8, border: "2px solid",
            borderColor: rating === "negative" ? "#DC2626" : "#D1D5DB",
            background: rating === "negative" ? "#FEF2F2" : "#fff",
            color: rating === "negative" ? "#DC2626" : "#6B7280",
            fontWeight: 600, fontSize: 13, cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: 16 }}>👎</span> À améliorer
        </button>
      </div>

      {/* Rejection tags (only when negative) */}
      {rating === "negative" && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6B7280" }}>Pourquoi cette réponse est-elle insuffisante ?</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {REJECTION_TAGS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleTag(key)}
                style={{
                  padding: "4px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                  border: "1px solid",
                  borderColor: tags.includes(key) ? "#7C3AED" : "#D1D5DB",
                  background: tags.includes(key) ? "#EDE9FE" : "#fff",
                  color: tags.includes(key) ? "#7C3AED" : "#6B7280",
                  fontWeight: tags.includes(key) ? 600 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Correction toggle & textarea */}
      {rating === "negative" && (
        <div style={{ marginBottom: 10 }}>
          <button
            onClick={() => setShowCorrection(v => !v)}
            style={{
              fontSize: 12, color: "#0066CC", background: "none", border: "none",
              cursor: "pointer", padding: 0, textDecoration: "underline",
            }}
          >
            {showCorrection ? "Masquer" : "Proposer une correction"}
          </button>
          {showCorrection && (
            <textarea
              value={correction}
              onChange={e => { setCorrection(e.target.value); setSaved(false) }}
              rows={4}
              placeholder="Décrivez ce que la réponse aurait dû contenir ou corriger…"
              style={{
                marginTop: 8, width: "100%", padding: "8px 10px",
                borderRadius: 8, border: "1px solid #D1D5DB",
                fontSize: 13, lineHeight: 1.5, resize: "vertical",
                boxSizing: "border-box", fontFamily: "inherit",
              }}
            />
          )}
        </div>
      )}

      {/* Submit */}
      {rating && isDirty && (
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            padding: "8px 18px", borderRadius: 8, border: "none",
            background: "#0066CC", color: "#fff", fontWeight: 600,
            fontSize: 13, cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Enregistrement…" : existing ? "Mettre à jour l'avis" : "Envoyer l'avis"}
        </button>
      )}
    </div>
  )
}
