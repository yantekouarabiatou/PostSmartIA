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
        Schema::create('call_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('client_name');
            $table->string('client_email')->nullable();
            $table->string('client_phone')->nullable();
            $table->string('demand_type');
            $table->text('call_summary');
            $table->text('commitments')->nullable();
            $table->text('next_steps')->nullable();
            $table->enum('urgency', ['faible', 'normale', 'haute'])->default('normale');
            $table->integer('call_duration')->nullable();
            $table->text('ai_response')->nullable();
            $table->text('validated_response')->nullable();
            $table->json('ai_quality_score')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->enum('status', ['draft', 'validated', 'archived'])->default('draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('call_reports');
    }
};
