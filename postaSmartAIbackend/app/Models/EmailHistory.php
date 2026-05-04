<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmailHistory extends Model
{
    /** @use HasFactory<\Database\Factories\EmailHistoryFactory> */
    use HasFactory, SoftDeletes;

    protected $table = 'email_histories';

    protected $fillable = [
        'user_id',
        'client_email',
        'client_name',
        'subject',
        'content',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Get the user who created this email history
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to filter by date range
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope to filter by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter by client email
     */
    public function scopeByClientEmail($query, $email)
    {
        return $query->where('client_email', $email);
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'draft' => 'Brouillon',
            'sent' => 'Envoyé',
            'modified' => 'Modifié',
            default => $this->status,
        };
    }
}
