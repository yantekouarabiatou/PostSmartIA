"use client"

import { useState, useEffect, useRef } from "react"
import {
  Phone, Sparkles, Copy, Check, Mic, MicOff, AlertCircle, FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { api, type GeneratedEmail } from "@/lib/api"

const REQUEST_TYPES = [
  "Réclamation",
  "Suivi colis / envoi",
  "Information offre / tarif",
  "Signalement incident",
  "Escalade médiateur",
  "Situation de handicap",
  "Demande de remboursement",
  "Changement d'adresse",
  "Autre",
]

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

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
}

export default function CallReportPage() {
  const [clientName, setClientName] = useState("")
  const [requestType, setRequestType] = useState("")
  const [callSummary, setCallSummary] = useState("")
  const [commitments, setCommitments] = useState("")
  const [nextSteps, setNextSteps] = useState("")

  const [result, setResult] = useState<GeneratedEmail | null>(null)
  const [editedBody, setEditedBody] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Voice dictation
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    const SpeechAPI = window.SpeechRecognition ?? window.webkitSpeechRecognition
    setSpeechSupported(!!SpeechAPI)
    if (!SpeechAPI) return

    const recognition = new SpeechAPI()
    recognition.lang = "fr-FR"
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = ""
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setCallSummary(transcript)
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
  }, [])

  function toggleListening() {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setCallSummary("")
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  async function handleGenerate() {
    if (!clientName.trim() || !requestType || !callSummary.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.post<GeneratedEmail>("/ai/call-report", {
        client_name: clientName,
        request_type: requestType,
        call_summary: callSummary,
        commitments,
        next_steps: nextSteps,
      })
      setResult(data)
      setEditedBody(data.body)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la génération")
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    const text = editedBody || result?.body || ""
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isValid = clientName.trim() && requestType && callSummary.trim()

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Compte-rendu d&apos;appel</h1>
        <p className="text-muted-foreground">
          Renseignez les éléments de l&apos;appel pour générer un mail post-appel structuré.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ── Left: form ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <Phone className="h-4 w-4 text-primary" />
                Informations de l&apos;appel
              </CardTitle>
              <CardDescription>Les champs marqués * sont obligatoires</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Nom du client <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Ex : Marie Martin"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              {/* Request type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Type de demande <span className="text-destructive">*</span>
                </label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Call summary + voice dictation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Résumé de l&apos;échange <span className="text-destructive">*</span>
                  </label>
                  {speechSupported && (
                    <Button
                      type="button"
                      variant={isListening ? "destructive" : "outline"}
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={toggleListening}
                    >
                      {isListening ? (
                        <><MicOff className="h-3.5 w-3.5" /> Arrêter</>
                      ) : (
                        <><Mic className="h-3.5 w-3.5" /> Dicter</>
                      )}
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <Textarea
                    placeholder={
                      isListening
                        ? "Parlez maintenant… (transcription en direct)"
                        : "Décrivez librement le déroulé de l'appel…"
                    }
                    value={callSummary}
                    onChange={(e) => setCallSummary(e.target.value)}
                    className={cn(
                      "min-h-[130px] resize-none text-sm",
                      isListening && "border-red-400 bg-red-50/30 focus-visible:ring-red-400"
                    )}
                  />
                  {isListening && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs text-red-500 font-medium">REC</span>
                    </div>
                  )}
                </div>
                {!speechSupported && (
                  <p className="text-xs text-muted-foreground">
                    La dictée vocale n&apos;est pas disponible sur ce navigateur.
                  </p>
                )}
              </div>

              {/* Commitments */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Engagements pris</label>
                <Textarea
                  placeholder="Ex : Remboursement sous 5 jours ouvrés, envoi d'un bon de réexpédition…"
                  value={commitments}
                  onChange={(e) => setCommitments(e.target.value)}
                  className="min-h-[80px] resize-none text-sm"
                />
              </div>

              {/* Next steps */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Prochaines étapes</label>
                <Textarea
                  placeholder="Ex : Rappel client le 10/06, escalade au service logistique…"
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  className="min-h-[70px] resize-none text-sm"
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

        {/* ── Right: generated email ────────────────────────────────────── */}
        <div>
          <Card className={cn(
            "border-border/50",
            !result && "flex flex-col items-center justify-center min-h-[300px]"
          )}>
            {result ? (
              <>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base text-foreground">Mail généré</CardTitle>
                    <CardDescription className="mt-1">Objet : {result.subject}</CardDescription>
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    className="min-h-[280px] resize-none text-sm font-mono leading-relaxed"
                  />

                  {result.quality_score && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score qualité</p>
                      <ScoreBar label="Clarté" value={result.quality_score.clarity} />
                      <ScoreBar label="Empathie" value={result.quality_score.empathy} />
                      <ScoreBar label="Conformité" value={result.quality_score.compliance} />
                    </div>
                  )}

                  <Button className="w-full gap-2" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copié !" : "Copier pour Outlook"}
                  </Button>
                </CardContent>
              </>
            ) : (
              <div className="text-center p-8 space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mx-auto">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Aucun mail généré</h3>
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
