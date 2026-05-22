<?php

namespace App\Http\Controllers;

use App\Models\AiFeedback;
use App\Models\CallReport;
use App\Models\EmailInbox;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private array $serviceLabels = [
        'suivi_colis'    => 'Suivi colis',
        'reclamation'    => 'Réclamation',
        'info_offre'     => 'Info offre',
        'handicap'       => 'Accessibilité',
        'info_generale'  => 'Info générale',
        'escalade'       => 'Escalade',
        'formation'      => 'Formation',
        'autre'          => 'Autre',
    ];

    /**
     * GET /api/reports/data
     * Retourne les données structurées pour la génération PDF côté frontend.
     */
    public function data(Request $request): JsonResponse
    {
        $period = $request->input('period', 'month');
        [$start, $end] = $this->periodBounds($period);

        $user    = $request->user();
        $isAdmin = in_array($user->role, ['admin', 'manager']);

        // KPIs globaux
        $totalEmails   = EmailInbox::whereBetween('received_at', [$start, $end])->count();
        $resolvedEmails= EmailInbox::whereBetween('received_at', [$start, $end])
                             ->whereIn('status', ['resolved', 'archived'])->count();
        $escalated     = EmailInbox::whereBetween('received_at', [$start, $end])
                             ->where('status', 'escalated')->count();

        $scores = EmailInbox::whereBetween('received_at', [$start, $end])
                      ->whereNotNull('ai_quality_score')->where('ai_quality_score', '>', 0)
                      ->pluck('ai_quality_score');
        $avgScore = $scores->count() > 0 ? round($scores->average(), 1) : null;

        // Répartition par service
        $byService = EmailInbox::whereBetween('received_at', [$start, $end])
            ->whereNotNull('ai_service_type')
            ->select('ai_service_type', DB::raw('COUNT(*) as total'))
            ->groupBy('ai_service_type')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => [
                'type'  => $r->ai_service_type,
                'label' => $this->serviceLabels[$r->ai_service_type] ?? $r->ai_service_type,
                'total' => $r->total,
            ])->values();

        // Activité quotidienne sur la période
        $dailyActivity = EmailInbox::whereBetween('received_at', [$start, $end])
            ->select(DB::raw('DATE(received_at) as day'), DB::raw('COUNT(*) as total'))
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn($r) => ['day' => $r->day, 'total' => $r->total])
            ->values();

        // Feedback IA
        $feedbackTotals = AiFeedback::whereBetween('created_at', [$start, $end])
            ->select('rating', DB::raw('COUNT(*) as count'))
            ->groupBy('rating')
            ->pluck('count', 'rating');

        $positiveCount = (int) ($feedbackTotals['positive'] ?? 0);
        $negativeCount = (int) ($feedbackTotals['negative'] ?? 0);
        $totalFeedback = $positiveCount + $negativeCount;

        // Top tags de rejet
        $allTags = AiFeedback::whereBetween('created_at', [$start, $end])
            ->where('rating', 'negative')->whereNotNull('rejection_tags')
            ->pluck('rejection_tags');
        $tagCounts = [];
        foreach ($allTags as $tags) {
            foreach ((array) $tags as $tag) {
                $tagCounts[$tag] = ($tagCounts[$tag] ?? 0) + 1;
            }
        }
        arsort($tagCounts);
        $topTags = array_slice(
            array_map(fn($k, $v) => ['tag' => $k, 'count' => $v], array_keys($tagCounts), $tagCounts),
            0, 6, true
        );

        // Classement conseillers (admin seulement)
        $leaderboard = [];
        if ($isAdmin) {
            $leaderboard = User::where('is_active', true)
                ->whereIn('role', ['conseiller', 'manager'])
                ->get()
                ->map(function ($u) use ($start, $end) {
                    $count = EmailInbox::where('validated_by', $u->id)
                        ->whereBetween('validated_at', [$start, $end])->count();
                    $scores = EmailInbox::where('validated_by', $u->id)
                        ->whereNotNull('ai_quality_score')
                        ->whereBetween('validated_at', [$start, $end])
                        ->pluck('ai_quality_score');
                    return [
                        'name'      => $u->first_name . ' ' . $u->last_name,
                        'role'      => $u->role,
                        'emails'    => $count,
                        'avg_score' => $scores->count() > 0 ? (int) round($scores->average()) : 0,
                    ];
                })
                ->filter(fn($u) => $u['emails'] > 0)
                ->sortByDesc('emails')
                ->values();
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'period'         => $period,
                'period_label'   => $this->periodLabel($period),
                'generated_at'   => now()->format('d/m/Y H:i'),
                'kpis' => [
                    'total_emails'   => $totalEmails,
                    'resolved'       => $resolvedEmails,
                    'resolution_rate'=> $totalEmails > 0 ? round(($resolvedEmails / $totalEmails) * 100) : 0,
                    'escalated'      => $escalated,
                    'avg_score'      => $avgScore,
                    'total_feedback' => $totalFeedback,
                    'ai_score'       => $totalFeedback > 0 ? round(($positiveCount / $totalFeedback) * 100) : null,
                ],
                'by_service'       => $byService,
                'daily_activity'   => $dailyActivity,
                'top_rejection_tags' => array_values($topTags),
                'leaderboard'      => $leaderboard,
            ],
        ]);
    }

    /**
     * GET /api/reports/export/excel
     * Génère et télécharge un fichier Excel .xlsx
     */
    public function exportExcel(Request $request): Response
    {
        if (!class_exists(\PhpOffice\PhpSpreadsheet\Spreadsheet::class)) {
            abort(503, 'PhpSpreadsheet non installé. Lancez : composer require phpoffice/phpspreadsheet');
        }

        $period = $request->input('period', 'month');
        [$start, $end] = $this->periodBounds($period);

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $spreadsheet->getProperties()
            ->setCreator('PostSmart IA')
            ->setTitle('Rapport ' . $this->periodLabel($period))
            ->setDescription('Export automatique PostSmart IA');

        // ── Feuille 1 : Résumé ─────────────────────────────────────────────────
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Résumé');

        $sheet->setCellValue('A1', 'PostSmart IA — Rapport ' . $this->periodLabel($period));
        $sheet->mergeCells('A1:D1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('00205B');
        $sheet->getStyle('A1')->getFont()->getColor()->setRGB('FFFFFF');

        $sheet->setCellValue('A2', 'Généré le ' . now()->format('d/m/Y à H:i'));
        $sheet->getStyle('A2')->getFont()->setItalic(true)->getColor()->setRGB('666666');

        $headers = ['Indicateur', 'Valeur'];
        $sheet->fromArray($headers, null, 'A4');
        $sheet->getStyle('A4:B4')->getFont()->setBold(true);
        $sheet->getStyle('A4:B4')->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('EFF6FF');

        $totalEmails    = EmailInbox::whereBetween('received_at', [$start, $end])->count();
        $resolvedEmails = EmailInbox::whereBetween('received_at', [$start, $end])
                              ->whereIn('status', ['resolved', 'archived'])->count();
        $escalated      = EmailInbox::whereBetween('received_at', [$start, $end])
                              ->where('status', 'escalated')->count();
        $scores = EmailInbox::whereBetween('received_at', [$start, $end])
                      ->whereNotNull('ai_quality_score')->where('ai_quality_score', '>', 0)
                      ->pluck('ai_quality_score');
        $avgScore = $scores->count() > 0 ? round($scores->average(), 1) : 0;

        $feedbackTotals = AiFeedback::whereBetween('created_at', [$start, $end])
            ->select('rating', DB::raw('COUNT(*) as count'))->groupBy('rating')
            ->pluck('count', 'rating');
        $pos = (int)($feedbackTotals['positive'] ?? 0);
        $neg = (int)($feedbackTotals['negative'] ?? 0);
        $totalFb = $pos + $neg;

        $kpis = [
            ['Emails reçus',          $totalEmails],
            ['Emails résolus',         $resolvedEmails],
            ['Taux de résolution (%)', $totalEmails > 0 ? round(($resolvedEmails / $totalEmails) * 100) : 0],
            ['Dossiers escaladés',     $escalated],
            ['Score qualité IA moyen', $avgScore],
            ['Feedbacks positifs',     $pos],
            ['Feedbacks négatifs',     $neg],
            ['Score satisfaction IA (%)', $totalFb > 0 ? round(($pos / $totalFb) * 100) : 0],
        ];

        $row = 5;
        foreach ($kpis as [$label, $value]) {
            $sheet->setCellValue("A{$row}", $label);
            $sheet->setCellValue("B{$row}", $value);
            $row++;
        }

        $sheet->getColumnDimension('A')->setWidth(35);
        $sheet->getColumnDimension('B')->setWidth(20);

        // ── Feuille 2 : Par service ────────────────────────────────────────────
        $sheet2 = $spreadsheet->createSheet();
        $sheet2->setTitle('Par service');

        $sheet2->setCellValue('A1', 'Type de service');
        $sheet2->setCellValue('B1', 'Nombre de mails');
        $sheet2->setCellValue('C1', 'Pourcentage');
        $sheet2->getStyle('A1:C1')->getFont()->setBold(true);
        $sheet2->getStyle('A1:C1')->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('EFF6FF');

        $byService = EmailInbox::whereBetween('received_at', [$start, $end])
            ->whereNotNull('ai_service_type')
            ->select('ai_service_type', DB::raw('COUNT(*) as total'))
            ->groupBy('ai_service_type')->orderByDesc('total')->get();

        $totalService = $byService->sum('total') ?: 1;
        $row = 2;
        foreach ($byService as $s) {
            $sheet2->setCellValue("A{$row}", $this->serviceLabels[$s->ai_service_type] ?? $s->ai_service_type);
            $sheet2->setCellValue("B{$row}", $s->total);
            $sheet2->setCellValue("C{$row}", round(($s->total / $totalService) * 100) . '%');
            $row++;
        }

        $sheet2->getColumnDimension('A')->setWidth(25);
        $sheet2->getColumnDimension('B')->setWidth(20);
        $sheet2->getColumnDimension('C')->setWidth(15);

        // ── Feuille 3 : Classement conseillers ────────────────────────────────
        $sheet3 = $spreadsheet->createSheet();
        $sheet3->setTitle('Conseillers');

        $sheet3->fromArray(['Conseiller', 'Rôle', 'Emails traités', 'Score IA moyen'], null, 'A1');
        $sheet3->getStyle('A1:D1')->getFont()->setBold(true);
        $sheet3->getStyle('A1:D1')->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('EFF6FF');

        $agents = User::where('is_active', true)
            ->whereIn('role', ['conseiller', 'manager'])->get();
        $row = 2;
        foreach ($agents as $agent) {
            $count = EmailInbox::where('validated_by', $agent->id)
                ->whereBetween('validated_at', [$start, $end])->count();
            $agentScores = EmailInbox::where('validated_by', $agent->id)
                ->whereNotNull('ai_quality_score')
                ->whereBetween('validated_at', [$start, $end])
                ->pluck('ai_quality_score');
            $avg = $agentScores->count() > 0 ? (int) round($agentScores->average()) : 0;

            $sheet3->setCellValue("A{$row}", $agent->name);
            $sheet3->setCellValue("B{$row}", $agent->role);
            $sheet3->setCellValue("C{$row}", $count);
            $sheet3->setCellValue("D{$row}", $avg);
            $row++;
        }

        foreach (['A', 'B', 'C', 'D'] as $col) {
            $sheet3->getColumnDimension($col)->setAutoSize(true);
        }

        // ── Feuille 4 : Emails détail ─────────────────────────────────────────
        $sheet4 = $spreadsheet->createSheet();
        $sheet4->setTitle('Emails détail');

        $sheet4->fromArray(
            ['Date', 'Expéditeur', 'Sujet', 'Type service', 'Statut', 'Score IA', 'Traité par'],
            null, 'A1'
        );
        $sheet4->getStyle('A1:G1')->getFont()->setBold(true);
        $sheet4->getStyle('A1:G1')->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('EFF6FF');

        $emails = EmailInbox::whereBetween('received_at', [$start, $end])
            ->with('validatedByUser:id,name')
            ->orderBy('received_at', 'desc')
            ->limit(500)
            ->get();

        $row = 2;
        foreach ($emails as $email) {
            $sheet4->setCellValue("A{$row}", $email->received_at?->format('d/m/Y H:i') ?? '');
            $sheet4->setCellValue("B{$row}", $email->from_email);
            $sheet4->setCellValue("C{$row}", mb_strimwidth($email->subject ?? '', 0, 80));
            $sheet4->setCellValue("D{$row}", $this->serviceLabels[$email->ai_service_type ?? ''] ?? ($email->ai_service_type ?? ''));
            $sheet4->setCellValue("E{$row}", $email->status);
            $sheet4->setCellValue("F{$row}", $email->ai_quality_score ?? '');
            $sheet4->setCellValue("G{$row}", $email->validatedByUser?->name ?? '');
            $row++;
        }

        foreach (['A','B','C','D','E','F','G'] as $col) {
            $sheet4->getColumnDimension($col)->setAutoSize(true);
        }

        // ── Génération du fichier ──────────────────────────────────────────────
        $spreadsheet->setActiveSheetIndex(0);
        $writer   = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $filename = 'rapport-postsmartia-' . now()->format('Y-m-d') . '.xlsx';

        ob_start();
        $writer->save('php://output');
        $content = ob_get_clean();

        return response($content, 200, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control'       => 'no-cache, no-store',
        ]);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function periodBounds(string $period): array
    {
        return match ($period) {
            'week'    => [now()->startOfWeek(), now()->endOfWeek()],
            'quarter' => [now()->startOfQuarter(), now()->endOfQuarter()],
            default   => [now()->startOfMonth(), now()->endOfMonth()],
        };
    }

    private function periodLabel(string $period): string
    {
        return match ($period) {
            'week'    => 'Semaine du ' . now()->startOfWeek()->format('d/m/Y'),
            'quarter' => 'T' . now()->quarter . ' ' . now()->year,
            default   => now()->locale('fr')->isoFormat('MMMM YYYY'),
        };
    }
}
