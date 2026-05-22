import type jsPDF from "jspdf"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Palette — exact v2
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  yellowSoft:   [255, 243, 196] as [number,number,number], // #FFF3C4 — très doux
  yellowMed:    [246, 201,  14] as [number,number,number], // #F6C90E — accent vif
  yellowDark:   [184, 148,  10] as [number,number,number], // #B8940A — labels email
  yellowBorder: [232, 216, 122] as [number,number,number], // #E8D87A — bordure box jaune
  bluePale:     [238, 243, 251] as [number,number,number], // #EEF3FB — fond sections
  blueMed:      [ 74, 127, 193] as [number,number,number], // #4A7FC1 — accent bleu
  blueNight:    [ 30,  58, 110] as [number,number,number], // #1E3A6E — titres
  grayText:     [ 74,  85, 104] as [number,number,number], // #4A5568 — texte corps
  grayBorder:   [221, 230, 245] as [number,number,number], // #DDE6F5 — bordures
  grayLight:    [248, 249, 250] as [number,number,number], // #F8F9FA — lignes alternées
  grayMeta:     [154, 171, 203] as [number,number,number], // #9AABCB — footer texte
  white:        [255, 255, 255] as [number,number,number],
}

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────
const setFill   = (d: jsPDF, c: [number,number,number]) => d.setFillColor(c[0], c[1], c[2])
const setStroke = (d: jsPDF, c: [number,number,number]) => d.setDrawColor(c[0], c[1], c[2])
const setColor  = (d: jsPDF, c: [number,number,number]) => d.setTextColor(c[0], c[1], c[2])

function filledRect(d: jsPDF, x: number, y: number, w: number, h: number, bg: [number,number,number]) {
  setFill(d, bg); d.rect(x, y, w, h, "F")
}
function borderedRect(
  d: jsPDF, x: number, y: number, w: number, h: number,
  bg: [number,number,number], bd: [number,number,number], lw = 0.2
) {
  setFill(d, bg); setStroke(d, bd); d.setLineWidth(lw); d.rect(x, y, w, h, "FD")
}
function accentBar(d: jsPDF, x: number, y: number, h: number, c: [number,number,number]) {
  setFill(d, c); d.rect(x, y, 1.2, h, "F")
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE CHROME
// FIX 1 — yellow bar drawn LAST so it always renders as exactly 3mm
// ─────────────────────────────────────────────────────────────────────────────
function drawPageChrome(
  doc: jsPDF, pageW: number, pageH: number,
  left: number, right: number, pageNum: number,
  dateStr: string, refStr: string,
  badgeLeft: string, badgeRight: string,
) {
  // White header background
  filledRect(doc, 0, 0, pageW, 38, C.white)

  // Title
  setColor(doc, C.blueNight)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text("PostSmart IA", left, 13)

  // Subtitle
  setColor(doc, C.blueMed)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.8)
  doc.text("Compte-rendu d\u2019appel client", left, 19)

  // Date / ref right
  setColor(doc, C.grayText)
  doc.setFontSize(8)
  doc.text(dateStr, pageW - right, 12, { align: "right" })
  doc.text(refStr,  pageW - right, 17, { align: "right" })

  // Yellow separator line
  setStroke(doc, C.yellowMed)
  doc.setLineWidth(0.55)
  doc.line(left, 23, pageW - right, 23)

  // Badges — rounded corners, NO border (fill only, like Python v2)
  const drawPill = (x: number, label: string, bg: [number,number,number], fg: [number,number,number]) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7.2)
    const tw = doc.getTextWidth(label)
    const pw = tw + 7
    const ph = 5.2
    const r = 1.5  // rounded corners radius mm
    setFill(doc, bg)
    doc.roundedRect(x, 26, pw, ph, r, r, "F")  // "F" = fill only, no stroke/border
    setColor(doc, fg)
    doc.text(label, x + pw / 2, 26 + ph / 2 + 1.1, { align: "center" })
    return pw + 2
  }
  let bx = left
  bx += drawPill(bx, badgeLeft,  C.bluePale,   C.blueNight)
        drawPill(bx, badgeRight, C.yellowSoft, C.yellowDark)

  // Footer
  const fy = pageH - 11
  setStroke(doc, C.grayBorder)
  doc.setLineWidth(0.3)
  doc.line(left, fy, pageW - right, fy)
  setColor(doc, C.grayMeta)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.5)
  doc.text("PostSmart IA  \u2014  Document confidentiel  \u2014  La Poste", left, fy + 4)
  setFill(doc, C.yellowMed)
  doc.circle(pageW / 2, fy + 3.5, 0.8, "F")
  setColor(doc, C.grayMeta)
  doc.text(`Page ${pageNum}`, pageW - right, fy + 4, { align: "right" })

  // FIX 1 — yellow bar drawn LAST, always on top, exactly 3mm
  filledRect(doc, 0, 0, pageW, 3, C.yellowMed)
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────
function sectionHeader(
  doc: jsPDF, x: number, y: number, w: number,
  title: string, accent: [number,number,number]
): number {
  const h = 5.8
  borderedRect(doc, x, y, w, h, C.bluePale, C.grayBorder, 0.25)
  setFill(doc, accent); doc.rect(x, y, 1.2, h, "F")
  setColor(doc, C.blueNight)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.6)
  doc.text(title, x + 4, y + h - 1.7)
  return y + h + 3
}

