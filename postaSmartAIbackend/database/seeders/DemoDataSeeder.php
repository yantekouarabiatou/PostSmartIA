<?php

namespace Database\Seeders;

use App\Models\AiFeedback;
use App\Models\EmailInbox;
use App\Models\ResponseTemplate;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

/**
 * Seed de démonstration pour illustrer :
 *  - RecurringTopicsWidget  : volume varié par type de service sur 30 jours
 *  - ClientHistoryPanel     : clients sensibles, clients réguliers, premier contact
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $conseiller = User::where('role', 'conseiller')->first();
        $manager    = User::where('role', 'manager')->first();
        $validatedBy = $conseiller?->id ?? 1;

        // ─── 1. CLIENT SENSIBLE — Marc Leclerc ────────────────────────────────
        // 7 contacts, 2 escalades, score moyen ~50 → badge CLIENT SENSIBLE
        $marc = 'marc.leclerc.plainte@gmail.com';
        $this->upsertAll([
            [
                'message_id'         => 'DEMO-MARC-001',
                'from_name'          => 'Marc Leclerc',
                'from_email'         => $marc,
                'subject'            => 'Colis endommagé - Remboursement refusé',
                'body_text'          => "Bonjour,\n\nJe vous contacte suite au refus de remboursement pour mon colis endommagé reçu début janvier. Le service client m'a renvoyé 3 fois sans solution. Je demande une escalade immédiate.\n\nMarc Leclerc",
                'received_at'        => Carbon::now()->subMonths(4),
                'status'             => 'resolved',
                'ai_service_type'    => 'reclamation',
                'ai_quality_score'   => 45,
                'ai_quality_score_json' => ['clarity' => 50, 'empathy' => 40, 'compliance' => 45],
                'validated_response' => "Bonjour Monsieur Leclerc, nous prenons en charge votre dossier...",
                'validated_at'       => Carbon::now()->subMonths(4)->addDays(2),
                'validated_by'       => $validatedBy,
                'priority'           => 'high',
                'is_read'            => true,
                'is_processed'       => true,
                'source'             => 'imap',
            ],
            [
                'message_id'         => 'DEMO-MARC-002',
                'from_name'          => 'Marc Leclerc',
                'from_email'         => $marc,
                'subject'            => 'Suivi colis #CP88123456FR introuvable',
                'body_text'          => "Madame, Monsieur,\n\nMon colis envoyé en Chronopost n'est plus tracé depuis 5 jours. Numéro CP88123456FR. Pas de réponse du service client.\n\nMarc Leclerc",
                'received_at'        => Carbon::now()->subMonths(3),
                'status'             => 'resolved',
                'ai_service_type'    => 'suivi_colis',
                'ai_quality_score'   => 52,
                'ai_quality_score_json' => ['clarity' => 55, 'empathy' => 48, 'compliance' => 53],
                'validated_response' => "Nous avons localisé votre colis...",
                'validated_at'       => Carbon::now()->subMonths(3)->addDay(),
                'validated_by'       => $validatedBy,
                'priority'           => 'high',
                'is_read'            => true,
                'is_processed'       => true,
                'source'             => 'imap',
            ],
            [
                'message_id'         => 'DEMO-MARC-003',
                'from_name'          => 'Marc Leclerc',
                'from_email'         => $marc,
                'subject'            => 'ESCALADE MÉDIATEUR - Dossier non résolu depuis 3 mois',
                'body_text'          => "Monsieur le Médiateur,\n\nDe janvier à mars 2026 j'ai contacté La Poste 7 fois sans résolution. Mon préjudice s'élève à 480€. Je saisis officiellement le Médiateur du Groupe La Poste.\n\nMarc Leclerc - Client depuis 2012",
                'received_at'        => Carbon::now()->subMonths(2),
                'status'             => 'escalated',
                'ai_service_type'    => 'escalade_mediateur',
                'ai_quality_score'   => 38,
                'ai_quality_score_json' => ['clarity' => 42, 'empathy' => 30, 'compliance' => 42],
                'escalated_to'       => 'manager',
                'escalated_to_user_id' => $manager?->id,
                'priority'           => 'urgent',
                'is_read'            => true,
                'is_processed'       => true,
                'source'             => 'imap',
            ],
            [
                'message_id'         => 'DEMO-MARC-004',
                'from_name'          => 'Marc Leclerc',
                'from_email'         => $marc,
                'subject'            => 'Suite médiation - Proposition de règlement insuffisante',
                'body_text'          => "Bonjour,\n\nJ'ai reçu la proposition de médiation de 120€ pour un préjudice de 480€. Je refuse ce montant. Merci de revoir votre position.\n\nMarc Leclerc",
                'received_at'        => Carbon::now()->subMonths(1)->subWeek(),
                'status'             => 'resolved',
                'ai_service_type'    => 'reclamation',
                'ai_quality_score'   => 61,
                'ai_quality_score_json' => ['clarity' => 65, 'empathy' => 58, 'compliance' => 60],
                'validated_response' => "Suite à votre retour, nous avons revu notre offre à 300€...",
                'validated_at'       => Carbon::now()->subMonths(1)->subWeek()->addDays(3),
                'validated_by'       => $validatedBy,
                'priority'           => 'high',
                'is_read'            => true,
                'is_processed'       => true,
                'source'             => 'imap',
            ],
            [
                'message_id'         => 'DEMO-MARC-005',
                'from_name'          => 'Marc Leclerc',
                'from_email'         => $marc,
                'subject'            => 'Nouveau problème - Recommandé non distribué',
                'body_text'          => "Encore moi. Mon recommandé du 2 mai n'a jamais été présenté à ma porte. L'avis de passage est faux, j'étais chez moi toute la journée.\n\nMarc Leclerc",
                'received_at'        => Carbon::now()->subDays(14),
                'status'             => 'escalated',
                'ai_service_type'    => 'reclamation',
                'ai_quality_score'   => 48,
                'ai_quality_score_json' => ['clarity' => 52, 'empathy' => 44, 'compliance' => 48],
                'escalated_to'       => 'manager',
                'escalated_to_user_id' => $manager?->id,
                'priority'           => 'urgent',
                'is_read'            => true,
                'is_processed'       => true,
                'source'             => 'imap',
            ],
            [
                'message_id'         => 'DEMO-MARC-006',
                'from_name'          => 'Marc Leclerc',
                'from_email'         => $marc,
                'subject'            => 'Relance - Recommandé #AR482615FR toujours bloqué',
                'body_text'          => "Bonjour,\n\nAucune nouvelle depuis 7 jours malgré l'escalade. Le recommandé AR482615FR contient mon avis d'imposition. Délai d'action : 24h.\n\nMarc Leclerc",
                'received_at'        => Carbon::now()->subDays(7),
                'status'             => 'pending',
                'ai_service_type'    => 'suivi_colis',
                'ai_quality_score'   => 55,
                'ai_quality_score_json' => ['clarity' => 60, 'empathy' => 50, 'compliance' => 55],
                'priority'           => 'urgent',
                'follow_up_at'       => Carbon::now()->subDays(5),
                'is_read'            => true,
                'is_processed'       => false,
                'source'             => 'imap',
            ],
            [
                'message_id'         => 'DEMO-MARC-007',
                'from_name'          => 'Marc Leclerc',
                'from_email'         => $marc,
                'subject'            => 'DERNIER RECOURS avant voie judiciaire',
                'body_text'          => "Mesdames, Messieurs,\n\nCeci est mon 7e contact depuis janvier 2026. Sans réponse satisfaisante sous 48h, je saisirai le tribunal d'instance pour l'ensemble de mes préjudices (colis perdus, recommandé non distribué, soit 530€ de dommages documentés).\n\nMarc Leclerc\nTél : 06 89 12 34 56",
                'received_at'        => Carbon::now()->subDays(2),
                'status'             => 'unread',
                'ai_service_type'    => 'escalade_mediateur',
                'priority'           => 'urgent',
                'is_read'            => false,
                'is_processed'       => false,
                'source'             => 'imap',
            ],
        ]);

        // ─── 2. CLIENT RÉGULIER — Julie Renard ────────────────────────────────
        // 3 contacts, aucune escalade, bon score → pas sensible
        $julie = 'julie.renard.pro@outlook.fr';
        $this->upsertAll([
            [
                'message_id'         => 'DEMO-JULIE-001',
                'from_name'          => 'Julie Renard',
                'from_email'         => $julie,
                'subject'            => 'Demande de contrat Colissimo Pro - 300 colis/mois',
                'body_text'          => "Bonjour,\n\nJe suis responsable logistique chez Renard & Co. Nous cherchons à externaliser nos envois (environ 300 colis/mois vers toute la France). Pourriez-vous nous soumettre une offre tarifaire ?\n\nJulie Renard",
                'received_at'        => Carbon::now()->subMonths(2),
                'status'             => 'resolved',
                'ai_service_type'    => 'info_offre',
                'ai_quality_score'   => 88,
                'ai_quality_score_json' => ['clarity' => 90, 'empathy' => 85, 'compliance' => 89],
                'validated_response' => "Bonjour Madame Renard, voici notre offre personnalisée Colissimo Pro...",
                'validated_at'       => Carbon::now()->subMonths(2)->addDay(),
                'validated_by'       => $validatedBy,
                'priority'           => 'normal',
                'is_read'            => true,
                'is_processed'       => true,
                'source'             => 'imap',
            ],
            [
                'message_id'         => 'DEMO-JULIE-002',
                'from_name'          => 'Julie Renard',
                'from_email'         => $julie,
                'subject'            => 'Suivi colis client prioritaire #CO982345FR',
                'body_text'          => "Bonjour,\n\nNotre client prioritaire attend le colis CO982345FR depuis hier. Y a-t-il un retard prévu ? Besoin d'une confirmation aujourd'hui.\n\nJulie Renard - Renard & Co",
                'received_at'        => Carbon::now()->subMonths(1),
                'status'             => 'resolved',
                'ai_service_type'    => 'suivi_colis',
                'ai_quality_score'   => 82,
                'ai_quality_score_json' => ['clarity' => 85, 'empathy' => 78, 'compliance' => 83],
                'validated_response' => "Bonjour Madame Renard, le colis CO982345FR est en cours de livraison...",
                'validated_at'       => Carbon::now()->subMonths(1)->addHours(4),
                'validated_by'       => $validatedBy,
                'priority'           => 'high',
                'is_read'            => true,
                'is_processed'       => true,
                'source'             => 'imap',
            ],
            [
                'message_id'         => 'DEMO-JULIE-003',
                'from_name'          => 'Julie Renard',
                'from_email'         => $julie,
                'subject'            => 'Renouvellement contrat + options assurance',
                'body_text'          => "Bonjour,\n\nNotre contrat Colissimo Pro arrive à terme fin mai. Nous souhaitons le renouveler et ajouter l'option assurance Valeur Déclarée. Pourriez-vous nous envoyer les nouvelles conditions tarifaires ?\n\nJulie Renard",
                'received_at'        => Carbon::now()->subDays(3),
                'status'             => 'read',
                'ai_service_type'    => 'info_offre',
                'ai_quality_score'   => 79,
                'ai_quality_score_json' => ['clarity' => 82, 'empathy' => 75, 'compliance' => 80],
                'priority'           => 'normal',
                'is_read'            => true,
                'is_processed'       => false,
                'source'             => 'imap',
            ],
        ]);

        // ─── 3. VOLUME SUJETS RÉCURRENTS — mai 2026 ───────────────────────────
        // Sujets variés répartis sur les 22 derniers jours pour le RecurringTopicsWidget

        $volumeEmails = [];

        // Suivi colis — dominant (18 emails) → déclenche alerte >30%
        $suiviSujets = [
            'Colis non livré - Numéro %s',
            'Suivi introuvable - Colissimo %s',
            'Avis de passage non respecté - Recommandé %s',
            'Retard de livraison Chronopost - %s',
            'Colis bloqué en centre de tri - %s',
            'Livraison à domicile manquée - %s',
            'Colissimo retourné expéditeur sans raison',
            'Délai de livraison dépassé - commande %s',
            'Recommandé remis à un voisin sans accord',
            'Colis endommagé à la livraison - %s',
        ];
        foreach (range(1, 18) as $i) {
            $sujet = $suiviSujets[($i - 1) % count($suiviSujets)];
            $ref   = 'FR' . rand(2026001, 2026999) . rand(100, 999);
            $volumeEmails[] = [
                'message_id'      => "DEMO-SUIVI-$i",
                'from_name'       => $this->randomName(),
                'from_email'      => 'client.suivi.' . $i . '@demo.fr',
                'subject'         => sprintf(str_contains($sujet, '%s') ? $sujet : $sujet, $ref),
                'body_text'       => "Bonjour, mon colis $ref n'a pas été livré. Numéro de suivi : $ref. Merci de vérifier.\n\nCordialement",
                'received_at'     => Carbon::now()->subDays(rand(0, 20))->subHours(rand(0, 23)),
                'status'          => $this->randomStatus(['unread', 'read', 'processing', 'resolved']),
                'ai_service_type' => 'suivi_colis',
                'ai_quality_score' => rand(62, 91),
                'priority'        => $this->randomStatus(['low', 'normal', 'high']),
                'is_read'         => rand(0, 1),
                'is_processed'    => rand(0, 1),
                'source'          => 'imap',
            ];
        }

        // Réclamations (12 emails)
        $reclSujets = [
            'Remboursement refusé - Colis endommagé',
            'Double facturation sur mon compte',
            'Erreur de livraison - Mauvais destinataire',
            'Recommandé non présenté - Avis de passage faux',
            'Colis perdu - Valeur déclarée non remboursée',
            'Indemnisation insuffisante dossier %s',
            'Réclamation formelle - Comportement en agence',
            'Retard chronique - 3e incident en 2 mois',
        ];
        foreach (range(1, 12) as $i) {
            $sujet = $reclSujets[($i - 1) % count($reclSujets)];
            $ref   = 'REC-2026-' . rand(1000, 9999);
            $volumeEmails[] = [
                'message_id'      => "DEMO-RECL-$i",
                'from_name'       => $this->randomName(),
                'from_email'      => 'client.recl.' . $i . '@demo.fr',
                'subject'         => str_contains($sujet, '%s') ? sprintf($sujet, $ref) : $sujet,
                'body_text'       => "Madame, Monsieur,\n\nJe souhaite porter une réclamation formelle. Référence : $ref.\n\nCordialement",
                'received_at'     => Carbon::now()->subDays(rand(0, 22))->subHours(rand(0, 23)),
                'status'          => $this->randomStatus(['unread', 'read', 'resolved', 'archived']),
                'ai_service_type' => 'reclamation',
                'ai_quality_score' => rand(55, 88),
                'priority'        => $this->randomStatus(['normal', 'high', 'urgent']),
                'is_read'         => rand(0, 1),
                'is_processed'    => rand(0, 1),
                'source'          => $i % 3 === 0 ? 'form' : 'imap',
            ];
        }

        // Info offres (10 emails)
        $infoSujets = [
            'Tarifs Colissimo International - Entreprise',
            'Contrat Pro Chronopost - Renouvellement',
            "Renseignements offre Lettre Suivie",
            'Devis pour envoi 500 colis/mois',
            'Options assurance Valeur Déclarée',
            'Colissimo domicile vs relais - comparatif',
            'Tarif recommandé international Europe',
            'Contrat entreprise La Banque Postale',
        ];
        foreach (range(1, 10) as $i) {
            $sujet = $infoSujets[($i - 1) % count($infoSujets)];
            $volumeEmails[] = [
                'message_id'      => "DEMO-INFO-$i",
                'from_name'       => $this->randomName(),
                'from_email'      => 'client.info.' . $i . '@demo.fr',
                'subject'         => $sujet,
                'body_text'       => "Bonjour,\n\nJe souhaite des informations sur : $sujet.\n\nCordialement",
                'received_at'     => Carbon::now()->subDays(rand(1, 20))->subHours(rand(0, 23)),
                'status'          => $this->randomStatus(['read', 'processing', 'resolved']),
                'ai_service_type' => 'info_offre',
                'ai_quality_score' => rand(70, 95),
                'priority'        => 'normal',
                'is_read'         => true,
                'is_processed'    => rand(0, 1),
                'source'          => 'imap',
            ];
        }

        // Escalades médiateur (7 emails)
        $escalSujets = [
            'Saisine Médiateur - Dossier non résolu 3 mois',
            'ESCALADE - Colis contenant documents officiels',
            'Médiation formelle - Préjudice 650€',
            'Dossier médiateur - Retards répétés Chronopost',
            'Escalade direction régionale - Recommandé perdu',
            'Saisine médiateur national La Poste',
            'Menace judiciaire - 5e contact sans solution',
        ];
        foreach (range(1, 7) as $i) {
            $volumeEmails[] = [
                'message_id'      => "DEMO-ESCAL-$i",
                'from_name'       => $this->randomName(),
                'from_email'      => 'client.escal.' . $i . '@demo.fr',
                'subject'         => $escalSujets[$i - 1],
                'body_text'       => "Madame, Monsieur,\n\nJe me vois contraint de saisir le médiateur suite à l'absence de traitement de mon dossier.\n\nCordialement",
                'received_at'     => Carbon::now()->subDays(rand(0, 18))->subHours(rand(0, 23)),
                'status'          => $this->randomStatus(['escalated', 'processing', 'pending']),
                'ai_service_type' => 'escalade_mediateur',
                'ai_quality_score' => rand(40, 70),
                'priority'        => $i <= 3 ? 'urgent' : 'high',
                'escalated_to'    => 'manager',
                'is_read'         => rand(0, 1),
                'is_processed'    => rand(0, 1),
                'source'          => 'imap',
            ];
        }

        // Formulaires (5 emails)
        $formSujets = [
            '[Formulaire] Demande de rendez-vous conseiller',
            '[Formulaire] Signalement agence - Délai attente',
            '[Formulaire] Ouverture compte épargne entreprise',
            '[Formulaire] Réclamation - Avis de passage abusif',
            '[Formulaire] Contact commercial - Colissimo Pro',
        ];
        foreach (range(1, 5) as $i) {
            $volumeEmails[] = [
                'message_id'      => "DEMO-FORM-$i",
                'from_name'       => $this->randomName(),
                'from_email'      => 'client.form.' . $i . '@demo.fr',
                'subject'         => $formSujets[$i - 1],
                'body_text'       => "Formulaire soumis le " . Carbon::now()->subDays($i)->format('d/m/Y') . "\n\nDemande traitée via le formulaire en ligne.",
                'received_at'     => Carbon::now()->subDays(rand(1, 15))->subHours(rand(0, 23)),
                'status'          => $this->randomStatus(['unread', 'read', 'resolved']),
                'ai_service_type' => 'formulaire',
                'ai_quality_score' => rand(68, 90),
                'priority'        => 'normal',
                'is_read'         => $i > 2,
                'is_processed'    => $i > 3,
                'source'          => 'form',
            ];
        }

        // Handicap / Accessibilité (3 emails)
        $this->upsertAll([
            [
                'message_id'      => 'DEMO-HANDI-1',
                'from_name'       => 'Sylvie Morel',
                'from_email'      => 'sylvie.morel.rqth@gmail.com',
                'subject'         => 'Accessibilité bureau de poste - Fauteuil roulant',
                'body_text'       => "Bonjour,\n\nLe bureau de poste de ma ville n'est pas accessible. Je suis en fauteuil roulant et ne peux pas entrer sans aide. La loi prévoit l'accessibilité obligatoire. Comment puis-je obtenir une livraison à domicile pour mes recommandés ?\n\nSylvie Morel - RQTH",
                'received_at'     => Carbon::now()->subDays(6),
                'status'          => 'processing',
                'ai_service_type' => 'handicap',
                'ai_quality_score' => 77,
                'priority'        => 'high',
                'is_read'         => true,
                'is_processed'    => true,
                'source'          => 'imap',
            ],
            [
                'message_id'      => 'DEMO-HANDI-2',
                'from_name'       => 'Robert Girard',
                'from_email'      => 'robert.girard.malvoyant@outlook.fr',
                'subject'         => 'Aide lecture courrier - Malvoyant',
                'body_text'       => "Bonjour,\n\nJe suis malvoyant et j'ai des difficultés à lire les avis de passage et notifications. Y a-t-il un service d'assistance lecture pour les personnes en situation de handicap visuel ?\n\nRobert Girard",
                'received_at'     => Carbon::now()->subDays(10),
                'status'          => 'resolved',
                'ai_service_type' => 'handicap',
                'ai_quality_score' => 85,
                'priority'        => 'normal',
                'is_read'         => true,
                'is_processed'    => true,
                'source'          => 'imap',
            ],
            [
                'message_id'      => 'DEMO-HANDI-3',
                'from_name'       => 'Fatou Diop',
                'from_email'      => 'fatou.diop.aidant@gmail.com',
                'subject'         => 'Procuration aidant - Retrait recommandés pour personne dépendante',
                'body_text'       => "Bonjour,\n\nJe suis aidante familiale pour ma mère âgée et dépendante. Comment établir une procuration valable à La Poste pour que je puisse retirer ses recommandés à sa place ?\n\nFatou Diop",
                'received_at'     => Carbon::now()->subDays(4),
                'status'          => 'read',
                'ai_service_type' => 'handicap',
                'ai_quality_score' => 80,
                'priority'        => 'normal',
                'is_read'         => true,
                'is_processed'    => false,
                'source'          => 'imap',
            ],
        ]);

        // Autres (2 emails)
        $volumeEmails[] = [
            'message_id'      => 'DEMO-AUTRE-1',
            'from_name'       => 'Monique Lacroix',
            'from_email'      => 'monique.lacroix@free.fr',
            'subject'         => 'Question générale - Horaires bureau poste Vincennes',
            'body_text'       => "Bonjour, quels sont les horaires du bureau de poste de Vincennes le samedi ? Merci",
            'received_at'     => Carbon::now()->subDays(8),
            'status'          => 'resolved',
            'ai_service_type' => 'autre',
            'ai_quality_score' => 72,
            'priority'        => 'low',
            'is_read'         => true,
            'is_processed'    => true,
            'source'          => 'imap',
        ];
        $volumeEmails[] = [
            'message_id'      => 'DEMO-AUTRE-2',
            'from_name'       => 'Denis Blanchard',
            'from_email'      => 'denis.blanchard@wanadoo.fr',
            'subject'         => 'Demande formulaire changement coordonnées bancaires',
            'body_text'       => "Bonjour, comment mettre à jour mes coordonnées bancaires pour les prélèvements La Banque Postale ? Merci",
            'received_at'     => Carbon::now()->subDays(12),
            'status'          => 'resolved',
            'ai_service_type' => 'autre',
            'ai_quality_score' => 68,
            'priority'        => 'low',
            'is_read'         => true,
            'is_processed'    => true,
            'source'          => 'imap',
        ];

        $this->upsertAll($volumeEmails);

        // ─── 4. DONNÉES MOIS PRÉCÉDENT (avril) — pour la comparaison ─────────
        // Moins de suivi_colis, plus de réclamations : on voit la tendance
        $aprilEmails = [];
        foreach (range(1, 8) as $i) {
            $aprilEmails[] = [
                'message_id'      => "DEMO-APR-SUIVI-$i",
                'from_name'       => $this->randomName(),
                'from_email'      => "apr.suivi.$i@demo.fr",
                'subject'         => "Colis en attente livraison - APR$i",
                'body_text'       => "Bonjour, mon colis APR$i est en attente depuis plusieurs jours.",
                'received_at'     => Carbon::create(2026, 4, rand(1, 28), rand(8, 18)),
                'status'          => 'archived',
                'ai_service_type' => 'suivi_colis',
                'ai_quality_score' => rand(60, 88),
                'priority'        => 'normal',
                'is_read'         => true,
                'is_processed'    => true,
                'source'          => 'imap',
            ];
        }
        foreach (range(1, 16) as $i) {
            $aprilEmails[] = [
                'message_id'      => "DEMO-APR-RECL-$i",
                'from_name'       => $this->randomName(),
                'from_email'      => "apr.recl.$i@demo.fr",
                'subject'         => "Réclamation avril - Dossier APR-REC-$i",
                'body_text'       => "Madame, Monsieur, suite à un problème constaté en avril, je porte réclamation.",
                'received_at'     => Carbon::create(2026, 4, rand(1, 28), rand(8, 18)),
                'status'          => 'archived',
                'ai_service_type' => 'reclamation',
                'ai_quality_score' => rand(58, 85),
                'priority'        => 'normal',
                'is_read'         => true,
                'is_processed'    => true,
                'source'          => $i % 4 === 0 ? 'form' : 'imap',
            ];
        }
        foreach (range(1, 6) as $i) {
            $aprilEmails[] = [
                'message_id'      => "DEMO-APR-INFO-$i",
                'from_name'       => $this->randomName(),
                'from_email'      => "apr.info.$i@demo.fr",
                'subject'         => "Demande tarif Colissimo - Avril",
                'body_text'       => "Bonjour, je souhaite des renseignements tarifaires.",
                'received_at'     => Carbon::create(2026, 4, rand(1, 28), rand(8, 18)),
                'status'          => 'archived',
                'ai_service_type' => 'info_offre',
                'ai_quality_score' => rand(70, 92),
                'priority'        => 'normal',
                'is_read'         => true,
                'is_processed'    => true,
                'source'          => 'imap',
            ];
        }

        $this->upsertAll($aprilEmails);

        // ─── 5. FEEDBACKS IA ─────────────────────────────────────────────────────
        $this->seedFeedbacks($conseiller, $manager);

        $total = 7 + 3 + count($volumeEmails) + count($aprilEmails) + 3; // marc + julie + volume + april + handi
        $this->seedTemplates($manager);

        $this->command->info("DemoDataSeeder : ~$total emails + feedbacks créés.");
        $this->command->info('  → CLIENT SENSIBLE : marc.leclerc.plainte@gmail.com (7 contacts, 2 escalades)');
        $this->command->info('  → CLIENT RÉGULIER : julie.renard.pro@outlook.fr (3 contacts, score ~83)');
        $this->command->info('  → Suivi colis dominant en mai (18 emails) → alerte déclenchée');
        $this->command->info('  → Réclamations dominant en avril (16 emails) → inversion de tendance visible');
        $this->command->info('  → Feedbacks IA : positifs sur Julie, négatifs + corrections sur Marc');
        $this->command->info('  → Modèles de réponses : 10 templates créés');
    }

    private function seedTemplates(?User $manager): void
    {
        $createdBy = $manager?->id ?? User::where('role', 'admin')->first()?->id;

        $templates = [
            [
                'title'        => 'Accusé de réception — Réclamation',
                'category'     => 'accusé',
                'service_type' => 'reclamation',
                'content'      => "Madame, Monsieur,\n\nNous accusons bonne réception de votre réclamation et vous remercions de nous avoir contactés.\n\nVotre dossier a été enregistré sous la référence [NUMÉRO DOSSIER]. Un conseiller dédié prend en charge votre demande et reviendra vers vous dans un délai de 5 jours ouvrés.\n\nNous vous présentons toutes nos excuses pour la gêne occasionnée et restons à votre disposition.\n\nCordialement,\nService Client La Poste",
                'use_count'    => 47,
            ],
            [
                'title'        => 'Suivi colis — Colis en transit',
                'category'     => 'information',
                'service_type' => 'suivi_colis',
                'content'      => "Madame, Monsieur,\n\nNous avons bien reçu votre demande de suivi concernant votre colis.\n\nAprès vérification, votre envoi référencé [NUMÉRO SUIVI] est actuellement en cours d'acheminement. La livraison est prévue dans un délai de [X] jours ouvrés.\n\nVous pouvez suivre l'avancement de votre livraison en temps réel sur notre site : laposte.fr/outils/suivre-vos-envois\n\nNous vous remercions de votre patience.\n\nCordialement,\nService Client La Poste",
                'use_count'    => 63,
            ],
            [
                'title'        => 'Suivi colis — Colis livré (non signalé)',
                'category'     => 'résolution',
                'service_type' => 'suivi_colis',
                'content'      => "Madame, Monsieur,\n\nNous avons bien pris note de votre signalement concernant votre colis [NUMÉRO SUIVI].\n\nD'après nos informations, votre envoi a été livré le [DATE] à [HEURE]. Il a été [déposé dans votre boîte aux lettres / remis à votre gardien / déposé chez votre voisin au n°XX / laissé devant votre porte].\n\nSi vous ne retrouvez pas votre colis malgré ces indications, nous vous invitons à contacter votre bureau de poste local en précisant la référence ci-dessus.\n\nCordialement,\nService Client La Poste",
                'use_count'    => 38,
            ],
            [
                'title'        => 'Demande d\'informations complémentaires',
                'category'     => 'demande',
                'service_type' => null,
                'content'      => "Madame, Monsieur,\n\nNous avons bien reçu votre demande et souhaitons y apporter une réponse complète et personnalisée.\n\nAfin de traiter votre dossier dans les meilleurs délais, nous avons besoin des informations suivantes :\n\n- [Information 1]\n- [Information 2]\n- [Information 3]\n\nMerci de nous transmettre ces éléments en réponse à ce message. Votre dossier sera traité dès réception.\n\nCordialement,\nService Client La Poste",
                'use_count'    => 29,
            ],
            [
                'title'        => 'Résolution — Remboursement accepté',
                'category'     => 'résolution',
                'service_type' => 'reclamation',
                'content'      => "Madame, Monsieur,\n\nSuite à l'étude approfondie de votre dossier [NUMÉRO DOSSIER], nous avons le plaisir de vous informer que votre demande de remboursement a été acceptée.\n\nUn virement de [MONTANT] € sera effectué sur votre compte bancaire dans un délai de 10 jours ouvrés.\n\nNous vous présentons une fois encore nos sincères excuses pour les désagréments rencontrés et espérons pouvoir compter sur votre fidélité.\n\nCordialement,\nService Client La Poste",
                'use_count'    => 22,
            ],
            [
                'title'        => 'Transfert vers service spécialisé',
                'category'     => 'escalade',
                'service_type' => null,
                'content'      => "Madame, Monsieur,\n\nNous avons bien pris connaissance de votre demande et comprenons l'importance de votre situation.\n\nAfin de vous apporter la meilleure réponse possible, votre dossier a été transmis à notre équipe spécialisée [SERVICE]. Un expert vous contactera directement sous 48 heures aux coordonnées que vous nous avez fournies.\n\nNous vous remercions de votre compréhension et faisons le nécessaire pour résoudre votre problème dans les meilleurs délais.\n\nCordialement,\nService Client La Poste",
                'use_count'    => 18,
            ],
            [
                'title'        => 'Accessibilité — Prise en charge PMR',
                'category'     => 'information',
                'service_type' => 'handicap',
                'content'      => "Madame, Monsieur,\n\nNous vous remercions de nous avoir contactés concernant nos services d'accessibilité.\n\nLa Poste s'engage à offrir un accueil adapté à tous ses clients. Pour bénéficier de nos services dédiés aux personnes à mobilité réduite ou en situation de handicap :\n\n• Livraison à domicile prioritaire : disponible sur demande\n• Accompagnement en bureau de poste : signalez votre besoin à l'accueil\n• Service téléphonique dédié : [NUMÉRO]\n\nN'hésitez pas à nous préciser vos besoins spécifiques afin que nous puissions vous proposer la solution la plus adaptée.\n\nCordialement,\nService Client La Poste",
                'use_count'    => 12,
            ],
            [
                'title'        => 'Information sur une offre ou un tarif',
                'category'     => 'information',
                'service_type' => 'info_offre',
                'content'      => "Madame, Monsieur,\n\nNous vous remercions de votre intérêt pour nos services.\n\nConcernant votre demande d'information sur [NOM OFFRE/SERVICE] :\n\n[DESCRIPTION DE L'OFFRE]\n\nTarif : [PRIX] €\nConditions : [CONDITIONS]\n\nPour plus d'informations ou pour souscrire, vous pouvez :\n• Vous rendre dans votre bureau de poste le plus proche\n• Appeler le 3631 (service gratuit + prix appel)\n• Consulter laposte.fr\n\nNous restons à votre disposition pour tout complément d'information.\n\nCordialement,\nService Client La Poste",
                'use_count'    => 31,
            ],
            [
                'title'        => 'Fermeture de dossier — Résolu',
                'category'     => 'fermeture',
                'service_type' => null,
                'content'      => "Madame, Monsieur,\n\nNous revenons vers vous concernant votre dossier [NUMÉRO DOSSIER] ouvert le [DATE].\n\nNous avons le plaisir de vous informer que votre demande a été traitée et résolue. [DESCRIPTION DE LA RÉSOLUTION]\n\nVotre dossier est désormais clôturé. Si vous avez de nouvelles questions ou si ce problème venait à se reproduire, n'hésitez pas à nous recontacter.\n\nNous espérons que cette réponse vous donne entière satisfaction.\n\nCordialement,\nService Client La Poste",
                'use_count'    => 19,
            ],
            [
                'title'        => 'Excuse et geste commercial',
                'category'     => 'excuse',
                'service_type' => 'reclamation',
                'content'      => "Madame, Monsieur,\n\nNous avons pris connaissance de votre retour et vous présentons nos plus sincères excuses pour la situation que vous avez vécue.\n\nLa qualité de service est notre priorité absolue, et nous regrettons profondément que cela n'ait pas été le cas dans votre situation.\n\nEn signe de notre engagement envers votre satisfaction, nous souhaitons vous offrir [GESTE COMMERCIAL : bon de réduction / remboursement partiel / service gratuit].\n\nNous espérons que ce geste témoigne de notre volonté de vous fidéliser et de rétablir votre confiance.\n\nCordialement,\nService Client La Poste",
                'use_count'    => 14,
            ],
        ];

        foreach ($templates as $tpl) {
            ResponseTemplate::firstOrCreate(
                ['title' => $tpl['title']],
                array_merge($tpl, ['is_active' => true, 'created_by' => $createdBy])
            );
        }
    }

    private function seedFeedbacks(?User $conseiller, ?User $manager): void
    {
        if (! $conseiller) {
            return;
        }

        // Feedbacks négatifs sur les mails Marc Leclerc (scores ~45-52 → réponses IA médiocres)
        $negativeSeeds = [
            ['message_id' => 'DEMO-MARC-001', 'tags' => ['ton_incorrect', 'information_manquante'],
             'correction' => "La réponse devrait reconnaître explicitement le refus de remboursement et proposer un numéro de dossier dédié, pas juste 'prendre en charge'. Exemple : 'Votre dossier DE-2026-001 est ouvert, un conseiller vous rappelle sous 48h.'"],
            ['message_id' => 'DEMO-MARC-003', 'tags' => ['hors_charte', 'trop_formel'],
             'correction' => "Le ton est trop administratif pour une situation d'escalade. Utiliser un langage plus direct et empathique : 'Je comprends votre frustration, voici ce que nous allons faire concrètement...'"],
            ['message_id' => 'DEMO-MARC-005', 'tags' => ['erreur_factuelle', 'information_manquante'],
             'correction' => "La réponse mentionne un délai de 5 jours ouvrable incorrect. Le délai réglementaire pour ce type de réclamation est de 10 jours. Toujours vérifier les délais avant de les communiquer."],
            ['message_id' => 'DEMO-MARC-006', 'tags' => ['trop_long'],
             'correction' => null],
        ];

        foreach ($negativeSeeds as $seed) {
            $email = EmailInbox::where('message_id', $seed['message_id'])->first();
            if (! $email) {
                continue;
            }
            AiFeedback::updateOrCreate(
                ['email_inbox_id' => $email->id, 'user_id' => $conseiller->id],
                [
                    'rating'            => 'negative',
                    'rejection_tags'    => $seed['tags'],
                    'correction'        => $seed['correction'],
                    'original_response' => $email->validated_response ?? $email->ai_response,
                    'created_at'        => $email->received_at?->addDays(1) ?? Carbon::now()->subDays(5),
                    'updated_at'        => $email->received_at?->addDays(1) ?? Carbon::now()->subDays(5),
                ]
            );
        }

        // Feedback négatif du manager sur un email d'escalade
        if ($manager) {
            $escaladeEmail = EmailInbox::where('message_id', 'DEMO-MARC-004')->first();
            if ($escaladeEmail) {
                AiFeedback::updateOrCreate(
                    ['email_inbox_id' => $escaladeEmail->id, 'user_id' => $manager->id],
                    [
                        'rating'            => 'negative',
                        'rejection_tags'    => ['ton_incorrect', 'hors_charte'],
                        'correction'        => "En situation d'escalade, la réponse IA doit systématiquement inclure : (1) validation de la gravité, (2) nom du responsable référent, (3) délai d'escalade précis. Cette réponse n'en fait aucun.",
                        'original_response' => $escaladeEmail->validated_response ?? null,
                        'created_at'        => Carbon::now()->subDays(8),
                        'updated_at'        => Carbon::now()->subDays(8),
                    ]
                );
            }
        }

        // Feedbacks positifs sur Julie Renard (scores ~80-86 → bonnes réponses)
        $positiveSeeds = ['DEMO-JULIE-001', 'DEMO-JULIE-002', 'DEMO-JULIE-003'];
        foreach ($positiveSeeds as $msgId) {
            $email = EmailInbox::where('message_id', $msgId)->first();
            if (! $email) {
                continue;
            }
            AiFeedback::updateOrCreate(
                ['email_inbox_id' => $email->id, 'user_id' => $conseiller->id],
                [
                    'rating'            => 'positive',
                    'rejection_tags'    => null,
                    'correction'        => null,
                    'original_response' => $email->validated_response ?? null,
                    'created_at'        => $email->received_at?->addHours(2) ?? Carbon::now()->subDays(2),
                    'updated_at'        => $email->received_at?->addHours(2) ?? Carbon::now()->subDays(2),
                ]
            );
        }

        // Feedbacks positifs sur quelques mails de volume récents (réponses correctes)
        $recentPositives = ['DEMO-SUIVI-3', 'DEMO-SUIVI-7', 'DEMO-RECL-4', 'DEMO-INFO-2', 'DEMO-FORM-1', 'DEMO-HANDI-1'];
        foreach ($recentPositives as $msgId) {
            $email = EmailInbox::where('message_id', $msgId)->first();
            if (! $email) {
                continue;
            }
            AiFeedback::updateOrCreate(
                ['email_inbox_id' => $email->id, 'user_id' => $conseiller->id],
                [
                    'rating'            => 'positive',
                    'rejection_tags'    => null,
                    'correction'        => null,
                    'original_response' => null,
                    'created_at'        => $email->received_at?->addHours(rand(1, 6)) ?? Carbon::now()->subDays(rand(1, 10)),
                    'updated_at'        => $email->received_at?->addHours(rand(1, 6)) ?? Carbon::now()->subDays(rand(1, 10)),
                ]
            );
        }

        // Feedbacks négatifs supplémentaires (variété de tags pour le tableau de bord)
        $extraNegatives = [
            ['DEMO-RECL-2',   ['information_manquante', 'trop_long'], null],
            ['DEMO-ESCAL-1',  ['ton_incorrect'],                      null],
            ['DEMO-RECL-8',   ['erreur_factuelle'],                   "Le taux de remboursement indiqué (50%) est incorrect, il est de 80% pour ce type de sinistre selon la procédure interne."],
            ['DEMO-SUIVI-12', ['trop_formel'],                        null],
        ];
        foreach ($extraNegatives as [$msgId, $tags, $correction]) {
            $email = EmailInbox::where('message_id', $msgId)->first();
            if (! $email) {
                continue;
            }
            AiFeedback::updateOrCreate(
                ['email_inbox_id' => $email->id, 'user_id' => $conseiller->id],
                [
                    'rating'            => 'negative',
                    'rejection_tags'    => $tags,
                    'correction'        => $correction,
                    'original_response' => null,
                    'created_at'        => $email->received_at?->addHours(3) ?? Carbon::now()->subDays(rand(2, 15)),
                    'updated_at'        => $email->received_at?->addHours(3) ?? Carbon::now()->subDays(rand(2, 15)),
                ]
            );
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function upsertAll(array $rows): void
    {
        foreach ($rows as $row) {
            EmailInbox::updateOrCreate(['message_id' => $row['message_id']], $row);
        }
    }

    private function randomStatus(array $options): string
    {
        return $options[array_rand($options)];
    }

    private function randomName(): string
    {
        $prenoms = ['Alice', 'Bruno', 'Claire', 'David', 'Emma', 'François', 'Géraldine',
                    'Henri', 'Isabelle', 'Jacques', 'Karen', 'Laurent', 'Martine', 'Nicolas',
                    'Olivia', 'Patrick', 'Quentin', 'Romain', 'Sandra', 'Thierry', 'Ursula'];
        $noms    = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit',
                    'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel',
                    'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier'];
        return $prenoms[array_rand($prenoms)] . ' ' . $noms[array_rand($noms)];
    }
}
