export interface LanguageInfo {
  code: string
  name: string
  flag: string
  isForeign: boolean
}

const LANG_MAP: Record<string, { name: string; flag: string }> = {
  fr: { name: "Français",    flag: "🇫🇷" },
  en: { name: "Anglais",     flag: "🇬🇧" },
  es: { name: "Espagnol",    flag: "🇪🇸" },
  de: { name: "Allemand",    flag: "🇩🇪" },
  it: { name: "Italien",     flag: "🇮🇹" },
  pt: { name: "Portugais",   flag: "🇵🇹" },
  ar: { name: "Arabe",       flag: "🇸🇦" },
  zh: { name: "Chinois",     flag: "🇨🇳" },
  ja: { name: "Japonais",    flag: "🇯🇵" },
  nl: { name: "Néerlandais", flag: "🇳🇱" },
  pl: { name: "Polonais",    flag: "🇵🇱" },
  ru: { name: "Russe",       flag: "🇷🇺" },
}

export function getLanguageInfo(code: string | null | undefined): LanguageInfo {
  const c = (code ?? "fr").toLowerCase()
  const meta = LANG_MAP[c] ?? { name: code ?? "Inconnu", flag: "🌍" }
  return { code: c, ...meta, isForeign: c !== "fr" }
}

/** Détection rapide côté client basée sur des mots courants (fallback léger). */
export function detectLanguageHeuristic(text: string): string {
  const t = text.toLowerCase().slice(0, 400)
  if (/\b(dear|sincerely|yours|hello|complaint|parcel|shipment)\b/.test(t)) return "en"
  if (/\b(estimado|hola|gracias|urgente|envío|reclamación|buenos)\b/.test(t)) return "es"
  if (/\b(sehr geehrte|bitte|pakete|lieferung|beschwerde|sendung)\b/.test(t)) return "de"
  if (/\b(gentile|pacco|spedizione|reclamare|buongiorno|cordiali)\b/.test(t)) return "it"
  if (/\b(prezado|obrigado|encomenda|reclamação|caro|estimado)\b/.test(t)) return "pt"
  if (/[؀-ۿ]/.test(t)) return "ar"
  if (/[一-鿿]/.test(t)) return "zh"
  if (/[぀-ヿ]/.test(t)) return "ja"
  return "fr"
}

export const THEME_COLORS: Record<string, { primary: string; light: string; name: string; emoji: string }> = {
  blue:   { primary: "#0066CC", light: "#EBF4FF", name: "Bleu La Poste",  emoji: "🔵" },
  yellow: { primary: "#FFCC00", light: "#FFFBEB", name: "Jaune La Poste", emoji: "🟡" },
  green:  { primary: "#059669", light: "#ECFDF5", name: "Vert Équipe",    emoji: "🟢" },
  purple: { primary: "#7C3AED", light: "#F5F3FF", name: "Violet Équipe",  emoji: "🟣" },
  red:    { primary: "#DC2626", light: "#FEF2F2", name: "Rouge Équipe",   emoji: "🔴" },
  teal:   { primary: "#0891B2", light: "#ECFEFF", name: "Cyan Équipe",    emoji: "🩵" },
  navy:   { primary: "#00205B", light: "#EEF2FF", name: "Marine La Poste",emoji: "🌊" },
}
