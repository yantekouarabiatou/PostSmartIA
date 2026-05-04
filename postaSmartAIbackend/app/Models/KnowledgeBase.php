<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class KnowledgeBase extends Model
{
    /** @use HasFactory<\Database\Factories\KnowledgeBaseFactory> */
    use HasFactory, SoftDeletes;

    protected $table = 'knowledge_base_items';

    protected $fillable = [
        'title',
        'description',
        'type',
        'content',
        'file_path',
        'tags',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'json',
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Get the user who created this knowledge base item
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope to get only active items
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to search by title or description
     */
    public function scopeSearch($query, $search)
    {
        return $query->where('title', 'like', "%{$search}%")
                     ->orWhere('description', 'like', "%{$search}%");
    }

    /**
     * Scope to filter by tags
     */
    public function scopeByTag($query, $tag)
    {
        return $query->where('tags', 'like', "%{$tag}%");
    }

    /**
     * Get type label
     */
    public function getTypeLabelAttribute(): string
    {
        return match($this->type) {
            'procedure' => 'Procédure',
            'offre' => 'Offre',
            'cgv' => 'CGV',
            'reglementation' => 'Réglementation',
            default => $this->type,
        };
    }
}
