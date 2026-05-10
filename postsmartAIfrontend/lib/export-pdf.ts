import type jsPDF from "jspdf"

interface EmailRecord {
  id: number
  from_name: string | null
  from_email: string
  subject: string
  body_text: string | null
  received_at: string
  ai_service_type: string | null
  validated_response: string | null
  validated_at: string | null
  status: string
  ai_quality_score_json: Record<string, number> | null
}

interface HistoryEmailRecord {
  id: number
  client_email: string
  client_name: string | null
  subject: string
  content: string
  status: "draft" | "sent" | "modified"
  created_at: string
}

interface CallReportRecord {
  id: number
  client_name: string
  client_email: string | null
  client_phone: string | null
  demand_type: string
  urgency: string
  call_duration: number | null
  call_summary: string
  commitments: string | null
  next_steps: string | null
  validated_response: string | null
  created_at: string
}

function addHeader(doc: jsPDF, subtitle: string) {
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 20
  doc.setFillColor(0, 32, 91)
  doc.rect(0, 0, pageW, 35, "F")
  doc.setTextColor(255, 204, 0)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("PostSmart IA", margin, 15)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(subtitle, margin, 24)
  doc.text(
    new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
    pageW - margin, 24, { align: "right" }
  )
}

function addFooters(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 20
  const total  = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFillColor(0, 32, 91)
    doc.rect(0, 287, pageW, 10, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text("PostSmart IA — Document confidentiel — La Poste", margin, 293)
    doc.text(`Page ${i}/${total}`, pageW - margin, 293, { align: "right" })
  }
}

export async function exportEmailToPdf(email: EmailRecord): Promise<void> {
  if (typeof window === 'undefined') return
  const { default: jsPDF } = await import('jspdf')
  const doc    = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW  = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentW = pageW - margin * 2
  let y = 50

  addHeader(doc, "Compte-rendu de traitement mail")

  // Info section
  doc.setTextColor(0, 32, 91)
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.text("Informations du mail", margin, y)
  y += 7
  doc.setDrawColor(0, 102, 204)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageW - margin, y)
  y += 7

  const infoRows: [string, string][] = [
    ["Expéditeur", `${email.from_name ?? ""} <${email.from_email}>`],
    ["Objet",      email.subject],
    ["Date reçu",  new Date(email.received_at).toLocaleString("fr-FR")],
    ["Type",       email.ai_service_type ?? "Non classifié"],
    ["Statut",     email.status],
  ]

  doc.setFontSize(10)
  infoRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 32, 91)
    doc.text(label + " :", margin, y)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(75, 85, 99)
    const lines = doc.splitTextToSize(value || "-", contentW - 40)
    doc.text(lines, margin + 40, y)
    y += 7 * lines.length
  })

  y += 6

  // Original body
  if (email.body_text) {
    doc.setTextColor(0, 32, 91)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Mail original du client", margin, y)
    y += 7
    doc.setFillColor(248, 250, 255)
    const lines = doc.splitTextToSize(email.body_text, contentW - 8)
    const h = lines.length * 5 + 10
    doc.rect(margin, y - 4, contentW, h, "F")
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(55, 65, 81)
    doc.text(lines, margin + 4, y + 2)
    y += h + 8
  }

  // Validated response
  if (email.validated_response) {
    if (y > 220) { doc.addPage(); y = 20 }
    doc.setTextColor(0, 32, 91)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Réponse validée par le conseiller", margin, y)
    y += 7
    doc.setFillColor(240, 255, 244)
    doc.setDrawColor(5, 150, 105)
    const lines = doc.splitTextToSize(email.validated_response, contentW - 8)
    const h = lines.length * 5 + 10
    doc.rect(margin, y - 4, contentW, h, "FD")
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(55, 65, 81)
    doc.text(lines, margin + 4, y + 2)
    y += h + 8
  }

  // Quality scores
  if (email.ai_quality_score_json) {
    if (y > 220) { doc.addPage(); y = 20 }
    doc.setTextColor(0, 32, 91)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Score de qualité IA", margin, y)
    y += 10

    const scoreItems: { label: string; key: string; color: [number, number, number] }[] = [
      { label: "Clarté",     key: "clarity",    color: [0, 102, 204]  },
      { label: "Empathie",   key: "empathy",    color: [8, 145, 178]  },
      { label: "Conformité", key: "compliance", color: [5, 150, 105]  },
      { label: "Global",     key: "overall",    color: [0, 32, 91]    },
    ]

    scoreItems.forEach(({ label, key, color }) => {
      const value = email.ai_quality_score_json?.[key] ?? 0
      if (!value) return
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(75, 85, 99)
      doc.text(label, margin, y)
      doc.text(`${value}/100`, pageW - margin, y, { align: "right" })
      doc.setFillColor(229, 231, 235)
      doc.rect(margin + 30, y - 3, contentW - 42, 4, "F")
      doc.setFillColor(...color)
      doc.rect(margin + 30, y - 3, (contentW - 42) * value / 100, 4, "F")
      y += 9
    })
  }

  addFooters(doc)
  doc.save(`PostSmartIA_Mail_${email.id}_${new Date().toISOString().split("T")[0]}.pdf`)
}

