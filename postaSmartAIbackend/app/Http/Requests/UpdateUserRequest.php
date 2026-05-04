<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin() || $this->user()->id === (int) $this->route('user');
    }

    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => [
                'sometimes',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($userId),
            ],
            'password' => 'sometimes|string|min:8|confirmed',
            'role' => ['sometimes', Rule::in(['conseiller', 'manager', 'admin'])],
            'avatar' => 'nullable|url',
        ];
    }
}
