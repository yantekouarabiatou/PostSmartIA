<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class KnowledgeBase extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'knowledge_base_items';

    /**
     * Types disponibles.
     * 'charte' → règles relationnelles La Poste, injectées automatiquement dans les prompts IA.
     */
    public const TYPES = ['procedure', 'offre', 'cgv', 'reglementation', 'charte'];

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
            'tags'       => 'json',
            'is_active'  => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where('title', 'like', "%{$search}%")
                     ->orWhere('description', 'like', "%{$search}%");
    }

    public function scopeByTag($query, string $tag)
    {
        return $query->where('tags', 'like', "%{$tag}%");
    }

    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            'procedure'      => 'Procédure',
            'offre'          => 'Offre',
            'cgv'            => 'CGV',
            'reglementation' => 'Réglementation',
            'charte'         => 'Charte relationnelle',
            default          => $this->type,
        };
    }
}
