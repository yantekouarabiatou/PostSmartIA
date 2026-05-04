"use client"

import { useState } from "react"
import {
  Search,
  FileText,
  Upload,
  FolderOpen,
  ChevronRight,
  Download,
  Trash2,
  Eye,
  Plus,
  X,
  File,
  FileSpreadsheet,
  FileImage,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const categories = [
  { id: "all", name: "Tous", count: 23 },
  { id: "procedures", name: "Procédures", count: 8 },
  { id: "tarifs", name: "Tarifs", count: 5 },
  { id: "templates", name: "Modèles", count: 6 },
  { id: "reglements", name: "Règlements", count: 4 },
]

const documents = [
  {
    id: 1,
    name: "Guide des procédures de réclamation",
    category: "procedures",
    type: "PDF",
    size: "2.4 MB",
    updated: "15 avril 2026",
    description: "Document détaillant les étapes à suivre pour traiter les réclamations clients.",
  },
  {
    id: 2,
    name: "Grille tarifaire Colissimo 2026",
    category: "tarifs",
    type: "Excel",
    size: "1.2 MB",
    updated: "1er janvier 2026",
    description: "Tarifs en vigueur pour les envois Colissimo France et international.",
  },
  {
    id: 3,
    name: "Modèle réponse réclamation standard",
    category: "templates",
    type: "Word",
    size: "45 KB",
    updated: "10 mars 2026",
    description: "Template de réponse pour les réclamations courantes.",
  },
  {
    id: 4,
    name: "Conditions générales de vente",
    category: "reglements",
    type: "PDF",
    size: "890 KB",
    updated: "1er janvier 2026",
    description: "CGV applicables aux services postaux et colis.",
  },
  {
    id: 5,
    name: "Procédure de réexpédition du courrier",
    category: "procedures",
    type: "PDF",
    size: "1.8 MB",
    updated: "20 février 2026",
    description: "Guide complet pour la mise en place des réexpéditions.",
  },
  {
    id: 6,
    name: "Tarifs Chronopost Express",
    category: "tarifs",
    type: "PDF",
    size: "3.1 MB",
    updated: "1er janvier 2026",
    description: "Grille tarifaire des services express Chronopost.",
  },
  {
    id: 7,
    name: "Modèle confirmation de service",
    category: "templates",
    type: "Word",
    size: "38 KB",
    updated: "5 avril 2026",
    description: "Template pour confirmer la mise en place d'un service.",
  },
  {
    id: 8,
    name: "Règlement intérieur service client",
    category: "reglements",
    type: "PDF",
    size: "456 KB",
    updated: "15 janvier 2026",
    description: "Règles et bonnes pratiques du service clientèle.",
  },
]

const getFileIcon = (type: string) => {
  switch (type) {
    case "PDF":
      return FileText
    case "Excel":
      return FileSpreadsheet
    case "Word":
      return File
    case "Image":
      return FileImage
    default:
      return FileText
  }
}

const getFileColor = (type: string) => {
  switch (type) {
    case "PDF":
      return "text-red-500"
    case "Excel":
      return "text-green-500"
    case "Word":
      return "text-blue-500"
    default:
      return "text-muted-foreground"
  }
}

export default function KnowledgeBasePage() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedDocument, setSelectedDocument] = useState<typeof documents[0] | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === "all" || doc.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Base de connaissances
          </h1>
          <p className="text-muted-foreground">
            Consultez la documentation et les ressources pour vous aider dans vos réponses.
          </p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-foreground">Ajouter un document</DialogTitle>
              <DialogDescription>
                Uploadez un nouveau document dans la base de connaissances.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              >
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Glissez-déposez vos fichiers ici ou{" "}
                  <span className="text-primary font-medium">parcourir</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  PDF, Word, Excel (max. 10 MB)
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                  Annuler
                </Button>
                <Button>Uploader</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Categories Sidebar */}
        <Card className="border-border/50 lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              Catégories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <nav className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span>{category.name}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      activeCategory === category.id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : ""
                    )}
                  >
                    {category.count}
                  </Badge>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredDocuments.length} document{filteredDocuments.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {filteredDocuments.map((doc) => {
              const FileIcon = getFileIcon(doc.type)
              return (
                <Card
                  key={doc.id}
                  className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
                  onClick={() => setSelectedDocument(doc)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                        <FileIcon className={cn("h-5 w-5", getFileColor(doc.type))} />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {doc.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {doc.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{doc.type}</span>
                          <span>•</span>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{doc.updated}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredDocuments.length === 0 && (
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">
                  Aucun document trouvé
                </h3>
                <p className="text-sm text-muted-foreground">
                  Essayez de modifier vos critères de recherche.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-start gap-3">
              {selectedDocument && (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                  {(() => {
                    const FileIcon = getFileIcon(selectedDocument.type)
                    return <FileIcon className={cn("h-5 w-5", getFileColor(selectedDocument.type))} />
                  })()}
                </div>
              )}
              <div>
                <DialogTitle className="text-foreground">{selectedDocument?.name}</DialogTitle>
                <DialogDescription className="mt-1">
                  {selectedDocument?.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium text-foreground">{selectedDocument?.type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taille</p>
                <p className="text-sm font-medium text-foreground">{selectedDocument?.size}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mis à jour</p>
                <p className="text-sm font-medium text-foreground">{selectedDocument?.updated}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
              <Button variant="outline" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
