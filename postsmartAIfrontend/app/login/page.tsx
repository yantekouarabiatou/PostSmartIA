"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Bot, Phone, Check, AlertCircle, Sparkles, Users, Clock, WifiOff, ServerCrash, X, UserX } from "lucide-react"
import { DrawerBackground } from "@/components/DrawerBackground"
import { api } from "@/lib/api"

type RoleId = "conseiller" | "manager" | "admin"

const ROLES: { id: RoleId; label: string; desc: string }[] = [
  { id: "conseiller", label: "Conseiller", desc: "Accès standard" },
  { id: "manager",    label: "Manager",    desc: "Accès équipe"   },
  { id: "admin",      label: "Admin",      desc: "Accès complet"  },
]

const DEMOS: Record<RoleId, { email: string; password: string }> = {
  conseiller: { email: "jean.martin@laposte.fr", password: "Conseiller@2024!" },
  manager:    { email: "manager@laposte.fr",      password: "Manager@2024!"    },
  admin:      { email: "admin@laposte.fr",         password: "Admin@2024!"      },
}

const STATS = [
  { icon: Users, value: "2 400+", label: "Conseillers actifs" },
  { icon: Mail,  value: "18 000", label: "Emails traités/jour" },
  { icon: Clock, value: "−65 %",  label: "Temps de réponse"   },
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .lp-root {
    display: flex;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    background: #0a0f1e;
  }

  /* ═══════════════════════════════
     LEFT PANEL
  ═══════════════════════════════ */
  .lp-left {
    display: none;
    position: relative;
    flex: 0 0 55%;
    overflow: hidden;
    background: linear-gradient(135deg, #00153d 0%, #00205B 45%, #003a8c 100%);
  }
  @media (min-width: 900px) { .lp-left { display: flex; flex-direction: column; justify-content: space-between; } }


  .lp-left-inner {
    position: relative;
    z-index: 2;
    padding: 2rem 2.5rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    flex: 1;
  }

  /* Logo */
  .lp-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .lp-logo-badge {
    width: 46px; height: 46px;
    border-radius: 14px;
    background: linear-gradient(135deg, #FFCC00, #FFB300);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(255,204,0,0.4);
  }
  .lp-logo-text { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
  .lp-logo-text .w { color: #fff; }
  .lp-logo-text .y { color: #FFCC00; }

  /* Headline */
  .lp-headline {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .lp-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,204,0,0.12);
    border: 1px solid rgba(255,204,0,0.3);
    border-radius: 20px;
    padding: 5px 12px;
    width: fit-content;
    font-size: 12px;
    font-weight: 500;
    color: #FFCC00;
  }
  .lp-h1 {
    font-size: 38px;
    font-weight: 700;
    color: #fff;
    line-height: 1.22;
    letter-spacing: -0.03em;
    margin: 0;
  }
  .lp-h1 .acc { color: #FFCC00; }
  .lp-desc {
    font-size: 14px;
    color: rgba(255,255,255,0.55);
    line-height: 1.75;
    margin: 0;
  }

  /* Feature cards */
  .lp-features { display: flex; flex-direction: column; gap: 10px; }
  .lp-feat {
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 14px;
    padding: 13px 16px;
    backdrop-filter: blur(4px);
    transition: background 0.2s, border-color 0.2s;
  }
  .lp-feat:hover { background: rgba(255,255,255,0.10); border-color: rgba(255,255,255,0.18); }
  .lp-feat-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: rgba(255,204,0,0.15);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .lp-feat-text { font-size: 13.5px; color: rgba(255,255,255,0.85); font-weight: 500; }

  /* Stats */
  .lp-stats {
    display: flex;
    gap: 0;
    border-top: 1px solid rgba(255,255,255,0.10);
    padding-top: 1.75rem;
    margin-bottom: 1rem;
  }
  .lp-stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 0 1.25rem;
    border-right: 1px solid rgba(255,255,255,0.10);
  }
  .lp-stat:first-child { padding-left: 0; }
  .lp-stat:last-child  { border-right: none; }
  .lp-stat-val  { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
  .lp-stat-lbl  { font-size: 11px; color: rgba(255,255,255,0.45); font-weight: 400; }

  /* ═══════════════════════════════
     RIGHT PANEL
  ═══════════════════════════════ */
  .lp-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #F4F6FB;
    padding: 1.25rem 1rem;
    min-width: 0;
    position: relative;
  }

  /* Cercle décoratif droit */
  .lp-right::before {
    content: '';
    position: absolute;
    width: 500px; height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0,102,204,0.06) 0%, transparent 70%);
    top: -100px; right: -150px;
    pointer-events: none;
  }

  /* Mobile logo */
  .lp-mob-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 2rem;
  }
  @media (min-width: 900px) { .lp-mob-logo { display: none; } }

  /* Carte formulaire */
  .lp-card {
    position: relative;
    width: 100%;
    max-width: 420px;
    background: #fff;
    border-radius: 24px;
    padding: 1.75rem 1.75rem 1.5rem;
    box-shadow:
      0 1px 2px rgba(0,32,91,0.04),
      0 4px 16px rgba(0,32,91,0.08),
      0 24px 48px rgba(0,32,91,0.06);
    border: 1px solid rgba(0,32,91,0.06);
  }

  /* Barre accent en haut de la carte */
  .lp-card::before {
    content: '';
    position: absolute;
    top: 0; left: 1.75rem; right: 1.75rem;
    height: 3px;
    background: linear-gradient(90deg, #FFCC00, #0066CC, #00205B);
    border-radius: 0 0 4px 4px;
  }

  .lp-card-title { font-size: 22px; font-weight: 700; color: #0d1117; margin: 0 0 4px; letter-spacing: -0.02em; }
  .lp-card-sub   { font-size: 13px; color: #8B95A2; margin: 0 0 1.75rem; }

  /* Sélecteur de rôle */
  .lp-roles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 1.75rem;
  }
  .lp-role-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 10px 8px;
    border: 1.5px solid #E8EBF0;
    border-radius: 12px;
    background: #F8F9FB;
    cursor: pointer;
    transition: all 0.18s;
    font-family: 'Inter', sans-serif;
  }
  .lp-role-btn:hover:not(.lp-role-active) {
    border-color: #c5d3e8;
    background: #EEF3FB;
  }
  .lp-role-active {
    border-color: #0066CC !important;
    background: linear-gradient(135deg, #EEF4FF, #E0ECFF) !important;
    box-shadow: 0 0 0 3px rgba(0,102,204,0.10);
  }
  .lp-role-name {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    line-height: 1;
  }
  .lp-role-active .lp-role-name { color: #0066CC; }
  .lp-role-desc {
    font-size: 10px;
    color: #9CA3AF;
    line-height: 1;
  }
  .lp-role-active .lp-role-desc { color: rgba(0,102,204,0.7); }

  /* Séparateur */
  .lp-divider {
    height: 1px;
    background: #F0F2F5;
    margin-bottom: 1.5rem;
  }

  /* Champs */
  .lp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1.1rem; }
  .lp-label {
    font-size: 12.5px;
    font-weight: 600;
    color: #374151;
    letter-spacing: 0.01em;
  }
  .lp-wrap { position: relative; }
  .lp-ico {
    position: absolute;
    left: 13px; top: 50%;
    transform: translateY(-50%);
    color: #9CA3AF;
    pointer-events: none;
    display: flex; align-items: center;
    transition: color 0.18s;
  }
  .lp-inp {
    width: 100%;
    height: 46px;
    border: 1.5px solid #E8EBF0;
    border-radius: 12px;
    background: #F8F9FB;
    padding: 0 14px 0 42px;
    font-size: 14px;
    color: #0d1117;
    outline: none;
    transition: all 0.18s;
    font-family: 'Inter', sans-serif;
  }
  .lp-inp::placeholder { color: #BCC3CD; }
  .lp-inp:focus {
    border-color: #0066CC;
    box-shadow: 0 0 0 4px rgba(0,102,204,0.10);
    background: #fff;
  }
  .lp-inp:focus ~ .lp-ico,
  .lp-wrap:focus-within .lp-ico { color: #0066CC; }
  .lp-inp-pr { padding-right: 46px; }
  .lp-pw-btn {
    position: absolute;
    right: 13px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none;
    cursor: pointer; color: #9CA3AF;
    display: flex; align-items: center; padding: 4px;
    border-radius: 6px;
    transition: color 0.15s, background 0.15s;
  }
  .lp-pw-btn:hover { color: #4B5563; background: rgba(0,0,0,0.05); }

  /* Remember / forgot */
  .lp-row-opts {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.4rem;
  }
  .lp-remember { display: flex; align-items: center; gap: 8px; cursor: pointer; }
  .lp-cb-wrap  { position: relative; width: 18px; height: 18px; flex-shrink: 0; }
  .lp-cb-wrap input { position: absolute; opacity: 0; width: 0; height: 0; }
  .lp-cb {
    width: 18px; height: 18px;
    border: 1.5px solid #D1D5DB;
    border-radius: 5px;
    background: #fff;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .lp-cb-wrap input:checked + .lp-cb { background: #0066CC; border-color: #0066CC; }
  .lp-remember-lbl { font-size: 12.5px; color: #6B7280; user-select: none; }
  .lp-forgot {
    font-size: 12.5px; font-weight: 500;
    color: #0066CC;
    background: none; border: none;
    cursor: pointer; padding: 0;
    font-family: 'Inter', sans-serif;
  }
  .lp-forgot:hover { color: #003D99; text-decoration: underline; }

  /* ── Notification d'erreur ── */
  @keyframes lp-err-in {
    from { opacity: 0; transform: translateY(-10px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)     scale(1);    }
  }
  @keyframes lp-shake {
    0%,100% { transform: translateX(0);   }
    20%     { transform: translateX(-6px); }
    40%     { transform: translateX(6px);  }
    60%     { transform: translateX(-4px); }
    80%     { transform: translateX(4px);  }
  }

  .lp-err-box {
    display: flex; align-items: flex-start; gap: 11px;
    border-radius: 14px;
    padding: 13px 13px 13px 14px;
    margin-bottom: 1.25rem;
    animation: lp-err-in 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
    border: 1px solid;
    position: relative;
  }
  .lp-err-auth    { background:#FEF2F2; border-color:#FECACA; border-left:3px solid #EF4444; }
  .lp-err-server  { background:#FFFBEB; border-color:#FDE68A; border-left:3px solid #F59E0B; }
  .lp-err-network { background:#EFF6FF; border-color:#BFDBFE; border-left:3px solid #3B82F6; }
  .lp-err-account { background:#FDF4FF; border-color:#E9D5FF; border-left:3px solid #A855F7; }

  .lp-err-icon {
    width: 32px; height: 32px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .lp-err-auth    .lp-err-icon { background:rgba(239,68,68,0.12);  color:#EF4444; }
  .lp-err-server  .lp-err-icon { background:rgba(245,158,11,0.12); color:#F59E0B; }
  .lp-err-network .lp-err-icon { background:rgba(59,130,246,0.12); color:#3B82F6; }
  .lp-err-account .lp-err-icon { background:rgba(168,85,247,0.12); color:#A855F7; }

  .lp-err-body { flex:1; min-width:0; }
  .lp-err-title  { font-size:13.5px; font-weight:700; color:#111827; margin:0 0 3px; line-height:1.3; }
  .lp-err-detail { font-size:12px;   font-weight:400; color:#6B7280; margin:0; line-height:1.55; }

  .lp-err-close {
    background:none; border:none; cursor:pointer; color:#9CA3AF;
    padding:3px; display:flex; border-radius:5px; flex-shrink:0;
    transition:color 0.15s, background 0.15s; margin-top:-1px;
  }
  .lp-err-close:hover { color:#374151; background:rgba(0,0,0,0.06); }

  .lp-inp-shake { animation: lp-shake 0.4s ease; }

  /* Bouton submit */
  .lp-btn {
    width: 100%; height: 48px;
    background: linear-gradient(135deg, #0066CC, #0052a3);
    color: #fff;
    border: none; border-radius: 12px;
    font-size: 14.5px; font-weight: 600;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
    margin-bottom: 1.4rem;
    letter-spacing: 0.01em;
    box-shadow: 0 4px 14px rgba(0,102,204,0.35);
  }
  .lp-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #0052a3, #003d7a);
    box-shadow: 0 6px 20px rgba(0,102,204,0.45);
    transform: translateY(-1px);
  }
  .lp-btn:active:not(:disabled) { transform: translateY(0); box-shadow: 0 2px 8px rgba(0,102,204,0.3); }
  .lp-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none !important; }

  .lp-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lp-spin 0.7s linear infinite;
  }
  @keyframes lp-spin { to { transform: rotate(360deg); } }

  /* Créer un compte */
  .lp-register {
    text-align: center;
    font-size: 13px;
    color: #8B95A2;
    margin-bottom: 1.4rem;
  }
  .lp-reg-link {
    font-size: 13px; font-weight: 600;
    color: #0066CC;
    background: none; border: none;
    cursor: pointer; padding: 0;
    font-family: 'Inter', sans-serif;
  }
  .lp-reg-link:hover { color: #003D99; text-decoration: underline; }

  /* Sécurité */
  .lp-sec {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: 11.5px; color: #B0BAC9;
    padding-top: 1.1rem;
    border-top: 1px solid #F0F2F5;
  }
  .lp-sec-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #34D399;
    flex-shrink: 0;
    box-shadow: 0 0 6px rgba(52,211,153,0.6);
  }

  /* Fade-in animation */
  @keyframes lp-fadein {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lp-card { animation: lp-fadein 0.45s ease both; }
  .lp-left-inner { animation: lp-fadein 0.5s ease both; }
`

type ErrorInfo = { title: string; detail: string; type: 'auth' | 'server' | 'network' | 'account' }

function getFriendlyError(raw: string): ErrorInfo {
  const lower = raw.toLowerCase()

  if (
    lower.includes('database') || lower.includes('sqlite') ||
    lower.includes('does not exist') || lower.includes('sql') ||
    lower.includes('500') || lower.includes('server error')
  ) {
    return {
      title: 'Service temporairement indisponible',
      detail: 'Nos serveurs rencontrent un problème technique. Réessayez dans quelques instants ou contactez le support.',
      type: 'server',
    }
  }

  if (
    lower.includes('failed to fetch') || lower.includes('networkerror') ||
    lower.includes('network') || lower.includes('fetch')
  ) {
    return {
      title: 'Connexion impossible',
      detail: 'Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.',
      type: 'network',
    }
  }

  if (lower.includes('désactivé') || lower.includes('disabled') || lower.includes('403')) {
    return {
      title: 'Compte désactivé',
      detail: 'Votre compte a été désactivé. Contactez votre administrateur pour le réactiver.',
      type: 'account',
    }
  }

  return {
    title: 'Identifiants incorrects',
    detail: 'L\'adresse e-mail ou le mot de passe est incorrect. Vérifiez vos informations et réessayez.',
    type: 'auth',
  }
}

const ERR_ICONS: Record<ErrorInfo['type'], React.ReactNode> = {
  auth:    <AlertCircle size={16} />,
  server:  <ServerCrash size={16} />,
  network: <WifiOff size={16} />,
  account: <UserX size={16} />,
}

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole]             = useState<RoleId>("conseiller")
  const [email, setEmail]           = useState(DEMOS.conseiller.email)
  const [password, setPassword]     = useState(DEMOS.conseiller.password)
  const [showPw, setShowPw]         = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<ErrorInfo | null>(null)
  const [shake, setShake]           = useState(false)

  useEffect(() => {
    if (localStorage.getItem("auth_token")) router.push("/dashboard")
  }, [router])

  function pickRole(r: RoleId) {
    setRole(r)
    setEmail(DEMOS[r].email)
    setPassword(DEMOS[r].password)
    setError(null)
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await api.post<{ user: any; token: string }>("/auth/login", { email, password })
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("auth_user", JSON.stringify(data.user))
      if (rememberMe) localStorage.setItem("remember_me", "true")
      router.push("/dashboard")
    } catch (err: any) {
      const info = getFriendlyError(err.message ?? "")
      setError(info)
      if (info.type === 'auth') {
        setShake(true)
        setTimeout(() => setShake(false), 500)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="lp-root">

        {/* ══════════════════════════════
            COLONNE GAUCHE
        ══════════════════════════════ */}
        <div className="lp-left">
          <DrawerBackground />

          <div className="lp-left-inner">

            {/* Logo */}
            <div className="lp-logo">
              <div className="lp-logo-badge">
                <Mail size={22} color="#00205B" strokeWidth={2.5} />
              </div>
              <div className="lp-logo-text">
                <span className="w">Post</span><span className="y">SmartAI</span>
              </div>
            </div>

            {/* Headline */}
            <div className="lp-headline">
              <div className="lp-tag">
                <Sparkles size={12} />
                Votre copilote intelligent
              </div>
              <h1 className="lp-h1">
                L'intelligence au service de votre{" "}
                <span className="acc">relation client.</span>
              </h1>
              <p className="lp-desc">
                Rédigez des réponses impeccables, réduisez votre charge
                mentale et gardez un lien humain avec chaque client.
              </p>
            </div>

            {/* Features */}
            <div className="lp-features">
              {[
                { icon: <Mail size={16} color="#FFCC00" />,  text: "Analyse et réponse aux mails entrants"  },
                { icon: <Phone size={16} color="#FFCC00" />, text: "Compte-rendu d'appel en 30 secondes"    },
                { icon: <Bot size={16} color="#FFCC00" />,   text: "Assistant IA disponible en temps réel"  },
              ].map(f => (
                <div key={f.text} className="lp-feat">
                  <div className="lp-feat-icon">{f.icon}</div>
                  <span className="lp-feat-text">{f.text}</span>
                </div>
              ))}
            </div>

          </div>

          {/* Stats */}
          <div style={{ position: 'relative', zIndex: 2, padding: '0 2.5rem 1.5rem' }}>
            <div className="lp-stats">
              {STATS.map(s => (
                <div key={s.label} className="lp-stat">
                  <span className="lp-stat-val">{s.value}</span>
                  <span className="lp-stat-lbl">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════
            COLONNE DROITE
        ══════════════════════════════ */}
        <div className="lp-right">

          {/* Logo mobile */}
          <div className="lp-mob-logo">
            <div className="lp-logo-badge">
              <Mail size={18} color="#00205B" strokeWidth={2.5} />
            </div>
            <div className="lp-logo-text" style={{ fontSize: 20 }}>
              <span className="w" style={{ color: '#00205B' }}>Post</span>
              <span className="y" style={{ color: '#0066CC' }}>SmartAI</span>
            </div>
          </div>

          <div className="lp-card">
            <h2 className="lp-card-title">Bon retour 👋</h2>
            <p className="lp-card-sub">Connectez-vous à votre espace PostSmartAI</p>

            {/* Sélecteur rôle */}
            <div className="lp-roles">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  className={`lp-role-btn${role === r.id ? ' lp-role-active' : ''}`}
                  onClick={() => pickRole(r.id)}
                >
                  <span className="lp-role-name">{r.label}</span>
                  <span className="lp-role-desc">{r.desc}</span>
                </button>
              ))}
            </div>

            <div className="lp-divider" />

            <form onSubmit={handleSubmit} noValidate>

              {error && (
                <div className={`lp-err-box lp-err-${error.type}`}>
                  <div className="lp-err-icon">{ERR_ICONS[error.type]}</div>
                  <div className="lp-err-body">
                    <p className="lp-err-title">{error.title}</p>
                    <p className="lp-err-detail">{error.detail}</p>
                  </div>
                  <button type="button" className="lp-err-close" onClick={() => setError(null)}>
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Email */}
              <div className="lp-field">
                <label className="lp-label">Adresse e-mail</label>
                <div className="lp-wrap">
                  <span className="lp-ico"><Mail size={16} /></span>
                  <input
                    type="email"
                    className={`lp-inp${shake ? ' lp-inp-shake' : ''}`}
                    placeholder="prenom.nom@laposte.fr"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null) }}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="lp-field">
                <label className="lp-label">Mot de passe</label>
                <div className="lp-wrap">
                  <span className="lp-ico"><Lock size={16} /></span>
                  <input
                    type={showPw ? "text" : "password"}
                    className={`lp-inp lp-inp-pr${shake ? ' lp-inp-shake' : ''}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(null) }}
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" className="lp-pw-btn" onClick={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="lp-row-opts">
                <label className="lp-remember">
                  <span className="lp-cb-wrap">
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                    <span className="lp-cb">
                      {rememberMe && <Check size={11} color="#fff" strokeWidth={3} />}
                    </span>
                  </span>
                  <span className="lp-remember-lbl">Se souvenir de moi</span>
                </label>
                <button type="button" className="lp-forgot">Mot de passe oublié ?</button>
              </div>

              {/* Submit */}
              <button type="submit" className="lp-btn" disabled={loading}>
                {loading
                  ? <><div className="lp-spinner" /> Connexion en cours…</>
                  : <>Se connecter <ArrowRight size={16} /></>
                }
              </button>
            </form>

            {/* Lien inscription */}
            <div className="lp-register">
              Pas encore de compte ?{" "}
              <button type="button" className="lp-reg-link" onClick={() => router.push("/register")}>
                Créer un compte
              </button>
            </div>

            {/* Sécurité */}
            <div className="lp-sec">
              <span className="lp-sec-dot" />
              <ShieldCheck size={13} />
              Connexion sécurisée · Chiffrement TLS · RGPD conforme
            </div>

          </div>
        </div>

      </div>
    </>
  )
}
