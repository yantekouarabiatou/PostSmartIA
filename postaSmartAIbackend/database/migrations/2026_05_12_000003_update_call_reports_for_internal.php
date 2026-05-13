<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('call_reports', function (Blueprint $table) {
            // Lien vers le mail IMAP d'origine (nullable — CR peut être créé sans mail)
            if (!Schema::hasColumn('call_reports', 'email_inbox_id')) {
                $table->unsignedBigInteger('email_inbox_id')->nullable()->after('user_id');
                $table->foreign('email_inbox_id')->references('id')->on('emails_inbox')->nullOnDelete();
            }

            // Type du document : mail client envoyé ou rapport interne
            if (!Schema::hasColumn('call_reports', 'report_type')) {
                $table->enum('report_type', ['client_email', 'internal_report'])
                      ->default('client_email')
                      ->after('email_inbox_id');
            }

            // Données structurées internes (contexte, demande, actions, engagements, suivi)
            if (!Schema::hasColumn('call_reports', 'structured_data')) {
                $table->json('structured_data')->nullable()->after('report_type');
            }

            // Statut interne du dossier (distinct du statut draft/validated/archived)
            if (!Schema::hasColumn('call_reports', 'internal_status')) {
                $table->enum('internal_status', ['open', 'closed', 'follow_up_required'])
                      ->default('open')
                      ->after('structured_data');
            }

            // Visibilité manager (pour la vue consolidée)
            if (!Schema::hasColumn('call_reports', 'visible_to_manager')) {
                $table->boolean('visible_to_manager')->default(false)->after('internal_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('call_reports', function (Blueprint $table) {
            $table->dropForeign(['email_inbox_id']);
            $table->dropColumn([
                'email_inbox_id',
                'report_type',
                'structured_data',
                'internal_status',
                'visible_to_manager',
            ]);
        });
    }
};
