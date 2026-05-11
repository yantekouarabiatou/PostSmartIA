<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ $subject }}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: #F5F7FA; color: #374151; }
    .wrapper { max-width: 620px; margin: 24px auto; }
    .container { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

    /* Header */
    .header { background: #00205B; padding: 28px 32px; text-align: center; }
    .header-logo { display: flex; align-items: center; justify-content: center; gap: 12px; }
    .logo-badge { background: #FFCC00; border-radius: 10px; width: 40px; height: 40px;
      display: inline-flex; align-items: center; justify-content: center; font-size: 20px; }
    .header h1 { color: #ffffff; font-size: 18px; font-weight: 700; margin-top: 10px; letter-spacing: -0.02em; }
    .header-sub { color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 4px; }

    /* Body */
    .body { padding: 36px 32px; font-size: 15px; line-height: 1.75; color: #1A1A2E; }
    .salutation { margin-bottom: 20px; }
    .content { white-space: pre-line; color: #374151; }
    .divider { border: none; border-top: 1px solid #E5E7EB; margin: 28px 0; }

    /* Advisor block */
    .advisor { background: #F8FAFF; border-left: 3px solid #FFCC00; border-radius: 0 8px 8px 0;
      padding: 16px 20px; margin-top: 24px; }
    .advisor-name { font-weight: 700; color: #00205B; font-size: 14px; }
    .advisor-role { color: #6B7280; font-size: 13px; margin-top: 2px; }

    /* Footer */
    .footer { background: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 18px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #9CA3AF; line-height: 1.6; }
    .footer .brand { color: #0066CC; font-weight: 600; }
    .footer .year { margin-top: 6px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">

      <!-- Header -->
      <div class="header">
        <div class="header-logo">
          <span class="logo-badge">📬</span>
        </div>
        <h1>PostSmart IA — La Poste</h1>
        <p class="header-sub">Service Client · Réponse à votre demande</p>
      </div>

      <!-- Body -->
      <div class="body">
        <p class="salutation">
          Bonjour {{ $clientName ?: 'Madame, Monsieur' }},
        </p>

        <div class="content">{!! nl2br(e($body)) !!}</div>

        <hr class="divider">

        <div class="advisor">
          <p class="advisor-name">{{ $advisorName }}</p>
          <p class="advisor-role">Conseiller Clientèle · La Poste<br>Service Client PostSmart IA</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>Ce message a été envoyé par le <span class="brand">Service Client La Poste</span> via PostSmart IA.<br>
        Merci de ne pas répondre directement à cet e-mail.</p>
        <p class="year">© {{ date('Y') }} La Poste — Tous droits réservés</p>
      </div>

    </div>
  </div>
</body>
</html>
