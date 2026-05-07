<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('emails_inbox', function (Blueprint $table) {
            if (!Schema::hasColumn('emails_inbox', 'status')) {
                $table->enum('status', ['unread', 'read', 'processing', 'resolved', 'archived'])
                      ->default('unread')->after('is_processed');
            }
            if (!Schema::hasColumn('emails_inbox', 'ai_quality_score_json')) {
                $table->json('ai_quality_score_json')->nullable()->after('ai_response');
            }
            if (!Schema::hasColumn('emails_inbox', 'validated_response')) {
                $table->longText('validated_response')->nullable()->after('ai_quality_score_json');
            }
            if (!Schema::hasColumn('emails_inbox', 'validated_at')) {
                $table->timestamp('validated_at')->nullable()->after('validated_response');
            }
            if (!Schema::hasColumn('emails_inbox', 'validated_by')) {
                $table->unsignedBigInteger('validated_by')->nullable()->after('validated_at');
            }
            if (!Schema::hasColumn('emails_inbox', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('validated_by');
            }
            if (!Schema::hasColumn('emails_inbox', 'source')) {
                $table->enum('source', ['imap', 'manual', 'form'])->default('imap')->after('archived_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('emails_inbox', function (Blueprint $table) {
            $table->dropColumn([
                'status', 'ai_quality_score_json', 'validated_response',
                'validated_at', 'validated_by', 'archived_at', 'source',
            ]);
        });
    }
};
