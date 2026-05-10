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
        'client_name',
        'client_email',
        'client_phone',
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
    ];

    protected function casts(): array
    {
        return [
            'ai_quality_score' => 'array',
            'validated_at'     => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
