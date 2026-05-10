"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type Locale = "fr" | "en"

const translations = {
  fr: {
    // Navbar
    nav: {
      dashboard:    "Tableau de bord",
      incoming:     "Mails entrants",
      forms:        "Formulaires",
      generate:     "Générer un email",
      history:      "Historique",
    },
    greeting: {
      morning:   "Bonjour",
      afternoon: "Bon après-midi",
      evening:   "Bonsoir",
    },
    notifications: {
      title:        "Notifications",
      markAllRead:  "Tout marquer lu",
      empty:        "Aucune notification",
      viewAll:      "Voir toutes les notifications →",
    },
    profile: {
      myProfile:    "👤 Mon profil",
      home:         "🏠 Page d'accueil",
      loginPage:    "🔑 Page de connexion",
      users:        "👥 Gestion utilisateurs",
      logs:         "🔐 Journaux d'activité",
      logout:       "🚪 Se déconnecter",
    },
    roles: {
      conseiller: "Conseiller",
      manager:    "Manager",
      admin:      "Administrateur",
    },
    // Common
    common: {
      save:       "Enregistrer",
      cancel:     "Annuler",
      confirm:    "Confirmer",
      delete:     "Supprimer",
      edit:       "Modifier",
      send:       "Envoyer",
      export:     "Exporter PDF",
      loading:    "Chargement…",
      error:      "Une erreur est survenue",
      noData:     "Aucune donnée",
      search:     "Rechercher…",
      validate:   "Valider",
      reject:     "Rejeter",
      archive:    "Archiver",
      restore:    "Restaurer",
      generate:   "Générer",
      copy:       "Copier",
      copied:     "Copié !",
      required:   "Champ obligatoire",
    },
    // Status
    status: {
      unread:     "Non lu",
      read:       "Lu",
      processing: "En cours",
      resolved:   "Résolu",
      archived:   "Archivé",
      draft:      "Brouillon",
      sent:       "Envoyé",
      modified:   "Modifié",
    },
    // Pages
    pages: {
      incoming: {
        title:       "Boîte de réception",
        subtitle:    "Mails clients — traitement IA",
        refresh:     "Actualiser",
        noEmails:    "Aucun email",
        selectEmail: "Sélectionnez un email",
        original:    "Mail original",
        aiResponse:  "Réponse IA",
        validated:   "Réponse validée",
        diff:        "Voir les modifications",
        hideDiff:    "Masquer les modifications",
      },
      history: {
        title:    "Historique",
        subtitle: "Emails générés",
      },
      callReport: {
        title:    "Compte-rendu d'appel",
        subtitle: "Saisie et suivi des appels clients",
      },
    },
  },

  en: {
    nav: {
      dashboard:    "Dashboard",
      incoming:     "Incoming Mail",
      forms:        "Forms",
      generate:     "Generate Email",
      history:      "History",
    },
    greeting: {
      morning:   "Good morning",
      afternoon: "Good afternoon",
      evening:   "Good evening",
    },
    notifications: {
      title:        "Notifications",
      markAllRead:  "Mark all read",
      empty:        "No notifications",
      viewAll:      "View all notifications →",
    },
    profile: {
      myProfile:    "👤 My profile",
      home:         "🏠 Home",
      loginPage:    "🔑 Login page",
      users:        "👥 User management",
      logs:         "🔐 Activity logs",
      logout:       "🚪 Sign out",
    },
    roles: {
      conseiller: "Advisor",
      manager:    "Manager",
      admin:      "Administrator",
    },
    common: {
      save:       "Save",
      cancel:     "Cancel",
      confirm:    "Confirm",
      delete:     "Delete",
      edit:       "Edit",
      send:       "Send",
      export:     "Export PDF",
      loading:    "Loading…",
      error:      "An error occurred",
      noData:     "No data",
      search:     "Search…",
      validate:   "Validate",
      reject:     "Reject",
      archive:    "Archive",
      restore:    "Restore",
      generate:   "Generate",
      copy:       "Copy",
      copied:     "Copied!",
      required:   "Required field",
    },
    status: {
      unread:     "Unread",
      read:       "Read",
      processing: "Processing",
      resolved:   "Resolved",
      archived:   "Archived",
      draft:      "Draft",
      sent:       "Sent",
      modified:   "Modified",
    },
    pages: {
      incoming: {
        title:       "Inbox",
        subtitle:    "Customer mail — AI processing",
        refresh:     "Refresh",
        noEmails:    "No emails",
        selectEmail: "Select an email",
        original:    "Original email",
        aiResponse:  "AI Response",
        validated:   "Validated response",
        diff:        "View changes",
        hideDiff:    "Hide changes",
      },
      history: {
        title:    "History",
        subtitle: "Generated emails",
      },
      callReport: {
        title:    "Call report",
        subtitle: "Customer call logging",
      },
    },
  },
} as const

export type Translations = typeof translations["fr"]

// ── Context ───────────────────────────────────────────────────────────────────

interface I18nCtx {
  locale: Locale
  t: Translations
  setLocale: (l: Locale) => void
}

const I18nContext = createContext<I18nCtx>({
  locale: "fr",
  t: translations.fr,
  setLocale: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr")

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null
    if (saved === "fr" || saved === "en") setLocaleState(saved)
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    localStorage.setItem("locale", l)
    document.documentElement.lang = l
  }

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
