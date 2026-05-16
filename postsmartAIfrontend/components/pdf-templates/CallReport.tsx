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
  nextSteps: Array<{title: string; description: string}>
  mailMeta: {from: string; to: string; subject: string}
  mailBody: string
}

export default function CallReport({ data }: { data: CallReportData }) {
  return (
    <div className="page">
      {/* Header */}
      <header className="ps-header">
        <div className="brand">
          <h1>PostSmart IA</h1>
          <div className="subtitle">Compte-rendu d'appel client</div>
        </div>
        <div className="meta">
          <div>{data.date}</div>
          <div>Réf. appel 000026</div>
        </div>
      </header>

      <div className="badges">
        <span className="badge light-blue">RÉCLAMATION</span>
        <span className="badge soft-yellow">URGENCE NORMALE</span>
      </div>

      {/* Sections */}
      <section className="section info">
        <div className="section-title">INFORMATIONS DE L'APPEL</div>
        <table className="info-table">
          <tbody>
            <tr>
              <td className="label">Client</td>
              <td className="value">{data.clientName}</td>
            </tr>
            <tr>
              <td className="label">E-mail</td>
              <td className="value">{data.email}</td>
            </tr>
            <tr>
              <td className="label">Téléphone</td>
              <td className="value">{data.phone ?? ''}</td>
            </tr>
            <tr>
              <td className="label">Date</td>
              <td className="value">{data.date}</td>
            </tr>
            <tr>
              <td className="label">Durée</td>
              <td className="value">{data.duration ?? ''}</td>
            </tr>
            <tr>
              <td className="label">Type</td>
              <td className="value">{data.type ?? ''}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="section summary">
        <div className="section-title">RÉSUMÉ DE L'ÉCHANGE</div>
        <div className="summary-box">{data.summary}</div>
      </section>

      <section className="section engagements">
        <div className="section-title">ENGAGEMENTS PRIS</div>
        <table className="eng-table">
          <tbody>
            {data.engagements.map((e, i) => (
              <tr key={i}>
                <td className="num">{i + 1}</td>
                <td className="eng-val">{e}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section next-steps">
        <div className="section-title">PROCHAINES ÉTAPES</div>
        <div className="steps">
          {data.nextSteps.map((s, i) => (
            <div className="step" key={i}><span className="icon">✉</span><strong>{s.title}</strong> — {s.description}</div>
          ))}
        </div>
      </section>

      <section className="section mail">
        <div className="section-title">E-MAIL POST-APPEL GÉNÉRÉ</div>
        <div className="mail-meta">
          <div><strong>De :</strong> {data.mailMeta.from}</div>
          <div><strong>À :</strong> {data.mailMeta.to}</div>
          <div><strong>Objet :</strong> {data.mailMeta.subject}</div>
        </div>
        <div className="mail-body">
          <div className="salutation">Monsieur Dupuis,</div>
          <div className="body-text">{data.mailBody}</div>
          <div className="signature">Cordialement,<br/>Service client PostSmart IA</div>
        </div>
      </section>

      <footer className="ps-footer">
        <div className="left">PostSmart IA — Document confidentiel — La Poste</div>
        <div className="center-dot" />
        <div className="right">Page 1</div>
      </footer>
    </div>
  )
}
