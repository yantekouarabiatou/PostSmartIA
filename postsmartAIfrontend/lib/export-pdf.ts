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
  if (typeof window === "undefined") return
  const { default: jsPDF } = await import("jspdf")
  const doc   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const mg    = 18
  const inner = pageW - mg * 2
  let y = 0

  // ── helpers ───────────────────────────────────────────────────────────────
  const rgb = (hex: string): [number, number, number] => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
  const setFont = (size: number, style: "normal" | "bold" = "normal", color = "#374151") => {
    doc.setFontSize(size)
    doc.setFont("helvetica", style)
    doc.setTextColor(...rgb(color))
  }
  const checkPage = (needed = 20) => {
    if (y + needed > pageH - 18) {
      renderFooter()
      doc.addPage()
      y = 18
      renderPageHeader()
    }
  }

  // ── footer ────────────────────────────────────────────────────────────────
  const renderFooter = () => {
    doc.setFillColor(0, 32, 91)
    doc.rect(0, pageH - 12, pageW, 12, "F")
    doc.setFillColor(255, 204, 0)
    doc.rect(0, pageH - 12, 4, 12, "F")
    setFont(7.5, "normal", "#94a3b8")
    doc.text("PostSmart IA — Document confidentiel — La Poste © 2026", 10, pageH - 4.5)
    setFont(7.5, "bold", "#ffffff")
    const cur = (doc.internal as any).getCurrentPageInfo().pageNumber
    doc.text(`Page ${cur}`, pageW - mg, pageH - 4.5, { align: "right" })
  }

  // ── continuation header ───────────────────────────────────────────────────
  const renderPageHeader = () => {
    doc.setFillColor(0, 32, 91)
    doc.rect(0, 0, pageW, 10, "F")
    doc.setFillColor(255, 204, 0)
    doc.rect(0, 0, 4, 10, "F")
    setFont(7, "bold", "#ffcc00")
    doc.text("PostSmart IA", 8, 7)
    setFont(7, "normal", "#94a3b8")
    doc.text("Compte-rendu de traitement mail", pageW - mg, 7, { align: "right" })
    y = 18
  }

  // ── main header ───────────────────────────────────────────────────────────
  doc.setFillColor(0, 32, 91)
  doc.rect(0, 0, pageW, 44, "F")
  doc.setFillColor(255, 204, 0)
  doc.rect(0, 0, 4, 44, "F")

  setFont(20, "bold", "#ffcc00")
  doc.text("PostSmart IA", 11, 17)
  setFont(9, "normal", "#ffffff")
  doc.text("Assistant IA — Service Client La Poste", 11, 25)

  setFont(8, "normal", "#94a3b8")
  doc.text(
    `Généré le ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}`,
    pageW - mg, 17, { align: "right" }
  )

  doc.setFillColor(255, 204, 0)
  doc.rect(mg, 31, inner, 0.5, "F")
  setFont(11, "bold", "#ffffff")
  doc.text("COMPTE-RENDU DE TRAITEMENT MAIL", mg, 39)
  y = 54

  // ── status band ───────────────────────────────────────────────────────────
  const statusColors: Record<string, [number, number, number]> = {
    resolved:   [5, 150, 105],
    archived:   [107, 114, 128],
    processing: [217, 119, 6],
    unread:     [0, 102, 204],
    read:       [107, 114, 128],
  }
  const statusLabels: Record<string, string> = {
    resolved: "RÉSOLU ✓", archived: "ARCHIVÉ", processing: "EN COURS", unread: "NON LU", read: "LU",
  }
  doc.setFillColor(...(statusColors[email.status] ?? [0, 102, 204]))
  doc.roundedRect(mg, y, inner, 10, 2, 2, "F")
  setFont(9, "bold", "#ffffff")
  doc.text(statusLabels[email.status] ?? email.status.toUpperCase(), pageW / 2, y + 6.5, { align: "center" })
  y += 16

  // ── section helper ────────────────────────────────────────────────────────
  const addSection = (title: string) => {
    checkPage(22)
    y += 4
    doc.setFillColor(0, 32, 91)
    doc.rect(mg, y, 3, 8, "F")
    setFont(11, "bold", "#00205B")
    doc.text(title, mg + 6, y + 6)
    y += 12
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.3)
    doc.line(mg, y, pageW - mg, y)
    y += 5
  }

  const addRow = (label: string, value: string, highlight = false) => {
    checkPage(10)
    if (highlight) {
      doc.setFillColor(235, 244, 255)
      doc.rect(mg, y - 4, inner, 9, "F")
    }
    setFont(9, "bold", "#4b5563")
    doc.text(label + " :", mg + 2, y)
    setFont(9, "normal", "#1a1a2e")
    const lines = doc.splitTextToSize(String(value || "-"), inner - 45)
    doc.text(lines, mg + 42, y)
    y += lines.length * 5.5 + 1
  }

  // ── expediteur ────────────────────────────────────────────────────────────
  addSection("Informations de l'expéditeur")
  addRow("Expéditeur", `${email.from_name ?? ""} <${email.from_email}>`, true)
  addRow("Objet", email.subject)
  addRow("Date reçu", new Date(email.received_at).toLocaleString("fr-FR"))
  addRow("Type détecté", email.ai_service_type ?? "Non classifié", true)
  addRow("Source", email.status === "form" ? "Formulaire Web" : "Email entrant")

  // ── mail original ─────────────────────────────────────────────────────────
  if (email.body_text) {
    addSection("Contenu du mail client")
    checkPage(30)
    const bodyLines = doc.splitTextToSize(email.body_text, inner - 10)
    const bodyH = bodyLines.length * 5 + 12
    doc.setFillColor(248, 250, 255)
    doc.setDrawColor(199, 217, 245)
    doc.setLineWidth(0.4)
    doc.roundedRect(mg, y, inner, bodyH, 3, 3, "FD")
    setFont(9, "normal", "#374151")
    doc.text(bodyLines, mg + 5, y + 7)
    y += bodyH + 8
  }

  // ── scores qualité ────────────────────────────────────────────────────────
  if (email.ai_quality_score_json) {
    addSection("Score de qualité IA")
    const scoreItems = [
      { label: "Clarté",     key: "clarity"    },
      { label: "Empathie",   key: "empathy"    },
      { label: "Conformité", key: "compliance" },
      { label: "Global",     key: "overall"    },
    ]
    scoreItems.forEach(({ label, key }) => {
      const val = email.ai_quality_score_json?.[key] ?? 0
      if (!val) return
      checkPage(10)
      setFont(8.5, "normal", "#6b7280")
      doc.text(label, mg + 2, y)
      doc.setFillColor(229, 231, 235)
      doc.roundedRect(mg + 30, y - 3.5, inner - 50, 5, 1.5, 1.5, "F")
      const barColor: [number, number, number] = val >= 75 ? [5, 150, 105] : val >= 50 ? [217, 119, 6] : [220, 38, 38]
      doc.setFillColor(...barColor)
      doc.roundedRect(mg + 30, y - 3.5, (inner - 50) * val / 100, 5, 1.5, 1.5, "F")
      setFont(8.5, "bold", val >= 75 ? "#059669" : val >= 50 ? "#d97706" : "#dc2626")
      doc.text(`${val}/100`, pageW - mg, y, { align: "right" })
      y += 8
    })
    y += 3
  }

  // ── réponse validée ───────────────────────────────────────────────────────
  if (email.validated_response) {
    addSection("Réponse validée par le conseiller")
    checkPage(30)
    const respLines = doc.splitTextToSize(email.validated_response, inner - 10)
    const respH = respLines.length * 5 + 16
    doc.setFillColor(236, 253, 245)
    doc.setDrawColor(167, 243, 208)
    doc.setLineWidth(0.4)
    doc.roundedRect(mg, y, inner, respH, 3, 3, "FD")
    doc.setFillColor(5, 150, 105)
    doc.roundedRect(mg + 2, y + 2, 22, 6, 1.5, 1.5, "F")
    setFont(7, "bold", "#ffffff")
    doc.text("VALIDÉ", mg + 5.5, y + 6.5)
    setFont(9, "normal", "#374151")
    doc.text(respLines, mg + 5, y + 12)
    y += respH + 6

    if (email.validated_at) {
      checkPage(12)
      doc.setFillColor(243, 244, 246)
      doc.rect(mg, y, inner, 10, "F")
      setFont(8, "normal", "#6b7280")
      doc.text(
        `Validé le ${new Date(email.validated_at).toLocaleString("fr-FR")}`,
        mg + 4, y + 6.5
      )
      y += 14
    }
  }

  // ── apply footers on all pages ────────────────────────────────────────────
  const total = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    renderFooter()
  }

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
