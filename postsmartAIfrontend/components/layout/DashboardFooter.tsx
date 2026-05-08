"use client"

import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

function FooterBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: "rgba(255,255,255,0.5)", fontSize: "12px",
        display: "flex", alignItems: "center", gap: "5px",
        fontFamily: "inherit", padding: "0",
        transition: "color 150ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.color = "#FFCC00" }}
      onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.5)" }}
    >
      {label}
    </button>
  )
}

export default function DashboardFooter() {
  const router = useRouter()

  async function handleLogout() {
    try { await api.post("/auth/logout", {}) } catch {}
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    localStorage.removeItem("remember_me")
    router.push("/")
  }

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      height: "36px", background: "#00205B",
      display: "flex", alignItems: "center",
      justifyContent: "center", gap: "24px",
      borderTop: "1px solid rgba(255,255,255,0.1)",
      zIndex: 999,
    }}>
      <FooterBtn onClick={() => router.push("/")} label="🏠 Page d'accueil" />
      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>|</span>
      <FooterBtn onClick={() => router.push("/login")} label="🔑 Connexion" />
      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>|</span>
      <FooterBtn onClick={handleLogout} label="🚪 Déconnexion" />
      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>|</span>
      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>
        PostSmart IA © 2026
      </span>
    </div>
  )
}
