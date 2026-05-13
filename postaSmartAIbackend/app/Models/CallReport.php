<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CallReport extends Model
{
    use HasFactory;

    protected $table = 'call_reports';

    protected $fillable = [
        'user_id',
        'email_inbox_id',
        'report_type',
        'client_name',
        'client_email',
        'client_phone',
        'call_date',
        'demand_type',
        'call_summary',
        'commitments',
        'next_steps',
        'urgency',
        'call_duration',
        'ai_response',
        'validated_response',
        'ai_quality_score',
        'validated_at',
        'status',
        'structured_data',
        'internal_status',
        'visible_to_manager',
    ];

    protected function casts(): array
    {
        return [
            'ai_quality_score'  => 'array',
            'structured_data'   => 'array',
            'validated_at'      => 'datetime',
            'call_date'         => 'datetime',
            'visible_to_manager'=> 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function emailInbox(): BelongsTo
    {
        return $this->belongsTo(EmailInbox::class, 'email_inbox_id');
    }
}