// ─────────────────────────────────────────────────────────────────────────────
// INFO TABLE
// ─────────────────────────────────────────────────────────────────────────────
function infoTable(
  doc: jsPDF, x: number, y: number, w: number,
  rows: Array<[string, string]>
): number {
  const rowH   = 6.8
  const labelW = 30
  rows.forEach(([lbl, val], i) => {
    borderedRect(doc, x, y, w, rowH, i % 2 === 0 ? C.white : C.grayLight, C.grayBorder, 0.2)
    setColor(doc, C.blueMed)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.text(lbl, x + 2, y + 4.4)
    setColor(doc, C.blueNight)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.4)
    const lines = doc.splitTextToSize(val || "\u2014", w - labelW - 4)
    doc.text(lines, x + labelW, y + 4.4)
    y += rowH
  })
  return y
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY BOX
// FIX 3 — use C.yellowSoft (#FFF3C4) explicitly, tight height
// ─────────────────────────────────────────────────────────────────────────────
function summaryBox(doc: jsPDF, x: number, y: number, w: number, text: string): number {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  const lines = doc.splitTextToSize(text, w - 10)
  // FIX 3 — tight: top pad 8 + lines + bottom pad 8
  const h = lines.length * 4.8 + 16
  // Explicitly use yellowSoft [255,243,196] — NOT yellowMed
  borderedRect(doc, x, y, w, h, C.yellowSoft, C.yellowBorder, 0.2)
  accentBar(doc, x, y, h, C.yellowMed)
  setColor(doc, C.grayText)
  doc.text(lines, x + 4, y + 8)
  return y + h
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGAGEMENTS
// ─────────────────────────────────────────────────────────────────────────────
function engagementsBlock(
  doc: jsPDF, x: number, y: number, w: number, items: string[]
): number {
  const numW = 8
  items.forEach((item, i) => {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    const lines = doc.splitTextToSize(item, w - numW - 6)
    const rowH  = Math.max(9, lines.length * 4.8 + 5)
    borderedRect(doc, x, y, w, rowH, i % 2 === 0 ? C.white : C.grayLight, C.grayBorder, 0.2)
    filledRect(doc, x, y, numW, rowH, C.blueMed)
    setColor(doc, C.white)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text(String(i + 1), x + numW / 2, y + rowH / 2 + 1.5, { align: "center" })
    setColor(doc, C.grayText)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    const textY = y + rowH / 2 - ((lines.length - 1) * 4.8) / 2 + 1.2
    doc.text(lines, x + numW + 3, textY)
    y += rowH
  })
  return y
}

// ─────────────────────────────────────────────────────────────────────────────
// NEXT STEPS
// FIX 2 — remove envelope icon completely, use simple filled circle bullet
// ─────────────────────────────────────────────────────────────────────────────
function nextStepsBlock(
  doc: jsPDF, x: number, y: number, w: number,
  steps: Array<{ title: string; description: string }>
): number {
  steps.forEach((step) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    const titleLines = doc.splitTextToSize(step.title, w - 14)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    const descLines = step.description ? doc.splitTextToSize(step.description, w - 14) : []
    const rowH = 7 + titleLines.length * 4.5 + (descLines.length > 0 ? descLines.length * 4 + 2 : 0) + 5

    borderedRect(doc, x, y, w, rowH, C.bluePale, C.grayBorder, 0.2)
    accentBar(doc, x, y, rowH, C.blueMed)

    // FIX 2 — simple filled circle bullet, no stray lines possible
    setFill(doc, C.blueMed)
    doc.circle(x + 6.5, y + rowH / 2, 1.5, "F")

    // Title
    setColor(doc, C.blueNight)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.text(titleLines, x + 11, y + 6.5)

    // Description
    if (descLines.length > 0) {
      setColor(doc, C.grayText)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.8)
      doc.text(descLines, x + 11, y + 6.5 + titleLines.length * 4.5)
    }
    y += rowH
  })
  return y
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL META BOX
// FIX 4 — "Objet :" label and value on same row, value truncated if needed
// ─────────────────────────────────────────────────────────────────────────────
function emailMetaBox(
  doc: jsPDF, x: number, y: number, w: number,
  from: string, to: string, subject: string
): number {
  const h = 21
  borderedRect(doc, x, y, w, h, C.yellowSoft, C.yellowBorder, 0.25)
  accentBar(doc, x, y, h, C.yellowMed)

  const labelX  = x + 3
  const valueX  = x + 18
  const maxValW = w - 21   // FIX 4 — constrain value width so label never wraps

  const rowYs = [y + 5.5, y + 10.5, y + 15.5]
  const rows: [string, string][] = [
    ["De :",    from],
    ["\u00c0 :", to],
    ["Objet :", subject],
  ]
  rows.forEach(([lbl, val], i) => {
    setColor(doc, C.yellowDark)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text(lbl, labelX, rowYs[i])

    setColor(doc, C.grayText)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    // FIX 4 — split to max 1 line for meta rows
    const valLines = doc.splitTextToSize(val, maxValW)
    doc.text(valLines[0] ?? "", valueX, rowYs[i])  // only first line
  })
  return y + h
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL BODY CARD
// FIX 5 — salutation uses just client_name (no "Monsieur / Madame" prefix)
// ─────────────────────────────────────────────────────────────────────────────
function emailBodyCard(
  doc: jsPDF, x: number, y: number, w: number,
  salutation: string, paragraphs: string[],
): number {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.2)
  const textW = w - 10
  const measuredParas = paragraphs.map(p => doc.splitTextToSize(p, textW))

  let totalH = 6 + 5.5 + 4
  measuredParas.forEach(lines => { totalH += lines.length * 4.5 + 3.5 })
  totalH += 3 + 5 + 5 + 6

  borderedRect(doc, x, y, w, totalH, C.white, C.grayBorder, 0.25)
  accentBar(doc, x, y, totalH, C.yellowMed)

  let cy = y + 6

  // Salutation
  setColor(doc, C.blueNight)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.text(salutation, x + 4, cy)
  cy += 5.5 + 4

  // Body paragraphs
  measuredParas.forEach(lines => {
    setColor(doc, C.grayText)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.2)
    doc.text(lines, x + 4, cy)
    cy += lines.length * 4.5 + 3.5
  })

  cy += 3

  // Cordialement
  setColor(doc, C.grayText)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.2)
  doc.text("Cordialement,", x + 4, cy)
  cy += 5

  // Signature
  setColor(doc, C.blueNight)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.2)
  doc.text("Service Client PostSmart IA \u2013 La Poste", x + 4, cy)

  return y + totalH
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility — strip salutation & signature from AI body text
// ─────────────────────────────────────────────────────────────────────────────
function cleanEmailBody(raw: string): string[] {
  return raw
    .split(/\n{2,}/)
    .map(s => s.replace(/\n/g, " ").trim())
    .filter(s => s.length > 0)
    .filter(s =>
      !s.match(/^(Monsieur|Madame|Cher|Bonjour|Objet\s*:)/i) &&
      !s.match(/^(Cordialement|Bien cordialement|Avec nos salutations|Sinc\u00e8rement)/i) &&
      !s.match(/Service [Cc]lient PostSmart/) &&
      !s.match(/^(Le )?Service [Cc]lient/) &&
      !s.match(/^PostSmart IA/)
    )
}

