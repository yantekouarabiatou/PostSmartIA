<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreKnowledgeBaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin() || $this->user()->isManager();
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'type' => ['required', Rule::in(['procedure', 'offre', 'cgv', 'reglementation'])],
            'content' => 'required|string',
            'file_path' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'is_active' => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Le titre est requis.',
            'description.required' => 'La description est requise.',
            'type.required' => 'Le type est requis.',
            'content.required' => 'Le contenu est requis.',
        ];
    }
}
