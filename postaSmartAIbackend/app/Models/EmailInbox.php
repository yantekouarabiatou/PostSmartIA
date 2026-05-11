<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailInbox extends Model
{
    protected $table = 'emails_inbox';

    protected $fillable = [
        'message_id', 'from_name', 'from_email', 'subject',
        'body_text', 'body_html', 'received_at',
        'is_read', 'is_processed', 'processed_at',
        'ai_response', 'ai_service_type', 'ai_quality_score',
        'ai_quality_score_json', 'status',
        'validated_response', 'validated_at', 'validated_by',
        'archived_at', 'source',
        'internal_note', 'follow_up_at', 'escalated_to',
        'resolved_points', 'open_points', 'priority',
    ];

    protected $appends = ['is_follow_up_overdue'];

    protected function casts(): array
    {
        return [
            'received_at'        => 'datetime',
            'processed_at'       => 'datetime',
            'validated_at'       => 'datetime',
            'archived_at'        => 'datetime',
            'follow_up_at'       => 'datetime',
            'is_read'            => 'boolean',
            'is_processed'       => 'boolean',
            'ai_quality_score_json' => 'array',
            'resolved_points'    => 'array',
            'open_points'        => 'array',
        ];
    }

    public function getIsFollowUpOverdueAttribute(): bool
    {
        return $this->follow_up_at !== null && $this->follow_up_at->isPast();
    }
}
