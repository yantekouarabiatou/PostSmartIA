"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight,
  Bot, Phone, Check, AlertCircle, Sparkles,
  WifiOff, ServerCrash, X, UserX,
} from "lucide-react"
import { DrawerBackground } from "@/components/DrawerBackground"
import { api } from "@/lib/api"
import { LanguageProvider, LangSwitcher, useI18n } from "@/lib/i18n"

// ── Types ────────────────────────────────────────────────────────────────────

type RoleId = "conseiller" | "manager" | "admin"

const ROLE_EMOJIS: Record<RoleId, string> = {
  conseiller: "👤",
  manager:    "👥",
  admin:      "🔐",
}

const DEMOS: Record<RoleId, { email: string; password: string }> = {
  conseiller: { email: "jean.martin@laposte.fr", password: "Conseiller@2024!" },
  manager:    { email: "manager@laposte.fr",      password: "Manager@2024!"    },
  admin:      { email: "admin@laposte.fr",          password: "Admin@2024!"      },
}

type ErrorInfo = {
  title: string; detail: string
  type: "auth" | "server" | "network" | "account"
}

function getErrorType(raw: string): ErrorInfo["type"] {
  const l = raw.toLowerCase()
  if (l.includes("database") || l.includes("500") || l.includes("server error")) return "server"
  if (l.includes("failed to fetch") || l.includes("network") || l.includes("fetch") || l.includes("timeout") || l.includes("inaccessible")) return "network"
  if (l.includes("désactivé") || l.includes("403")) return "account"
  return "auth"
}

const ERR_ICONS: Record<ErrorInfo["type"], React.ReactNode> = {
  auth:    <AlertCircle size={15} />,
  server:  <ServerCrash size={15} />,
  network: <WifiOff size={15} />,
  account: <UserX size={15} />,
}

// ── Animated counter ──────────────────────────────────────────────────────────

function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let step = 0
    const steps = 55
    const timer = setInterval(() => {
      step++
      setVal(Math.round((end / steps) * Math.min(step, steps)))
      if (step >= steps) clearInterval(timer)
    }, 1400 / steps)
    return () => clearInterval(timer)
  }, [end])
  return <>{val.toLocaleString("fr-FR")}{suffix}</>
}

// ── Floating AI preview card ──────────────────────────────────────────────────

