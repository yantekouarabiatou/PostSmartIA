<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EscalationHistory extends Model
{
    protected $table = 'escalation_histories';

    protected $fillable = [
        'email_id',
        'escalated_by',
        'escalated_to_user_id',
        'escalated_to_role',
        'reason',
        'urgency_level',
        'signals_detected',
        'acknowledged_at',
        'acknowledged_by',
        'sla_notified_at',
    ];

    protected function casts(): array
    {
        return [
            'signals_detected' => 'array',
            'acknowledged_at'  => 'datetime',
            'sla_notified_at'  => 'datetime',
        ];
    }

    public function email(): BelongsTo
    {
        return $this->belongsTo(EmailInbox::class, 'email_id');
    }

    public function escalatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'escalated_by');
    }

    public function escalatedToUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'escalated_to_user_id');
    }

    public function acknowledgedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }

    public function isAcknowledged(): bool
    {
        return $this->acknowledged_at !== null;
    }

    /**
     * Escalades non acquittées depuis plus de $hours heures.
     */
    public function scopeOverdueSla($query, int $hours = 2)
    {
        return $query
            ->whereNull('acknowledged_at')
            ->where('created_at', '<=', now()->subHours($hours))
            ->whereNull('sla_notified_at');
    }
}
