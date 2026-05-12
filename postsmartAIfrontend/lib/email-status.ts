export type EmailStatus =
  | "unread" | "read" | "processing" | "pending"
  | "partial" | "escalated" | "resolved" | "archived"

export type EmailPriority = "low" | "normal" | "high" | "urgent"

export interface StatusConfig {
  label: string
  color: string
  bg: string
  border: string
  icon: string
}

export interface PriorityConfig {
  label: string
  color: string
  bg: string
  icon: string
}

export const STATUS_CONFIG: Record<EmailStatus, StatusConfig> = {
  unread: {
    label: "Non lu",
    color: "#1e40af",
    bg: "#dbeafe",
    border: "#93c5fd",
    icon: "●",
  },
  read: {
    label: "Lu",
    color: "#374151",
    bg: "#f3f4f6",
    border: "#d1d5db",
    icon: "○",
  },
  processing: {
    label: "En traitement",
    color: "#6d28d9",
    bg: "#ede9fe",
    border: "#c4b5fd",
    icon: "⚙",
  },
  pending: {
    label: "En attente",
    color: "#92400e",
    bg: "#fef3c7",
    border: "#fcd34d",
    icon: "⏳",
  },
  partial: {
    label: "Partiel",
    color: "#1e3a5f",
    bg: "#e0f2fe",
    border: "#7dd3fc",
    icon: "◑",
  },
  escalated: {
    label: "Escaladé",
    color: "#9a3412",
    bg: "#ffedd5",
    border: "#fdba74",
    icon: "⬆",
  },
  resolved: {
    label: "Résolu",
    color: "#14532d",
    bg: "#dcfce7",
    border: "#86efac",
    icon: "✓",
  },
  archived: {
    label: "Archivé",
    color: "#374151",
    bg: "#f9fafb",
    border: "#e5e7eb",
    icon: "🗄",
  },
}

export const PRIORITY_CONFIG: Record<EmailPriority, PriorityConfig> = {
  low: {
    label: "Faible",
    color: "#374151",
    bg: "#f3f4f6",
    icon: "↓",
  },
  normal: {
    label: "Normal",
    color: "#1d4ed8",
    bg: "#dbeafe",
    icon: "→",
  },
  high: {
    label: "Haute",
    color: "#c2410c",
    bg: "#ffedd5",
    icon: "↑",
  },
  urgent: {
    label: "Urgent",
    color: "#ffffff",
    bg: "#dc2626",
    icon: "‼",
  },
}

// Valeurs alignées sur les rôles Spatie du backend (NotificationService::sendToRole)
export const ESCALATION_TARGETS = [
  { value: "manager",              label: "Manager" },
  { value: "service_reclamations", label: "Service Réclamations" },
  { value: "specialiste",          label: "Spécialiste" },
  { value: "mediateur",            label: "Médiateur La Poste" },
  { value: "admin",                label: "Administration" },
]
