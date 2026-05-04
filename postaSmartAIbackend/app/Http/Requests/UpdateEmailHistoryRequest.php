<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmailHistoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->emailHistory->user_id === $this->user()->id || $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'client_email' => 'sometimes|string|email|max:255',
            'client_name' => 'nullable|string|max:255',
            'subject' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'status' => 'sometimes|in:draft,sent,modified',
        ];
    }

    public function messages(): array
    {
        return [
            'client_email.email' => 'L\'email du client doit être valide.',
        ];
    }
}
