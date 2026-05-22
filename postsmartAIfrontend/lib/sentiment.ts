export type SentimentLevel = "urgent" | "frustrated" | "neutral" | "positive"

export interface SentimentResult {
  level: SentimentLevel
  label: string
  emoji: string
  color: string
  bg: string
  score: number
}

const URGENT_KEYWORDS = [
  "urgent","urgence","immédiat","critique","danger","décès","hospitalisation",
  "fraude","arnaque","litige","scandaleux","inacceptable","vol","accident",
  "irresponsable","escroquerie","plainte formelle","tribunal","avocat",
]

const FRUSTRATED_KEYWORDS = [
  "insatisfait","mécontent","remboursement","retard","perdu","manquant","disparu",
  "erreur","problème","incident","réclamation","plainte","déçu","pas reçu",
  "non livré","jamais arrivé","introuvable","inadmissible","honteux","honte",
  "nul","mauvais","pire","incompétent","incompétence","ras-le-bol","agacé",
  "énervé","en colère","colère","furieux","désespéré","aberrant","incroyable",
  "encore une fois","toujours le même","sans réponse","personne ne",
]

const POSITIVE_KEYWORDS = [
  "merci","félicitations","bravo","excellent","parfait","super","génial",
  "très bien","satisfait","content","ravi","enchanté","bonne","sympa",
  "rapide","efficace","professionnel","au top","top","bien reçu",
  "tout va bien","impeccable","nickel","formidable","magnifique",
]

function countKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase()
  return keywords.filter(k => lower.includes(k)).length
}

export function detectSentiment(text: string | null | undefined): SentimentResult {
  if (!text || text.trim().length < 10) {
    return { level: "neutral", label: "Neutre", emoji: "😐", color: "#6B7280", bg: "#F3F4F6", score: 0 }
  }

  const urgentCount    = countKeywords(text, URGENT_KEYWORDS)
  const frustCount     = countKeywords(text, FRUSTRATED_KEYWORDS)
  const positiveCount  = countKeywords(text, POSITIVE_KEYWORDS)

  if (urgentCount >= 1) {
    return { level: "urgent", label: "Urgent", emoji: "🚨", color: "#DC2626", bg: "#FEE2E2", score: urgentCount }
  }
  if (frustCount >= 2) {
    return { level: "frustrated", label: "Frustré", emoji: "😠", color: "#EA580C", bg: "#FFF7ED", score: frustCount }
  }
  if (frustCount === 1) {
    return { level: "frustrated", label: "Mécontent", emoji: "😕", color: "#D97706", bg: "#FFFBEB", score: 1 }
  }
  if (positiveCount >= 2) {
    return { level: "positive", label: "Satisfait", emoji: "😊", color: "#059669", bg: "#ECFDF5", score: positiveCount }
  }
  return { level: "neutral", label: "Neutre", emoji: "😐", color: "#6B7280", bg: "#F3F4F6", score: 0 }
}

export function toneToSentiment(tone: string | undefined): SentimentResult | null {
  if (!tone) return null
  const t = tone.toLowerCase()
  if (t.includes("urgent") || t.includes("agressif") || t.includes("menaçant"))
    return { level: "urgent", label: "Urgent", emoji: "🚨", color: "#DC2626", bg: "#FEE2E2", score: 3 }
  if (t.includes("insatisfait") || t.includes("frustré") || t.includes("mécontent") || t.includes("colère") || t.includes("négatif"))
    return { level: "frustrated", label: tone, emoji: "😠", color: "#EA580C", bg: "#FFF7ED", score: 2 }
  if (t.includes("positif") || t.includes("satisfait") || t.includes("content") || t.includes("poli"))
    return { level: "positive", label: tone, emoji: "😊", color: "#059669", bg: "#ECFDF5", score: 2 }
  return { level: "neutral", label: tone, emoji: "😐", color: "#6B7280", bg: "#F3F4F6", score: 0 }
}