function AiCard() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 2000),
      setTimeout(() => setPhase(2), 3600),
      setTimeout(() => { setPhase(0) }, 7000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [phase])

  return (
    <div style={{
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 18,
      padding: "18px 20px",
      width: 300,
      backdropFilter: "blur(12px)",
      animation: "card-float 5s ease-in-out infinite",
      boxShadow: "0 24px 48px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: "rgba(255,204,0,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Mail size={16} color="#FFCC00" />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff" }}>Nouveau mail entrant</p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>jean.petit@gmail.com</p>
        </div>
        <span style={{
          marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "2px 8px",
          borderRadius: 20, background: "rgba(255,204,0,0.15)", color: "#FFCC00",
          border: "1px solid rgba(255,204,0,0.3)",
        }}>Nouveau</span>
      </div>

      {/* Email snippet */}
      <div style={{
        background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px",
        marginBottom: 12, border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
          Suivi colis n° 1Z999AA10123456784
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
          Bonjour, mon colis commandé le 3 mai n'est toujours pas arrivé…
        </p>
      </div>

      {phase === 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: "rgba(0,102,204,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Bot size={12} color="#60a5fa" />
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>En attente d'analyse IA…</p>
        </div>
      )}

      {phase === 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: "rgba(251,191,36,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Sparkles size={11} color="#FCD34D" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#FCD34D" }}>IA en cours d'analyse…</p>
            <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "#FCD34D",
                  animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "Type détecté", value: "Suivi colis", color: "#34D399" },
            { label: "Score qualité", value: "92 / 100",   color: "#60a5fa" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "6px 10px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Check size={11} color={color} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{label}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}</span>
            </div>
          ))}
          <div style={{
            marginTop: 4, padding: "8px 10px", borderRadius: 10,
            background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
          }}>
            <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "#34D399" }}>✉ Réponse générée</p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
              Monsieur Petit, je comprends votre inquiétude concernant…
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lp-root {
    display: flex; min-height: 100vh;
    font-family: 'Inter', sans-serif;
    background: #03091A;
  }

  /* ═══════════ LEFT ═══════════ */
  .lp-left {
    display: none; position: relative; flex: 0 0 55%;
    background: #03091A; overflow: hidden;
  }
  @media (min-width: 900px) {
    .lp-left { display: flex; flex-direction: column; justify-content: space-between; }
  }

  /* Dot grid */
  .lp-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image: radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  /* Gradient orbs */
  .lp-orb {
    position: absolute; border-radius: 50%;
    pointer-events: none; filter: blur(60px);
  }
  .lp-orb-1 {
    width: 480px; height: 480px;
    background: radial-gradient(circle, rgba(0,102,204,0.35) 0%, transparent 70%);
    top: -120px; right: -80px;
    animation: orb-drift 18s ease-in-out infinite;
  }
  .lp-orb-2 {
    width: 360px; height: 360px;
    background: radial-gradient(circle, rgba(255,204,0,0.12) 0%, transparent 70%);
    bottom: -80px; left: -60px;
    animation: orb-drift 22s ease-in-out infinite reverse;
  }
  .lp-orb-3 {
    width: 280px; height: 280px;
    background: radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%);
    top: 40%; left: 10%;
    animation: orb-drift 14s ease-in-out 3s infinite;
  }

  @keyframes orb-drift {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(20px,-25px) scale(1.06); }
    66%      { transform: translate(-15px,18px) scale(0.97); }
  }

  /* Inner */
  .lp-left-inner {
    position: relative; z-index: 2;
    padding: 2.25rem 2.75rem 1.5rem;
    display: flex; flex-direction: column; gap: 1.75rem; flex: 1;
    animation: slide-up 0.55s cubic-bezier(.22,1,.36,1) both;
  }

  /* Logo */
  .lp-logo { display: flex; align-items: center; gap: 12px; }
  .lp-logo-badge {
    width: 44px; height: 44px; border-radius: 13px;
    background: linear-gradient(135deg, #FFCC00, #FFB300);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(255,204,0,0.4);
    flex-shrink: 0;
  }
  .lp-logo-name { font-size: 22px; font-weight: 800; letter-spacing: -0.03em; }
  .lp-logo-name .w { color: #fff; }
  .lp-logo-name .y { color: #FFCC00; }
  .lp-logo-pill {
    font-size: 10px; font-weight: 600;
    background: rgba(255,204,0,0.12); border: 1px solid rgba(255,204,0,0.28);
    color: #FFCC00; border-radius: 20px; padding: 2px 8px; margin-left: 2px;
  }

  /* Headline */
  .lp-headline { display: flex; flex-direction: column; gap: 12px; }
  .lp-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,204,0,0.1); border: 1px solid rgba(255,204,0,0.25);
    border-radius: 20px; padding: 5px 12px; width: fit-content;
    font-size: 11.5px; font-weight: 500; color: #FFCC00;
  }
  .lp-h1 {
    font-size: 36px; font-weight: 800; line-height: 1.2;
    letter-spacing: -0.035em; color: #fff;
  }
  .lp-h1-grad {
    background: linear-gradient(135deg, #60a5fa 0%, #FFCC00 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .lp-desc {
    font-size: 14px; color: rgba(255,255,255,0.48);
    line-height: 1.75; max-width: 400px;
  }

  /* Features */
  .lp-features { display: flex; flex-direction: column; gap: 8px; }
  .lp-feat {
    display: flex; align-items: center; gap: 13px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 13px; padding: 12px 15px;
    backdrop-filter: blur(4px);
    transition: background 200ms, border-color 200ms;
  }
  .lp-feat:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.14); }
  .lp-feat-icon {
    width: 34px; height: 34px; border-radius: 9px;
    background: rgba(255,204,0,0.12);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .lp-feat-text { font-size: 13px; color: rgba(255,255,255,0.8); font-weight: 500; }

  /* AI preview */
  .lp-preview {
    position: relative; z-index: 2; padding: 0 2.75rem 0;
    display: flex; align-items: center; justify-content: center;
  }

  @keyframes card-float {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-10px); }
  }
  @keyframes dot-pulse {
    0%,80%,100% { transform: scale(0); opacity: .4; }
    40%         { transform: scale(1); opacity: 1; }
  }

  /* Stats */
  .lp-stats-wrap {
    position: relative; z-index: 2;
    padding: 0 2.75rem 1.75rem;
  }
  .lp-stats {
    display: flex; gap: 0;
    border-top: 1px solid rgba(255,255,255,0.08);
    padding-top: 1.5rem;
  }
  .lp-stat {
    flex: 1; padding: 0 1.25rem;
    border-right: 1px solid rgba(255,255,255,0.08);
  }
  .lp-stat:first-child { padding-left: 0; }
  .lp-stat:last-child  { border-right: none; }
  .lp-stat-val { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.03em; }
  .lp-stat-lbl { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 3px; }

  /* ═══════════ RIGHT ═══════════ */
  .lp-right {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: #F0F3FA; padding: 1.5rem 1.25rem;
    min-width: 0; position: relative; overflow: hidden;
  }
  .lp-right::before {
    content: '';
    position: absolute; width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0,102,204,0.07) 0%, transparent 65%);
    top: -200px; right: -200px; pointer-events: none;
  }
  .lp-right::after {
    content: '';
    position: absolute; width: 400px; height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,204,0,0.05) 0%, transparent 65%);
    bottom: -150px; left: -100px; pointer-events: none;
  }

  /* Mobile logo */
  .lp-mob-logo {
    display: flex; align-items: center; gap: 10px; margin-bottom: 1.75rem;
  }
  @media (min-width: 900px) { .lp-mob-logo { display: none; } }

  /* Card */
  .lp-card {
    position: relative; z-index: 1;
    width: 100%; max-width: 424px;
    background: #fff;
    border-radius: 22px;
    padding: 2rem 2rem 1.6rem;
    box-shadow:
      0 1px 0 rgba(0,32,91,0.04),
      0 6px 24px rgba(0,32,91,0.09),
      0 32px 60px rgba(0,32,91,0.07);
    border: 1px solid rgba(0,32,91,0.06);
    animation: slide-up 0.5s cubic-bezier(.22,1,.36,1) 0.05s both;
  }

  /* Gradient top bar */
  .lp-card::before {
    content: '';
    position: absolute; top: 0; left: 1.75rem; right: 1.75rem;
    height: 3px;
    background: linear-gradient(90deg, #FFCC00 0%, #0066CC 50%, #00205B 100%);
    border-radius: 0 0 4px 4px;
  }

  .lp-card-title {
    font-size: 22px; font-weight: 800;
    color: #0d1117; letter-spacing: -0.025em;
    margin-bottom: 4px;
  }
  .lp-card-sub { font-size: 13px; color: #8B95A2; margin-bottom: 1.6rem; }

  /* Role selector */
  .lp-roles {
    display: flex; gap: 6px;
    background: #F3F5F9; border-radius: 14px;
    padding: 5px; margin-bottom: 1.5rem;
  }
  .lp-role-btn {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
    padding: 9px 6px; border: none; border-radius: 10px;
    background: transparent; cursor: pointer;
    transition: all 0.2s; font-family: 'Inter', sans-serif;
  }
  .lp-role-btn:hover:not(.active) { background: rgba(0,0,0,0.04); }
  .lp-role-btn.active {
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,32,91,0.12), 0 0 0 1px rgba(0,102,204,0.15);
  }
  .lp-role-emoji { font-size: 17px; line-height: 1; }
  .lp-role-label {
    font-size: 11.5px; font-weight: 600;
    color: #6B7280; transition: color 0.2s;
  }
  .lp-role-btn.active .lp-role-label { color: #0066CC; }
  .lp-role-desc {
    font-size: 10px; color: #9CA3AF; line-height: 1;
  }
  .lp-role-btn.active .lp-role-desc { color: rgba(0,102,204,0.7); }

  /* Divider */
  .lp-div {
    height: 1px; background: #F0F2F5;
    margin-bottom: 1.4rem;
  }

  /* Field */
  .lp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1rem; }
  .lp-label { font-size: 12.5px; font-weight: 600; color: #374151; }
  .lp-wrap  { position: relative; }
  .lp-ico {
    position: absolute; left: 13px; top: 50%;
    transform: translateY(-50%); color: #B0B8C4;
    display: flex; align-items: center; pointer-events: none;
    transition: color 0.18s;
  }
  .lp-inp {
    width: 100%; height: 46px;
    border: 1.5px solid #E5E8EF; border-radius: 12px;
    background: #FAFBFD; padding: 0 14px 0 42px;
    font-size: 14px; color: #0d1117; outline: none;
    transition: all 0.18s; font-family: 'Inter', sans-serif;
  }
  .lp-inp::placeholder { color: #C4CAD4; }
  .lp-inp:focus {
    border-color: #0066CC;
    box-shadow: 0 0 0 4px rgba(0,102,204,0.10);
    background: #fff;
  }
  .lp-wrap:focus-within .lp-ico { color: #0066CC; }
  .lp-inp-pr { padding-right: 46px; }
  .lp-pw-btn {
    position: absolute; right: 12px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: #B0B8C4; display: flex; align-items: center;
    padding: 4px; border-radius: 6px; transition: color 0.15s;
  }
  .lp-pw-btn:hover { color: #4B5563; }

  /* Row opts */
  .lp-opts {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.35rem;
  }
  .lp-remember { display: flex; align-items: center; gap: 8px; cursor: pointer; }
  .lp-cb-wrap  { position: relative; width: 17px; height: 17px; flex-shrink: 0; }
  .lp-cb-wrap input { position: absolute; opacity: 0; width: 0; height: 0; }
  .lp-cb {
    width: 17px; height: 17px; border: 1.5px solid #D1D5DB;
    border-radius: 5px; background: #fff;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .lp-cb-wrap input:checked + .lp-cb { background: #0066CC; border-color: #0066CC; }
  .lp-remember-lbl { font-size: 12.5px; color: #6B7280; user-select: none; }
  .lp-forgot {
    font-size: 12.5px; font-weight: 500; color: #0066CC;
    background: none; border: none; cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: color 0.15s;
  }
  .lp-forgot:hover { color: #003D99; text-decoration: underline; }

  /* Error box */
  @keyframes err-in {
    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    40%      { transform: translateX(6px); }
    60%      { transform: translateX(-4px); }
    80%      { transform: translateX(4px); }
  }
  .lp-err {
    display: flex; align-items: flex-start; gap: 10px;
    border-radius: 12px; padding: 12px 13px;
    margin-bottom: 1.15rem; border: 1px solid;
    animation: err-in 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  .lp-err-auth    { background: #FEF2F2; border-color: #FECACA; border-left: 3px solid #EF4444; }
  .lp-err-server  { background: #FFFBEB; border-color: #FDE68A; border-left: 3px solid #F59E0B; }
  .lp-err-network { background: #EFF6FF; border-color: #BFDBFE; border-left: 3px solid #3B82F6; }
  .lp-err-account { background: #FDF4FF; border-color: #E9D5FF; border-left: 3px solid #A855F7; }
  .lp-err-ico {
    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .lp-err-auth    .lp-err-ico { background: rgba(239,68,68,0.10);  color: #EF4444; }
  .lp-err-server  .lp-err-ico { background: rgba(245,158,11,0.10); color: #F59E0B; }
  .lp-err-network .lp-err-ico { background: rgba(59,130,246,0.10); color: #3B82F6; }
  .lp-err-account .lp-err-ico { background: rgba(168,85,247,0.10); color: #A855F7; }
  .lp-err-body { flex: 1; }
  .lp-err-t { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 2px; }
  .lp-err-d { font-size: 11.5px; color: #6B7280; line-height: 1.5; }
  .lp-err-x {
    background: none; border: none; cursor: pointer;
    color: #9CA3AF; padding: 2px; border-radius: 4px;
    display: flex; flex-shrink: 0; transition: color 0.15s;
  }
  .lp-err-x:hover { color: #374151; }
  .lp-shake { animation: shake 0.4s ease; }

  /* Submit button */
  .lp-btn {
    width: 100%; height: 48px;
    background: linear-gradient(135deg, #0066CC 0%, #004FA3 100%);
    color: #fff; border: none; border-radius: 13px;
    font-size: 14.5px; font-weight: 600; letter-spacing: 0.01em;
    cursor: pointer; font-family: 'Inter', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(0,102,204,0.35), 0 0 0 0 rgba(0,102,204,0);
    margin-bottom: 1.3rem; position: relative; overflow: hidden;
  }
  .lp-btn::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
    pointer-events: none;
  }
  .lp-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #0052a3 0%, #003d7a 100%);
    box-shadow: 0 6px 22px rgba(0,102,204,0.48), 0 0 0 0 rgba(0,102,204,0);
    transform: translateY(-1px);
  }
  .lp-btn:active:not(:disabled) { transform: translateY(0); }
  .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .lp-spin {
    width: 15px; height: 15px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    animation: spin 0.65s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Register */
  .lp-reg { text-align: center; font-size: 13px; color: #8B95A2; margin-bottom: 1.3rem; }
  .lp-reg-link {
    font-size: 13px; font-weight: 600; color: #0066CC;
    background: none; border: none; cursor: pointer;
    font-family: 'Inter', sans-serif;
  }
  .lp-reg-link:hover { color: #003D99; text-decoration: underline; }

  /* Sécurité */
  .lp-sec {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: 11.5px; color: #B0BAC9;
    padding-top: 1rem; border-top: 1px solid #F0F2F5;
  }
  .lp-sec-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #34D399; flex-shrink: 0;
    box-shadow: 0 0 6px rgba(52,211,153,0.65);
  }

  /* Animations */
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

// ── Inner page ────────────────────────────────────────────────────────────────

function LoginContent() {
  const router = useRouter()
  const { t }  = useI18n()
  const tl     = t.login

  const ROLES = (["conseiller", "manager", "admin"] as RoleId[]).map(id => ({
    id,
    emoji: ROLE_EMOJIS[id],
    label: tl.roles[id].label,
    desc:  tl.roles[id].desc,
  }))

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
      const type = getErrorType(err.message ?? "")
      const errorMessages: Record<ErrorInfo["type"], { title: string; detail: string }> = {
        server:  { title: tl.errors.server,  detail: "Nos serveurs rencontrent un problème technique. Réessayez dans quelques instants." },
        network: { title: tl.errors.network, detail: "Impossible de joindre le serveur. Vérifiez votre connexion internet." },
        account: { title: tl.errors.account, detail: "Votre compte a été désactivé. Contactez votre administrateur." },
        auth:    { title: tl.errors.auth,    detail: "L'e-mail ou le mot de passe est incorrect. Vérifiez vos informations." },
      }
      const info = { type, ...errorMessages[type] }
      setError(info)
      if (info.type === "auth") {
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

        {/* ══════════════ LEFT PANEL ══════════════ */}
        <div className="lp-left">
          <DrawerBackground />
          <div className="lp-grid" />
          <div className="lp-orb lp-orb-1" />
          <div className="lp-orb lp-orb-2" />
          <div className="lp-orb lp-orb-3" />

          <div className="lp-left-inner">
            {/* Logo */}
            <div className="lp-logo">
              <div className="lp-logo-badge">
                <Mail size={20} color="#00205B" strokeWidth={2.5} />
              </div>
              <div>
                <div className="lp-logo-name">
                  <span className="w">Post</span><span className="y">Smart</span>
                  <span className="w"> IA</span>
                </div>
              </div>
              <span className="lp-logo-pill">by La Poste</span>
            </div>

            {/* Headline */}
            <div className="lp-headline">
              <div className="lp-tag">
                <Sparkles size={11} />
                Propulsé par Gemini AI + Groq
              </div>
              <h1 className="lp-h1">
                L&apos;IA qui transforme{" "}
                <br />
                <span className="lp-h1-grad">votre relation client.</span>
              </h1>
              <p className="lp-desc">
                Répondez à vos mails en quelques secondes, générez vos
                comptes-rendus d&apos;appel et gardez un lien humain avec chaque client.
              </p>
            </div>

            {/* Features */}
            <div className="lp-features">
              {[
                { icon: <Mail size={15} color="#FFCC00" />,  text: "Analyse et réponse IA aux mails entrants"   },
                { icon: <Phone size={15} color="#FFCC00" />, text: "Compte-rendu d'appel en 30 secondes"        },
                { icon: <Bot size={15} color="#FFCC00" />,   text: "Assistant documentaire disponible 24/7"     },
              ].map(f => (
                <div key={f.text} className="lp-feat">
                  <div className="lp-feat-icon">{f.icon}</div>
                  <span className="lp-feat-text">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating AI preview */}
          <div className="lp-preview">
            <AiCard />
          </div>

          {/* Stats */}
          <div className="lp-stats-wrap">
            <div className="lp-stats">
              {[
                { end: 2400,  suffix: "+", label: "Conseillers actifs"       },
                { end: 18000, suffix: "",  label: "Emails traités / jour"    },
                { end: 65,    suffix: "%", label: "Temps de réponse réduit"  },
              ].map(s => (
                <div key={s.label} className="lp-stat">
                  <div className="lp-stat-val">
                    {s.label === "Temps de réponse réduit" && "−"}
                    <Counter end={s.end} suffix={s.suffix} />
                  </div>
                  <div className="lp-stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════ RIGHT PANEL ══════════════ */}
        <div className="lp-right">

          {/* Mobile logo */}
          <div className="lp-mob-logo">
            <div className="lp-logo-badge">
              <Mail size={17} color="#00205B" strokeWidth={2.5} />
            </div>
            <div className="lp-logo-name" style={{ fontSize: 18 }}>
              <span style={{ color: "#00205B" }}>Post</span>
              <span style={{ color: "#0066CC" }}>Smart IA</span>
            </div>
          </div>

          {/* Lang switcher (desktop) */}
          <div style={{ position: "absolute", top: 20, right: 24, zIndex: 10 }}>
            <LangSwitcher dark />
          </div>

          <div className="lp-card">
            <h2 className="lp-card-title">Bon retour 👋</h2>
            <p className="lp-card-sub">Connectez-vous à votre espace PostSmart IA</p>

            {/* Role selector */}
            <div className="lp-roles">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  className={`lp-role-btn${role === r.id ? " active" : ""}`}
                  onClick={() => pickRole(r.id)}
                >
                  <span className="lp-role-emoji">{r.emoji}</span>
                  <span className="lp-role-label">{r.label}</span>
                  <span className="lp-role-desc">{r.desc}</span>
                </button>
              ))}
            </div>

            <div className="lp-div" />

            <form onSubmit={handleSubmit} noValidate>

              {/* Error */}
              {error && (
                <div className={`lp-err lp-err-${error.type}`}>
                  <div className="lp-err-ico">{ERR_ICONS[error.type]}</div>
                  <div className="lp-err-body">
                    <p className="lp-err-t">{error.title}</p>
                    <p className="lp-err-d">{error.detail}</p>
                  </div>
                  <button type="button" className="lp-err-x" onClick={() => setError(null)}>
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Email */}
              <div className="lp-field">
                <label className="lp-label">{tl.emailLabel}</label>
                <div className="lp-wrap">
                  <span className="lp-ico"><Mail size={15} /></span>
                  <input
                    type="email"
                    className={`lp-inp${shake ? " lp-shake" : ""}`}
                    placeholder={tl.emailPlaceholder}
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null) }}
                    required autoComplete="email"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="lp-field">
                <label className="lp-label">{tl.passwordLabel}</label>
                <div className="lp-wrap">
                  <span className="lp-ico"><Lock size={15} /></span>
                  <input
                    type={showPw ? "text" : "password"}
                    className={`lp-inp lp-inp-pr${shake ? " lp-shake" : ""}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(null) }}
                    required autoComplete="current-password"
                  />
                  <button type="button" className="lp-pw-btn" onClick={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="lp-opts">
                <label className="lp-remember">
                  <span className="lp-cb-wrap">
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                    <span className="lp-cb">
                      {rememberMe && <Check size={10} color="#fff" strokeWidth={3} />}
                    </span>
                  </span>
                  <span className="lp-remember-lbl">{tl.rememberMe}</span>
                </label>
                <button type="button" className="lp-forgot">Mot de passe oublié ?</button>
              </div>

              {/* Submit */}
              <button type="submit" className="lp-btn" disabled={loading}>
                {loading
                  ? <><div className="lp-spin" /> {tl.submitting}</>
                  : <>{tl.submit} <ArrowRight size={16} /></>
                }
              </button>
            </form>

            {/* Register */}
            <div className="lp-reg">
              Pas encore de compte ?{" "}
              <button type="button" className="lp-reg-link" onClick={() => router.push("/register")}>
                Créer un compte
              </button>
            </div>

            {/* Security */}
            <div className="lp-sec">
              <span className="lp-sec-dot" />
              <ShieldCheck size={12} />
              Connexion sécurisée · TLS · RGPD conforme
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

// ── Page wrapper ──────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <LanguageProvider>
      <LoginContent />
    </LanguageProvider>
  )
}
