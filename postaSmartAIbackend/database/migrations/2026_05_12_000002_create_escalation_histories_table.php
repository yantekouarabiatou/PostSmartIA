<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('escalation_histories', function (Blueprint $table) {
            $table->id();

            $table->foreignId('email_id')
                  ->constrained('emails_inbox')
                  ->cascadeOnDelete();

            $table->foreignId('escalated_by')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->unsignedBigInteger('escalated_to_user_id')->nullable();
            $table->foreign('escalated_to_user_id')->references('id')->on('users')->nullOnDelete();

            $table->string('escalated_to_role')->nullable();     // 'manager', 'specialiste', etc.
            $table->text('reason')->nullable();
            $table->enum('urgency_level', ['immediate', 'high', 'normal'])->default('normal');
            $table->json('signals_detected')->nullable();        // tableau des signaux IA

            // Accusé de réception
            $table->timestamp('acknowledged_at')->nullable();
            $table->unsignedBigInteger('acknowledged_by')->nullable();
            $table->foreign('acknowledged_by')->references('id')->on('users')->nullOnDelete();

            // SLA — horodatage de la notification manager si non acquitté sous 2h
            $table->timestamp('sla_notified_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('escalation_histories');
    }
};
