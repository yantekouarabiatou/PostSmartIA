"use client"

import {
  EmailStatus, EmailPriority,
  STATUS_CONFIG, PRIORITY_CONFIG,
} from "@/lib/email-status"

interface StatusBadgeProps {
  status: EmailStatus
  size?: "sm" | "md"
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.read
  const pad  = size === "sm" ? "2px 7px" : "3px 10px"
  const font = size === "sm" ? 11 : 12

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: pad,
      borderRadius: 20,
      fontSize: font,
      fontWeight: 600,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: size === "sm" ? 9 : 10 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}

interface PriorityBadgeProps {
  priority: EmailPriority
  size?: "sm" | "md"
}

export function PriorityBadge({ priority, size = "sm" }: PriorityBadgeProps) {
  const cfg  = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.normal
  const pad  = size === "sm" ? "2px 7px" : "3px 10px"
  const font = size === "sm" ? 11 : 12

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      padding: pad,
      borderRadius: 20,
      fontSize: font,
      fontWeight: 700,
      color: cfg.color,
      background: cfg.bg,
      whiteSpace: "nowrap",
    }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}
