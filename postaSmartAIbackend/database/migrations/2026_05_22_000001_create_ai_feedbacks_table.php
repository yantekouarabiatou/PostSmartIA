<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('email_inbox_id');
            $table->unsignedBigInteger('user_id');
            $table->enum('rating', ['positive', 'negative']);
            $table->json('rejection_tags')->nullable();
            $table->text('correction')->nullable();
            $table->text('original_response')->nullable();
            $table->timestamps();

            $table->foreign('email_inbox_id')->references('id')->on('emails_inbox')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['email_inbox_id', 'user_id']); // un feedback par conseiller par mail
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_feedbacks');
    }
};
