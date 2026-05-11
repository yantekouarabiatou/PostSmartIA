<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        \Log::info('Login attempt', ['email' => $credentials['email']]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user) {
            ActivityLogService::logWithoutAuth('login_failed', "Email inconnu: {$credentials['email']}");
            return response()->json([
                'success' => false,
                'message' => 'Aucun compte trouvé avec cet email.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Ce compte est désactivé. Contactez l\'administrateur.',
            ], 403);
        }

        if (!\Illuminate\Support\Facades\Hash::check($credentials['password'], $user->password)) {
            ActivityLogService::logWithoutAuth('login_failed', "Mot de passe incorrect pour: {$credentials['email']}");
            return response()->json([
                'success' => false,
                'message' => 'Mot de passe incorrect.',
            ], 401);
        }

        // Révoquer anciens tokens
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->update(['last_login_at' => now()]);

        ActivityLogService::logWithoutAuth('login', "Connexion de {$user->full_name} ({$credentials['email']})");

        NotificationService::send(
            $user->id,
            'login',
            'Nouvelle connexion',
            'Connexion depuis ' . $request->ip()
        );

        $permissions = [];
        try {
            $permissions = $user->getAllPermissions()->pluck('name')->toArray();
        } catch (\Exception $e) {}

        return ApiResponse::success([
            'token' => $token,
            'user'  => array_merge($user->fresh()->toArray(), [
                'permissions' => $permissions,
            ]),
        ], 'Connexion réussie');
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'required|email|max:255|unique:users',
            'password'   => 'required|string|min:8|confirmed',
            'role'       => 'required|in:conseiller,manager,admin',
            'equipe'     => 'nullable|string|max:255',
            'avatar'     => 'nullable|url',
        ]);

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name'  => $request->last_name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'role'       => $request->role,
            'equipe'     => $request->equipe,
            'avatar'     => $request->avatar,
            'is_active'  => true,
        ]);

        NotificationService::send(
            $user->id,
            'account_created',
            'Bienvenue sur PostAssist !',
            "Votre compte conseiller a été créé avec succès. Bienvenue dans l'équipe, {$user->first_name} !"
        );

        return ApiResponse::success($user, 'Utilisateur créé avec succès', 201);
    }

    public function user(Request $request): JsonResponse
    {
        return ApiResponse::success($request->user(), 'Utilisateur récupéré avec succès');
    }

    public function logout(Request $request): JsonResponse
    {
        ActivityLogService::log('logout', "Déconnexion de {$request->user()->full_name}");
        $request->user()->currentAccessToken()->delete();

        return ApiResponse::success(null, 'Déconnexion réussie');
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name'  => 'sometimes|string|max:255',
            'avatar'     => 'nullable|url',
            'password'   => 'nullable|string|min:8|confirmed',
        ]);

        $user = $request->user();
        $data = $request->only(['first_name', 'last_name', 'avatar']);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);
        ActivityLogService::log('update', "Mise à jour du profil de {$user->full_name}", User::class, $user->id);

        return ApiResponse::success($user->fresh(), 'Profil mis à jour avec succès');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return ApiResponse::success(null, 'Lien de réinitialisation envoyé par email.');
        }

        return ApiResponse::error(null, 'Impossible d\'envoyer le lien. Vérifiez l\'adresse email.', 400);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'                 => 'required',
            'email'                 => 'required|email',
            'password'              => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required',
        ]);

        $status = Password::reset($request->only('email', 'password', 'password_confirmation', 'token'), function (User $user, string $password) {
            $user->forceFill(['password' => Hash::make($password)])->save();
            $user->tokens()->delete();
        });

        if ($status === Password::PASSWORD_RESET) {
            return ApiResponse::success(null, 'Mot de passe réinitialisé avec succès.');
        }

        return ApiResponse::error(['token' => ['Token invalide ou expiré.']], 'Erreur de réinitialisation', 400);
    }
}
