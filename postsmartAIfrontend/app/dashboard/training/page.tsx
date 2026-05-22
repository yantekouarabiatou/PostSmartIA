"use client"

import { useState } from "react"
import { Sparkles, RotateCcw, Check, ChevronDown, ChevronUp } from "lucide-react"
import { api } from "@/lib/api"
import toast, { Toaster } from "react-hot-toast"
import { detectSentiment } from "@/lib/sentiment"

// ── Sample scenarios ──────────────────────────────────────────────────────────

const SCENARIOS = [
  {
    id: 1,
    title: "Colis perdu — client mécontent",
    difficulty: "Facile",
    diffColor: "#059669",
    service: "suivi_colis",
    email: {
      from_name: "Paul Durand",
      from_email: "paul.durand@example.com",
      subject: "Colis n°4729813 introuvable depuis 10 jours",
      body: `Bonjour,

Cela fait maintenant 10 jours que j'attends mon colis (numéro de suivi : 4729813) et il n'est toujours pas arrivé. Le tracking indique "en transit" depuis le 12 mai et plus aucune mise à jour depuis.

J'ai besoin de ce colis de toute urgence, c'est un cadeau d'anniversaire pour ma femme qui a lieu vendredi. Je suis vraiment très déçu par ce service.

Pourriez-vous faire le nécessaire rapidement ?

Cordialement,
Paul Durand`,
    },
    hint: "Accuser réception, s'excuser, expliquer la procédure de recherche du colis, proposer un délai de réponse ou un remboursement si non trouvé.",
    referenceResponse: `Madame, Monsieur,

Nous avons bien reçu votre message et nous comprenons votre inquiétude concernant votre colis n°4729813.

Nous nous excusons sincèrement pour ce délai qui dépasse nos standards habituels. Notre service logistique a été immédiatement informé et procède à une recherche approfondie de votre envoi.

Nous vous adresserons un retour sous 48 heures ouvrées avec le statut précis de votre colis. Si celui-ci est introuvable, nous procéderons au remboursement intégral ou à un réenvoi prioritaire selon votre préférence.

Encore toutes nos excuses pour la gêne occasionnée.

Cordialement,
Le Service Client`,
  },
  {
    id: 2,
    title: "Demande d'informations — Offre Senior",
    difficulty: "Facile",
    diffColor: "#059669",
    service: "info_offre",
    email: {
      from_name: "Michèle Fontaine",
      from_email: "michele.fontaine@wanadoo.fr",
      subject: "Renseignements offre Senior",
      body: `Bonjour,

Je suis âgée de 68 ans et j'aimerais en savoir plus sur vos offres spéciales pour les seniors. J'entends dire qu'il existe des réductions et des services adaptés mais je ne trouve pas l'information sur votre site.

Pourriez-vous m'expliquer ce qui est disponible pour une personne de mon âge ?

Merci d'avance,
Michèle Fontaine`,
    },
    hint: "Présenter clairement les avantages seniors, proposer un rendez-vous téléphonique si besoin, rester simple et chaleureux.",
    referenceResponse: `Madame Fontaine,

Merci pour votre message. Nous sommes ravis de vous informer sur nos services adaptés aux personnes de 60 ans et plus.

Notre offre Senior comprend notamment :
- Une réduction de 15 % sur l'ensemble de nos tarifs standard
- Un accueil prioritaire en agence sans attente
- Un conseiller dédié joignable du lundi au vendredi de 9h à 17h

Pour bénéficier de ces avantages, il vous suffit de présenter une pièce d'identité lors de votre inscription ou de mentionner votre âge lors de votre prochain contact téléphonique.

N'hésitez pas à nous appeler au 3630 si vous souhaitez en savoir davantage ou prendre rendez-vous.

Bien cordialement,
Le Service Client`,
  },
  {
    id: 3,
    title: "Réclamation — Facturation incorrecte",
    difficulty: "Moyen",
    diffColor: "#D97706",
    service: "reclamation",
    email: {
      from_name: "Thomas Renard",
      from_email: "t.renard.pro@gmail.com",
      subject: "RÉCLAMATION — double facturation inacceptable",
      body: `Bonjour,

Je constate avec stupéfaction que j'ai été débité DEUX FOIS pour le même envoi (référence : CMD-20240512-887).

Premier débit : 12,90 € le 12/05 — OK
Deuxième débit : 12,90 € le 14/05 — ERREUR

C'est absolument inacceptable. J'attends un remboursement immédiat. Si je ne reçois pas de réponse sous 24 heures, je n'hésiterai pas à contacter ma banque et à déposer une plainte.

Thomas Renard`,
    },
    hint: "Reconnaître l'erreur, s'excuser fermement, confirmer le remboursement sous délai précis, proposer un geste commercial.",
    referenceResponse: `Monsieur Renard,

Nous avons pris connaissance de votre message avec la plus grande attention et nous vous présentons nos sincères excuses pour cette erreur de facturation.

Après vérification, nous confirmons bien l'existence d'un double débit sur votre commande CMD-20240512-887. Ce type d'incident est exceptionnel et nous le regrettons vivement.

Nous avons initié le remboursement de 12,90 € ce jour. La somme sera créditée sur votre compte bancaire sous 3 à 5 jours ouvrés selon votre établissement.

En compensation du désagrément subi, nous vous offrons un bon de réduction de 5 € sur votre prochaine commande (code : EXCUSE5).

Nous nous engageons à tout mettre en œuvre pour que cela ne se reproduise pas.

Cordialement,
Le Service Qualité`,
  },
  {
    id: 4,
    title: "Accessibilité — Accompagnement PMR",
    difficulty: "Moyen",
    diffColor: "#D97706",
    service: "handicap",
    email: {
      from_name: "François Lecomte",
      from_email: "f.lecomte@sfr.fr",
      subject: "Besoin d'accompagnement — fauteuil roulant",
      body: `Bonjour,

Je me déplace en fauteuil roulant électrique et j'ai besoin de savoir si votre agence de Lyon Part-Dieu est accessible. J'ai également un envoi important à faire et je voudrais savoir si vous pouvez m'aider sur place.

Par ailleurs, est-il possible d'effectuer les démarches à domicile ?

Merci de votre aide,
François Lecomte`,
    },
    hint: "Confirmer l'accessibilité PMR, mentionner les services à domicile disponibles, donner des informations pratiques claires.",
    referenceResponse: `Monsieur Lecomte,

Merci de nous avoir contactés. Nous sommes heureux de vous confirmer que notre agence de Lyon Part-Dieu est totalement accessible aux personnes à mobilité réduite : entrée de plain-pied, rampe d'accès, comptoir abaissé et places de parking réservées à proximité immédiate.

Sur place, nos conseillers sont formés pour vous accompagner et vous proposer une prise en charge prioritaire.

Par ailleurs, nous proposons effectivement un service à domicile pour les enlèvements : un facteur peut se déplacer à votre adresse pour récupérer votre envoi. Ce service est disponible du lundi au samedi, sur rendez-vous au 3631.

N'hésitez pas à nous indiquer votre disponibilité et nous organiserons cela avec plaisir.

Cordialement,
Le Service Accessibilité`,
  },
  {
    id: 5,
    title: "Escalade médiateur — Litige complexe",
    difficulty: "Difficile",
    diffColor: "#DC2626",
    service: "escalade_mediateur",
    email: {
      from_name: "Isabelle Moreau",
      from_email: "isabelle.moreau.litige@hotmail.fr",
      subject: "Mise en demeure — absence de réponse depuis 3 semaines",
      body: `Madame, Monsieur,

Cela fait exactement 3 semaines que j'attends une réponse à ma réclamation (ticket #REC-4892) concernant la perte définitive de mon colis contenant des documents professionnels irremplaçables d'une valeur estimée à 800 euros.

J'ai relancé 4 fois sans aucun retour de votre part. Je considère votre silence comme une réponse négative et je me vois dans l'obligation d'engager un recours auprès du Médiateur du Commerce conformément au Code de la consommation.

Je vous mets en demeure de me répondre dans les 48 heures sous peine d'un recours judiciaire.

Isabelle Moreau`,
    },
    hint: "Reconnaître le manquement, s'excuser formellement, escalader immédiatement en interne, rassurer sur les recours disponibles, proposer un contact direct.",
    referenceResponse: `Madame Moreau,

Je vous adresse nos excuses les plus sincères pour l'absence totale de réponse à votre réclamation #REC-4892. Ce manquement est inacceptable et nous en sommes pleinement conscients.

Votre dossier a été transmis en urgence à notre Responsable Qualité qui vous contactera personnellement avant demain 12h.

Concernant votre colis : une enquête approfondie est ouverte. Si la perte est confirmée, nous procéderons à une indemnisation à hauteur de la valeur déclarée, dans la limite de notre plafond de garantie, et nous examinerons avec bienveillance toute demande de dépassement justifiée.

Vous avez bien entendu le droit de saisir le Médiateur du Commerce si notre réponse ne vous satisfait pas ; nous faciliterons cette démarche si vous le souhaitez.

Veuillez agréer, Madame, nos excuses renouvelées.

Le Directeur du Service Client`,
  },
]

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TrainingPage() {
  const [selected, setSelected]       = useState<typeof SCENARIOS[0] | null>(null)
  const [response, setResponse]       = useState("")
  const [analyzing, setAnalyzing]     = useState(false)
  const [aiResult, setAiResult]       = useState<any>(null)
  const [showRef, setShowRef]         = useState(false)
  const [showHint, setShowHint]       = useState(false)
  const [sessionCount, setSessionCount] = useState(() => {
    if (typeof window === "undefined") return 0
    return parseInt(localStorage.getItem("training_sessions") ?? "0", 10)
  })

  function startScenario(s: typeof SCENARIOS[0]) {
    setSelected(s)
    setResponse("")
    setAiResult(null)
    setShowRef(false)
    setShowHint(false)
  }

  function reset() {
    setSelected(null)
    setResponse("")
    setAiResult(null)
    setShowRef(false)
    setShowHint(false)
  }

  async function handleAnalyze() {
    if (!selected) return
    setAnalyzing(true)
    try {
      const emailContent = `Objet : ${selected.email.subject}\nDe : ${selected.email.from_name} <${selected.email.from_email}>\n\n${selected.email.body}`
      const res = await api.post<any>("/ai/analyze", { email_content: emailContent })
      setAiResult(res)
      const count = sessionCount + 1
      setSessionCount(count)
      localStorage.setItem("training_sessions", String(count))
      toast.success("✨ Analyse IA générée ! Comparez avec votre réponse.")
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors de l'analyse")
    } finally {
      setAnalyzing(false)
    }
  }

  const sentiment = selected ? detectSentiment(selected.email.body) : null

  return (
    <>
      <Toaster position="top-right" />
      <div style={{ display: "flex", height: "calc(100vh - 64px)", fontFamily: "Inter, sans-serif", background: "#F5F7FA" }}>

        {/* Scenario list */}
        <div style={{
          width: selected ? 320 : "100%", flexShrink: 0, display: "flex", flexDirection: "column",
          borderRight: selected ? "1px solid #E5E7EB" : "none", background: "#fff",
          overflowY: "auto",
        }}>
          <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid #F0F0F0" }}>
            <h1 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#00205B" }}>🎓 Mode Formation</h1>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "#6B7280" }}>
              Entraînez-vous sur des scénarios réels. Rédigez votre réponse, puis comparez avec la suggestion IA.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ padding: "5px 12px", borderRadius: 20, background: "#EEF4FF", fontSize: 12, color: "#0066CC", fontWeight: 600 }}>
                🏅 {sessionCount} session{sessionCount !== 1 ? "s" : ""} complétée{sessionCount !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div style={{ padding: "12px 16px" }}>
            {SCENARIOS.map(s => {
              const isActive = selected?.id === s.id
              return (
                <div
                  key={s.id}
                  onClick={() => startScenario(s)}
                  style={{
                    padding: "14px 16px", borderRadius: 10, marginBottom: 8, cursor: "pointer",
                    border: isActive ? "2px solid #0066CC" : "1px solid #E5E7EB",
                    background: isActive ? "#EBF4FF" : "#fff",
                    transition: "all 150ms",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "#00205B" }}>{s.title}</p>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 10, flexShrink: 0,
                      background: s.diffColor + "20", color: s.diffColor, fontWeight: 600,
                    }}>{s.difficulty}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "#6B7280" }}>
                    📧 {s.email.from_name} · {s.service.replace(/_/g, " ")}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Practice area */}
        {selected && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
            {/* Header */}
            <div style={{ background: "#fff", padding: "16px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#00205B" }}>{selected.title}</h2>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 10,
                    background: selected.diffColor + "20", color: selected.diffColor, fontWeight: 600,
                  }}>{selected.difficulty}</span>
                </div>
              </div>
              <button onClick={reset} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 14px", borderRadius: 8, border: "1px solid #E5E7EB",
                background: "#fff", color: "#374151", fontSize: 12, cursor: "pointer",
              }}>
                <RotateCcw size={13} /> Choisir un autre scénario
              </button>
            </div>

            <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Email received */}
              <div style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: "1px solid #E5E7EB" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#00205B" }}>📩 Mail reçu (simulation)</p>
                  {sentiment && sentiment.level !== "neutral" && (
                    <span style={{
                      fontSize: 12, padding: "3px 10px", borderRadius: 20,
                      background: sentiment.bg, color: sentiment.color, fontWeight: 600,
                    }}>{sentiment.emoji} {sentiment.label}</span>
                  )}
                </div>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: "#374151" }}>
                  <strong>De :</strong> {selected.email.from_name} &lt;{selected.email.from_email}&gt;
                </p>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#374151" }}>
                  <strong>Objet :</strong> {selected.email.subject}
                </p>
                <pre style={{ margin: 0, fontFamily: "inherit", fontSize: 13, lineHeight: 1.7, color: "#1A1A2E", whiteSpace: "pre-wrap" }}>
                  {selected.email.body}
                </pre>
              </div>

              {/* Hint */}
              <div style={{ borderRadius: 10, border: "1px solid #FDE68A", overflow: "hidden" }}>
                <button
                  onClick={() => setShowHint(v => !v)}
                  style={{
                    width: "100%", padding: "10px 16px", background: "#FFFBEB",
                    border: "none", cursor: "pointer", display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                    fontSize: 13, fontWeight: 600, color: "#92400E",
                  }}
                >
                  <span>💡 Indice — points clés à couvrir</span>
                  {showHint ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showHint && (
                  <div style={{ padding: "12px 16px", background: "#FFFEF7", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                    {selected.hint}
                  </div>
                )}
              </div>

              {/* User's response editor */}
              <div style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: "1px solid #E5E7EB" }}>
                <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#00205B" }}>✍️ Votre réponse</p>
                <textarea
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  rows={10}
                  placeholder="Rédigez votre réponse ici avant de consulter la suggestion IA…"
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 8,
                    border: "1px solid #D1D5DB", fontSize: 13, lineHeight: 1.7,
                    resize: "vertical", boxSizing: "border-box", fontFamily: "inherit",
                  }}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button onClick={handleAnalyze} disabled={analyzing} style={{
                    padding: "10px 18px", borderRadius: 8, border: "none", cursor: analyzing ? "wait" : "pointer",
                    background: "#0066CC", color: "#fff", fontWeight: 600, fontSize: 13,
                    display: "flex", alignItems: "center", gap: 6, opacity: analyzing ? 0.7 : 1,
                  }}>
                    <Sparkles size={15} />
                    {analyzing ? "Analyse en cours…" : "✨ Voir la suggestion IA"}
                  </button>
                  <button onClick={() => setShowRef(v => !v)} style={{
                    padding: "10px 14px", borderRadius: 8, border: "1px solid #059669", cursor: "pointer",
                    background: "#F0FDF4", color: "#059669", fontWeight: 600, fontSize: 13,
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <Check size={14} /> {showRef ? "Masquer" : "Voir"} la réponse de référence
                  </button>
                </div>
              </div>

              {/* AI suggestion */}
              {aiResult && (
                <div style={{ background: "#F8FAFF", borderRadius: 12, padding: "18px 22px", border: "1px solid #C7D9F5" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FFCC00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#00205B" }}>IA</div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#00205B" }}>Suggestion PostSmart IA</span>
                  </div>
                  {aiResult.analysis && (
                    <div style={{ marginBottom: 12, fontSize: 13, color: "#374151", padding: "10px 14px", background: "#EEF4FF", borderRadius: 8 }}>
                      <strong>Analyse :</strong> {aiResult.analysis.main_request} · Ton détecté : {aiResult.analysis.tone}
                    </div>
                  )}
                  {aiResult.response?.body && (
                    <pre style={{ margin: 0, fontFamily: "inherit", fontSize: 13, lineHeight: 1.7, color: "#1A1A2E", whiteSpace: "pre-wrap" }}>
                      {aiResult.response.body}
                    </pre>
                  )}
                </div>
              )}

              {/* Reference response */}
              {showRef && (
                <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "18px 22px", border: "1px solid #BBF7D0" }}>
                  <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#065F46" }}>
                    ✅ Réponse de référence (formateur)
                  </p>
                  <pre style={{ margin: 0, fontFamily: "inherit", fontSize: 13, lineHeight: 1.7, color: "#1A1A2E", whiteSpace: "pre-wrap" }}>
                    {selected.referenceResponse}
                  </pre>
                </div>
              )}

              {/* Self-evaluation */}
              {(aiResult || showRef) && response.trim().length > 0 && (
                <div style={{ background: "#FFFBEB", borderRadius: 12, padding: "18px 22px", border: "1px solid #FDE68A" }}>
                  <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#92400E" }}>
                    📝 Auto-évaluation — Critères clés
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { q: "Avez-vous reconnu et exprimé l'empathie envers le client ?", key: "empathy" },
                      { q: "Avez-vous proposé une solution concrète avec un délai ?", key: "solution" },
                      { q: "Le ton est-il professionnel et adapté à la situation ?", key: "tone" },
                      { q: "Avez-vous adressé tous les points soulevés par le client ?", key: "completeness" },
                    ].map((crit, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 12px", background: "#fff", borderRadius: 8, border: "1px solid #FDE68A" }}>
                        <span style={{ fontSize: 13, color: "#374151", flex: 1 }}>{crit.q}</span>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid #BBF7D0", background: "#F0FDF4", color: "#059669", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✓ Oui</button>
                          <button style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✗ Non</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Welcome state */}
        {!selected && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "#F5F7FA" }}>
            <div style={{ textAlign: "center", color: "#9CA3AF", padding: 40 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎓</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>Choisissez un scénario pour commencer</p>
              <p style={{ fontSize: 13, color: "#9CA3AF", maxWidth: 360 }}>
                Chaque scénario simule un email client réel. Rédigez votre réponse, puis comparez avec la suggestion de l'IA et la réponse de référence.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
