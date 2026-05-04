"use client"

import { Mail, Clock, TrendingUp, FileText, ArrowRight, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const stats = [
  {
    title: "Emails générés",
    value: "147",
    description: "Ce mois-ci",
    icon: Mail,
    trend: "+12%",
  },
  {
    title: "Temps moyen",
    value: "45s",
    description: "Par email",
    icon: Clock,
    trend: "-23%",
  },
  {
    title: "Satisfaction",
    value: "94%",
    description: "Taux de validation",
    icon: TrendingUp,
    trend: "+5%",
  },
  {
    title: "Base de données",
    value: "23",
    description: "Documents indexés",
    icon: FileText,
    trend: "+3",
  },
]

const recentEmails = [
  {
    id: 1,
    subject: "Confirmation de livraison",
    client: "Marie Martin",
    date: "Il y a 2 heures",
    type: "Livraison",
  },
  {
    id: 2,
    subject: "Suivi de réclamation",
    client: "Pierre Bernard",
    date: "Il y a 4 heures",
    type: "Réclamation",
  },
  {
    id: 3,
    subject: "Information tarifs",
    client: "Sophie Leroy",
    date: "Hier",
    type: "Information",
  },
]

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground">
          Bienvenue sur PostSmartAI, votre assistant intelligent pour la génération d&apos;emails.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{stat.description}</span>
                <span className="text-xs font-medium text-primary">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Emails */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">Actions rapides</CardTitle>
            <CardDescription>
              Accédez rapidement aux fonctionnalités principales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-between h-12" asChild>
              <Link href="/dashboard/generate">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Générer un nouvel email
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between h-12" asChild>
              <Link href="/dashboard/history">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Voir l&apos;historique
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between h-12" asChild>
              <Link href="/dashboard/knowledge">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Consulter la base de connaissances
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Emails */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">Emails récents</CardTitle>
            <CardDescription>
              Les derniers emails que vous avez générés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEmails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {email.subject}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{email.client}</span>
                      <span>•</span>
                      <span>{email.date}</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary shrink-0">
                    {email.type}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4" asChild>
              <Link href="/dashboard/history">
                Voir tout l&apos;historique
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-4 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shrink-0">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">Astuce du jour</h3>
            <p className="text-sm text-muted-foreground">
              Pour des emails plus personnalisés, pensez à ajouter le contexte du client et 
              l&apos;historique de ses interactions. Plus vous fournissez de détails, plus 
              l&apos;email généré sera pertinent et adapté à la situation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