export async function exportCallReportToPdf(report: CallReportRecord): Promise<void> {
  if (typeof window === 'undefined') return
  const { default: jsPDF } = await import('jspdf')
  const doc    = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW  = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentW = pageW - margin * 2
  let y = 50

  addHeader(doc, "Compte-rendu d'appel client")

  // Info rows
  const infoRows: [string, string][] = [
    ["Client",          report.client_name],
    ["Email",           report.client_email ?? "-"],
    ["Téléphone",       report.client_phone ?? "-"],
    ["Type de demande", report.demand_type],
    ["Urgence",         report.urgency],
    ["Durée",           report.call_duration ? `${report.call_duration} min` : "-"],
    ["Date",            new Date(report.created_at).toLocaleString("fr-FR")],
  ]

  doc.setTextColor(0, 32, 91)
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.text("Informations de l'appel", margin, y)
  y += 7
  doc.setDrawColor(0, 102, 204)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageW - margin, y)
  y += 7

  doc.setFontSize(10)
  infoRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 32, 91)
    doc.text(label + " :", margin, y)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(75, 85, 99)
    const lines = doc.splitTextToSize(value, contentW - 45)
    doc.text(lines, margin + 45, y)
    y += 7 * lines.length
  })

  const textSections: [string, string | null | undefined, [number, number, number]][] = [
    ["Résumé de l'échange",      report.call_summary,        [248, 250, 255]],
    ["Engagements pris",         report.commitments,         [240, 255, 244]],
    ["Prochaines étapes",        report.next_steps,          [255, 251, 235]],
    ["Mail post-appel généré",   report.validated_response,  [240, 255, 244]],
  ]

  textSections.forEach(([title, content, bgColor]) => {
    if (!content) return
    if (y > 220) { doc.addPage(); y = 20 }
    y += 6
    doc.setTextColor(0, 32, 91)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(title, margin, y)
    y += 7
    doc.setFillColor(...bgColor)
    const lines = doc.splitTextToSize(content, contentW - 8)
    const h = lines.length * 5 + 8
    doc.rect(margin, y - 3, contentW, h, "F")
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(55, 65, 81)
    doc.text(lines, margin + 4, y + 2)
    y += h + 6
  })

  addFooters(doc)
  doc.save(`PostSmartIA_Appel_${report.id}_${new Date().toISOString().split("T")[0]}.pdf`)
}

export async function exportHistoryEmailToPdf(record: HistoryEmailRecord): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const doc    = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW  = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentW = pageW - margin * 2
  let y = 50

  addHeader(doc, "Email généré — Historique")

  const infoRows: [string, string][] = [
    ["Destinataire", record.client_name ? `${record.client_name} (${record.client_email})` : record.client_email],
    ["Objet",        record.subject],
    ["Statut",       { draft: "Brouillon", sent: "Envoyé", modified: "Modifié" }[record.status] ?? record.status],
    ["Date",         new Date(record.created_at).toLocaleString("fr-FR")],
  ]

  doc.setTextColor(0, 32, 91)
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.text("Informations", margin, y)
  y += 7
  doc.setDrawColor(0, 102, 204)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageW - margin, y)
  y += 7

  doc.setFontSize(10)
  infoRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 32, 91)
    doc.text(label + " :", margin, y)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(75, 85, 99)
    const lines = doc.splitTextToSize(value, contentW - 40)
    doc.text(lines, margin + 40, y)
    y += 7 * lines.length
  })

  y += 6
  doc.setTextColor(0, 32, 91)
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Contenu du mail", margin, y)
  y += 7
  doc.setFillColor(248, 250, 255)
  const lines = doc.splitTextToSize(record.content, contentW - 8)
  const h = lines.length * 5 + 10
  doc.rect(margin, y - 4, contentW, h, "F")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(55, 65, 81)
  doc.text(lines, margin + 4, y + 2)

  addFooters(doc)
  doc.save(`PostSmartIA_Historique_${record.id}_${new Date().toISOString().split("T")[0]}.pdf`)
}
