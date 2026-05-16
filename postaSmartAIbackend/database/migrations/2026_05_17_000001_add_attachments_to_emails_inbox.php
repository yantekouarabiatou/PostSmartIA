<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('emails_inbox', function (Blueprint $table) {
            $table->json('attachments')->nullable()->after('body_html');
        });
    }

    public function down(): void
    {
        Schema::table('emails_inbox', function (Blueprint $table) {
            $table->dropColumn('attachments');
        });
    }
};
