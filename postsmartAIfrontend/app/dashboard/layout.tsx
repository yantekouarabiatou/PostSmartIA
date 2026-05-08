"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { ChatPanel } from "@/components/chat-panel"
import Navbar from "@/components/layout/Navbar"
import DashboardFooter from "@/components/layout/DashboardFooter"
import Onboarding from "@/components/ui/onboarding"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem("auth_token")) {
      router.replace("/login")
    } else {
      setReady(true)
    }
  }, [router])

  if (!ready) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className={cn(
          "transition-all duration-300 pt-16 pb-9",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        {children}
      </main>
      <ChatPanel />
      <DashboardFooter />
      <Onboarding />
    </div>
  )
}
