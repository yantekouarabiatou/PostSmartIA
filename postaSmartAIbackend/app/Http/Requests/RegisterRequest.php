<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only admins can create users
        return $this->user() && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => ['required', new Enum(\App\Enums\UserRole::class)],
            'avatar' => 'nullable|url',
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'Le prénom est requis.',
            'last_name.required' => 'Le nom est requis.',
            'email.required' => 'L\'adresse email est requise.',
            'email.unique' => 'Cette adresse email est déjà utilisée.',
            'password.required' => 'Le mot de passe est requis.',
            'password.confirmed' => 'Les mots de passe ne correspondent pas.',
            'role.required' => 'Le rôle est requis.',
        ];
    }
}
