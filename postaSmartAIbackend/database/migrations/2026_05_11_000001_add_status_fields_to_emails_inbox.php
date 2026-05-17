<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Expand the status CHECK constraint (PostgreSQL stores enums as varchar + CHECK)
        DB::statement("ALTER TABLE emails_inbox DROP CONSTRAINT IF EXISTS emails_inbox_status_check");
        DB::statement("ALTER TABLE emails_inbox ADD CONSTRAINT emails_inbox_status_check CHECK (status IN ('unread','read','processing','pending','partial','escalated','resolved','archived'))");

        Schema::table('emails_inbox', function (Blueprint $table) {
            if (!Schema::hasColumn('emails_inbox', 'internal_note')) {
                $table->text('internal_note')->nullable()->after('status');
            }
            if (!Schema::hasColumn('emails_inbox', 'follow_up_at')) {
                $table->timestamp('follow_up_at')->nullable()->after('internal_note');
            }
            if (!Schema::hasColumn('emails_inbox', 'escalated_to')) {
                $table->string('escalated_to')->nullable()->after('follow_up_at');
            }
            if (!Schema::hasColumn('emails_inbox', 'resolved_points')) {
                $table->json('resolved_points')->nullable()->after('escalated_to');
            }
            if (!Schema::hasColumn('emails_inbox', 'open_points')) {
                $table->json('open_points')->nullable()->after('resolved_points');
            }
            if (!Schema::hasColumn('emails_inbox', 'priority')) {
                $table->enum('priority', ['low', 'normal', 'high', 'urgent'])
                      ->default('normal')->after('open_points');
            }
        });
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE emails_inbox DROP CONSTRAINT IF EXISTS emails_inbox_status_check");
        DB::statement("ALTER TABLE emails_inbox ADD CONSTRAINT emails_inbox_status_check CHECK (status IN ('unread','read','processing','resolved','archived'))");

        Schema::table('emails_inbox', function (Blueprint $table) {
            $table->dropColumn([
                'internal_note', 'follow_up_at', 'escalated_to',
                'resolved_points', 'open_points', 'priority',
            ]);
        });
    }
};
