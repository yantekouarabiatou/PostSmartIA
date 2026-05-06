"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Bot, Phone, Check, AlertCircle } from "lucide-react"
import { DrawerBackground } from "@/components/DrawerBackground"
import { api } from "@/lib/api"

type RoleId = "conseiller" | "manager" | "admin"

const ROLES: { id: RoleId; label: string }[] = [
  { id: "conseiller", label: "Conseiller" },
  { id: "manager",    label: "Manager"    },
  { id: "admin",      label: "Admin"      },
]

const DEMOS: Record<RoleId, { email: string; password: string }> = {
  conseiller: { email: "jean.martin@laposte.fr", password: "Conseiller@2024!" },
  manager:    { email: "manager@laposte.fr",      password: "Manager@2024!"    },
  admin:      { email: "admin@laposte.fr",         password: "Admin@2024!"      },
}

const FEATURES = [
  { icon: <Mail  size={14} color="#FFCC00" />, text: "Analyse et réponse aux mails entrants" },
  { icon: <Phone size={14} color="#FFCC00" />, text: "Compte-rendu d'appel en 30 secondes"   },
  { icon: <Bot   size={14} color="#FFCC00" />, text: "Assistant IA disponible en temps réel" },
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  .lp-root { display:flex; min-height:100vh; font-family:'Inter',sans-serif; }

  /* ── LEFT COLUMN ── */
  .lp-left {
    display: none;
    position: relative;
    flex: 0 0 60%;
    background: #00205B;
    overflow: hidden;
  }
  @media (min-width: 768px) {
    .lp-left { display: flex; flex-direction: column; justify-content: center; }
  }
  .lp-left-inner {
    position: relative;
    z-index: 1;
    padding: 3rem 3.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }
  .lp-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .lp-brand-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #FFCC00;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .lp-brand-name {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .lp-brand-name .w { color: #fff; }
  .lp-brand-name .y { color: #FFCC00; }

  .lp-title {
    font-size: 30px;
    font-weight: 600;
    color: #fff;
    line-height: 1.32;
    max-width: 430px;
    margin: 0;
  }
  .lp-title .accent { color: #FFCC00; }

  .lp-sub {
    font-size: 13.5px;
    color: rgba(255,255,255,0.65);
    line-height: 1.7;
    max-width: 400px;
    margin: 0;
  }

  .lp-pills { display: flex; flex-direction: column; gap: 10px; }
  .lp-pill {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    padding: 10px 14px;
    width: fit-content;
  }
  .lp-pill span { font-size: 13px; color: #fff; font-weight: 500; }

  /* ── RIGHT COLUMN ── */
  .lp-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #F5F7FA;
    padding: 2.5rem 1.5rem;
    min-width: 0;
  }

  /* Mobile header */
  .lp-mob-header {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    max-width: 420px;
    background: #00205B;
    border-radius: 12px;
    padding: 12px 18px;
    margin-bottom: 1.5rem;
  }
  @media (min-width: 768px) { .lp-mob-header { display: none; } }

  .lp-form-card {
    width: 100%;
    max-width: 420px;
    background: #fff;
    border-radius: 20px;
    padding: 2.25rem 2rem 2rem;
    box-shadow: 0 8px 32px rgba(0,32,91,0.10);
  }

  .lp-form-title { font-size: 20px; font-weight: 600; color: #1A1A2E; margin: 0 0 3px; }
  .lp-form-sub   { font-size: 13px; color: #6B7280; margin: 0 0 1.5rem; }

  /* Role tabs */
  .lp-tabs {
    display: flex;
    gap: 3px;
    background: #F0F2F5;
    border-radius: 10px;
    padding: 4px;
    margin-bottom: 1.5rem;
  }
  .lp-tab {
    flex: 1;
    height: 34px;
    border: none;
    border-radius: 7px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    transition: all 0.18s;
    background: transparent;
    color: #6B7280;
  }
  .lp-tab:hover:not(.lp-tab-active) { background: rgba(0,102,204,0.07); color: #0066CC; }
  .lp-tab-active { background: #0066CC !important; color: #fff !important; box-shadow: 0 2px 8px rgba(0,102,204,0.25); }

  /* Fields */
  .lp-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 1rem; }
  .lp-label { font-size: 12px; font-weight: 500; color: #6B7280; }
  .lp-wrap  { position: relative; }
  .lp-ico {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9CA3AF;
    pointer-events: none;
    display: flex;
    align-items: center;
  }
  .lp-inp {
    width: 100%;
    height: 44px;
    border: 1.5px solid #E5E7EB;
    border-radius: 10px;
    background: #F5F7FA;
    padding: 0 12px 0 40px;
    font-size: 14px;
    color: #1A1A2E;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
    font-family: 'Inter', sans-serif;
    box-sizing: border-box;
  }
  .lp-inp:focus { border-color: #0066CC; box-shadow: 0 0 0 3px rgba(0,102,204,0.15); background: #fff; }
  .lp-inp-pr { padding-right: 44px; }
  .lp-pw-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #9CA3AF;
    display: flex;
    align-items: center;
    padding: 0;
  }
  .lp-pw-btn:hover { color: #6B7280; }

  /* Custom checkbox */
  .lp-remember { display: flex; align-items: center; gap: 8px; margin-bottom: 1.25rem; cursor: pointer; }
  .lp-cb-wrap  { position: relative; width: 18px; height: 18px; flex-shrink: 0; }
  .lp-cb-wrap input { position: absolute; opacity: 0; width: 0; height: 0; }
  .lp-cb {
    width: 18px;
    height: 18px;
    border: 1.5px solid #D1D5DB;
    border-radius: 4px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    cursor: pointer;
  }
  .lp-cb-wrap input:checked + .lp-cb { background: #0066CC; border-color: #0066CC; }
  .lp-remember-lbl { font-size: 13px; color: #4B5563; user-select: none; }

  /* Error */
  .lp-err {
    background: #FEF2F2;
    border: 1px solid #FECACA;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    color: #DC2626;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* Submit */
  .lp-btn {
    width: 100%;
    height: 44px;
    background: #0066CC;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.18s, transform 0.12s;
    font-family: 'Inter', sans-serif;
    margin-bottom: 1rem;
  }
  .lp-btn:hover:not(:disabled) { background: #003D99; }
  .lp-btn:active:not(:disabled) { transform: scale(0.985); }
  .lp-btn:disabled { opacity: 0.7; cursor: not-allowed; }

  .lp-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lp-spin 0.7s linear infinite;
  }
  @keyframes lp-spin { to { transform: rotate(360deg); } }

  /* Bottom links */
  .lp-links { display: flex; justify-content: space-between; margin-bottom: 1.25rem; }
  .lp-link {
    font-size: 12px;
    color: #0066CC;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: 'Inter', sans-serif;
    text-decoration: none;
  }
  .lp-link:hover { color: #003D99; text-decoration: underline; }

  /* Security */
  .lp-sec {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 11px;
    color: #9CA3AF;
    padding-top: 1rem;
    border-top: 1px solid #F3F4F6;
  }
`

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole]             = useState<RoleId>("conseiller")
  const [email, setEmail]           = useState(DEMOS.conseiller.email)
  const [password, setPassword]     = useState(DEMOS.conseiller.password)
  const [showPw, setShowPw]         = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState("")

  useEffect(() => {
    if (localStorage.getItem("auth_token")) router.push("/dashboard")
  }, [router])

  function pickRole(r: RoleId) {
    setRole(r)
    setEmail(DEMOS[r].email)
    setPassword(DEMOS[r].password)
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const data = await api.post<{ user: any; token: string }>("/auth/login", { email, password })
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("auth_user", JSON.stringify(data.user))
      if (rememberMe) localStorage.setItem("remember_me", "true")
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Identifiants incorrects. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="lp-root">

        {/* ── COLONNE GAUCHE ── */}
        <div className="lp-left">
          <DrawerBackground />
          <div className="lp-left-inner">

            <div className="lp-brand">
              <div className="lp-brand-icon">
                <Mail size={20} color="#00205B" strokeWidth={2.5} />
              </div>
              <div className="lp-brand-name">
                <span className="w">Post</span><span className="y">Assist</span>
              </div>
            </div>

            <h1 className="lp-title">
              L'IA au service de votre<br />
              <span className="accent">relation</span> client.
            </h1>

            <p className="lp-sub">
              Rédigez des réponses impeccables, réduisez votre charge,
              gardez le lien humain.
            </p>

            <div className="lp-pills">
              {FEATURES.map(f => (
                <div key={f.text} className="lp-pill">
                  {f.icon}
                  <span>{f.text}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── COLONNE DROITE ── */}
        <div className="lp-right">

          {/* Mobile header */}
          <div className="lp-mob-header">
            <div className="lp-brand-icon" style={{ width: 32, height: 32 }}>
              <Mail size={15} color="#00205B" strokeWidth={2.5} />
            </div>
            <div className="lp-brand-name">
              <span className="w">Post</span><span className="y">Assist</span>
            </div>
          </div>

          <div className="lp-form-card">
            <h2 className="lp-form-title">Connexion</h2>
            <p className="lp-form-sub">Bienvenue sur PostAssist — La Poste</p>

            {/* Role tabs */}
            <div className="lp-tabs">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  className={`lp-tab${role === r.id ? ' lp-tab-active' : ''}`}
                  onClick={() => pickRole(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate>

              {error && (
                <div className="lp-err">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="lp-field">
                <label className="lp-label">Adresse e-mail</label>
                <div className="lp-wrap">
                  <span className="lp-ico"><Mail size={16} /></span>
                  <input
                    type="email"
                    className="lp-inp"
                    placeholder="prenom.nom@laposte.fr"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="lp-field">
                <label className="lp-label">Mot de passe</label>
                <div className="lp-wrap">
                  <span className="lp-ico"><Lock size={16} /></span>
                  <input
                    type={showPw ? "text" : "password"}
                    className="lp-inp lp-inp-pr"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" className="lp-pw-btn" onClick={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="lp-remember">
                <span className="lp-cb-wrap">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  <span className="lp-cb">
                    {rememberMe && <Check size={11} color="#fff" strokeWidth={3} />}
                  </span>
                </span>
                <span className="lp-remember-lbl">Se souvenir de moi</span>
              </label>

              {/* Submit */}
              <button type="submit" className="lp-btn" disabled={loading}>
                {loading
                  ? <><div className="lp-spinner" />Connexion…</>
                  : <>Se connecter <ArrowRight size={15} /></>
                }
              </button>
            </form>

            {/* Bottom links */}
            <div className="lp-links">
              <button type="button" className="lp-link">Mot de passe oublié ?</button>
              <button type="button" className="lp-link">Créer un compte</button>
            </div>

            {/* Security badge */}
            <div className="lp-sec">
              <ShieldCheck size={13} />
              Connexion sécurisée — RGPD conforme
            </div>

          </div>
        </div>

      </div>
    </>
  )
}
