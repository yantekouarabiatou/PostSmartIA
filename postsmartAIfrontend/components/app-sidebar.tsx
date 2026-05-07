"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Mail,
  History,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Inbox,
  Bell,
  Users,
  Shield,
  KeyRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { api } from "@/lib/api"

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface AuthUser {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  equipe?: string
  avatar?: string
}

const ROLE_LABELS: Record<string, string> = {
  conseiller: "Conseiller",
  manager: "Manager",
  admin: "Administrateur",
}

const BASE_NAV = [
  { title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { title: "Mails entrants", href: "/dashboard/incoming", icon: Inbox },
  { title: "Compte-rendu d'appel", href: "/dashboard/call-report", icon: Phone },
  { title: "Générer un email", href: "/dashboard/generate", icon: Mail },
  { title: "Historique", href: "/dashboard/history", icon: History },
  { title: "Base de connaissances", href: "/dashboard/knowledge", icon: BookOpen },
]

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem("auth_user")
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
  }, [])

  useEffect(() => {
    api.get<any>("/notifications?per_page=1")
      .then(d => setUnreadCount(d.unread_count ?? 0))
      .catch(() => {})

    const interval = setInterval(() => {
      api.get<any>("/notifications?per_page=1")
        .then(d => setUnreadCount(d.unread_count ?? 0))
        .catch(() => {})
    }, 30_000)

    return () => clearInterval(interval)
  }, [])

  async function handleLogout() {
    try { await api.post("/auth/logout", {}) } catch {}
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    localStorage.removeItem("remember_me")
    router.push("/login")
  }

  const isManagerOrAdmin = user?.role === "manager" || user?.role === "admin"
  const isAdmin = user?.role === "admin"

  const navItems = [
    ...BASE_NAV,
    ...(isManagerOrAdmin
      ? [{ title: "Gestion utilisateurs", href: "/dashboard/users", icon: Users }]
      : []),
    ...(isAdmin
      ? [
          { title: "Journaux d'activité",   href: "/dashboard/logs",        icon: Shield },
          { title: "Gestion des permissions", href: "/dashboard/permissions", icon: KeyRound },
        ]
      : []),
  ]

  const initials = user
    ? `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase()
    : "?"

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-sidebar-border",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shrink-0">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold text-sidebar-foreground">
                PostSmart<span className="text-yellow-400">AI</span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const NavItem = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return NavItem
          })}

          {/* Notifications link */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/notifications"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                    pathname === "/dashboard/notifications"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Bell className={cn("h-5 w-5 shrink-0", pathname === "/dashboard/notifications" && "text-primary")} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">Notifications</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/dashboard/notifications"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === "/dashboard/notifications"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <div className="relative shrink-0">
                <Bell className={cn("h-5 w-5", pathname === "/dashboard/notifications" && "text-primary")} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span>Notifications</span>
              {unreadCount > 0 && !collapsed && (
                <span className="ml-auto text-[10px] font-bold text-destructive">{unreadCount}</span>
              )}
            </Link>
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {/* User Info */}
          <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/30",
            collapsed && "justify-center px-2"
          )}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.first_name}
                className="h-8 w-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 shrink-0 text-xs font-bold text-primary">
                {initials}
              </div>
            )}
            {!collapsed && user && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={cn(
            "flex items-center gap-2",
            collapsed ? "flex-col" : "justify-between"
          )}>
            <ThemeToggle />
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Déconnexion</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar shadow-sm hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="h-3 w-3 text-sidebar-foreground" />
          )}
        </button>
      </aside>
    </TooltipProvider>
  )
}
