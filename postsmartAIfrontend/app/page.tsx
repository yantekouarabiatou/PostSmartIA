"use client"

import Link from "next/link"
import { Mail, Phone, Bot, Check, Star, ChevronDown, Mic } from "lucide-react"
import { DrawerBackground } from "@/components/DrawerBackground"

// ── Data ───────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "70%",  label: "Réduction du temps de rédaction"   },
  { value: "3 min", label: "Temps moyen de traitement mail"    },
  { value: "98%",  label: "Conformité charte relationnelle"    },
  { value: "24/7", label: "Assistant disponible"               },
]

const FEATURES = [
  {
    icon: <Mail size={28} color="#0066CC" />,
    iconBg: "#EBF4FF",
    title: "Traitement des mails",
    desc: "Analysez et catégorisez automatiquement les mails entrants pour répondre plus vite et mieux.",
    bullets: [
      "Détection automatique du type de demande",
      "Génération de réponse personnalisée en 1 clic",
      "Score qualité et conformité à la charte",
    ],
  },
  {
    icon: <Mic size={28} color="#D97706" />,
    iconBg: "#FFFBEB",
    title: "Compte-rendu d'appel",
    desc: "Transformez vos notes d'appel en comptes-rendus structurés prêts à envoyer.",
    bullets: [
      "Saisie libre ou guidée par thème",
      "Structuration automatique du compte-rendu",
      "Email client prêt à envoyer en 30 secondes",
    ],
  },
  {
    icon: <Bot size={28} color="#7C3AED" />,
    iconBg: "#F5F3FF",
    title: "Assistant IA temps réel",
    desc: "Un assistant intelligent disponible à chaque instant pour vous épauler.",
    bullets: [
      "Procédures et délais à portée de main",
      "Formulations adaptées à chaque situation",
      "Suggestions contextuelles en temps réel",
    ],
  },
]

const TESTIMONIALS = [
  {
    initials: "SM",
    bg: "#0066CC",
    name: "Sophie M.",
    role: "Conseillère · Paris",
    quote: "PostAssist m'a changé la vie ! Je traite mes mails deux fois plus vite et mes réponses sont bien plus professionnelles.",
  },
  {
    initials: "KB",
    bg: "#7C3AED",
    name: "Karim B.",
    role: "Manager · Lyon",
    quote: "Un outil indispensable pour notre équipe. Les comptes-rendus d'appel sont impeccables et notre direction est ravie de la qualité.",
  },
  {
    initials: "IT",
    bg: "#059669",
    name: "Isabelle T.",
    role: "Conseillère · Bordeaux",
    quote: "L'assistant IA est bluffant. Il connaît toutes les procédures La Poste par cœur. Je ne pourrais vraiment plus m'en passer.",
  },
]