const FALLBACK_BODY = [
  "Nous vous remercions de nous avoir contact\u00e9s.",
  "Nous avons bien pris note de votre demande et allons proc\u00e9der sans d\u00e9lai \u00e0 une v\u00e9rification approfondie afin d\u2019identifier les causes de cette situation et d\u2019y apporter une solution adapt\u00e9e.",
  "Nous vous confirmons que vous recevrez un retour de notre part dans les meilleurs d\u00e9lais. Pour toute question compl\u00e9mentaire, n\u2019h\u00e9sitez pas \u00e0 nous recontacter.",
  "Nous vous remercions de votre patience et vous prions d\u2019agr\u00e9er l\u2019expression de nos cordiales salutations.",
]

// ─────────────────────────────────────────────────────────────────────────────
// CALL REPORT export
// FIX 6 — tighter spacing, no large gap at bottom of page 1
// FIX 7 — ref = time of call (hh:mm), not padded id
// ─────────────────────────────────────────────────────────────────────────────
export async function exportCallReportToPdf(report: CallReportRecord): Promise<void> {
  if (typeof window === "undefined") return
  const { default: jsPDF } = await import("jspdf")

  const doc   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = 210
  const pageH = 297
  const left  = 18
  const right = 18
  const W     = pageW - left - right
  const BODY  = 36
  const GAP   = 4   // FIX 6 — slightly tighter gap (was 5)

  const d         = new Date(report.created_at)
  const dateStr   = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
  const timeStr   = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  const dateLabel = `${dateStr} \u00e0 ${timeStr}`

  // FIX 7 — ref shows call time (hh:mm), matches v2 style "Réf. appel 00h26"
  const refHour = d.getHours().toString().padStart(2, "0")
  const refMin  = d.getMinutes().toString().padStart(2, "0")
  const refLabel = `R\u00e9f. appel ${refHour}h${refMin}`

  const urgLabel  = `URGENCE ${(report.urgency ?? "normale").toUpperCase()}`
  const typeLabel = (report.demand_type ?? "R\u00c9CLAMATION").toUpperCase()

  const commitmentList = report.commitments
    ? report.commitments.split(/\n+/).map(s => s.trim()).filter(Boolean)
    : ["V\u00e9rification en interne de la livraison partielle du colis."]

  const nextList: Array<{ title: string; description: string }> = report.next_steps
    ? report.next_steps.split(/\n+/).map(s => s.trim()).filter(Boolean)
        .map(s => ({ title: s, description: "" }))
    : [{
        title: "Envoyer l\u2019e-mail de confirmation au client",
        description: report.client_email
          ? `Transmettre le mail \u00e0 ${report.client_email} d\u00e8s que possible.`
          : "Transmettre le mail d\u00e8s que possible.",
      }]

  // ── PAGE 1 ──────────────────────────────────────────────────────────────────
  drawPageChrome(doc, pageW, pageH, left, right, 1, dateLabel, refLabel, typeLabel, urgLabel)
  let y = BODY

  y = sectionHeader(doc, left, y, W, "INFORMATIONS DE L\u2019APPEL", C.yellowMed)
  y = infoTable(doc, left, y, W, [
    ["Client",               report.client_name],
    ["E-mail",               report.client_email ?? "\u2014"],
    ["T\u00e9l\u00e9phone",  report.client_phone ?? "\u2014"],
    ["Date",                 dateLabel],
    ["Dur\u00e9e",           report.call_duration ? `${report.call_duration} minutes` : "\u2014"],
    ["Type",                 `${report.demand_type} \u00b7 Urgence ${report.urgency}`],
  ])
  y += GAP

  y = sectionHeader(doc, left, y, W, "R\u00c9SUM\u00c9 DE L\u2019\u00c9CHANGE", C.yellowMed)
  y = summaryBox(doc, left, y, W, report.call_summary)
  y += GAP

  y = sectionHeader(doc, left, y, W, "ENGAGEMENTS PRIS", C.blueMed)
  y = engagementsBlock(doc, left, y, W, commitmentList)
  y += GAP

  y = sectionHeader(doc, left, y, W, "PROCHAINES \u00c9TAPES", C.blueMed)
  y = nextStepsBlock(doc, left, y, W, nextList)
  y += GAP

  y = sectionHeader(doc, left, y, W, "E-MAIL POST-APPEL G\u00c9N\u00c9R\u00c9", C.yellowMed)
  emailMetaBox(
    doc, left, y, W,
    "Service client PostSmart IA \u2013 La Poste",
    report.client_email ?? "",
    `Suite \u00e0 votre r\u00e9clamation \u2013 ${report.demand_type}`
  )

  // ── PAGE 2 — email body ─────────────────────────────────────────────────────
  const paragraphs = cleanEmailBody(report.validated_response ?? "")
  const finalParas = paragraphs.length > 0 ? paragraphs : FALLBACK_BODY

  doc.addPage()
  drawPageChrome(doc, pageW, pageH, left, right, 2, dateLabel, refLabel, typeLabel, urgLabel)

  // FIX 5 — salutation: "Monsieur [name]," — no double civility
  const firstName = report.client_name.split(" ")[0] ?? report.client_name
  emailBodyCard(
    doc, left, BODY, W,
    `Monsieur ${firstName},`,
    finalParas
  )

  doc.save(`PostSmartIA_Appel_${report.id}_${new Date().toISOString().split("T")[0]}.pdf`)
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL (inbox) export
// ─────────────────────────────────────────────────────────────────────────────
export async function exportEmailToPdf(email: EmailRecord): Promise<void> {
  if (typeof window === "undefined") return
  const { default: jsPDF } = await import("jspdf")
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = 210, pageH = 297, left = 18, right = 18
  const W = pageW - left - right
  const GAP = 4

  const dateLabel = new Date(email.received_at).toLocaleDateString("fr-FR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
  })
  const statusLabels: Record<string, string> = {
    resolved: "R\u00c9SOLU", archived: "ARCHIV\u00c9",
    processing: "EN COURS", unread: "NON LU", read: "LU",
  }
  drawPageChrome(doc, pageW, pageH, left, right, 1, dateLabel,
    `R\u00e9f. mail #${email.id}`,
    statusLabels[email.status] ?? email.status.toUpperCase(),
    email.ai_service_type?.toUpperCase() ?? "EMAIL"
  )

  let y = 36

  y = sectionHeader(doc, left, y, W, "INFORMATIONS DE L\u2019EXP\u00c9DITEUR", C.yellowMed)
  y = infoTable(doc, left, y, W, [
    ["Exp\u00e9diteur", `${email.from_name ?? ""} <${email.from_email}>`],
    ["Objet",           email.subject],
    ["Date re\u00e7u",  new Date(email.received_at).toLocaleString("fr-FR")],
    ["Type",            email.ai_service_type ?? "Non classifi\u00e9"],
  ])
  y += GAP

  if (email.body_text) {
    y = sectionHeader(doc, left, y, W, "CONTENU DU MAIL CLIENT", C.blueMed)
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5)
    const lines = doc.splitTextToSize(email.body_text, W - 10)
    const h = lines.length * 4.8 + 14
    borderedRect(doc, left, y, W, h, C.bluePale, C.grayBorder, 0.2)
    accentBar(doc, left, y, h, C.blueMed)
    setColor(doc, C.grayText)
    doc.text(lines, left + 4, y + 7)
    y += h + GAP
  }

  if (email.ai_quality_score_json) {
    y = sectionHeader(doc, left, y, W, "SCORE DE QUALIT\u00c9 IA", C.yellowMed)
    const items = [
      { label: "Clart\u00e9",      key: "clarity"    },
      { label: "Empathie",         key: "empathy"    },
      { label: "Conformit\u00e9",  key: "compliance" },
      { label: "Global",           key: "overall"    },
    ]
    items.forEach(({ label, key }) => {
      const val = email.ai_quality_score_json?.[key] ?? 0; if (!val) return
      const bc: [number,number,number] = val >= 75 ? [5,150,105] : val >= 50 ? [217,119,6] : [220,38,38]
      setColor(doc, C.grayText); doc.setFont("helvetica","normal"); doc.setFontSize(8)
      doc.text(label, left + 2, y + 3.5)
      setFill(doc, C.grayLight); doc.rect(left + 28, y, W - 48, 4.5, "F")
      setFill(doc, bc); doc.rect(left + 28, y, (W - 48) * val / 100, 4.5, "F")
      setColor(doc, bc); doc.setFont("helvetica","bold")
      doc.text(`${val}/100`, pageW - right, y + 3.5, { align: "right" })
      y += 9
    })
    y += GAP
  }

  if (email.validated_response) {
    y = sectionHeader(doc, left, y, W, "R\u00c9PONSE VALID\u00c9E", C.blueMed)
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5)
    const lines = doc.splitTextToSize(email.validated_response, W - 10)
    const h = lines.length * 4.8 + 14
    borderedRect(doc, left, y, W, h,
      [236,253,245] as [number,number,number],
      [167,243,208] as [number,number,number], 0.2
    )
    accentBar(doc, left, y, h, [5,150,105] as [number,number,number])
    setColor(doc, C.grayText)
    doc.text(lines, left + 4, y + 7)
  }

  doc.save(`PostSmartIA_Mail_${email.id}_${new Date().toISOString().split("T")[0]}.pdf`)
}

