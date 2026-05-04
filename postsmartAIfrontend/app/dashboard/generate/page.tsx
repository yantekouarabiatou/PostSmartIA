"use client"

import { useState } from "react"
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Send,
  ChevronDown,
  User,
  FileText,
  MessageSquare,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

const emailTypes = [
  { value: "livraison", label: "Suivi de livraison" },
  { value: "reclamation", label: "Réponse à réclamation" },
  { value: "information", label: "Demande d'information" },
  { value: "confirmation", label: "Confirmation de service" },
  { value: "relance", label: "Relance client" },
  { value: "autre", label: "Autre" },
]

const tones = [
  { value: "professionnel", label: "Professionnel" },
  { value: "empathique", label: "Empathique" },
  { value: "formel", label: "Formel" },
  { value: "amical", label: "Amical" },
]

const sampleGeneratedEmail = `Madame Martin,

Suite à votre demande concernant le suivi de votre colis n°LP123456789FR, je me permets de vous apporter les informations suivantes.

Votre colis a bien été pris en charge par nos services le 15 janvier 2026. Après vérification auprès de notre service logistique, je peux vous confirmer que votre envoi est actuellement en transit et devrait être livré à l'adresse indiquée dans les 48 heures ouvrées.

Vous pouvez suivre l'acheminement de votre colis en temps réel sur notre site laposte.fr ou via notre application mobile en utilisant le numéro de suivi mentionné ci-dessus.

Je reste à votre entière disposition pour tout renseignement complémentaire.

Cordialement,

Jean Dupont
Conseiller clientèle
La Poste - Service Client`

export default function GenerateEmailPage() {
  const [clientName, setClientName] = useState("")
  const [emailType, setEmailType] = useState("")
  const [tone, setTone] = useState("professionnel")
  const [context, setContext] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [generatedEmail, setGeneratedEmail] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setGeneratedEmail(sampleGeneratedEmail)
    setIsGenerating(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = async () => {
    setIsGenerating(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsGenerating(false)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Générer un email
        </h1>
        <p className="text-muted-foreground">
          Remplissez les informations ci-dessous pour générer un email personnalisé assisté par IA.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <User className="h-5 w-5 text-primary" />
                Informations client
              </CardTitle>
              <CardDescription>
                Entrez les détails du destinataire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Nom du client
                </label>
                <Input
                  placeholder="Ex: Marie Martin"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Type d&apos;email
                  </label>
                  <Select value={emailType} onValueChange={setEmailType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Ton
                  </label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <MessageSquare className="h-5 w-5 text-primary" />
                Contexte de la demande
              </CardTitle>
              <CardDescription>
                Décrivez la situation et ce que vous souhaitez communiquer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Contexte principal <span className="text-destructive">*</span>
                </label>
                <Textarea
                  placeholder="Ex: Le client demande le suivi de son colis LP123456789FR envoyé le 15 janvier. Il souhaite connaître la date de livraison estimée."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>

              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between h-10 px-3">
                    <span className="text-sm text-muted-foreground">
                      Options avancées
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        showAdvanced && "rotate-180"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Informations complémentaires
                    </label>
                    <Textarea
                      placeholder="Historique client, numéros de référence, détails spécifiques..."
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={!context || isGenerating}
            className="w-full h-12 text-base"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Génération en cours...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Générer l&apos;email
              </span>
            )}
          </Button>
        </div>

        {/* Generated Email Preview */}
        <div className="space-y-4">
          <Card className={cn(
            "border-border/50 h-full flex flex-col",
            !generatedEmail && "items-center justify-center"
          )}>
            {generatedEmail ? (
              <>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <FileText className="h-5 w-5 text-primary" />
                      Email généré
                    </CardTitle>
                    <CardDescription>
                      Relisez et modifiez si nécessaire avant envoi
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      className="h-9 w-9"
                    >
                      <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      className="h-9 w-9"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="h-full min-h-[400px] p-4 rounded-lg bg-muted/50 border border-border">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                      {generatedEmail}
                    </pre>
                  </div>
                </CardContent>
                <div className="p-6 pt-0 flex gap-3">
                  <Button variant="outline" className="flex-1">
                    Modifier
                  </Button>
                  <Button className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Copier et ouvrir Outlook
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center p-8 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    Aucun email généré
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-[250px]">
                    Remplissez le formulaire et cliquez sur &quot;Générer l&apos;email&quot; pour voir le résultat ici.
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
