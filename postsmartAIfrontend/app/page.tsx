"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Mail, Phone, Bot, Check, Star, Sparkles,
  ArrowRight, ChevronDown, Mic, Shield, Zap, Users,
} from "lucide-react"

// ── Intersection hook ─────────────────────────────────────────────────────────

function useVisible(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref])
  return visible
}

// ── Animated counter ──────────────────────────────────────────────────────────

function Counter({ end, suffix = "", active }: { end: number; suffix?: string; active: boolean }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    let step = 0
    const steps = 55
    const t = setInterval(() => {
      step++
      setVal(Math.round((end / steps) * Math.min(step, steps)))
      if (step >= steps) clearInterval(t)
    }, 1600 / steps)
    return () => clearInterval(t)
  }, [active, end])
  return <>{val.toLocaleString("fr-FR")}{suffix}</>
}

// ── Dashboard mock (hero) ─────────────────────────────────────────────────────

function DashboardMock() {
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 900); return () => clearTimeout(t) }, [])

  return (
    <div style={{
      background: "#fff", borderRadius: 20, overflow: "hidden", width: 380, flexShrink: 0,
      boxShadow: "0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)",
      animation: "mock-float 6s ease-in-out infinite",
    }}>
      {/* Title bar */}
      <div style={{ background: "#00205B", padding: "11px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#FF5F57","#FEBC2E","#28C840"].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <span style={{ flex: 1, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "Inter, sans-serif" }}>
          PostSmart IA — Mails entrants
        </span>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: "#FFCC00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#00205B" }}>IA</div>
      </div>

      {/* Mail item */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #F0F0F0", background: "#EBF4FF" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#0066CC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>JP</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Jean Petit</span>
              <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "Inter, sans-serif" }}>Il y a 2 min</span>
            </div>
            <div style={{ fontSize: 11.5, color: "#374151", fontFamily: "Inter, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Suivi colis n° 1Z999AA10123456784
            </div>
            <div style={{ fontSize: 10, color: "#6B7280", fontFamily: "Inter, sans-serif", marginTop: 2 }}>
              Mon colis commandé le 3 mai n'est toujours pas…
            </div>
          </div>
        </div>
      </div>

      {/* AI panel */}
      <div style={{ padding: 14, background: "#F8FAFF", opacity: ready ? 1 : 0, transition: "opacity 0.7s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: "#FFCC00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#00205B" }}>IA</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#00205B", fontFamily: "Inter, sans-serif" }}>Réponse générée — Suivi colis</span>
          <span style={{ marginLeft: "auto", fontSize: 10, padding: "1px 7px", borderRadius: 20, background: "#DCFCE7", color: "#059669", fontWeight: 600, fontFamily: "Inter, sans-serif" }}>96/100</span>
        </div>
        {[
          { label: "Clarté",     value: 94, color: "#0066CC" },
          { label: "Empathie",   value: 88, color: "#0891B2" },
          { label: "Conformité", value: 96, color: "#059669" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2, fontFamily: "Inter, sans-serif" }}>
              <span style={{ color: "#6B7280" }}>{label}</span>
              <span style={{ fontWeight: 700, color }}>{value}/100</span>
            </div>
            <div style={{ height: 4, background: "#E5E7EB", borderRadius: 99 }}>
              <div style={{ height: "100%", width: ready ? `${value}%` : "0%", background: color, borderRadius: 99, transition: "width 1.2s ease" }} />
            </div>
          </div>
        ))}
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "8px 10px", margin: "10px 0" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 3, fontFamily: "Inter, sans-serif" }}>✉ Réponse proposée</div>
          <p style={{ margin: 0, fontSize: 11, color: "#374151", lineHeight: 1.6, fontFamily: "Inter, sans-serif" }}>
            Monsieur Petit, je comprends votre inquiétude concernant votre colis. Suite à vérification, il est actuellement en transit…
          </p>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <div style={{ flex: 1, textAlign: "center", padding: "7px", background: "#059669", borderRadius: 8, fontSize: 11, fontWeight: 600, color: "#fff", fontFamily: "Inter, sans-serif", cursor: "pointer" }}>✓ Valider</div>
          <div style={{ flex: 1, textAlign: "center", padding: "7px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11, color: "#374151", fontFamily: "Inter, sans-serif", cursor: "pointer" }}>✏ Modifier</div>
          <div style={{ padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11, fontFamily: "Inter, sans-serif", cursor: "pointer" }}>📄</div>
        </div>
      </div>
    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { end: 2400, suffix: "+", label: "Conseillers actifs" },
  { end: 18000, suffix: "",  label: "Emails traités / jour" },
  { end: 65,   suffix: "%", label: "Temps de réponse réduit", prefix: "−" },
  { end: 98,   suffix: "%", label: "Conformité charte La Poste" },
]

const STEPS = [
  {
    n: "01", icon: <Mail size={22} color="#0066CC" />, color: "#EBF4FF", border: "#BFDBFE",
    title: "Mail entrant détecté",
    desc: "L'IA analyse instantanément le contenu, détecte le type de demande, le niveau d'urgence et génère une réponse professionnelle prête à valider.",
    tag: "Traitement en < 3 sec",
  },
  {
    n: "02", icon: <Mic size={22} color="#7C3AED" />, color: "#F5F3FF", border: "#DDD6FE",
    title: "Appel terminé — résumé dicté",
    desc: "Après l'appel, dictez librement votre résumé dans le navigateur. L'IA structure le compte-rendu et génère le mail post-appel. Aucun audio conservé.",
    tag: "100% RGPD · 0 stockage audio",
  },
  {
    n: "03", icon: <Bot size={22} color="#059669" />, color: "#F0FDF4", border: "#BBF7D0",
    title: "Question → Réponse immédiate",
    desc: "Posez vos questions en langage naturel. L'assistant puise dans la base documentaire La Poste pour vous répondre avec précision en quelques secondes.",
    tag: "Disponible 24/7",
  },
]

const FEATURES = [
  {
    icon: <Mail size={26} color="#0066CC" />, bg: "#EBF4FF",
    title: "Traitement des mails entrants",
    desc: "Analysez, catégorisez et répondez aux mails clients avec une précision inégalée.",
    bullets: [
      "Détection automatique du type de demande (suivi colis, réclamation, handicap…)",
      "Génération de réponse personnalisée en 1 clic",
      "Score qualité : clarté, empathie, conformité charte",
    ],
  },
  {
    icon: <Mic size={26} color="#7C3AED" />, bg: "#F5F3FF",
    title: "Compte-rendu d'appel",
    desc: "Transformez vos notes d'appel vocales en comptes-rendus structurés et mails clients prêts à envoyer.",
    bullets: [
      "Dictée vocale directement dans le navigateur",
      "Structuration automatique : résumé, engagements, prochaines étapes",
      "Mail post-appel généré en 30 secondes",
    ],
  },
  {
    icon: <Bot size={26} color="#059669" />, bg: "#F0FDF4",
    title: "Assistant documentaire IA",
    desc: "Un copilote intelligent disponible 24/7 pour toutes vos questions procédurales.",
    bullets: [
      "Base de connaissances La Poste intégrée",
      "Réponses contextuelles en langage naturel",
      "Suggestions de formulations adaptées à chaque situation",
    ],
  },
]

const TESTIMONIALS = [
  {
    initials: "SM", bg: "#0066CC", name: "Sophie M.", role: "Conseillère · Paris 15e",
    quote: "PostSmart IA m'a changé la vie. Je traite mes mails deux fois plus vite et mes réponses sont bien plus professionnelles. Mes clients le remarquent.",
  },
  {
    initials: "KB", bg: "#7C3AED", name: "Karim B.", role: "Manager d'équipe · Lyon",
    quote: "L'outil est indispensable pour notre équipe. Les comptes-rendus d'appel sont impeccables et notre direction est ravie de la qualité de service.",
  },
  {
    initials: "IT", bg: "#059669", name: "Isabelle T.", role: "Conseillère · Bordeaux",
    quote: "L'assistant IA connaît toutes les procédures La Poste par cœur. Je gagne un temps fou et je n'ai plus peur de me tromper de formulation.",
  },
]

const TECH = [
  { label: "Gemini AI",  sub: "Google DeepMind",  color: "#4285F4", emoji: "🧠" },
  { label: "Groq",       sub: "Ultra-fast LLM",   color: "#F06292", emoji: "⚡" },
  { label: "Laravel 12", sub: "API Backend",      color: "#FF2D20", emoji: "🔧" },
  { label: "Next.js 16", sub: "Frontend",         color: "#000",    emoji: "▲"  },
]

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ld { font-family: 'Inter', sans-serif; color: #1A1A2E; }

  /* ══ NAVBAR ══ */
  .ld-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 500;
    height: 64px; display: flex; align-items: center;
    padding: 0 2rem; transition: all 0.3s;
  }
  .ld-nav.scrolled {
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(12px);
    box-shadow: 0 1px 20px rgba(0,0,0,0.08);
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }
  .ld-nav-in {
    width: 100%; max-width: 1180px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  }
  .ld-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .ld-logo-badge {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #FFCC00, #FFB300);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 3px 10px rgba(255,204,0,0.35);
  }
  .ld-logo-name { font-size: 17px; font-weight: 800; letter-spacing: -0.02em; }
  .ld-logo-name .w { color: #fff; }
  .ld-logo-name .b { color: #00205B; }
  .ld-logo-name .y { color: #FFCC00; }
  .scrolled .ld-logo-name .w { color: #00205B; }
  .ld-nav-links { display: flex; gap: 4px; align-items: center; }
  @media (max-width: 640px) { .ld-nav-links { display: none; } }
  .ld-nav-link {
    font-size: 14px; font-weight: 500;
    color: rgba(255,255,255,0.75); background: none; border: none;
    cursor: pointer; padding: 6px 12px; border-radius: 8px;
    font-family: 'Inter', sans-serif; transition: all 0.15s;
    text-decoration: none;
  }
  .ld-nav-link:hover { color: #fff; background: rgba(255,255,255,0.1); }
  .scrolled .ld-nav-link { color: #4B5563; }
  .scrolled .ld-nav-link:hover { color: #0066CC; background: #EBF4FF; }
  .ld-nav-cta {
    background: #FFCC00; color: #00205B; border: none; border-radius: 10px;
    padding: 9px 20px; font-size: 14px; font-weight: 700;
    cursor: pointer; font-family: 'Inter', sans-serif;
    transition: all 0.18s; text-decoration: none;
    display: inline-flex; align-items: center; gap: 6px;
    box-shadow: 0 3px 12px rgba(255,204,0,0.35);
    flex-shrink: 0;
  }
  .ld-nav-cta:hover { background: #FFB300; transform: translateY(-1px); box-shadow: 0 5px 16px rgba(255,204,0,0.45); }

  /* ══ HERO ══ */
  .ld-hero {
    min-height: 100vh; position: relative;
    background: #02091A; overflow: hidden;
    display: flex; align-items: center;
  }
  .ld-hero-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 28px 28px;
  }
  .ld-hero-orb {
    position: absolute; border-radius: 50%; pointer-events: none; filter: blur(55px);
  }
  .ld-orb-a { width: 520px; height: 520px; background: radial-gradient(circle, rgba(0,102,204,0.32) 0%, transparent 70%); top: -120px; right: 5%; animation: orb-a 18s ease-in-out infinite; }
  .ld-orb-b { width: 380px; height: 380px; background: radial-gradient(circle, rgba(255,204,0,0.11) 0%, transparent 70%); bottom: -80px; left: 8%; animation: orb-a 22s ease-in-out infinite reverse; }
  .ld-orb-c { width: 260px; height: 260px; background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%); top: 40%; left: 20%; animation: orb-a 14s ease-in-out 4s infinite; }
  @keyframes orb-a {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(25px,-20px) scale(1.06); }
    66%      { transform: translate(-15px,18px) scale(0.96); }
  }
  .ld-hero-in {
    position: relative; z-index: 2;
    width: 100%; max-width: 1180px; margin: 0 auto;
    padding: 100px 2rem 80px;
    display: flex; align-items: center; gap: 60px;
  }
  @media (max-width: 900px) { .ld-hero-in { flex-direction: column; text-align: center; padding: 110px 1.5rem 60px; } }

  .ld-hero-left { flex: 1; min-width: 0; }
  .ld-hero-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,204,0,0.1); border: 1px solid rgba(255,204,0,0.28);
    border-radius: 20px; padding: 5px 14px;
    font-size: 12px; font-weight: 600; color: #FFCC00; margin-bottom: 1.5rem;
    animation: fade-up 0.6s ease both;
  }
  .ld-hero-h1 {
    font-size: 54px; font-weight: 900; color: #fff;
    line-height: 1.12; letter-spacing: -0.04em; margin-bottom: 1.25rem;
    animation: fade-up 0.6s 0.1s ease both;
  }
  @media (max-width: 640px) { .ld-hero-h1 { font-size: 36px; } }
  @media (max-width: 900px) { .ld-hero-h1 { font-size: 42px; } }
  .ld-hero-grad {
    background: linear-gradient(135deg, #60a5fa 0%, #FFCC00 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .ld-hero-sub {
    font-size: 17px; color: rgba(255,255,255,0.55); line-height: 1.75;
    max-width: 490px; margin-bottom: 2.25rem;
    animation: fade-up 0.6s 0.2s ease both;
  }
  @media (max-width: 900px) { .ld-hero-sub { margin: 0 auto 2rem; } }
  .ld-hero-ctas {
    display: flex; gap: 12px; flex-wrap: wrap;
    animation: fade-up 0.6s 0.3s ease both;
  }
  @media (max-width: 900px) { .ld-hero-ctas { justify-content: center; } }
  .ld-btn-primary {
    background: linear-gradient(135deg, #FFCC00, #FFB300); color: #00205B;
    border: none; border-radius: 12px; padding: 14px 26px;
    font-size: 15px; font-weight: 700; cursor: pointer;
    font-family: 'Inter', sans-serif; text-decoration: none;
    display: inline-flex; align-items: center; gap: 8px;
    box-shadow: 0 6px 20px rgba(255,204,0,0.35); transition: all 0.2s;
  }
  .ld-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,204,0,0.45); }
  .ld-btn-secondary {
    background: transparent; color: rgba(255,255,255,0.85);
    border: 1.5px solid rgba(255,255,255,0.25); border-radius: 12px;
    padding: 14px 26px; font-size: 15px; font-weight: 500;
    cursor: pointer; font-family: 'Inter', sans-serif;
    text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
    transition: all 0.2s;
  }
  .ld-btn-secondary:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.5); }
  .ld-hero-trust {
    display: flex; align-items: center; gap: 16px; margin-top: 1.75rem; flex-wrap: wrap;
    animation: fade-up 0.6s 0.4s ease both;
  }
  @media (max-width: 900px) { .ld-hero-trust { justify-content: center; } }
  .ld-trust-dot { width: 5px; height: 5px; border-radius: 50%; background: #34D399; box-shadow: 0 0 6px rgba(52,211,153,0.7); flex-shrink: 0; }
  .ld-trust-text { font-size: 12.5px; color: rgba(255,255,255,0.4); }
  .ld-trust-sep { color: rgba(255,255,255,0.15); font-size: 13px; }

  .ld-hero-right {
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    animation: fade-up 0.7s 0.2s ease both;
  }
  @media (max-width: 900px) { .ld-hero-right { width: 100%; max-width: 380px; margin: 0 auto; } }

  @keyframes mock-float {
    0%,100% { transform: translateY(0) rotate(0.5deg); }
    50%      { transform: translateY(-14px) rotate(-0.5deg); }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Scroll arrow */
  .ld-scroll {
    position: absolute; bottom: 2rem; left: 50%;
    transform: translateX(-50%); z-index: 2;
    color: rgba(255,255,255,0.35); display: flex;
    flex-direction: column; align-items: center; gap: 4px;
    font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
    animation: bounce 2.5s ease-in-out infinite;
  }
  @keyframes bounce { 0%,100% { transform: translate(-50%,0); } 50% { transform: translate(-50%,-8px); } }

  /* ══ PARTNERS ══ */
  .ld-partners {
    background: #fff; padding: 32px 2rem;
    border-bottom: 1px solid #F0F2F5;
  }
  .ld-partners-in {
    max-width: 900px; margin: 0 auto;
    display: flex; align-items: center; gap: 0; flex-wrap: wrap;
    justify-content: center;
  }
  .ld-partner-label { font-size: 12px; color: #B0B8C4; font-weight: 500; margin-right: 24px; white-space: nowrap; }
  .ld-partner-badges { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
  .ld-partner-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 6px 14px; border-radius: 20px;
    border: 1px solid #E5E7EB; background: #F9FAFB;
    font-size: 12px; font-weight: 600; color: #374151;
    transition: all 0.2s;
  }
  .ld-partner-badge:hover { border-color: #0066CC; background: #EBF4FF; color: #0066CC; }

  /* ══ STATS ══ */
  .ld-stats { background: #00205B; padding: 72px 2rem; }
  .ld-stats-in {
    max-width: 1000px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(2,1fr); gap: 2.5rem 2rem;
  }
  @media (min-width: 768px) { .ld-stats-in { grid-template-columns: repeat(4,1fr); } }
  .ld-stat { text-align: center; }
  .ld-stat-val { font-size: 44px; font-weight: 900; color: #fff; line-height: 1; letter-spacing: -0.04em; margin-bottom: 6px; }
  .ld-stat-val .acc { color: #FFCC00; }
  .ld-stat-lbl { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.45; }

  /* ══ HOW IT WORKS ══ */
  .ld-hiw { background: #F4F7FF; padding: 100px 2rem; }
  .ld-hiw-in { max-width: 1100px; margin: 0 auto; }
  .ld-section-tag {
    display: inline-block; font-size: 12px; font-weight: 700;
    color: #0066CC; background: #EBF4FF; border-radius: 20px;
    padding: 4px 14px; margin-bottom: 1rem; letter-spacing: 0.05em; text-transform: uppercase;
  }
  .ld-section-h2 {
    font-size: 36px; font-weight: 800; color: #00205B;
    letter-spacing: -0.03em; margin-bottom: 0.75rem;
  }
  @media (max-width: 640px) { .ld-section-h2 { font-size: 26px; } }
  .ld-section-sub { font-size: 16px; color: #6B7280; line-height: 1.65; max-width: 480px; margin-bottom: 3.5rem; }
  .ld-steps { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
  @media (min-width: 900px) { .ld-steps { grid-template-columns: repeat(3,1fr); } }
  .ld-step {
    background: #fff; border-radius: 20px; padding: 28px;
    border: 1px solid #E5E7EB; position: relative;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
  }
  .ld-step:hover { border-color: #0066CC; box-shadow: 0 12px 36px rgba(0,102,204,0.1); transform: translateY(-4px); }
  .ld-step-n {
    font-size: 52px; font-weight: 900; color: #E5E7EB;
    letter-spacing: -0.04em; line-height: 1; margin-bottom: 12px;
    font-variant-numeric: tabular-nums;
  }
  .ld-step:hover .ld-step-n { color: rgba(0,102,204,0.15); }
  .ld-step-icon {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 14px;
  }
  .ld-step-title { font-size: 17px; font-weight: 700; color: #00205B; margin-bottom: 8px; }
  .ld-step-desc { font-size: 14px; color: #6B7280; line-height: 1.65; margin-bottom: 14px; }
  .ld-step-tag {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600;
    padding: 3px 10px; border-radius: 20px;
    border: 1px solid; opacity: 0.8;
  }

  /* ══ FEATURES ══ */
  .ld-feats { background: #fff; padding: 100px 2rem; }
  .ld-feats-grid {
    max-width: 1100px; margin: 0 auto;
    display: grid; gap: 1.5rem; grid-template-columns: 1fr;
  }
  @media (min-width: 768px) { .ld-feats-grid { grid-template-columns: repeat(3,1fr); } }
  .ld-feat-card {
    border: 1.5px solid #E5E7EB; border-radius: 20px; padding: 2rem;
    transition: all 0.25s; position: relative; overflow: hidden;
  }
  .ld-feat-card::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent 60%, rgba(0,102,204,0.03) 100%);
    pointer-events: none; opacity: 0; transition: opacity 0.3s;
  }
  .ld-feat-card:hover { border-color: #0066CC; transform: translateY(-5px); box-shadow: 0 16px 40px rgba(0,102,204,0.12); }
  .ld-feat-card:hover::after { opacity: 1; }
  .ld-feat-ico {
    width: 56px; height: 56px; border-radius: 16px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;
  }
  .ld-feat-title { font-size: 18px; font-weight: 700; color: #00205B; margin-bottom: 8px; }
  .ld-feat-desc { font-size: 14px; color: #6B7280; line-height: 1.65; margin-bottom: 1.25rem; }
  .ld-feat-bullets { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .ld-feat-bullet { display: flex; gap: 9px; align-items: flex-start; font-size: 13.5px; color: #374151; line-height: 1.5; }

  /* ══ TECH ══ */
  .ld-tech { background: #F4F7FF; padding: 72px 2rem; }
  .ld-tech-in { max-width: 900px; margin: 0 auto; text-align: center; }
  .ld-tech-lbl { font-size: 13px; color: #9CA3AF; font-weight: 500; margin-bottom: 1.75rem; letter-spacing: 0.04em; text-transform: uppercase; }
  .ld-tech-badges { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .ld-tech-badge {
    display: flex; align-items: center; gap: 8px;
    background: #fff; border: 1.5px solid #E5E7EB; border-radius: 14px;
    padding: 10px 18px; font-size: 13px; font-weight: 600;
    transition: all 0.2s; cursor: default;
  }
  .ld-tech-badge:hover { border-color: #0066CC; box-shadow: 0 4px 16px rgba(0,102,204,0.1); transform: translateY(-2px); }
  .ld-tech-emoji { font-size: 18px; }
  .ld-tech-name { color: #1A1A2E; }
  .ld-tech-sub { font-size: 11px; color: #9CA3AF; font-weight: 400; }

  /* ══ TESTIMONIALS ══ */
  .ld-testis { background: #fff; padding: 100px 2rem; }
  .ld-testi-grid {
    max-width: 1100px; margin: 0 auto;
    display: grid; gap: 1.5rem; grid-template-columns: 1fr;
  }
  @media (min-width: 768px) { .ld-testi-grid { grid-template-columns: repeat(3,1fr); } }
  .ld-testi-card {
    border: 1px solid #E5E7EB; border-radius: 20px; padding: 1.75rem;
    transition: box-shadow 0.25s, transform 0.25s; position: relative;
  }
  .ld-testi-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.08); transform: translateY(-3px); }
  .ld-testi-quote {
    font-size: 15px; color: #374151; line-height: 1.75;
    margin-bottom: 1.5rem; position: relative;
    padding-top: 1.5rem;
  }
  .ld-testi-quote::before {
    content: '"'; position: absolute; top: -8px; left: -4px;
    font-size: 80px; color: #EBF4FF; font-family: Georgia, serif;
    line-height: 1; z-index: 0;
  }
  .ld-testi-body { position: relative; z-index: 1; }
  .ld-testi-footer { display: flex; align-items: center; gap: 12px; }
  .ld-testi-av {
    width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .ld-testi-name { font-size: 14px; font-weight: 700; color: #1A1A2E; }
  .ld-testi-role { font-size: 12px; color: #9CA3AF; }
  .ld-stars { display: flex; gap: 2px; margin-bottom: 12px; }

  /* ══ CTA ══ */
  .ld-cta {
    background: #02091A; padding: 100px 2rem;
    text-align: center; position: relative; overflow: hidden;
  }
  .ld-cta-orb {
    position: absolute; border-radius: 50%; pointer-events: none;
    width: 500px; height: 500px; filter: blur(60px);
    background: radial-gradient(circle, rgba(0,102,204,0.3) 0%, transparent 70%);
    top: -100px; left: 50%; transform: translateX(-50%);
  }
  .ld-cta-in { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; }
  .ld-cta-h2 {
    font-size: 42px; font-weight: 900; color: #fff;
    letter-spacing: -0.04em; line-height: 1.18; margin-bottom: 1rem;
  }
  @media (max-width: 640px) { .ld-cta-h2 { font-size: 30px; } }
  .ld-cta-sub { font-size: 16px; color: rgba(255,255,255,0.5); line-height: 1.65; margin-bottom: 2.5rem; }
  .ld-cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  /* ══ FOOTER ══ */
  .ld-footer { background: #010B1A; padding: 44px 2rem; border-top: 1px solid rgba(255,255,255,0.05); }
  .ld-footer-in {
    max-width: 1100px; margin: 0 auto;
    display: flex; flex-wrap: wrap; align-items: center;
    justify-content: space-between; gap: 1.25rem;
  }
  .ld-footer-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; }
  .ld-footer-badge {
    width: 28px; height: 28px; border-radius: 8px;
    background: rgba(255,204,0,0.85); display: flex; align-items: center; justify-content: center;
  }
  .ld-footer-name { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.55); }
  .ld-footer-name .y { color: #FFCC00; }
  .ld-footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .ld-footer-link {
    font-size: 12px; color: rgba(255,255,255,0.38);
    text-decoration: none; background: none; border: none;
    cursor: pointer; font-family: 'Inter', sans-serif; transition: color 0.15s;
  }
  .ld-footer-link:hover { color: rgba(255,255,255,0.7); }
  .ld-footer-copy { font-size: 12px; color: rgba(255,255,255,0.22); }
`

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const statsRef = useRef<HTMLElement>(null)
  const statsVisible = useVisible(statsRef)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ld">

        {/* ══ NAVBAR ══ */}
        <nav className={`ld-nav${scrolled ? " scrolled" : ""}`}>
          <div className="ld-nav-in">
            <Link href="/" className="ld-logo">
              <div className="ld-logo-badge">
                <Mail size={18} color="#00205B" strokeWidth={2.5} />
              </div>
              <div className="ld-logo-name">
                <span className={scrolled ? "b" : "w"}>Post</span>
                <span className="y">Smart</span>
                <span className={scrolled ? "b" : "w"}> IA</span>
              </div>
            </Link>

            <div className="ld-nav-links">
              <button className="ld-nav-link" onClick={() => scrollTo("hiw")}>Comment ça marche</button>
              <button className="ld-nav-link" onClick={() => scrollTo("feats")}>Fonctionnalités</button>
              <button className="ld-nav-link" onClick={() => scrollTo("testis")}>Témoignages</button>
            </div>

            <Link href="/login" className="ld-nav-cta">
              Se connecter <ArrowRight size={14} />
            </Link>
          </div>
        </nav>

        {/* ══ HERO ══ */}
        <section className="ld-hero">
          <div className="ld-hero-grid" />
          <div className="ld-hero-orb ld-orb-a" />
          <div className="ld-hero-orb ld-orb-b" />
          <div className="ld-hero-orb ld-orb-c" />

          <div className="ld-hero-in">
            {/* Left */}
            <div className="ld-hero-left">
              <div className="ld-hero-tag">
                <Sparkles size={11} /> Hackathon La Poste × EY × Microsoft
              </div>
              <h1 className="ld-hero-h1">
                L'IA qui transforme<br />
                <span className="ld-hero-grad">votre relation client.</span>
              </h1>
              <p className="ld-hero-sub">
                Analysez les mails entrants, rédigez vos comptes-rendus d'appel en 30 secondes
                et accédez aux procédures La Poste en temps réel. Tout en un seul outil.
              </p>
              <div className="ld-hero-ctas">
                <Link href="/login" className="ld-btn-primary">
                  Accéder à l'application <ArrowRight size={15} />
                </Link>
                <button className="ld-btn-secondary" onClick={() => scrollTo("hiw")}>
                  Voir comment ça marche
                </button>
              </div>
              <div className="ld-hero-trust">
                <span className="ld-trust-dot" />
                <span className="ld-trust-text">2 400+ conseillers</span>
                <span className="ld-trust-sep">·</span>
                <span className="ld-trust-text">18 000 emails/jour</span>
                <span className="ld-trust-sep">·</span>
                <span className="ld-trust-text">100% RGPD</span>
              </div>
            </div>

            {/* Right: floating mock */}
            <div className="ld-hero-right">
              <DashboardMock />
            </div>
          </div>

          <div className="ld-scroll">
            <ChevronDown size={22} />
          </div>
        </section>

        {/* ══ PARTNERS ══ */}
        <div className="ld-partners">
          <div className="ld-partners-in">
            <span className="ld-partner-label">Propulsé par</span>
            <div className="ld-partner-badges">
              {[
                { emoji: "🧠", name: "Gemini AI" },
                { emoji: "⚡", name: "Groq" },
                { emoji: "🔐", name: "Laravel 12" },
                { emoji: "▲", name: "Next.js 16" },
                { emoji: "🛡", name: "RGPD Conforme" },
              ].map(b => (
                <div key={b.name} className="ld-partner-badge">
                  <span>{b.emoji}</span> {b.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ STATS ══ */}
        <section className="ld-stats" ref={statsRef as React.RefObject<HTMLElement>}>
          <div className="ld-stats-in">
            {STATS.map(s => (
              <div key={s.label} className="ld-stat">
                <div className="ld-stat-val">
                  {s.prefix && <span className="acc">{s.prefix}</span>}
                  <Counter end={s.end} suffix={s.suffix} active={statsVisible} />
                </div>
                <div className="ld-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ HOW IT WORKS ══ */}
        <section className="ld-hiw" id="hiw">
          <div className="ld-hiw-in">
            <span className="ld-section-tag">Comment ça marche</span>
            <h2 className="ld-section-h2">De zéro à résolu en quelques secondes</h2>
            <p className="ld-section-sub">
              PostSmart IA s'intègre naturellement dans votre journée. Trois cas d'usage,
              un seul outil, aucune formation requise.
            </p>
            <div className="ld-steps">
              {STEPS.map(s => (
                <div key={s.n} className="ld-step">
                  <div className="ld-step-n">{s.n}</div>
                  <div className="ld-step-icon" style={{ background: s.color, border: `1px solid ${s.border}` }}>
                    {s.icon}
                  </div>
                  <h3 className="ld-step-title">{s.title}</h3>
                  <p className="ld-step-desc">{s.desc}</p>
                  <span className="ld-step-tag" style={{ background: s.color, borderColor: s.border, color: "#374151" }}>
                    <Zap size={10} /> {s.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FEATURES ══ */}
        <section className="ld-feats" id="feats">
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <span className="ld-section-tag">Fonctionnalités</span>
            <h2 className="ld-section-h2">Trois modules, un seul outil</h2>
            <p className="ld-section-sub" style={{ marginBottom: "3rem" }}>
              Chaque module est pensé pour le quotidien du conseiller La Poste.
            </p>
            <div className="ld-feats-grid">
              {FEATURES.map(f => (
                <div key={f.title} className="ld-feat-card">
                  <div className="ld-feat-ico" style={{ background: f.bg }}>{f.icon}</div>
                  <h3 className="ld-feat-title">{f.title}</h3>
                  <p className="ld-feat-desc">{f.desc}</p>
                  <ul className="ld-feat-bullets">
                    {f.bullets.map(b => (
                      <li key={b} className="ld-feat-bullet">
                        <Check size={13} color="#FFCC00" strokeWidth={3} style={{ marginTop: 3, flexShrink: 0 }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TECH ══ */}
        <section className="ld-tech">
          <div className="ld-tech-in">
            <p className="ld-tech-lbl">Stack technologique</p>
            <div className="ld-tech-badges">
              {TECH.map(t => (
                <div key={t.label} className="ld-tech-badge">
                  <span className="ld-tech-emoji">{t.emoji}</span>
                  <div>
                    <div className="ld-tech-name">{t.label}</div>
                    <div className="ld-tech-sub">{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIALS ══ */}
        <section className="ld-testis" id="testis">
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <span className="ld-section-tag">Témoignages</span>
            <h2 className="ld-section-h2" style={{ marginBottom: "0.75rem" }}>Ce que disent nos équipes</h2>
            <p className="ld-section-sub" style={{ marginBottom: "3rem" }}>
              Des conseillers et managers La Poste qui utilisent PostSmart IA au quotidien.
            </p>
            <div className="ld-testi-grid">
              {TESTIMONIALS.map(t => (
                <div key={t.name} className="ld-testi-card">
                  <div className="ld-stars">
                    {[1,2,3,4,5].map(i => <Star key={i} size={13} fill="#FFCC00" color="#FFCC00" />)}
                  </div>
                  <p className="ld-testi-quote">{t.quote}</p>
                  <div className="ld-testi-footer">
                    <div className="ld-testi-av" style={{ background: t.bg }}>{t.initials}</div>
                    <div>
                      <div className="ld-testi-name">{t.name}</div>
                      <div className="ld-testi-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA ══ */}
        <section className="ld-cta">
          <div className="ld-cta-orb" />
          <div className="ld-cta-in">
            <h2 className="ld-cta-h2">
              Prêt à transformer<br />
              <span style={{ color: "#FFCC00" }}>chaque échange client ?</span>
            </h2>
            <p className="ld-cta-sub">
              Rejoignez les conseillers La Poste qui font confiance à PostSmart IA
              pour répondre plus vite, mieux et sans stress.
            </p>
            <div className="ld-cta-btns">
              <Link href="/login" className="ld-btn-primary">
                Commencer maintenant <ArrowRight size={15} />
              </Link>
              <button className="ld-btn-secondary" onClick={() => scrollTo("hiw")}>
                En savoir plus
              </button>
            </div>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer className="ld-footer">
          <div className="ld-footer-in">
            <Link href="/" className="ld-footer-logo">
              <div className="ld-footer-badge">
                <Mail size={13} color="#00205B" strokeWidth={2.5} />
              </div>
              <span className="ld-footer-name">Post<span className="y">Smart IA</span></span>
            </Link>
            <div className="ld-footer-links">
              <button type="button" className="ld-footer-link">Mentions légales</button>
              <button type="button" className="ld-footer-link">Confidentialité</button>
              <button type="button" className="ld-footer-link">RGPD</button>
              <Link href="/login" className="ld-footer-link">Connexion</Link>
            </div>
            <span className="ld-footer-copy">© 2026 PostSmart IA — La Poste × EY × Microsoft</span>
          </div>
        </footer>

      </div>
    </>
  )
}
