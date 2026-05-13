"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"

export type Locale = "fr" | "en"

const translations = {
  fr: {
    // Navbar dashboard
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
    landing: {
      nav: {
        howItWorks:   "Comment ça marche",
        features:     "Fonctionnalités",
        testimonials: "Témoignages",
        login:        "Se connecter",
      },
      hero: {
        tag:   "Hackathon La Poste × EY × Microsoft",
        h1a:   "L'IA qui transforme",
        h1b:   "votre relation client.",
        sub:   "Analysez les mails entrants, rédigez vos comptes-rendus d'appel en 30 secondes et accédez aux procédures La Poste en temps réel. Tout en un seul outil.",
        cta1:  "Accéder à l'application",
        cta2:  "Voir comment ça marche",
        trust1: "2 400+ conseillers",
        trust2: "18 000 emails/jour",
        trust3: "100% RGPD",
      },
      partners: "Propulsé par",
      stats: [
        { label: "Conseillers actifs",         prefix: "" },
        { label: "Emails traités / jour",       prefix: "" },
        { label: "Temps de réponse réduit",     prefix: "−" },
        { label: "Conformité charte La Poste",  prefix: "" },
      ],
      hiw: {
        tag: "Comment ça marche",
        h2:  "De zéro à résolu en quelques secondes",
        sub: "PostSmart IA s'intègre naturellement dans votre journée. Trois cas d'usage, un seul outil, aucune formation requise.",
        steps: [
          { title: "Mail entrant détecté",          tag: "Traitement en < 3 sec",          desc: "L'IA analyse instantanément le contenu, détecte le type de demande, le niveau d'urgence et génère une réponse professionnelle prête à valider." },
          { title: "Appel terminé — résumé dicté",  tag: "100% RGPD · 0 stockage audio",   desc: "Après l'appel, dictez librement votre résumé dans le navigateur. L'IA structure le compte-rendu et génère le mail post-appel. Aucun audio conservé." },
          { title: "Question → Réponse immédiate",  tag: "Disponible 24/7",                desc: "Posez vos questions en langage naturel. L'assistant puise dans la base documentaire La Poste pour vous répondre avec précision en quelques secondes." },
        ],
      },
      feats: {
        tag: "Fonctionnalités",
        h2:  "Trois modules, un seul outil",
        sub: "Chaque module est pensé pour le quotidien du conseiller La Poste.",
        items: [
          {
            title: "Traitement des mails entrants",
            desc:  "Analysez, catégorisez et répondez aux mails clients avec une précision inégalée.",
            bullets: [
              "Détection automatique du type de demande (suivi colis, réclamation, handicap…)",
              "Génération de réponse personnalisée en 1 clic",
              "Score qualité : clarté, empathie, conformité charte",
            ],
          },
          {
            title: "Compte-rendu d'appel",
            desc:  "Transformez vos notes d'appel vocales en comptes-rendus structurés et mails clients prêts à envoyer.",
            bullets: [
              "Dictée vocale directement dans le navigateur",
              "Structuration automatique : résumé, engagements, prochaines étapes",
              "Mail post-appel généré en 30 secondes",
            ],
          },
          {
            title: "Assistant documentaire IA",
            desc:  "Un copilote intelligent disponible 24/7 pour toutes vos questions procédurales.",
            bullets: [
              "Base de connaissances La Poste intégrée",
              "Réponses contextuelles en langage naturel",
              "Suggestions de formulations adaptées à chaque situation",
            ],
          },
        ],
      },
      tech: "Stack technologique",
      testis: {
        tag: "Témoignages",
        h2:  "Ce que disent nos équipes",
        sub: "Des conseillers et managers La Poste qui utilisent PostSmart IA au quotidien.",
      },
      cta: {
        h2a:  "Prêt à transformer",
        h2b:  "chaque échange client ?",
        sub:  "Rejoignez les conseillers La Poste qui font confiance à PostSmart IA pour répondre plus vite, mieux et sans stress.",
        btn1: "Commencer maintenant",
        btn2: "En savoir plus",
      },
      footer: {
        legal:   "Mentions légales",
        privacy: "Confidentialité",
        rgpd:    "RGPD",
        login:   "Connexion",
        copy:    "© 2026 PostSmart IA — La Poste × EY × Microsoft",
      },
      scroll: "Scroll pour découvrir",
    },
    login: {
      roles: {
        conseiller: { label: "Conseiller", desc: "Accès standard" },
        manager:    { label: "Manager",    desc: "Accès équipe"   },
        admin:      { label: "Admin",      desc: "Accès complet"  },
      },
      emailLabel:       "Adresse e-mail",
      emailPlaceholder: "votre@email.fr",
      passwordLabel:    "Mot de passe",
      rememberMe:       "Rester connecté",
      submit:           "Se connecter",
      submitting:       "Connexion…",
      leftTitle:        "L'assistant IA des conseillers",
      leftSubtitle:     "Traitez vos mails, rédigez vos comptes-rendus et accédez à toutes les procédures La Poste en quelques secondes.",
      demoTitle:        "Comptes de démonstration",
      errors: {
        auth:    "Identifiants incorrects",
        server:  "Service temporairement indisponible",
        network: "Connexion impossible",
        account: "Compte désactivé",
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
    landing: {
      nav: {
        howItWorks:   "How it works",
        features:     "Features",
        testimonials: "Testimonials",
        login:        "Sign in",
      },
      hero: {
        tag:   "Hackathon La Poste × EY × Microsoft",
        h1a:   "The AI that transforms",
        h1b:   "your customer relations.",
        sub:   "Analyze incoming emails, write your call reports in 30 seconds and access La Poste procedures in real time. All in one tool.",
        cta1:  "Access the app",
        cta2:  "See how it works",
        trust1: "2,400+ advisors",
        trust2: "18,000 emails/day",
        trust3: "100% GDPR",
      },
      partners: "Powered by",
      stats: [
        { label: "Active advisors",              prefix: "" },
        { label: "Emails processed / day",       prefix: "" },
        { label: "Response time reduced",        prefix: "−" },
        { label: "La Poste charter compliance",  prefix: "" },
      ],
      hiw: {
        tag: "How it works",
        h2:  "From zero to resolved in seconds",
        sub: "PostSmart IA integrates naturally into your day. Three use cases, one tool, no training required.",
        steps: [
          { title: "Incoming email detected",         tag: "Processing in < 3 sec",         desc: "AI instantly analyzes the content, detects the request type, urgency level and generates a professional response ready to validate." },
          { title: "Call ended — summary dictated",   tag: "100% GDPR · 0 audio storage",   desc: "After the call, freely dictate your summary in the browser. AI structures the report and generates the follow-up email. No audio stored." },
          { title: "Question → Immediate answer",     tag: "Available 24/7",                desc: "Ask your questions in natural language. The assistant draws from the La Poste document base to answer precisely in seconds." },
        ],
      },
      feats: {
        tag: "Features",
        h2:  "Three modules, one tool",
        sub: "Each module is designed for the daily routine of La Poste advisors.",
        items: [
          {
            title: "Incoming mail processing",
            desc:  "Analyze, categorize and respond to customer emails with unmatched precision.",
            bullets: [
              "Automatic detection of request type (parcel tracking, complaint, disability…)",
              "Generate personalized response in 1 click",
              "Quality score: clarity, empathy, charter compliance",
            ],
          },
          {
            title: "Call report",
            desc:  "Transform your vocal call notes into structured reports and customer-ready emails.",
            bullets: [
              "Voice dictation directly in the browser",
              "Automatic structuring: summary, commitments, next steps",
              "Post-call email generated in 30 seconds",
            ],
          },
          {
            title: "AI document assistant",
            desc:  "An intelligent co-pilot available 24/7 for all your procedural questions.",
            bullets: [
              "Integrated La Poste knowledge base",
              "Contextual answers in natural language",
              "Suggested phrasing tailored to each situation",
            ],
          },
        ],
      },
      tech: "Tech stack",
      testis: {
        tag: "Testimonials",
        h2:  "What our teams say",
        sub: "La Poste advisors and managers who use PostSmart IA daily.",
      },
      cta: {
        h2a:  "Ready to transform",
        h2b:  "every customer interaction?",
        sub:  "Join La Poste advisors who trust PostSmart IA to respond faster, better and stress-free.",
        btn1: "Get started now",
        btn2: "Learn more",
      },
      footer: {
        legal:   "Legal notice",
        privacy: "Privacy",
        rgpd:    "GDPR",
        login:   "Sign in",
        copy:    "© 2026 PostSmart IA — La Poste × EY × Microsoft",
      },
      scroll: "Scroll to discover",
    },
    login: {
      roles: {
        conseiller: { label: "Advisor",  desc: "Standard access" },
        manager:    { label: "Manager",  desc: "Team access"     },
        admin:      { label: "Admin",    desc: "Full access"     },
      },
      emailLabel:       "Email address",
      emailPlaceholder: "your@email.com",
      passwordLabel:    "Password",
      rememberMe:       "Stay signed in",
      submit:           "Sign in",
      submitting:       "Signing in…",
      leftTitle:        "The AI assistant for advisors",
      leftSubtitle:     "Process your emails, write your call reports and access all La Poste procedures in seconds.",
      demoTitle:        "Demo accounts",
      errors: {
        auth:    "Incorrect credentials",
        server:  "Service temporarily unavailable",
        network: "Connection failed",
        account: "Account disabled",
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

// ── Shared LangSwitcher (dropdown) ───────────────────────────────────────────

const LANGS: { code: Locale; flag: string; short: string; label: string }[] = [
  { code: "fr", flag: "🇫🇷", short: "FR", label: "Français" },
  { code: "en", flag: "🇬🇧", short: "EN", label: "English"  },
]

interface LangSwitcherProps { dark?: boolean }

export function LangSwitcher({ dark = false }: LangSwitcherProps) {
  const { locale, setLocale } = useI18n()
  const [open, setOpen]       = useState(false)
  const ref                   = useRef<HTMLDivElement>(null)
  const current               = LANGS.find(l => l.code === locale) ?? LANGS[0]

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const btnBase: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6,
    padding: "5px 10px", borderRadius: 8, cursor: "pointer",
    fontSize: 12, fontWeight: 600, transition: "all 150ms",
    border: dark
      ? "1px solid rgba(0,0,0,0.15)"
      : "1px solid rgba(255,255,255,0.2)",
    background: dark
      ? "rgba(0,0,0,0.06)"
      : "rgba(255,255,255,0.1)",
    color: dark ? "#374151" : "#fff",
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button onClick={() => setOpen(v => !v)} style={btnBase}>
        <span style={{ fontSize: 15 }}>{current.flag}</span>
        <span>{current.short}</span>
        <span style={{
          fontSize: 9, opacity: 0.55,
          display: "inline-block",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 180ms",
        }}>▼</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: 42, right: 0,
          background: "#fff", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          border: "1px solid #E5E7EB",
          overflow: "hidden", zIndex: 9999,
          minWidth: 155,
          animation: "langSlide 150ms ease",
        }}>
          <style>{`@keyframes langSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
          {LANGS.map(lang => {
            const active = lang.code === locale
            return (
              <button
                key={lang.code}
                onClick={() => { setLocale(lang.code); setOpen(false) }}
                style={{
                  width: "100%", padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: 10,
                  background: active ? "#EBF4FF" : "#fff",
                  border: "none", borderBottom: "1px solid #F9F9F9",
                  cursor: "pointer", fontSize: 13, color: "#1A1A2E",
                  textAlign: "left", transition: "background 100ms",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB" }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = active ? "#EBF4FF" : "#fff" }}
              >
                <span style={{ fontSize: 17 }}>{lang.flag}</span>
                <span style={{ fontWeight: active ? 600 : 400, flex: 1 }}>{lang.label}</span>
                {active && <span style={{ color: "#0066CC", fontSize: 13 }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
