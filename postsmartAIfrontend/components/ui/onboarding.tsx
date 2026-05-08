"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const STEPS = [
  {
    title: "👋 Bienvenue sur PostSmart IA !",
    description: "Votre assistant IA pour une relation client d'excellence. Laissez-nous vous guider en 3 étapes rapides.",
    action: "Commencer →",
    image: "📬",
  },
  {
    title: "📧 Traitez vos mails en quelques secondes",
    description: "Collez un mail client, l'IA détecte automatiquement le type de demande et génère une réponse professionnelle. Vous n'avez plus qu'à valider.",
    action: "Suivant →",
    image: "✨",
  },
  {
    title: "📞 Compte-rendu d'appel en 30 secondes",
    description: "Après un appel, dictez votre résumé directement dans le navigateur. L'IA rédige le mail post-appel complet. Aucun audio conservé — 100% RGPD.",
    action: "Suivant →",
    image: "🎤",
  },
  {
    title: "🤖 Votre assistant IA disponible 24/7",
    description: "Posez vos questions en langage naturel : procédures, délais, formulations… L'assistant puise dans la base documentaire La Poste pour vous répondre.",
    action: "Commencer à utiliser PostSmart IA 🚀",
    image: "💬",
  },
]

export default function Onboarding() {
  const [step,    setStep]    = useState(0)
  const [visible, setVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!localStorage.getItem("onboarding_done")) {
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  function finish() {
    localStorage.setItem("onboarding_done", "true")
    setVisible(false)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  if (!visible) return null

  const current = STEPS[step]

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(0,32,91,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: 40,
        maxWidth: 480, width: "90%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
        position: "relative",
        animation: "ld-slideUp 300ms ease",
      }}>
        {/* Skip */}
        <button onClick={finish} style={{
          position: "absolute", top: 16, right: 16,
          background: "none", border: "none", cursor: "pointer",
          color: "#9CA3AF", fontSize: 13, fontFamily: "inherit",
        }}>
          Passer ✕
        </button>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: "#EBF4FF", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 36, marginBottom: 20,
        }}>
          {current.image}
        </div>

        <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 700, color: "#00205B" }}>
          {current.title}
        </h2>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "#4B5563", lineHeight: 1.65 }}>
          {current.description}
        </p>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              style={{
                width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                background: i === step ? "#0066CC" : "#E5E7EB",
                transition: "all 300ms", cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={next}
          style={{
            width: "100%", height: 46, background: "#0066CC",
            border: "none", borderRadius: 10, color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
            transition: "background 150ms", fontFamily: "inherit",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#003D99" }}
          onMouseLeave={e => { e.currentTarget.style.background = "#0066CC" }}
        >
          {current.action}
        </button>

        <p style={{ margin: "12px 0 0", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
          Étape {step + 1} sur {STEPS.length}
        </p>
      </div>

      <style>{`
        @keyframes ld-slideUp {
          from { transform: translateY(30px); opacity: 0 }
          to   { transform: translateY(0);    opacity: 1 }
        }
      `}</style>
    </div>
  )
}
