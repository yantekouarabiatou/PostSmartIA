"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { api } from "@/lib/api"

interface AuthUser {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  equipe?: string
  avatar?: string
}

interface Notification {
  id: number
  title: string
  message: string
  is_read: boolean
  created_at: string
}

const ROLE_LABEL: Record<string, string> = {
  conseiller: "Conseiller",
  manager: "Manager",
  admin: "Administrateur",
}

const ROLE_COLOR: Record<string, string> = {
  conseiller: "#0066CC",
  manager: "#854F0B",
  admin: "#993C1D",
}

const NAV_LINKS = [
  { label: "Tableau de bord", path: "/dashboard" },
  { label: "Mails entrants",  path: "/dashboard/incoming" },
  { label: "Formulaires",     path: "/dashboard/forms" },
  { label: "Générer un email", path: "/dashboard/generate" },
  { label: "Historique",      path: "/dashboard/history" },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Bonjour"
  if (h < 18) return "Bon après-midi"
  return "Bonsoir"
}

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()

  const [user, setUser]               = useState<AuthUser | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifs, setShowNotifs]   = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const notifsRef  = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored) setUser(JSON.parse(stored))
    } catch {}
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifsRef.current  && !notifsRef.current.contains(e.target as Node))  setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function fetchNotifications() {
    try {
      const data = await api.get<any>("/notifications?per_page=5")
      const items: Notification[] = data?.data ?? []
      setNotifications(items)
      setUnreadCount(data?.unread_count ?? items.filter((n) => !n.is_read).length)
    } catch {}
  }

  async function markAllRead() {
    try {
      await api.put("/notifications/read-all", {})
      fetchNotifications()
    } catch {}
  }

  async function handleLogout() {
    try { await api.post("/auth/logout", {}) } catch {}
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    localStorage.removeItem("remember_me")
    router.push("/login")
  }

  const initials = user
    ? `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase()
    : "?"

  const isManagerOrAdmin = user?.role === "manager" || user?.role === "admin"
  const isAdmin = user?.role === "admin"

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      height: "64px", background: "#00205B",
      display: "flex", alignItems: "center",
      padding: "0 24px", gap: "8px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
    }}>
      {/* Logo */}
      <Link href="/dashboard" style={{
        display: "flex", alignItems: "center", gap: "10px",
        marginRight: "16px", textDecoration: "none",
      }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "8px",
          background: "#FFCC00", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "16px",
        }}>✉</div>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: "16px" }}>
          PostSmart<span style={{ color: "#FFCC00" }}> IA</span>
        </span>
      </Link>

      {/* Nav links */}
      {NAV_LINKS.map(item => (
        <Link
          key={item.path}
          href={item.path}
          style={{
            color: pathname === item.path ? "#FFCC00" : "rgba(255,255,255,0.75)",
            fontSize: "13px", fontWeight: 500,
            padding: "6px 12px", borderRadius: "8px",
            textDecoration: "none",
            background: pathname === item.path ? "rgba(255,204,0,0.12)" : "transparent",
            transition: "all 150ms",
            whiteSpace: "nowrap",
          }}
        >
          {item.label}
        </Link>
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Greeting */}
      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", whiteSpace: "nowrap" }}>
        {getGreeting()},{" "}
        <strong style={{ color: "#FFCC00" }}>{user?.first_name ?? "…"}</strong>
      </span>

      {/* Notifications */}
      <div ref={notifsRef} style={{ position: "relative" }}>
        <button
          onClick={() => setShowNotifs(v => !v)}
          style={{
            position: "relative", background: "rgba(255,255,255,0.1)",
            border: "none", borderRadius: "8px", width: "38px", height: "38px",
            cursor: "pointer", color: "#fff", fontSize: "18px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          🔔
          {unreadCount > 0 && (
            <span style={{
              position: "absolute", top: "4px", right: "4px",
              background: "#FF4444", color: "#fff", borderRadius: "50%",
              width: "16px", height: "16px", fontSize: "10px", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1.5px solid #00205B",
            }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <div style={{
            position: "absolute", top: "48px", right: 0,
            width: "360px", background: "#fff", borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)", border: "1px solid #E5E7EB",
            overflow: "hidden", zIndex: 1001,
          }}>
            <div style={{
              padding: "14px 16px", borderBottom: "1px solid #F0F0F0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontWeight: 600, fontSize: "14px", color: "#00205B" }}>
                Notifications {unreadCount > 0 && <span style={{ color: "#0066CC" }}>({unreadCount})</span>}
              </span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{
                  background: "none", border: "none", color: "#0066CC",
                  fontSize: "12px", cursor: "pointer",
                }}>
                  Tout marquer lu
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#9CA3AF", fontSize: "13px" }}>
                Aucune notification
              </div>
            ) : notifications.map(n => (
              <div key={n.id} style={{
                padding: "12px 16px", borderBottom: "1px solid #F9F9F9",
                background: n.is_read ? "#fff" : "#F0F7FF",
              }}>
                <p style={{
                  margin: 0, fontSize: "13px",
                  fontWeight: n.is_read ? 400 : 600, color: "#1A1A2E",
                }}>{n.title}</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>{n.message}</p>
              </div>
            ))}
            <div style={{ padding: "10px 16px", borderTop: "1px solid #F0F0F0", textAlign: "center" }}>
              <Link
                href="/dashboard/notifications"
                onClick={() => setShowNotifs(false)}
                style={{ color: "#0066CC", fontSize: "12px", textDecoration: "none" }}
              >
                Voir toutes les notifications →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div ref={profileRef} style={{ position: "relative" }}>
        <button
          onClick={() => setShowProfile(v => !v)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(255,255,255,0.1)", border: "none",
            borderRadius: "8px", padding: "5px 10px", cursor: "pointer",
          }}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.first_name}
              style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{
              width: "30px", height: "30px", borderRadius: "50%",
              background: "#FFCC00", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#00205B",
            }}>{initials}</div>
          )}
          <span style={{ color: "#fff", fontSize: "13px", fontWeight: 500 }}>
            {user?.first_name ?? "…"}
          </span>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>▼</span>
        </button>

        {showProfile && (
          <div style={{
            position: "absolute", top: "48px", right: 0,
            width: "240px", background: "#fff", borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)", border: "1px solid #E5E7EB",
            overflow: "hidden", zIndex: 1001,
          }}>
            {/* User info */}
            <div style={{ padding: "16px", borderBottom: "1px solid #F0F0F0", background: "#F8FAFF" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "#FFCC00", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 700, color: "#00205B",
                fontSize: "14px", marginBottom: "8px",
              }}>{initials}</div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#00205B" }}>
                {user?.first_name} {user?.last_name}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>{user?.email}</p>
              {user?.role && (
                <span style={{
                  display: "inline-block", marginTop: "6px",
                  padding: "2px 8px", borderRadius: "20px", fontSize: "11px",
                  fontWeight: 600, color: "#fff",
                  background: ROLE_COLOR[user.role] ?? "#0066CC",
                }}>
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
              )}
            </div>

            {/* Menu items */}
            {[
              ...(isManagerOrAdmin ? [{ label: "👥 Gestion utilisateurs", path: "/dashboard/users" }] : []),
              ...(isAdmin ? [{ label: "🔐 Journaux d'activité", path: "/dashboard/logs" }] : []),
            ].map(item => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setShowProfile(false)}
                style={{
                  display: "block", padding: "11px 16px",
                  fontSize: "13px", color: "#374151",
                  textDecoration: "none", borderBottom: "1px solid #F9F9F9",
                }}
              >
                {item.label}
              </Link>
            ))}

            <button
              onClick={handleLogout}
              style={{
                width: "100%", padding: "11px 16px", background: "none",
                border: "none", textAlign: "left", fontSize: "13px",
                color: "#DC2626", cursor: "pointer",
              }}
            >
              🚪 Se déconnecter
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
