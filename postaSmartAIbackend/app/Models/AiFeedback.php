<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiFeedback extends Model
{
    protected $table = 'ai_feedbacks';

    protected $fillable = [
        'email_inbox_id',
        'user_id',
        'rating',
        'rejection_tags',
        'correction',
        'original_response',
    ];

    protected function casts(): array
    {
        return [
            'rejection_tags' => 'array',
        ];
    }

    public function email(): BelongsTo
    {
        return $this->belongsTo(EmailInbox::class, 'email_inbox_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
