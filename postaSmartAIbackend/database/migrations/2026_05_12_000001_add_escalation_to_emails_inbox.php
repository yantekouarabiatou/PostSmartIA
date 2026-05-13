<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('emails_inbox', function (Blueprint $table) {
            // FK utilisateur spécifique pour l'escalade (en plus du champ role string existant)
            if (!Schema::hasColumn('emails_inbox', 'escalated_to_user_id')) {
                $table->unsignedBigInteger('escalated_to_user_id')
                      ->nullable()
                      ->after('escalated_to');

                $table->foreign('escalated_to_user_id')
                      ->references('id')
                      ->on('users')
                      ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('emails_inbox', function (Blueprint $table) {
            $table->dropForeign(['escalated_to_user_id']);
            $table->dropColumn('escalated_to_user_id');
        });
    }
};
