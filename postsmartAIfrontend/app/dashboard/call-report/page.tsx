"use client"

import { useState } from "react"
import {
  Phone, Sparkles, Copy, Check, RotateCcw, X, AlertCircle, FileText, Save,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { api, type GeneratedEmail } from "@/lib/api"
import VoiceRecorder from "@/components/voice-recorder"
import AudioReader from "@/components/ui/audio-reader"
import AppSelect, { type SelectOption } from "@/components/ui/app-select"
import QualityScore from "@/components/ui/quality-score"
async function exportCallReportToPdf(payload: any) {
  if (typeof window === 'undefined') return
  const mod = await import("../../../lib/export-pdf")
  return mod.exportCallReportToPdf(payload)
}

const REQUEST_TYPE_OPTIONS: SelectOption[] = [
  { value: "Suivi de colis",           label: "📦 Suivi de colis" },
  { value: "Réclamation",              label: "⚠️ Réclamation" },
  { value: "Information offre",        label: "ℹ️ Information offre" },
  { value: "Problème livraison",       label: "🚚 Problème livraison" },
  { value: "Question facturation",     label: "💳 Question facturation" },
  { value: "Situation de handicap",    label: "♿ Situation de handicap" },
  { value: "Escalade médiateur",       label: "🚨 Escalade médiateur" },
  { value: "Autre",                    label: "📝 Autre" },
]

const URGENCY_PILLS = [
  { value: "faible",  label: "🟢 Faible",  active: "bg-green-100 text-green-700 border-green-400 dark:bg-green-900/30 dark:text-green-400" },
  { value: "normale", label: "🟡 Normale", active: "bg-yellow-100 text-yellow-700 border-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { value: "haute",   label: "🔴 Haute",   active: "bg-red-100 text-red-700 border-red-400 dark:bg-red-900/30 dark:text-red-400" },
] as const

type Urgency = "faible" | "normale" | "haute"

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : "bg-red-500"
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-3 shadow-lg dark:border-green-800 dark:bg-green-950">
      <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
      <span className="text-sm font-medium text-green-800 dark:text-green-200">{message}</span>
      <button onClick={onClose} className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function CallReportPage() {
  const [clientName, setClientName]     = useState("")
  const [clientEmail, setClientEmail]   = useState("")
  const [clientPhone, setClientPhone]   = useState("")
  const [callDate, setCallDate]         = useState(() => new Date().toISOString().slice(0, 16))
  const [requestType, setRequestType]   = useState("")
  const [callSummary, setCallSummary]   = useState("")
  const [commitments, setCommitments]   = useState("")
  const [nextSteps, setNextSteps]       = useState("")
  const [urgency, setUrgency]           = useState<Urgency>("normale")
  const [callDuration, setCallDuration] = useState("")

  const [result, setResult]           = useState<GeneratedEmail | null>(null)
  const [editedSubject, setEditedSubject] = useState("")
  const [editedBody, setEditedBody]   = useState("")
  const [loading, setLoading]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [copied, setCopied]           = useState(false)
  const [toast, setToast]             = useState<string | null>(null)

  function handleTranscript(text: string, field: string) {
    if (field === "resume")           setCallSummary(prev => prev + text)
    else if (field === "engagements") setCommitments(prev => prev + text)
    else if (field === "prochaines_etapes") setNextSteps(prev => prev + text)
  }

  async function handleGenerate() {
    if (!clientName.trim() || !requestType || !callSummary.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await api.post<GeneratedEmail>("/call-reports/generate", {
        client_name:   clientName,
        client_email:  clientEmail || null,
        client_phone:  clientPhone || null,
        call_date:     callDate,
        demand_type:   requestType,
        call_summary:  callSummary,
        commitments:   commitments || null,
        next_steps:    nextSteps || null,
        urgency,
        call_duration: callDuration ? parseInt(callDuration) : null,
      })
      setResult(data)
      setEditedSubject(data.subject)
      setEditedBody(data.body)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la génération")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!result) return
    setSaving(true)
    setError(null)
    try {
      await api.post("/call-reports", {
        client_name:        clientName,
        client_email:       clientEmail || null,
        client_phone:       clientPhone || null,
        call_date:          callDate,
        demand_type:        requestType,
        call_summary:       callSummary,
        commitments:        commitments || null,
        next_steps:         nextSteps || null,
        urgency,
        call_duration:      callDuration ? parseInt(callDuration) : null,
        ai_response:        result.body,
        validated_response: editedBody,
        ai_quality_score:   result.quality_score,
      })
      setToast("Mail post-appel enregistré avec succès ✓")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  function handleCopy() {
    const text = editedBody || result?.body || ""
    if (!text) return
    navigator.clipboard.writeText(`Objet : ${editedSubject}\n\n${text}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleReset() {
    setResult(null)
    setEditedSubject("")
    setEditedBody("")
    setError(null)
  }

  const isValid = clientName.trim() && requestType && callSummary.trim()
  const qs = result?.quality_score

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <Phone className="h-6 w-6 text-primary" />
            Compte-rendu d&apos;appel
          </h1>
          <p className="text-muted-foreground text-sm">
            Saisissez ou dictez le résumé de votre échange client pour générer un mail post-appel.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400">
          🔒 Aucun audio conservé — conforme RGPD
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ── Left: formulaire ───────────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-4 w-4 text-primary" />
                Informations de l&apos;appel
              </CardTitle>
              <CardDescription>Les champs marqués * sont obligatoires</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Nom client */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Nom du client <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Ex : Marie Dupont"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                />
              </div>

              {/* Email + Téléphone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Email client</label>
                  <Input
                    type="email"
                    placeholder="marie.dupont@gmail.com"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                  <Input
                    type="tel"
                    placeholder="06 00 00 00 00"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Date et heure de l'appel */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  📅 Date et heure de l&apos;appel <span className="text-destructive">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={callDate}
                  onChange={e => setCallDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-muted-foreground">Par défaut : maintenant. Modifiez si l&apos;appel a eu lieu plus tôt.</p>
              </div>

              {/* Type de demande */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Type de demande <span className="text-destructive">*</span>
                </label>
                <AppSelect
                  options={REQUEST_TYPE_OPTIONS}
                  value={REQUEST_TYPE_OPTIONS.find(o => o.value === requestType) ?? null}
                  onChange={(opt) => setRequestType((opt as SelectOption | null)?.value ?? "")}
                  placeholder="Sélectionner le type…"
                  isClearable
                />
              </div>

              {/* Résumé + dictée vocale */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Résumé de l&apos;échange <span className="text-destructive">*</span>
                  </label>
                  <VoiceRecorder onTranscript={handleTranscript} targetField="resume" />
                </div>
                <Textarea
                  placeholder="Décrivez l'échange avec le client…"
                  value={callSummary}
                  onChange={e => setCallSummary(e.target.value)}
                  className="min-h-[130px] resize-none text-sm"
                />
              </div>

              {/* Engagements + dictée */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">Engagements pris</label>
                  <VoiceRecorder onTranscript={handleTranscript} targetField="engagements" />
                </div>
                <Textarea
                  placeholder="Ex : Remboursement sous 5 jours, rappel client prévu…"
                  value={commitments}
                  onChange={e => setCommitments(e.target.value)}
                  className="min-h-[80px] resize-none text-sm"
                />
              </div>

              {/* Prochaines étapes + dictée */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">Prochaines étapes</label>
                  <VoiceRecorder onTranscript={handleTranscript} targetField="prochaines_etapes" />
                </div>
                <Textarea
                  placeholder="Ex : Envoyer mail de confirmation, ouvrir dossier réclamation…"
                  value={nextSteps}
                  onChange={e => setNextSteps(e.target.value)}
                  className="min-h-[80px] resize-none text-sm"
                />
              </div>

              {/* Urgence pills */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Niveau d&apos;urgence</label>
                <div className="flex gap-2 flex-wrap">
                  {URGENCY_PILLS.map(pill => (
                    <button
                      key={pill.value}
                      type="button"
                      onClick={() => setUrgency(pill.value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                        urgency === pill.value
                          ? pill.active
                          : "border-border text-muted-foreground hover:border-foreground/30"
                      )}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Durée */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Durée de l&apos;appel (minutes)
                </label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Ex : 8"
                  value={callDuration}
                  onChange={e => setCallDuration(e.target.value)}
                  className="w-32"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={!isValid || loading}
                className="w-full h-11"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Génération en cours…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Générer le mail post-appel
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: résultat ────────────────────────────────────────── */}
        <div>
          <Card className={cn(
            "border-border/50",
            !result && "flex flex-col items-center justify-center min-h-[300px]"
          )}>
            {result ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Mail post-appel généré
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Modifiez si besoin avant de valider
                      </CardDescription>
                    </div>
                    {qs?.overall !== undefined && (
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-bold border",
                        qs.overall >= 80
                          ? "bg-green-100 text-green-700 border-green-300"
                          : qs.overall >= 60
                          ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                          : "bg-red-100 text-red-700 border-red-300"
                      )}>
                        Score {qs.overall}/100
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Scores qualité */}
                  {qs && <QualityScore scores={qs} />}

                  {/* Objet éditable */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Objet
                    </label>
                    <Input
                      value={editedSubject}
                      onChange={e => setEditedSubject(e.target.value)}
                      className="text-sm font-medium"
                    />
                  </div>

                  {/* Corps éditable */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Corps du mail
                    </label>
                    <Textarea
                      value={editedBody}
                      onChange={e => setEditedBody(e.target.value)}
                      className="min-h-[280px] resize-none text-sm font-mono leading-relaxed"
                    />
                  </div>

                  {/* Lecture audio du mail généré */}
                  {editedBody && (
                    <AudioReader text={editedBody} autoPlay={true} />
                  )}

                  {/* Boutons d'action */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {saving ? (
                        <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Valider et enregistrer
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleCopy}
                      className="gap-1.5"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copié !" : "Copier"}
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={handleGenerate}
                      disabled={loading}
                      className="gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Régénérer
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => exportCallReportToPdf({
                        id: 0,
                        client_name:        clientName,
                        client_email:       clientEmail || null,
                        client_phone:       clientPhone || null,
                        demand_type:        requestType,
                        urgency,
                        call_duration:      callDuration ? parseInt(callDuration) : null,
                        call_summary:       callSummary,
                        commitments:        commitments || null,
                        next_steps:         nextSteps || null,
                        validated_response: editedBody || null,
                        created_at:         new Date().toISOString(),
                      })}
                      className="gap-1.5"
                    >
                      📄 PDF
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={handleReset}
                      className="gap-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="text-center p-8 space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mx-auto">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Aucun mail généré</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                    Remplissez le formulaire et cliquez sur &quot;Générer&quot;.
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
