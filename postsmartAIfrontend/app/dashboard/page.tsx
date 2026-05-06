"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Mail, Clock, Star, Bell, ArrowRight, Phone, Bot, ChevronRight } from "lucide-react"
import { api } from "@/lib/api"

function getGreeting(firstName: string) {
  const h = new Date().getHours()
  if (h < 12) return `Bonjour ${firstName} 👋`
  if (h < 18) return `Bon après-midi ${firstName} 👋`
  return `Bonsoir ${firstName} 👋`
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({ emails_today: 0, avg_time: "—", quality_avg: "—", unread_notifications: 0 })
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("auth_user")
    if (stored) setUser(JSON.parse(stored))

    api.get<any>("/dashboard/stats").then(d => {
      setStats({
        emails_today: d.emails_today ?? 0,
        avg_time: d.avg_time ?? "45s",
        quality_avg: d.quality_avg ?? "92%",
        unread_notifications: d.unread_notifications ?? 0,
      })
    }).catch(() => {})

    api.get<any>("/notifications?per_page=5").then(d => {
      setNotifications(d.notifications?.data ?? [])
    }).catch(() => {})
  }, [])

  const firstName = user?.first_name ?? "Conseiller"

  const statCards = [
    {
      label: "Mails traités aujourd'hui",
      value: stats.emails_today,
      icon: <Mail size={22} color="#0066CC" />,
      color: "#0066CC",
      bg: "#EBF4FF",
    },
    {
      label: "Temps moyen de rédaction",
      value: stats.avg_time,
      icon: <Clock size={22} color="#16a34a" />,
      color: "#16a34a",
      bg: "#f0fdf4",
    },
    {
      label: "Score qualité moyen",
      value: stats.quality_avg,
      icon: <Star size={22} color="#d97706" />,
      color: "#d97706",
      bg: "#fffbeb",
    },
    {
      label: "Notifications non lues",
      value: stats.unread_notifications,
      icon: <Bell size={22} color={stats.unread_notifications > 0 ? "#dc2626" : "#6b7280"} />,
      color: stats.unread_notifications > 0 ? "#dc2626" : "#6b7280",
      bg: stats.unread_notifications > 0 ? "#fef2f2" : "#f9fafb",
    },
  ]

  const quickCards = [
    {
      title: "Traiter un mail entrant",
      description: "Analysez et répondez aux mails clients avec l'assistance IA.",
      href: "/dashboard/incoming",
      img: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=600&q=80",
      icon: <Mail size={20} color="#fff" />,
    },
    {
      title: "Compte-rendu d'appel",
      description: "Générez un mail structuré après chaque entretien téléphonique.",
      href: "/dashboard/call-report",
      img: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600&q=80",
      icon: <Phone size={20} color="#fff" />,
    },
    {
      title: "Assistant IA",
      description: "Posez vos questions et obtenez des réponses instantanées.",
      href: "/dashboard/generate",
      img: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80",
      icon: <Bot size={20} color="#fff" />,
    },
  ]

  const notifIcons: Record<string, string> = {
    account_created: "🎉",
    mail_processed: "📬",
    quality_alert: "⚠️",
    login_alert: "🔐",
    default: "🔔",
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        .db-root * { font-family: 'Inter', sans-serif; box-sizing: border-box; }

        .db-root { background: #f5f7fb; min-height: 100vh; }

        /* Hero */
        .hero {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, #0066CC 0%, #003D99 100%);
          padding: 2.5rem 2rem 3.5rem;
          color: #fff;
        }
        .hero-bg {
          position: absolute; inset: 0;
          background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80');
          background-size: cover; background-position: center;
          opacity: 0.08;
        }
        .hero-content { position: relative; z-index: 1; max-width: 700px; }
        .hero-greeting { font-size: 1.85rem; font-weight: 700; margin-bottom: 0.4rem; }
        .hero-sub { font-size: 1rem; color: rgba(255,255,255,0.82); margin-bottom: 1.75rem; }
        .hero-ctas { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .cta-primary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: #fff; color: #003D99;
          font-weight: 600; font-size: 0.9rem;
          padding: 0.6rem 1.4rem; border-radius: 9px;
          text-decoration: none; border: none; cursor: pointer;
          transition: box-shadow 0.2s, transform 0.15s;
        }
        .cta-primary:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.18); transform: translateY(-1px); }
        .cta-secondary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: #FFCC00; color: #1a1a1a;
          font-weight: 600; font-size: 0.9rem;
          padding: 0.6rem 1.4rem; border-radius: 9px;
          text-decoration: none; border: none; cursor: pointer;
          transition: box-shadow 0.2s, transform 0.15s;
        }
        .cta-secondary:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.18); transform: translateY(-1px); }

        /* Content area */
        .db-content { padding: 1.75rem 1.5rem; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.75rem; }

        /* Stat cards */
        .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        @media (min-width: 900px) { .stat-grid { grid-template-columns: repeat(4, 1fr); } }

        .stat-card {
          background: #fff; border-radius: 14px;
          padding: 1.25rem 1.2rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.07);
          display: flex; flex-direction: column; gap: 0.6rem;
        }
        .stat-icon { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 10px; }
        .stat-value { font-size: 1.75rem; font-weight: 700; color: #111827; }
        .stat-label { font-size: 0.8rem; color: #6b7280; font-weight: 500; }

        /* Section title */
        .section-title { font-size: 1.1rem; font-weight: 700; color: #1f2937; margin-bottom: 1rem; }

        /* Quick access cards */
        .quick-grid { display: grid; gap: 1rem; grid-template-columns: 1fr; }
        @media (min-width: 600px) { .quick-grid { grid-template-columns: repeat(3, 1fr); } }

        .quick-card {
          position: relative; border-radius: 14px; overflow: hidden;
          text-decoration: none; display: block;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: transform 0.2s, box-shadow 0.2s;
          min-height: 180px;
        }
        .quick-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,102,204,0.18); }
        .quick-card-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          transition: transform 0.35s;
        }
        .quick-card:hover .quick-card-bg { transform: scale(1.04); }
        .quick-card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(160deg, rgba(0,61,153,0.72) 0%, rgba(0,102,204,0.85) 100%);
          transition: opacity 0.2s;
        }
        .quick-card:hover .quick-card-overlay { opacity: 0.75; }
        .quick-card-body {
          position: relative; z-index: 1;
          padding: 1.4rem 1.3rem;
          display: flex; flex-direction: column; justify-content: flex-end;
          min-height: 180px; color: #fff;
        }
        .quick-card-icon {
          width: 38px; height: 38px; border-radius: 9px;
          background: rgba(255,255,255,0.18);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 0.8rem;
        }
        .quick-card-title { font-size: 1rem; font-weight: 700; margin-bottom: 0.3rem; }
        .quick-card-desc { font-size: 0.8rem; color: rgba(255,255,255,0.82); line-height: 1.4; }
        .quick-card-arrow {
          position: absolute; top: 1.1rem; right: 1.1rem;
          color: rgba(255,255,255,0.7);
        }

        /* Notifications */
        .notif-card {
          background: #fff; border-radius: 14px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.07);
          overflow: hidden;
        }
        .notif-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.2rem 1.25rem 0.75rem;
          border-bottom: 1px solid #f3f4f6;
        }
        .notif-list { display: flex; flex-direction: column; }
        .notif-item {
          display: flex; align-items: flex-start; gap: 0.9rem;
          padding: 0.9rem 1.25rem;
          border-bottom: 1px solid #f9fafb;
          transition: background 0.15s;
        }
        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: #f9fafb; }
        .notif-emoji { font-size: 1.25rem; margin-top: 0.1rem; }
        .notif-msg { font-size: 0.875rem; color: #374151; font-weight: 500; }
        .notif-time { font-size: 0.75rem; color: #9ca3af; margin-top: 0.15rem; }
        .notif-empty { padding: 2rem 1.25rem; text-align: center; color: #9ca3af; font-size: 0.875rem; }
        .notif-footer {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid #f3f4f6;
        }
        .see-all {
          display: inline-flex; align-items: center; gap: 0.3rem;
          font-size: 0.85rem; font-weight: 600; color: #0066CC;
          text-decoration: none;
        }
        .see-all:hover { color: #003D99; }
      `}</style>

      <div className="db-root">
        {/* Hero */}
        <div className="hero">
          <div className="hero-bg" />
          <div className="hero-content">
            <div className="hero-greeting">{getGreeting(firstName)}</div>
            <p className="hero-sub">PostAssist est là pour vous accompagner à chaque échange client.</p>
            <div className="hero-ctas">
              <Link href="/dashboard/incoming" className="cta-primary">
                <Mail size={16} /> Traiter un mail
              </Link>
              <Link href="/dashboard/call-report" className="cta-secondary">
                <Phone size={16} /> Nouveau compte-rendu
              </Link>
            </div>
          </div>
        </div>

        <div className="db-content">
          {/* Stats */}
          <div className="stat-grid">
            {statCards.map(card => (
              <div key={card.label} className="stat-card">
                <div className="stat-icon" style={{ background: card.bg }}>
                  {card.icon}
                </div>
                <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Quick access */}
          <div>
            <div className="section-title">Accès rapide</div>
            <div className="quick-grid">
              {quickCards.map(card => (
                <Link key={card.title} href={card.href} className="quick-card">
                  <div className="quick-card-bg" style={{ backgroundImage: `url('${card.img}')` }} />
                  <div className="quick-card-overlay" />
                  <div className="quick-card-body">
                    <div className="quick-card-icon">{card.icon}</div>
                    <div className="quick-card-title">{card.title}</div>
                    <div className="quick-card-desc">{card.description}</div>
                  </div>
                  <ChevronRight size={18} className="quick-card-arrow" />
                </Link>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <div className="section-title">Notifications récentes</div>
            <div className="notif-card">
              <div className="notif-header">
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1f2937" }}>Activité</span>
                <Link href="/dashboard/notifications" className="see-all">
                  Voir tout <ArrowRight size={13} />
                </Link>
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">Aucune notification récente</div>
                ) : notifications.slice(0, 5).map((n: any) => (
                  <div key={n.id} className="notif-item">
                    <span className="notif-emoji">{notifIcons[n.type] ?? notifIcons.default}</span>
                    <div>
                      <div className="notif-msg">{n.title}</div>
                      <div className="notif-time">{n.message?.slice(0, 80)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="notif-footer">
                <Link href="/dashboard/notifications" className="see-all">
                  Toutes les notifications <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