// ─────────────────────────────────────────────────────────────────────────────
// RAPPORT STATISTIQUES export
// ─────────────────────────────────────────────────────────────────────────────

interface ReportData {
  period_label: string
  generated_at: string
  kpis: {
    total_emails: number
    resolved: number
    resolution_rate: number
    escalated: number
    avg_score: number | null
    total_feedback: number
    ai_score: number | null
  }
  by_service: Array<{ label: string; total: number }>
  top_rejection_tags: Array<{ tag: string; count: number }>
  leaderboard: Array<{ name: string; role: string; emails: number; avg_score: number }>
}

const TAG_LABELS_FR: Record<string, string> = {
  ton_incorrect:         "Ton incorrect",
  information_manquante: "Info manquante",
  hors_charte:           "Hors charte",
  trop_long:             "Trop long",
  trop_formel:           "Trop formel",
  erreur_factuelle:      "Erreur factuelle",
  autre:                 "Autre",
}

export async function exportReportToPdf(report: ReportData): Promise<void> {
  if (typeof window === "undefined") return
  const { default: jsPDF } = await import("jspdf")

  const doc   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = 210
  const pageH = 297
  const left  = 18
  const right = 18
  const W     = pageW - left - right
  const GAP   = 5

  // ── Page 1 ────────────────────────────────────────────────────────────────
  // Cover header (custom, not chrome)
  filledRect(doc, 0, 0, pageW, 3, C.yellowMed)
  filledRect(doc, 0, 3, pageW, 42, C.blueNight)

  setColor(doc, C.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("PostSmart IA", left, 18)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  setColor(doc, [180, 200, 230] as [number,number,number])
  doc.text(`Rapport d’activité — ${report.period_label}`, left, 26)

  doc.setFontSize(7.5)
  setColor(doc, [130, 160, 200] as [number,number,number])
  doc.text(`Généré le ${report.generated_at}`, left, 33)

  // Yellow accent line
  setStroke(doc, C.yellowMed)
  doc.setLineWidth(0.5)
  doc.line(left, 38, pageW - right, 38)

  let y = 52

  // ── KPI grid (2 × 4) ─────────────────────────────────────────────────────
  y = sectionHeader(doc, left, y, W, "INDICATEURS CLÉS", C.yellowMed)

  const kpiItems: Array<[string, string, [number,number,number]]> = [
    ["Emails reçus",        String(report.kpis.total_emails),      C.blueMed],
    ["Emails résolus",       String(report.kpis.resolved),          [5, 150, 105]],
    ["Taux résolution",      `${report.kpis.resolution_rate}%`,     report.kpis.resolution_rate >= 75 ? [5,150,105] : [217,119,6]],
    ["Dossiers escaladés",   String(report.kpis.escalated),         report.kpis.escalated > 0 ? [220,38,38] : [5,150,105]],
    ["Score qualité IA",     report.kpis.avg_score != null ? `${report.kpis.avg_score}/100` : "—", C.yellowDark],
    ["Feedbacks collectés",  String(report.kpis.total_feedback),    C.blueMed],
    ["Score satisfaction IA",report.kpis.ai_score != null ? `${report.kpis.ai_score}%` : "—", report.kpis.ai_score != null && report.kpis.ai_score >= 70 ? [5,150,105] : [217,119,6]],
    ["Taux non-résolution",  `${100 - report.kpis.resolution_rate}%`, C.grayText],
  ]

  const colW  = (W - 4) / 2
  const kpiH  = 16
  const kpiGap = 2
  kpiItems.forEach(([label, value, color], i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const kx  = left + col * (colW + 4)
    const ky  = y + row * (kpiH + kpiGap)

    borderedRect(doc, kx, ky, colW, kpiH, C.white, C.grayBorder, 0.2)
    accentBar(doc, kx, ky, kpiH, color)

    setColor(doc, C.grayText)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.text(label, kx + 4, ky + 5.5)

    setColor(doc, color)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.text(value, kx + 4, ky + 13)
  })

  y += 4 * (kpiH + kpiGap) + GAP + 2

  // ── Répartition par service ────────────────────────────────────────────────
  if (report.by_service.length > 0) {
    y = sectionHeader(doc, left, y, W, "RÉPARTITION PAR TYPE DE SERVICE", C.blueMed)

    const maxSvc = report.by_service[0]?.total ?? 1
    const barH   = 5.5
    const barGap = 2
    const labelW = 40
    const valueW = 12

    report.by_service.slice(0, 8).forEach((svc, i) => {
      const barW = Math.round(((W - labelW - valueW - 6) * svc.total) / maxSvc)
      const bc: [number,number,number] = i === 0 ? C.blueMed : i === 1 ? [99,102,241] : [148,163,184]

      setColor(doc, C.grayText)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.5)
      doc.text(svc.label, left, y + barH - 1)

      setFill(doc, C.grayLight)
      doc.rect(left + labelW, y, W - labelW - valueW, barH, "F")
      setFill(doc, bc)
      doc.rect(left + labelW, y, barW, barH, "F")

      setColor(doc, C.blueNight)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7.5)
      doc.text(String(svc.total), left + W - valueW + 2, y + barH - 1)

      y += barH + barGap
    })

    y += GAP
  }

  // ── Top tags de rejet ─────────────────────────────────────────────────────
  if (report.top_rejection_tags.length > 0) {
    y = sectionHeader(doc, left, y, W, "PRINCIPAUX MOTIFS DE REJET IA", C.yellowMed)

    const maxTag = report.top_rejection_tags[0]?.count ?? 1
    const tagBarH = 5
    const tagGap  = 2
    const tagLW   = 44

    report.top_rejection_tags.slice(0, 6).forEach((t) => {
      const tagLabel = TAG_LABELS_FR[t.tag] ?? t.tag
      const bw = Math.round(((W - tagLW - 14) * t.count) / maxTag)

      setColor(doc, C.grayText)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.5)
      doc.text(tagLabel, left, y + tagBarH - 1)

      setFill(doc, C.grayLight)
      doc.rect(left + tagLW, y, W - tagLW - 12, tagBarH, "F")
      setFill(doc, [124, 58, 237] as [number,number,number])
      doc.rect(left + tagLW, y, bw, tagBarH, "F")

      setColor(doc, C.blueNight)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7.5)
      doc.text(String(t.count), left + W - 10, y + tagBarH - 1)

      y += tagBarH + tagGap
    })

    y += GAP
  }

  // Footer page 1
  const fy1 = pageH - 11
  setStroke(doc, C.grayBorder); doc.setLineWidth(0.3)
  doc.line(left, fy1, pageW - right, fy1)
  setColor(doc, C.grayMeta); doc.setFont("helvetica", "normal"); doc.setFontSize(6.5)
  doc.text("PostSmart IA  —  Document confidentiel  —  La Poste", left, fy1 + 4)
  doc.text("Page 1", pageW - right, fy1 + 4, { align: "right" })
  filledRect(doc, 0, pageH - 3, pageW, 3, C.yellowMed)

  // ── Page 2 — Classement conseillers (si données) ───────────────────────────
  if (report.leaderboard.length > 0) {
    doc.addPage()
    filledRect(doc, 0, 0, pageW, 3, C.yellowMed)
    filledRect(doc, 0, 3, pageW, 28, C.blueNight)

    setColor(doc, C.white)
    doc.setFont("helvetica", "bold"); doc.setFontSize(14)
    doc.text("PostSmart IA — Classement conseillers", left, 18)
    setColor(doc, [130,160,200] as [number,number,number])
    doc.setFont("helvetica", "normal"); doc.setFontSize(8)
    doc.text(report.period_label, left, 26)

    let y2 = 40
    y2 = sectionHeader(doc, left, y2, W, "PERFORMANCE DES CONSEILLERS", C.blueMed)

    // Table header
    const cols = [60, 28, 28, 28]
    const headers2 = ["Conseiller", "Rôle", "Mails traités", "Score IA moy."]
    const colX2 = [left, left + cols[0], left + cols[0] + cols[1], left + cols[0] + cols[1] + cols[2]]
    filledRect(doc, left, y2, W, 7, C.bluePale)
    headers2.forEach((h, i) => {
      setColor(doc, C.blueNight); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5)
      doc.text(h, colX2[i] + 2, y2 + 5)
    })
    y2 += 7

    report.leaderboard.forEach((agent, i) => {
      const rowBg = i % 2 === 0 ? C.white : C.grayLight
      filledRect(doc, left, y2, W, 6.5, rowBg)
      setStroke(doc, C.grayBorder); doc.setLineWidth(0.15)
      doc.rect(left, y2, W, 6.5, "D")

      const scoreColor: [number,number,number] = agent.avg_score >= 75 ? [5,150,105] : agent.avg_score >= 50 ? [217,119,6] : [220,38,38]

      setColor(doc, C.grayText); doc.setFont("helvetica", "normal"); doc.setFontSize(8)
      doc.text(String(agent.name ?? ""), colX2[0] + 2, y2 + 4.5)
      doc.text(String(agent.role ?? ""), colX2[1] + 2, y2 + 4.5)
      doc.setFont("helvetica", "bold")
      doc.text(String(agent.emails), colX2[2] + 2, y2 + 4.5)
      setColor(doc, scoreColor)
      doc.text(agent.avg_score > 0 ? `${agent.avg_score}/100` : "—", colX2[3] + 2, y2 + 4.5)
      y2 += 6.5
    })

    const fy2 = pageH - 11
    setStroke(doc, C.grayBorder); doc.setLineWidth(0.3)
    doc.line(left, fy2, pageW - right, fy2)
    setColor(doc, C.grayMeta); doc.setFont("helvetica", "normal"); doc.setFontSize(6.5)
    doc.text("PostSmart IA  —  Document confidentiel  —  La Poste", left, fy2 + 4)
    doc.text("Page 2", pageW - right, fy2 + 4, { align: "right" })
    filledRect(doc, 0, pageH - 3, pageW, 3, C.yellowMed)
  }

  const filename = `PostSmartIA_Rapport_${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(filename)
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY EMAIL export
// ─────────────────────────────────────────────────────────────────────────────
export async function exportHistoryEmailToPdf(record: HistoryEmailRecord): Promise<void> {
  const { default: jsPDF } = await import("jspdf")
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = 210, pageH = 297, left = 18, right = 18
  const W = pageW - left - right
  const GAP = 4

  const dateLabel = new Date(record.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric"
  })
  const statusLabel = {
    draft: "BROUILLON", sent: "ENVOY\u00c9", modified: "MODIFI\u00c9"
  }[record.status] ?? record.status.toUpperCase()

  drawPageChrome(doc, pageW, pageH, left, right, 1, dateLabel,
    `R\u00e9f. #${record.id}`, statusLabel, "EMAIL G\u00c9N\u00c9R\u00c9")

  let y = 36

  y = sectionHeader(doc, left, y, W, "INFORMATIONS", C.yellowMed)
  y = infoTable(doc, left, y, W, [
    ["Destinataire", record.client_name
      ? `${record.client_name} (${record.client_email})` : record.client_email],
    ["Objet",  record.subject],
    ["Statut", { draft: "Brouillon", sent: "Envoy\u00e9", modified: "Modifi\u00e9" }[record.status] ?? record.status],
    ["Date",   new Date(record.created_at).toLocaleString("fr-FR")],
  ])
  y += GAP

  y = sectionHeader(doc, left, y, W, "CONTENU DU MAIL", C.blueMed)
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5)
  const lines = doc.splitTextToSize(record.content, W - 10)
  const h = lines.length * 4.8 + 14
  borderedRect(doc, left, y, W, h, C.bluePale, C.grayBorder, 0.2)
  accentBar(doc, left, y, h, C.blueMed)
  setColor(doc, C.grayText)
  doc.text(lines, left + 4, y + 7)

  doc.save(`PostSmartIA_Historique_${record.id}_${new Date().toISOString().split("T")[0]}.pdf`)
}