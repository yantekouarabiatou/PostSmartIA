<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('call_reports', 'call_date')) {
            Schema::table('call_reports', function (Blueprint $table) {
                $table->timestamp('call_date')->nullable()->after('client_phone');
            });
        }
    }

    public function down(): void
    {
        Schema::table('call_reports', function (Blueprint $table) {
            $table->dropColumn('call_date');
        });
    }
};
