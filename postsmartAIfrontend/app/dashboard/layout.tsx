"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className={cn(
          "transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        {children}
      </main>
    </div>
  )
}
