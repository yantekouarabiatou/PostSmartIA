"use client"

import { useState, useEffect } from "react"
import {
  Sparkles, Copy, Check, RefreshCw, Save, User, FileText,
  MessageSquare, ChevronDown, AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { api, type GeneratedEmail } from "@/lib/api"
import ToneGauge from "@/components/ui/tone-gauge"

const RESPONSE_LANGUAGES = [
  { value: "fr", label: "🇫🇷 Français" },
  { value: "en", label: "🇬🇧 Anglais" },
  { value: "es", label: "🇪🇸 Espagnol" },
  { value: "de", label: "🇩🇪 Allemand" },
  { value: "it", label: "🇮🇹 Italien" },
  { value: "pt", label: "🇵🇹 Portugais" },
  { value: "ar", label: "🇸🇦 Arabe" },
]

interface SatisfactionResult {
  satisfaction_score: number
  stars: number
  label: string
  strengths: string[]
  improvements: string[]
  risk_level: "low" | "medium" | "high"
  risk_reason: string
}

const EMAIL_TYPES = [
  { value: "livraison",    label: "Suivi de livraison"     },
  { value: "reclamation",  label: "Réponse à réclamation"  },
  { value: "information",  label: "Demande d'information"  },
  { value: "confirmation", label: "Confirmation de service" },
  { value: "relance",      label: "Relance client"          },
  { value: "autre",        label: "Autre"                  },
]

const TONES = [
  { value: "professionnel", label: "Professionnel" },
  { value: "empathique",    label: "Empathique"    },
  { value: "formel",        label: "Formel"        },
  { value: "amical",        label: "Amical"        },
]

export default function GenerateEmailPage() {
  const [clientName, setClientName]         = useState("")
  const [clientEmail, setClientEmail]       = useState("")
  const [emailType, setEmailType]           = useState("livraison")
  const [tone, setTone]                     = useState("professionnel")
  const [context, setContext]               = useState("")

  useEffect(() => {
    const injected = sessionStorage.getItem("kb_inject")
    if (injected) {
      setContext(injected)
      sessionStorage.removeItem("kb_inject")
    }
  }, [])
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [showAdvanced, setShowAdvanced]     = useState(false)

  const [responseLang, setResponseLang]     = useState("fr")
  const [result, setResult]                 = useState<GeneratedEmail | null>(null)
  const [generating, setGenerating]         = useState(false)
  const [saving, setSaving]                 = useState(false)
  const [saved, setSaved]                   = useState(false)
  const [copied, setCopied]                 = useState(false)
  const [genError, setGenError]             = useState("")
  const [saveMsg, setSaveMsg]               = useState("")
  const [satisfaction, setSatisfaction]     = useState<SatisfactionResult | null>(null)
  const [loadingSat, setLoadingSat]         = useState(false)

  async function handleGenerate() {
    if (!context.trim()) return
    setGenerating(true)
    setGenError("")
    setResult(null)
    setSaved(false)
    setSaveMsg("")
    try {
      const typeLabel = EMAIL_TYPES.find(t => t.value === emailType)?.label ?? emailType
      const toneLabel = TONES.find(t => t.value === tone)?.label ?? tone

      const emailContent = [
        `Type d'email : ${typeLabel}`,
        `Ton souhaité : ${toneLabel}`,
        clientName     && `Destinataire : ${clientName}`,
        `Contexte : ${context}`,
        additionalInfo && `Informations complémentaires : ${additionalInfo}`,
      ].filter(Boolean).join("\n")

      const data = await api.post<GeneratedEmail>("/ai/generate-response", {
        email_content: emailContent,
        service_type: emailType,
        detected_language: responseLang !== "fr" ? responseLang : undefined,
        entities: clientName
          ? { client_name: clientName, main_request: context }
          : undefined,
      })
      setResult(data)
      setSatisfaction(null)
    } catch (err: any) {
      setGenError(err.message || "Erreur lors de la génération. Vérifiez la clé API Groq dans .env.")
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!result || !clientEmail.trim()) return
    setSaving(true)
    setSaveMsg("")
    try {
      await api.post("/email-histories", {
        client_email: clientEmail,
        client_name: clientName || undefined,
        subject: result.subject,
        content: result.body,
        status: "draft",
      })
      setSaved(true)
      setSaveMsg("Sauvegardé dans l'historique.")
    } catch (err: any) {
      setSaveMsg(err.message || "Erreur lors de la sauvegarde.")
    } finally {
      setSaving(false)
    }
  }

  async function handlePredictSatisfaction() {
    if (!result) return
    setLoadingSat(true)
    try {
      const data = await api.post<SatisfactionResult>("/ai/satisfaction", {
        response_body: result.body,
        original_email: context,
      })
      setSatisfaction(data)
    } catch { /* non-bloquant */ }
    finally { setLoadingSat(false) }
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(`Objet : ${result.subject}\n\n${result.body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const qualityItems = result
    ? [
        { label: "Clarté",     value: result.quality_score.clarity,    color: "#0066CC" },
        { label: "Empathie",   value: result.quality_score.empathy,    color: "#7C3AED" },
        { label: "Conformité", value: result.quality_score.compliance, color: "#059669" },
      ]
    : []

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Générer un email</h1>
        <p className="text-muted-foreground">
          Décrivez le contexte et laissez l'IA rédiger un email professionnel conforme à la charte La Poste.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── Formulaire gauche ── */}
        <div className="space-y-5">

          {/* Infos client */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-sm font-semibold">
                <User className="h-4 w-4 text-primary" />
                Informations client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nom du client</label>
                  <Input
                    placeholder="Ex : Marie Martin"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email client
                    <span className="text-muted-foreground font-normal ml-1 text-xs">(pour sauvegarder)</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="client@example.fr"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Type d'email</label>
                  <Select value={emailType} onValueChange={setEmailType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMAIL_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Ton</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TONES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">🌍 Langue de la réponse</label>
                <Select value={responseLang} onValueChange={setResponseLang}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESPONSE_LANGUAGES.map(l => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contexte */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-sm font-semibold">
                <MessageSquare className="h-4 w-4 text-primary" />
                Contexte de la demande
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Contexte <span className="text-destructive">*</span>
                </label>
                <Textarea
                  placeholder="Ex : Le client demande le suivi de son colis LP123456789FR envoyé le 15 janvier. Il souhaite connaître la date de livraison estimée…"
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  className="min-h-[110px] resize-none"
                />
                <ToneGauge text={context} />
              </div>
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between h-9 px-3">
                    <span className="text-sm text-muted-foreground">Options avancées</span>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showAdvanced && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Informations complémentaires</label>
                    <Textarea
                      placeholder="Numéros de référence, historique client, détails spécifiques…"
                      value={additionalInfo}
                      onChange={e => setAdditionalInfo(e.target.value)}
                      className="min-h-[72px] resize-none"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {genError && (
            <div className="flex items-start gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/8 border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{genError}</span>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!context.trim() || generating}
            className="w-full h-11"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Génération en cours…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Générer l'email
              </span>
            )}
          </Button>
        </div>

        {/* ── Résultat droit ── */}
        <div>
          <Card className={cn("border-border/50 flex flex-col", !result && "min-h-[460px] items-center justify-center")}>
            {result ? (
              <>
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-foreground text-sm font-semibold">
                      <FileText className="h-4 w-4 text-primary" />
                      Email généré
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">Relisez et modifiez si nécessaire</CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline" size="icon" className="h-8 w-8"
                      onClick={handleGenerate}
                      disabled={generating || !context.trim()}
                      title="Régénérer"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", generating && "animate-spin")} />
                    </Button>
                    <Button
                      variant="outline" size="icon" className="h-8 w-8"
                      onClick={handleCopy}
                      title="Copier"
                    >
                      {copied
                        ? <Check className="h-3.5 w-3.5 text-primary" />
                        : <Copy className="h-3.5 w-3.5" />
                      }
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Objet */}
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Objet</p>
                    <p className="text-sm font-semibold text-foreground">{result.subject}</p>
                  </div>

                  {/* Corps */}
                  <div className="p-4 rounded-lg bg-muted/50 border border-border min-h-[180px]">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                      {result.body}
                    </pre>
                  </div>

                  {/* Scores qualité */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Score qualité</p>
                    {qualityItems.map(q => (
                      <div key={q.label} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-20 shrink-0">{q.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${q.value}%`, background: q.color }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-foreground w-9 text-right">{q.value}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Prédiction satisfaction */}
                  {!satisfaction && (
                    <button
                      onClick={handlePredictSatisfaction}
                      disabled={loadingSat}
                      style={{
                        width: "100%", background: "#F5F3FF", color: "#7C3AED",
                        border: "1px solid #DDD6FE", borderRadius: 8, padding: "8px",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      {loadingSat
                        ? "⏳ Prédiction en cours…"
                        : "⭐ Prédire la satisfaction client"}
                    </button>
                  )}
                  {satisfaction && (
                    <div style={{
                      borderRadius: 10, border: "1px solid #DDD6FE",
                      background: "#F5F3FF", padding: "12px 14px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>
                          {"⭐".repeat(satisfaction.stars)}{"☆".repeat(5 - satisfaction.stars)}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#7C3AED" }}>
                          {satisfaction.label}
                        </span>
                        <span style={{
                          marginLeft: "auto", fontSize: 11, fontWeight: 600, padding: "2px 8px",
                          borderRadius: 20,
                          background: satisfaction.risk_level === "low" ? "#ECFDF5"
                            : satisfaction.risk_level === "medium" ? "#FFFBEB" : "#FEF2F2",
                          color: satisfaction.risk_level === "low" ? "#059669"
                            : satisfaction.risk_level === "medium" ? "#D97706" : "#DC2626",
                        }}>
                          Risque {satisfaction.risk_level === "low" ? "faible"
                            : satisfaction.risk_level === "medium" ? "moyen" : "élevé"}
                        </span>
                      </div>
                      {satisfaction.strengths.length > 0 && (
                        <div style={{ fontSize: 11, color: "#059669", marginBottom: 4 }}>
                          {satisfaction.strengths.map((s, i) => <div key={i}>✓ {s}</div>)}
                        </div>
                      )}
                      {satisfaction.improvements.length > 0 && (
                        <div style={{ fontSize: 11, color: "#D97706" }}>
                          {satisfaction.improvements.map((s, i) => <div key={i}>💡 {s}</div>)}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>

                {/* Sauvegarde */}
                <div className="px-5 pb-5 pt-3 border-t border-border space-y-2">
                  {saveMsg && (
                    <p className={cn("text-xs flex items-center gap-1", saved ? "text-green-600" : "text-destructive")}>
                      {saved && <Check className="h-3 w-3" />}
                      {saveMsg}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full h-9 text-sm"
                    onClick={handleSave}
                    disabled={saving || !clientEmail.trim() || saved}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                        Sauvegarde…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-3.5 w-3.5" />
                        {clientEmail.trim()
                          ? "Sauvegarder dans l'historique"
                          : "Entrez l'email client pour sauvegarder"}
                      </span>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center p-10 space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mx-auto">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-foreground text-sm">Aucun email généré</h3>
                  <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                    Remplissez le contexte et cliquez sur "Générer l'email".
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  )
}
