<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmailHistoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_email' => 'required|string|email|max:255',
            'client_name' => 'nullable|string|max:255',
            'subject' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'sometimes|in:draft,sent,modified',
        ];
    }

    public function messages(): array
    {
        return [
            'client_email.required' => 'L\'email du client est requis.',
            'client_email.email' => 'L\'email du client doit être valide.',
            'subject.required' => 'Le sujet est requis.',
            'content.required' => 'Le contenu est requis.',
        ];
    }
}
