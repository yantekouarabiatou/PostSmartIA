"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  {
    title: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Générer un email",
    href: "/dashboard/generate",
    icon: Mail,
  },
  {
    title: "Historique",
    href: "/dashboard/history",
    icon: History,
  },
  {
    title: "Base de connaissances",
    href: "/dashboard/knowledge",
    icon: BookOpen,
  },
]

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
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
                PostSmartAI
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
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {/* User Info */}
          <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/30",
            collapsed && "justify-center px-2"
          )}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  Jean Dupont
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Conseiller clientèle
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
                  <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                    <Link href="/">
                      <LogOut className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Déconnexion</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
                <Link href="/">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Link>
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
