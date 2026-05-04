"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  Calendar,
  Eye,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const historyData = [
  {
    id: 1,
    subject: "Confirmation de livraison - Colis LP123456789FR",
    client: "Marie Martin",
    type: "Livraison",
    date: "17 avril 2026",
    time: "14:32",
    content: `Madame Martin,

Suite à votre demande concernant le suivi de votre colis n°LP123456789FR, je me permets de vous apporter les informations suivantes.

Votre colis a bien été pris en charge par nos services le 15 janvier 2026. Après vérification auprès de notre service logistique, je peux vous confirmer que votre envoi est actuellement en transit et devrait être livré à l'adresse indiquée dans les 48 heures ouvrées.

Cordialement,
Jean Dupont`,
  },
  {
    id: 2,
    subject: "Réponse à réclamation - Colis endommagé",
    client: "Pierre Bernard",
    type: "Réclamation",
    date: "17 avril 2026",
    time: "11:15",
    content: `Monsieur Bernard,

Je fais suite à votre réclamation concernant les dommages constatés sur votre colis. Je comprends parfaitement votre mécontentement et vous présente nos sincères excuses pour ce désagrément.

Après examen de votre dossier, nous avons ouvert une procédure d'indemnisation. Un conseiller vous contactera sous 48h pour finaliser votre dossier.

Cordialement,
Jean Dupont`,
  },
  {
    id: 3,
    subject: "Information tarifs - Envoi international",
    client: "Sophie Leroy",
    type: "Information",
    date: "16 avril 2026",
    time: "16:45",
    content: `Madame Leroy,

Suite à votre demande d'information concernant les tarifs d'envoi vers le Canada, voici les options disponibles :

- Colissimo International : 25,50€ (délai 7-10 jours)
- Chronopost International : 65,00€ (délai 2-4 jours)

N'hésitez pas à me contacter pour toute information complémentaire.

Cordialement,
Jean Dupont`,
  },
  {
    id: 4,
    subject: "Confirmation de service - Réexpédition",
    client: "Thomas Petit",
    type: "Confirmation",
    date: "16 avril 2026",
    time: "09:20",
    content: `Monsieur Petit,

Je vous confirme la mise en place de votre service de réexpédition définitive à compter du 1er mai 2026.

Tous vos courriers seront désormais acheminés à votre nouvelle adresse.

Cordialement,
Jean Dupont`,
  },
  {
    id: 5,
    subject: "Relance - Documents manquants",
    client: "Emma Dubois",
    type: "Relance",
    date: "15 avril 2026",
    time: "14:00",
    content: `Madame Dubois,

Je me permets de vous relancer concernant les documents nécessaires à l'ouverture de votre compte professionnel La Poste.

Les pièces suivantes sont toujours en attente :
- Extrait Kbis de moins de 3 mois
- Pièce d'identité du gérant

Cordialement,
Jean Dupont`,
  },
  {
    id: 6,
    subject: "Suivi de livraison - Express",
    client: "Lucas Moreau",
    type: "Livraison",
    date: "15 avril 2026",
    time: "10:30",
    content: `Monsieur Moreau,

Votre envoi Chronopost n°CH987654321FR a été livré ce jour à 09h45.

La signature a été recueillie par M. Moreau.

Cordialement,
Jean Dupont`,
  },
]

const typeColors: Record<string, string> = {
  Livraison: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Réclamation: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Information: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Confirmation: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Relance: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
}

export default function HistoryPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedEmail, setSelectedEmail] = useState<typeof historyData[0] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filteredData = historyData.filter((item) => {
    const matchesSearch =
      item.subject.toLowerCase().includes(search.toLowerCase()) ||
      item.client.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === "all" || item.type === typeFilter
    return matchesSearch && matchesType
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Historique
        </h1>
        <p className="text-muted-foreground">
          Retrouvez tous les emails que vous avez générés.
        </p>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par sujet ou client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="Livraison">Livraison</SelectItem>
                  <SelectItem value="Réclamation">Réclamation</SelectItem>
                  <SelectItem value="Information">Information</SelectItem>
                  <SelectItem value="Confirmation">Confirmation</SelectItem>
                  <SelectItem value="Relance">Relance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Emails générés</CardTitle>
          <CardDescription>
            {filteredData.length} email{filteredData.length > 1 ? "s" : ""} trouvé{filteredData.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paginatedData.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-foreground truncate">
                      {item.subject}
                    </h3>
                    <Badge variant="secondary" className={cn("shrink-0", typeColors[item.type])}>
                      {item.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{item.client}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.date} à {item.time}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedEmail(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopy(item.content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Aucun email trouvé correspondant à vos critères.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Preview Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <DialogTitle className="text-foreground">{selectedEmail?.subject}</DialogTitle>
                <DialogDescription>
                  {selectedEmail?.client} • {selectedEmail?.date} à {selectedEmail?.time}
                </DialogDescription>
              </div>
              {selectedEmail && (
                <Badge variant="secondary" className={cn("shrink-0 mt-1", typeColors[selectedEmail.type])}>
                  {selectedEmail.type}
                </Badge>
              )}
            </div>
          </DialogHeader>
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
              {selectedEmail?.content}
            </pre>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setSelectedEmail(null)}>
              <X className="h-4 w-4 mr-2" />
              Fermer
            </Button>
            <Button onClick={() => selectedEmail && handleCopy(selectedEmail.content)}>
              <Copy className="h-4 w-4 mr-2" />
              Copier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
