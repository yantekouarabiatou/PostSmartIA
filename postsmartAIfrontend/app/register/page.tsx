"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Bot, User, Phone, AlertCircle } from "lucide-react"
import { DrawerBackground } from "@/components/DrawerBackground"
import { api } from "@/lib/api"

type RoleId = "conseiller" | "manager" | "admin"

const ROLES: { id: RoleId; label: string }[] = [
  { id: "conseiller", label: "Conseiller" },
  { id: "manager",    label: "Manager"    },
  { id: "admin",      label: "Admin"      },
]

const FEATURES = [
  { icon: <Mail  size={14} color="#FFCC00" />, text: "Analyse et réponse aux mails entrants" },
  { icon: <Phone size={14} color="#FFCC00" />, text: "Compte-rendu d'appel en 30 secondes"   },
  { icon: <Bot   size={14} color="#FFCC00" />, text: "Assistant IA disponible en temps réel" },
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  .rp-root { display:flex; min-height:100vh; font-family:'Inter',sans-serif; }

  .rp-left {
    display: none;
    position: relative;
    flex: 0 0 60%;
    background: #00205B;
    overflow: hidden;
  }
  @media (min-width: 768px) {
    .rp-left { display: flex; flex-direction: column; justify-content: center; }
  }
  .rp-left-inner {
    position: relative;
    z-index: 1;
    padding: 3rem 3.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }
  .rp-brand { display: flex; align-items: center; gap: 10px; }
  .rp-brand-icon {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: #FFCC00;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .rp-brand-name { font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
  .rp-brand-name .w { color: #fff; }
  .rp-brand-name .y { color: #FFCC00; }
  .rp-title { font-size: 30px; font-weight: 600; color: #fff; line-height: 1.32; max-width: 430px; margin: 0; }
  .rp-title .accent { color: #FFCC00; }
  .rp-sub { font-size: 13.5px; color: rgba(255,255,255,0.65); line-height: 1.7; max-width: 400px; margin: 0; }
  .rp-pills { display: flex; flex-direction: column; gap: 10px; }
  .rp-pill {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px; padding: 10px 14px; width: fit-content;
  }
  .rp-pill span { font-size: 13px; color: #fff; font-weight: 500; }

  .rp-right {
    flex: 1;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: #F5F7FA;
    padding: 2.5rem 1.5rem;
    min-width: 0;
  }

  .rp-mob-header {
    display: flex; align-items: center; gap: 10px;
    width: 100%; max-width: 420px;
    background: #00205B; border-radius: 12px;
    padding: 12px 18px; margin-bottom: 1.5rem;
  }
  @media (min-width: 768px) { .rp-mob-header { display: none; } }

  .rp-form-card {
    width: 100%; max-width: 480px;
    background: #fff; border-radius: 20px;
    padding: 2.25rem 2rem 2rem;
    box-shadow: 0 8px 32px rgba(0,32,91,0.10);
  }

  .rp-form-title { font-size: 20px; font-weight: 600; color: #1A1A2E; margin: 0 0 3px; }
  .rp-form-sub   { font-size: 13px; color: #6B7280; margin: 0 0 1.5rem; }

  .rp-tabs {
    display: flex; gap: 3px;
    background: #F0F2F5; border-radius: 10px;
    padding: 4px; margin-bottom: 1.5rem;
  }
  .rp-tab {
    flex: 1; height: 34px; border: none; border-radius: 7px;
    cursor: pointer; font-size: 13px; font-weight: 500;
    font-family: 'Inter', sans-serif; transition: all 0.18s;
    background: transparent; color: #6B7280;
  }
  .rp-tab:hover:not(.rp-tab-active) { background: rgba(0,102,204,0.07); color: #0066CC; }
  .rp-tab-active { background: #0066CC !important; color: #fff !important; box-shadow: 0 2px 8px rgba(0,102,204,0.25); }

  .rp-row { display: flex; gap: 12px; }
  .rp-row .rp-field { flex: 1; }

  .rp-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 1rem; }
  .rp-label { font-size: 12px; font-weight: 500; color: #6B7280; }
  .rp-wrap  { position: relative; }
  .rp-ico {
    position: absolute; left: 12px; top: 50%;
    transform: translateY(-50%); color: #9CA3AF;
    pointer-events: none; display: flex; align-items: center;
  }
  .rp-inp {
    width: 100%; height: 44px;
    border: 1.5px solid #E5E7EB; border-radius: 10px;
    background: #F5F7FA; padding: 0 12px 0 40px;
    font-size: 14px; color: #1A1A2E; outline: none;
    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
    font-family: 'Inter', sans-serif; box-sizing: border-box;
  }
  .rp-inp:focus { border-color: #0066CC; box-shadow: 0 0 0 3px rgba(0,102,204,0.15); background: #fff; }
  .rp-inp-pr { padding-right: 44px; }
  .rp-pw-btn {
    position: absolute; right: 12px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: #9CA3AF; display: flex; align-items: center; padding: 0;
  }
  .rp-pw-btn:hover { color: #6B7280; }

  .rp-err {
    background: #FEF2F2; border: 1px solid #FECACA;
    border-radius: 8px; padding: 10px 14px;
    font-size: 13px; color: #DC2626;
    margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;
  }

  .rp-success {
    background: #F0FDF4; border: 1px solid #BBF7D0;
    border-radius: 8px; padding: 10px 14px;
    font-size: 13px; color: #16A34A;
    margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;
  }

  .rp-btn {
    width: 100%; height: 44px;
    background: #0066CC; color: #fff;
    border: none; border-radius: 10px;
    font-size: 14px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.18s, transform 0.12s;
    font-family: 'Inter', sans-serif; margin-bottom: 1rem;
  }
  .rp-btn:hover:not(:disabled) { background: #003D99; }
  .rp-btn:active:not(:disabled) { transform: scale(0.985); }
  .rp-btn:disabled { opacity: 0.7; cursor: not-allowed; }

  .rp-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff; border-radius: 50%;
    animation: rp-spin 0.7s linear infinite;
  }
  @keyframes rp-spin { to { transform: rotate(360deg); } }

  .rp-login-link {
    text-align: center; font-size: 13px; color: #6B7280; margin-bottom: 1.25rem;
  }
  .rp-link {
    font-size: 13px; color: #0066CC;
    background: none; border: none; cursor: pointer; padding: 0;
    font-family: 'Inter', sans-serif; text-decoration: none;
  }
  .rp-link:hover { color: #003D99; text-decoration: underline; }

  .rp-sec {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: 11px; color: #9CA3AF;
    padding-top: 1rem; border-top: 1px solid #F3F4F6;
  }
`

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole]                   = useState<RoleId>("conseiller")
  const [firstName, setFirstName]         = useState("")
  const [lastName, setLastName]           = useState("")
  const [email, setEmail]                 = useState("")
  const [equipe, setEquipe]               = useState("")
  const [password, setPassword]           = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [showPw, setShowPw]               = useState(false)
  const [showPwConfirm, setShowPwConfirm] = useState(false)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState("")
  const [success, setSuccess]             = useState("")

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    setLoading(true)
    try {
      await api.post("/auth/register", {
        first_name:            firstName,
        last_name:             lastName,
        email,
        password,
        password_confirmation: passwordConfirm,
        role,
        equipe:                equipe || undefined,
      })
      setSuccess("Compte créé avec succès ! Redirection vers la connexion…")
      setTimeout(() => router.push("/login"), 1800)
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="rp-root">

        {/* ── COLONNE GAUCHE ── */}
        <div className="rp-left">
          <DrawerBackground />
          <div className="rp-left-inner">
            <div className="rp-brand">
              <div className="rp-brand-icon">
                <Mail size={20} color="#00205B" strokeWidth={2.5} />
              </div>
              <div className="rp-brand-name">
                <span className="w">Post</span><span className="y">SmartAI</span>
              </div>
            </div>
            <h1 className="rp-title">
              L'IA au service de votre<br />
              <span className="accent">relation</span> client.
            </h1>
            <p className="rp-sub">
              Rédigez des réponses impeccables, réduisez votre charge,
              gardez le lien humain.
            </p>
            <div className="rp-pills">
              {FEATURES.map(f => (
                <div key={f.text} className="rp-pill">
                  {f.icon}
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── COLONNE DROITE ── */}
        <div className="rp-right">

          {/* Mobile header */}
          <div className="rp-mob-header">
            <div className="rp-brand-icon" style={{ width: 32, height: 32 }}>
              <Mail size={15} color="#00205B" strokeWidth={2.5} />
            </div>
            <div className="rp-brand-name">
              <span className="w">Post</span><span className="y">SmartAI</span>
            </div>
          </div>

          <div className="rp-form-card">
            <h2 className="rp-form-title">Créer un compte</h2>
            <p className="rp-form-sub">Inscription sur PostSmartAI — La Poste</p>

            {/* Role tabs */}
            <div className="rp-tabs">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  className={`rp-tab${role === r.id ? ' rp-tab-active' : ''}`}
                  onClick={() => setRole(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate>

              {error && (
                <div className="rp-err">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              {success && (
                <div className="rp-success">
                  {success}
                </div>
              )}

              {/* Prénom / Nom */}
              <div className="rp-row">
                <div className="rp-field">
                  <label className="rp-label">Prénom</label>
                  <div className="rp-wrap">
                    <span className="rp-ico"><User size={16} /></span>
                    <input
                      type="text"
                      className="rp-inp"
                      placeholder="Jean"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                      autoComplete="given-name"
                    />
                  </div>
                </div>
                <div className="rp-field">
                  <label className="rp-label">Nom</label>
                  <div className="rp-wrap">
                    <span className="rp-ico"><User size={16} /></span>
                    <input
                      type="text"
                      className="rp-inp"
                      placeholder="Martin"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="rp-field">
                <label className="rp-label">Adresse e-mail</label>
                <div className="rp-wrap">
                  <span className="rp-ico"><Mail size={16} /></span>
                  <input
                    type="email"
                    className="rp-inp"
                    placeholder="prenom.nom@laposte.fr"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Équipe */}
              <div className="rp-field">
                <label className="rp-label">Équipe <span style={{ color: '#9CA3AF' }}>(optionnel)</span></label>
                <div className="rp-wrap">
                  <span className="rp-ico"><Phone size={16} /></span>
                  <input
                    type="text"
                    className="rp-inp"
                    placeholder="Équipe Paris Nord"
                    value={equipe}
                    onChange={e => setEquipe(e.target.value)}
                    autoComplete="organization"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="rp-field">
                <label className="rp-label">Mot de passe</label>
                <div className="rp-wrap">
                  <span className="rp-ico"><Lock size={16} /></span>
                  <input
                    type={showPw ? "text" : "password"}
                    className="rp-inp rp-inp-pr"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" className="rp-pw-btn" onClick={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirmation mot de passe */}
              <div className="rp-field">
                <label className="rp-label">Confirmer le mot de passe</label>
                <div className="rp-wrap">
                  <span className="rp-ico"><Lock size={16} /></span>
                  <input
                    type={showPwConfirm ? "text" : "password"}
                    className="rp-inp rp-inp-pr"
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" className="rp-pw-btn" onClick={() => setShowPwConfirm(v => !v)}>
                    {showPwConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="rp-btn" disabled={loading}>
                {loading
                  ? <><div className="rp-spinner" />Création en cours…</>
                  : <>Créer mon compte <ArrowRight size={15} /></>
                }
              </button>
            </form>

            <div className="rp-login-link">
              Déjà un compte ?{" "}
              <button type="button" className="rp-link" onClick={() => router.push("/login")}>
                Se connecter
              </button>
            </div>

            <div className="rp-sec">
              <ShieldCheck size={13} />
              Connexion sécurisée — RGPD conforme
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
