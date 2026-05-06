"use client"

import { useState } from "react"
import {
  Mail, Sparkles, Copy, Check, RefreshCw, Wand2,
  AlertCircle, User, Hash, FileSearch, ChevronDown, ChevronUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { api, type AnalysisResult, type GeneratedEmail, type ImprovedEmail } from "@/lib/api"

// ── Helpers ────────────────────────────────────────────────────────────────

const SERVICE_COLORS: Record<string, string> = {
  reclamation:          "bg-red-100 text-red-800 border-red-200",
  suivi_colis:          "bg-blue-100 text-blue-800 border-blue-200",
  information_offre:    "bg-green-100 text-green-800 border-green-200",
  escalade_mediateur:   "bg-orange-100 text-orange-800 border-orange-200",
  situation_handicap:   "bg-purple-100 text-purple-800 border-purple-200",
  autre:                "bg-gray-100 text-gray-800 border-gray-200",
}

const URGENCY_COLORS: Record<string, string> = {
  faible:  "bg-green-50 text-green-700",
  normale: "bg-yellow-50 text-yellow-700",
  haute:   "bg-red-50 text-red-700",
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : "bg-red-500"
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{value}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function DiffViewer({ original, improved }: { original: string; improved: string }) {
  const origLines = original.split("\n")
  const imprLines = improved.split("\n")

  return (
    <div className="grid gap-3 sm:grid-cols-2 text-xs font-mono">
      <div>
        <p className="text-muted-foreground font-sans text-xs mb-1 font-semibold">Brouillon original</p>
        <div className="rounded bg-red-50 border border-red-200 p-3 whitespace-pre-wrap leading-relaxed">
          {origLines.map((line, i) => (
            <div key={i} className={imprLines[i] !== line ? "bg-red-100 -mx-3 px-3" : ""}>{line}</div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-muted-foreground font-sans text-xs mb-1 font-semibold">Version améliorée</p>
        <div className="rounded bg-green-50 border border-green-200 p-3 whitespace-pre-wrap leading-relaxed">
          {imprLines.map((line, i) => (
            <div key={i} className={origLines[i] !== line ? "bg-green-100 -mx-3 px-3" : ""}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function IncomingEmailPage() {
  const [incomingEmail, setIncomingEmail] = useState("")
  const [advisorDraft, setAdvisorDraft] = useState("")
  const [editedBody, setEditedBody] = useState("")
  const [mode, setMode] = useState<"generate" | "improve">("generate")

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [generated, setGenerated] = useState<GeneratedEmail | null>(null)
  const [improved, setImproved] = useState<ImprovedEmail | null>(null)

  const [loadingAnalyze, setLoadingAnalyze] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showDiff, setShowDiff] = useState(false)

  // ── Actions ──────────────────────────────────────────────────────────────

  async function handleAnalyze() {
    if (!incomingEmail.trim()) return
    setLoadingAnalyze(true)
    setError(null)
    setAnalysis(null)
    setGenerated(null)
    setImproved(null)
    try {
      const result = await api.post<AnalysisResult>("/ai/analyze", {
        email_content: incomingEmail,
      })
      setAnalysis(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'analyse")
    } finally {
      setLoadingAnalyze(false)
    }
  }

  async function handleGenerate() {
    if (!analysis) return
    setLoadingAction(true)
    setError(null)
    try {
      const result = await api.post<GeneratedEmail>("/ai/generate-response", {
        email_content: incomingEmail,
        service_type: analysis.service_type,
        entities: analysis.entities,
      })
      setGenerated(result)
      setEditedBody(result.body)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la génération")
    } finally {
      setLoadingAction(false)
    }
  }

  async function handleImprove() {
    if (!advisorDraft.trim()) return
    setLoadingAction(true)
    setError(null)
    try {
      const result = await api.post<ImprovedEmail>("/ai/improve", {
        original_email: incomingEmail,
        advisor_draft: advisorDraft,
        service_type: analysis?.service_type,
      })
      setImproved(result)
      setEditedBody(result.improved_body)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'amélioration")
    } finally {
      setLoadingAction(false)
    }
  }

  function handleCopy() {
    const text = editedBody || generated?.body || improved?.improved_body || ""
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const qualityScore = generated?.quality_score ?? improved?.quality_score ?? null
  const outputBody = editedBody || generated?.body || improved?.improved_body || ""
  const hasOutput = !!(generated || improved)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Traitement des mails entrants</h1>
        <p className="text-muted-foreground">
          Collez le mail client, analysez-le et générez ou améliorez la réponse.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ── Left column: input ────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Incoming email paste zone */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground text-base">
                <Mail className="h-4 w-4 text-primary" />
                Mail client reçu
              </CardTitle>
              <CardDescription>Collez le mail entrant du client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Coller le mail client ici…"
                value={incomingEmail}
                onChange={(e) => {
                  setIncomingEmail(e.target.value)
                  setAnalysis(null)
                  setGenerated(null)
                  setImproved(null)
                }}
                className="min-h-[180px] resize-none font-mono text-sm"
              />
              <Button
                onClick={handleAnalyze}
                disabled={!incomingEmail.trim() || loadingAnalyze}
                className="w-full"
              >
                {loadingAnalyze ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Analyse en cours…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FileSearch className="h-4 w-4" />
                    Analyser le mail
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Analysis result */}
          {analysis && (
            <Card className="border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Résultat de l&apos;analyse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Service type + urgency */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn("border text-xs", SERVICE_COLORS[analysis.service_type])}>
                    {analysis.service_type_label}
                  </Badge>
                  <Badge className={cn("text-xs", URGENCY_COLORS[analysis.entities.urgency])}>
                    Urgence : {analysis.entities.urgency}
                  </Badge>
                </div>

                {/* Entities */}
                <div className="grid gap-2 text-sm">
                  {analysis.entities.client_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span><span className="font-medium text-foreground">Client :</span> {analysis.entities.client_name}</span>
                    </div>
                  )}
                  {analysis.entities.dossier_number && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Hash className="h-3.5 w-3.5 shrink-0" />
                      <span><span className="font-medium text-foreground">Dossier :</span> {analysis.entities.dossier_number}</span>
                    </div>
                  )}
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">Demande :</span> {analysis.entities.main_request}
                  </p>
                </div>

                {/* Recommendation */}
                <div className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground border border-border/40">
                  <AlertCircle className="h-3.5 w-3.5 inline mr-1.5 text-primary" />
                  {analysis.recommended_action}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mode tabs */}
          {analysis && (
            <Card className="border-border/50">
              <CardContent className="pt-4 space-y-4">
                <Tabs value={mode} onValueChange={(v) => setMode(v as "generate" | "improve")}>
                  <TabsList className="w-full">
                    <TabsTrigger value="generate" className="flex-1 gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Générer une réponse
                    </TabsTrigger>
                    <TabsTrigger value="improve" className="flex-1 gap-1.5">
                      <Wand2 className="h-3.5 w-3.5" />
                      Améliorer mon brouillon
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="generate" className="mt-4">
                    <Button
                      onClick={handleGenerate}
                      disabled={loadingAction}
                      className="w-full"
                    >
                      {loadingAction ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Génération…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Générer la réponse IA
                        </span>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="improve" className="mt-4 space-y-3">
                    <Textarea
                      placeholder="Saisissez votre brouillon de réponse…"
                      value={advisorDraft}
                      onChange={(e) => setAdvisorDraft(e.target.value)}
                      className="min-h-[140px] resize-none text-sm"
                    />
                    <Button
                      onClick={handleImprove}
                      disabled={!advisorDraft.trim() || loadingAction}
                      className="w-full"
                    >
                      {loadingAction ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Amélioration…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Wand2 className="h-4 w-4" />
                          Améliorer mon brouillon
                        </span>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* ── Right column: output ──────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Email output editor */}
          <Card className={cn("border-border/50 h-fit", !hasOutput && "flex flex-col items-center justify-center min-h-[300px]")}>
            {hasOutput ? (
              <>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base text-foreground">
                      {mode === "generate" ? "Réponse générée" : "Brouillon amélioré"}
                    </CardTitle>
                    {generated?.subject && (
                      <CardDescription className="mt-1">
                        Objet : {generated.subject}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8"
                      onClick={() => mode === "generate" ? handleGenerate() : handleImprove()}
                      disabled={loadingAction}
                    >
                      <RefreshCw className={cn("h-4 w-4", loadingAction && "animate-spin")} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Editable body */}
                  <Textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    className="min-h-[280px] resize-none text-sm font-mono leading-relaxed"
                  />

                  {/* Quality scores */}
                  {qualityScore && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score qualité</p>
                      <ScoreBar label="Clarté" value={qualityScore.clarity} />
                      <ScoreBar label="Empathie" value={qualityScore.empathy} />
                      <ScoreBar label="Conformité" value={qualityScore.compliance} />
                    </div>
                  )}

                  {/* Diff viewer for improve mode */}
                  {improved && (
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between text-muted-foreground text-xs"
                        onClick={() => setShowDiff(!showDiff)}
                      >
                        Voir les modifications ({improved.changes_summary.length})
                        {showDiff ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                      {showDiff && (
                        <div className="mt-3 space-y-3">
                          <ul className="space-y-1">
                            {improved.changes_summary.map((change, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="text-green-500 font-bold mt-0.5">+</span>
                                {change}
                              </li>
                            ))}
                          </ul>
                          <DiffViewer original={advisorDraft} improved={improved.improved_body} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Copy for Outlook */}
                  <Button className="w-full gap-2" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copié !" : "Copier pour Outlook"}
                  </Button>
                </CardContent>
              </>
            ) : (
              <div className="text-center p-8 space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mx-auto">
                  <Mail className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">En attente</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                    Analysez d&apos;abord le mail puis choisissez un mode de réponse.
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
