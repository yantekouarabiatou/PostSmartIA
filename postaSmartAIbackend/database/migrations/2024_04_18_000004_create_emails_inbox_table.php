<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emails_inbox', function (Blueprint $table) {
            $table->id();
            $table->string('message_id')->unique();
            $table->string('from_name')->nullable();
            $table->string('from_email');
            $table->string('subject');
            $table->longText('body_text')->nullable();
            $table->longText('body_html')->nullable();
            $table->timestamp('received_at');
            $table->boolean('is_read')->default(false);
            $table->boolean('is_processed')->default(false);
            $table->timestamp('processed_at')->nullable();
            $table->text('ai_response')->nullable();
            $table->string('ai_service_type')->nullable();
            $table->integer('ai_quality_score')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emails_inbox');
    }
};
