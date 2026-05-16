'use client'

import React from 'react'

type CallReportData = {
  clientName: string
  email: string
  phone?: string
  date: string
  duration?: string
  type?: string
  summary: string
  engagements: string[]
  nextSteps: Array<{ title: string; description: string }>
  mailMeta: { from: string; to: string; subject: string }
  mailBody: string
}

const sample: CallReportData = {
  clientName: 'Martine',
  email: 'martine@gmail.com',
  phone: '06 00 00 00 00',
  date: '14 mai 2026',
  duration: '2 min',
  type: 'Réclamation',
  summary:
    "Le client signale une réception incomplète de son colis et demande une vérification de la partie manquante.",
  engagements: [
    'Vérification interne de la livraison partielle.',
    'Retour au client après contrôle du dossier.',
  ],
  nextSteps: [
    {
      title: "Envoyer l'e-mail de confirmation",
      description: 'Transmettre le mail généré au client dans les meilleurs délais.',
    },
  ],
  mailMeta: {
    from: 'Service client PostSmart IA - La Poste',
    to: 'martine@gmail.com',
    subject: 'Suite à votre réclamation concernant votre colis',
  },
  mailBody:
    'Madame Martine,\n\nNous vous remercions de nous avoir contactés au sujet de votre colis. Nous sommes désolés d\'apprendre que vous n\'avez pas encore reçu votre colis et nous comprenons votre impatience.\n\nNous allons immédiatement enquêter sur ce problème et nous vous tiendrons informée de l\'avancement de notre enquête.\n\nCordialement,\nLe service client de La Poste',
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 mb-3 flex items-center gap-2 rounded-sm bg-[#eef3fb] px-3 py-1.5 text-[13px] font-bold text-[#00205b]">
      <span className="h-4 w-1.5 rounded-sm bg-[#ffcc00]" />
      <span>{children}</span>
    </div>
  )
}

function Box({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'yellow' }) {
  const bg = tone === 'yellow' ? 'bg-amber-100 border-amber-200' : 'bg-[#eef3fb] border-slate-200'
  const accent = tone === 'yellow' ? 'bg-[#ffcc00]' : 'bg-[#4a7fc1]'
  return (
    <div className={`relative overflow-hidden rounded-sm border p-4 ${bg}`}>
      <span className={`absolute left-0 top-0 h-full w-1.5 ${accent}`} />
      <div className="pl-2">{children}</div>
    </div>
  )
}

export default function PdfPreviewPage() {
  const data = sample

  return (
    <div className="min-h-screen bg-[#111827] p-4 md:p-8">
      <div className="mx-auto overflow-hidden bg-white shadow-2xl" style={{ maxWidth: '794px' }}>
        <div className="h-1.5 bg-[#ffcc00]" />
        <div className="px-8 pt-5 pb-2">
          <div className="flex items-start justify-between gap-4 border-b border-[#ffcc00] pb-2">
            <div>
              <div className="text-[27px] font-black tracking-tight text-[#00205b]">PostSmart IA</div>
              <div className="text-[13px] text-[#2563eb]">Compte-rendu d'appel client</div>
            </div>
            <div className="text-right text-[13px] text-[#1d4ed8]">
              <div>{data.date} à 15:44</div>
              <div>Réf. appel 000000</div>
            </div>
          </div>
        </div>

        <div className="px-10 pb-10 pt-0 text-[13px] leading-6 text-slate-700">
          <div className="flex flex-wrap gap-2 px-1">
            <span className="rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#00205b]">{data.type ?? 'Réclamation'}</span>
            <span className="rounded-md border border-amber-200 bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800">Urgence normale</span>
          </div>

          <SectionTitle>INFORMATIONS DE L'APPEL</SectionTitle>
          <div className="overflow-hidden border border-slate-200">
            {[
              ['Client', data.clientName],
              ['E-mail', data.email],
              ['Téléphone', data.phone ?? ''],
              ['Date', data.date],
              ['Durée', data.duration ?? ''],
              ['Type', data.type ?? ''],
            ].map(([label, value], index) => (
              <div key={label} className={`grid grid-cols-[120px_1fr] px-3 py-2 ${index % 2 === 0 ? 'bg-white' : 'bg-[#f8faff]'}`}>
                <div className="font-bold text-[#2563eb]">{label}</div>
                <div className="font-bold text-[#00205b]">{value}</div>
              </div>
            ))}
          </div>

          <SectionTitle>RÉSUMÉ DE L'ÉCHANGE</SectionTitle>
          <Box tone="yellow">{data.summary}</Box>

          <SectionTitle>ENGAGEMENTS PRIS</SectionTitle>
          <div className="space-y-2">
            {data.engagements.map((item, index) => (
              <div key={item} className="grid grid-cols-[40px_1fr] items-stretch rounded-sm border border-slate-200 bg-white">
                <div className="flex items-center justify-center bg-[#4a7fc1] text-sm font-bold text-white">{index + 1}</div>
                <div className="px-3 py-2">{item}</div>
              </div>
            ))}
          </div>

          <SectionTitle>PROCHAINES ÉTAPES</SectionTitle>
          <div className="space-y-2">
            {data.nextSteps.map((step) => (
              <div key={step.title} className="relative overflow-hidden rounded-sm border border-slate-200 bg-[#eef3fb] p-3 pl-6">
                <span className="absolute left-0 top-0 h-full w-1.5 bg-[#4a7fc1]" />
                <div className="font-bold text-[#00205b]">{step.title}</div>
                <div className="text-[#4b5563]">{step.description}</div>
              </div>
            ))}
          </div>

          <SectionTitle>E-MAIL POST-APPEL GÉNÉRÉ</SectionTitle>
          <div className="rounded-sm border border-slate-200 bg-amber-50 p-3">
            <div><span className="font-bold text-[#00205b]">De :</span> {data.mailMeta.from}</div>
            <div><span className="font-bold text-[#00205b]">À :</span> {data.mailMeta.to}</div>
            <div><span className="font-bold text-[#00205b]">Objet :</span> {data.mailMeta.subject}</div>
          </div>
          <Box>
            <div className="whitespace-pre-line">{data.mailBody}</div>
          </Box>
        </div>
      </div>
    </div>
  )
}