// ── CSS ────────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  .ld-root { font-family: 'Inter', sans-serif; color: #1A1A2E; }
  .ld-root * { box-sizing: border-box; }

  /* ── NAVBAR ── */
  .ld-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 200;
    height: 64px;
    background: #fff;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    display: flex;
    align-items: center;
    padding: 0 2rem;
  }
  .ld-nav-inner {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
  }
  .ld-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
  }
  .ld-logo-circle {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: #FFCC00;
    display: flex; align-items: center; justify-content: center;
  }
  .ld-logo-name { font-size: 17px; font-weight: 600; }
  .ld-logo-name .np { color: #00205B; }
  .ld-logo-name .ny { color: #0066CC; }

  .ld-nav-links { display: flex; gap: 0.5rem; align-items: center; }
  .ld-nav-link {
    font-size: 14px;
    font-weight: 500;
    color: #4B5563;
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    transition: color 0.15s, background 0.15s;
    text-decoration: none;
  }
  .ld-nav-link:hover { color: #0066CC; background: #EBF4FF; }
  .ld-nav-cta {
    background: #0066CC;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: background 0.18s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
  }
  .ld-nav-cta:hover { background: #003D99; }

  @media (max-width: 640px) {
    .ld-nav-links { display: none; }
  }

  /* ── HERO ── */
  .ld-hero {
    min-height: 100vh;
    position: relative;
    background: #00205B;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .ld-hero-inner {
    position: relative;
    z-index: 1;
    text-align: center;
    padding: 100px 2rem 80px;
    max-width: 700px;
    margin: 0 auto;
  }
  .ld-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #FFCC00;
    color: #00205B;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 999px;
    margin-bottom: 2rem;
  }
  .ld-hero-title {
    font-size: 52px;
    font-weight: 600;
    color: #fff;
    line-height: 1.18;
    margin: 0 0 1.25rem;
    letter-spacing: -0.02em;
  }
  .ld-hero-title .accent { color: #FFCC00; }
  @media (max-width: 640px) {
    .ld-hero-title { font-size: 34px; }
  }
  .ld-hero-sub {
    font-size: 18px;
    color: rgba(255,255,255,0.72);
    line-height: 1.65;
    margin: 0 auto 2.5rem;
    max-width: 560px;
  }
  @media (max-width: 640px) { .ld-hero-sub { font-size: 15px; } }

  .ld-hero-ctas { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
  .ld-cta-primary {
    background: #FFCC00;
    color: #00205B;
    border: none;
    border-radius: 10px;
    padding: 14px 28px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: transform 0.18s, box-shadow 0.18s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
  }
  .ld-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,204,0,0.35); }
  .ld-cta-secondary {
    background: transparent;
    color: #fff;
    border: 1.5px solid rgba(255,255,255,0.4);
    border-radius: 10px;
    padding: 14px 28px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: background 0.18s, border-color 0.18s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
  }
  .ld-cta-secondary:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.6); }

  /* Scroll indicator */
  .ld-scroll {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;
    color: rgba(255,255,255,0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  @keyframes ld-bounce {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-7px); }
  }
  .ld-scroll-icon { animation: ld-bounce 2s ease-in-out infinite; }

  /* ── STATS ── */
  .ld-stats {
    background: #fff;
    padding: 80px 2rem;
  }
  .ld-stats-grid {
    max-width: 960px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem 3rem;
  }
  @media (min-width: 768px) {
    .ld-stats-grid { grid-template-columns: repeat(4, 1fr); }
  }
  .ld-stat { text-align: center; }
  .ld-stat-value { font-size: 40px; font-weight: 600; color: #0066CC; line-height: 1; margin-bottom: 8px; }
  .ld-stat-label { font-size: 14px; color: #6B7280; line-height: 1.4; }

  /* ── FEATURES ── */
  .ld-feats {
    background: #F5F7FA;
    padding: 80px 2rem;
  }
  .ld-section-title {
    font-size: 32px;
    font-weight: 600;
    color: #00205B;
    text-align: center;
    margin: 0 0 3rem;
    letter-spacing: -0.01em;
  }
  .ld-section-sub {
    font-size: 16px;
    color: #6B7280;
    text-align: center;
    margin: -2rem auto 3rem;
    max-width: 480px;
    line-height: 1.6;
  }
  .ld-feats-grid {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    gap: 1.5rem;
    grid-template-columns: 1fr;
  }
  @media (min-width: 768px) {
    .ld-feats-grid { grid-template-columns: repeat(3, 1fr); }
  }
  .ld-feat-card {
    background: #fff;
    border: 1.5px solid #E5E7EB;
    border-radius: 16px;
    padding: 2rem;
    transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
  }
  .ld-feat-card:hover {
    border-color: #0066CC;
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0,102,204,0.12);
  }
  .ld-feat-icon {
    width: 58px; height: 58px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 1.25rem;
  }
  .ld-feat-title { font-size: 18px; font-weight: 600; color: #00205B; margin: 0 0 0.5rem; }
  .ld-feat-desc  { font-size: 14px; color: #6B7280; line-height: 1.6; margin: 0 0 1rem; }
  .ld-feat-bullets { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .ld-feat-bullet  { display: flex; align-items: flex-start; gap: 8px; font-size: 13.5px; color: #374151; }

  /* ── TESTIMONIALS ── */
  .ld-testis {
    background: #fff;
    padding: 80px 2rem;
  }
  .ld-testi-grid {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    gap: 1.5rem;
    grid-template-columns: 1fr;
  }
  @media (min-width: 768px) {
    .ld-testi-grid { grid-template-columns: repeat(3, 1fr); }
  }
  .ld-testi-card {
    border: 1px solid #E5E7EB;
    border-radius: 16px;
    padding: 1.75rem;
    transition: box-shadow 0.25s;
  }
  .ld-testi-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
  .ld-testi-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1rem; }
  .ld-testi-avatar {
    width: 44px; height: 44px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 600; color: #fff;
    flex-shrink: 0;
  }
  .ld-testi-name { font-size: 14px; font-weight: 600; color: #1A1A2E; }
  .ld-testi-role { font-size: 12px; color: #9CA3AF; }
  .ld-testi-stars { display: flex; gap: 2px; margin-bottom: 0.75rem; }
  .ld-testi-quote { font-size: 14px; color: #4B5563; line-height: 1.65; font-style: italic; }
  .ld-testi-quote::before { content: '\\201C'; }
  .ld-testi-quote::after  { content: '\\201D'; }

  /* ── CTA SECTION ── */
  .ld-cta-sec {
    position: relative;
    background: #00205B;
    padding: 100px 2rem;
    overflow: hidden;
    text-align: center;
  }
  .ld-cta-inner { position: relative; z-index: 1; }
  .ld-cta-title {
    font-size: 36px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 1rem;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }
  @media (max-width: 640px) { .ld-cta-title { font-size: 26px; } }
  .ld-cta-sub {
    font-size: 16px;
    color: rgba(255,255,255,0.65);
    margin: 0 auto 2.5rem;
    max-width: 440px;
    line-height: 1.6;
  }

  /* ── FOOTER ── */
  .ld-footer {
    background: #001540;
    padding: 40px 2rem;
  }
  .ld-footer-inner {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1.25rem;
  }
  .ld-footer-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
  .ld-footer-logo-circle {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: rgba(255,204,0,0.8);
    display: flex; align-items: center; justify-content: center;
  }
  .ld-footer-logo-name { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.6); }
  .ld-footer-logo-name .y { color: #FFCC00; }

  .ld-footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .ld-footer-link {
    font-size: 12px;
    color: rgba(255,255,255,0.5);
    text-decoration: none;
    background: none; border: none; cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: color 0.15s;
  }
  .ld-footer-link:hover { color: rgba(255,255,255,0.8); }

  .ld-footer-copy { font-size: 12px; color: rgba(255,255,255,0.4); }
`

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ld-root">

        {/* ── NAVBAR ── */}
        <nav className="ld-nav">
          <div className="ld-nav-inner">
            <Link href="/" className="ld-logo">
              <div className="ld-logo-circle">
                <Mail size={16} color="#00205B" strokeWidth={2.5} />
              </div>
              <span className="ld-logo-name">
                <span className="np">Post</span><span className="ny">Assist</span>
              </span>
            </Link>

            <div className="ld-nav-links">
              <button className="ld-nav-link" onClick={() => scrollTo("features")}>Fonctionnalités</button>
              <button className="ld-nav-link" onClick={() => scrollTo("testimonials")}>À propos</button>
            </div>

            <Link href="/login" className="ld-nav-cta">Se connecter</Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="ld-hero">
          <DrawerBackground />
          <div className="ld-hero-inner">
            <div className="ld-hero-badge">✦ Hackathon La Poste × EY × Microsoft</div>
            <h1 className="ld-hero-title">
              Votre assistant IA pour une<br />
              relation client d'<span className="accent">excellence</span>
            </h1>
            <p className="ld-hero-sub">
              PostAssist aide les conseillers La Poste à rédiger des réponses
              impeccables, gérer les comptes-rendus d'appel et accéder aux procédures
              en temps réel.
            </p>
            <div className="ld-hero-ctas">
              <Link href="/login" className="ld-cta-primary">Commencer maintenant</Link>
              <button
                type="button"
                className="ld-cta-secondary"
                onClick={() => scrollTo("features")}
              >
                En savoir plus
              </button>
            </div>
          </div>
          <div className="ld-scroll">
            <ChevronDown size={22} className="ld-scroll-icon" />
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="ld-stats">
          <div className="ld-stats-grid">
            {STATS.map(s => (
              <div key={s.value} className="ld-stat">
                <div className="ld-stat-value">{s.value}</div>
                <div className="ld-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="ld-feats" id="features">
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 className="ld-section-title">Trois modules, un seul outil</h2>
            <div className="ld-feats-grid">
              {FEATURES.map(f => (
                <div key={f.title} className="ld-feat-card">
                  <div className="ld-feat-icon" style={{ background: f.iconBg }}>
                    {f.icon}
                  </div>
                  <h3 className="ld-feat-title">{f.title}</h3>
                  <p className="ld-feat-desc">{f.desc}</p>
                  <ul className="ld-feat-bullets">
                    {f.bullets.map(b => (
                      <li key={b} className="ld-feat-bullet">
                        <Check size={14} color="#FFCC00" strokeWidth={3} style={{ marginTop: 2, flexShrink: 0 }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="ld-testis" id="testimonials">
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 className="ld-section-title">Ce que disent nos équipes</h2>
            <div className="ld-testi-grid">
              {TESTIMONIALS.map(t => (
                <div key={t.name} className="ld-testi-card">
                  <div className="ld-testi-header">
                    <div className="ld-testi-avatar" style={{ background: t.bg }}>
                      {t.initials}
                    </div>
                    <div>
                      <div className="ld-testi-name">{t.name}</div>
                      <div className="ld-testi-role">{t.role}</div>
                    </div>
                  </div>
                  <div className="ld-testi-stars">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14} fill="#FFCC00" color="#FFCC00" />
                    ))}
                  </div>
                  <p className="ld-testi-quote">{t.quote}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA SECTION ── */}
        <section className="ld-cta-sec">
          <DrawerBackground />
          <div className="ld-cta-inner">
            <h2 className="ld-cta-title">Prêt à transformer<br />votre relation client ?</h2>
            <p className="ld-cta-sub">
              Rejoignez les équipes La Poste qui font confiance à PostAssist
              pour chaque échange client.
            </p>
            <Link href="/login" className="ld-cta-primary">
              Accéder à PostAssist
            </Link>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="ld-footer">
          <div className="ld-footer-inner">
            <Link href="/" className="ld-footer-logo">
              <div className="ld-footer-logo-circle">
                <Mail size={13} color="#00205B" strokeWidth={2.5} />
              </div>
              <span className="ld-footer-logo-name">
                Post<span className="y">Assist</span>
              </span>
            </Link>

            <div className="ld-footer-links">
              <button type="button" className="ld-footer-link">Mentions légales</button>
              <button type="button" className="ld-footer-link">Confidentialité</button>
              <button type="button" className="ld-footer-link">RGPD</button>
            </div>

            <span className="ld-footer-copy">
              © 2026 PostAssist — La Poste × EY × Microsoft
            </span>
          </div>
        </footer>

      </div>
    </>
  )
}
