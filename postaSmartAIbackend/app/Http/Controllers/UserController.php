<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q
                ->where('first_name', 'like', "%{$s}%")
                ->orWhere('last_name', 'like', "%{$s}%")
                ->orWhere('email', 'like', "%{$s}%")
            );
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 20));

        return ApiResponse::success($users, 'Utilisateurs récupérés avec succès');
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'required|email|unique:users',
            'password'   => 'required|string|min:8',
            'role'       => 'required|in:conseiller,manager,admin',
            'equipe'     => 'nullable|string|max:255',
            'is_active'  => 'boolean',
            'avatar'     => 'nullable|url',
        ]);

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name'  => $request->last_name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'role'       => $request->role,
            'equipe'     => $request->equipe,
            'is_active'  => $request->boolean('is_active', true),
            'avatar'     => $request->avatar,
        ]);

        NotificationService::send(
            $user->id,
            'account_created',
            'Bienvenue sur PostAssist !',
            "Votre compte a été créé. Bienvenue, {$user->first_name} !"
        );

        return ApiResponse::success($user, 'Utilisateur créé avec succès', 201);
    }

    public function show(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return ApiResponse::notFound('Utilisateur introuvable');
        }

        return ApiResponse::success($user, 'Utilisateur récupéré avec succès');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return ApiResponse::notFound('Utilisateur introuvable');
        }

        $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name'  => 'sometimes|string|max:255',
            'email'      => "sometimes|email|unique:users,email,{$id}",
            'role'       => 'sometimes|in:conseiller,manager,admin',
            'equipe'     => 'nullable|string|max:255',
            'is_active'  => 'sometimes|boolean',
            'avatar'     => 'nullable|url',
            'password'   => 'nullable|string|min:8',
        ]);

        $data = $request->only(['first_name', 'last_name', 'email', 'role', 'equipe', 'is_active', 'avatar']);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return ApiResponse::success($user->fresh(), 'Utilisateur mis à jour avec succès');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return ApiResponse::notFound('Utilisateur introuvable');
        }

        if ($user->id === $request->user()->id) {
            return ApiResponse::error(null, 'Vous ne pouvez pas supprimer votre propre compte.', 403);
        }

        $name = $user->full_name;
        $user->delete();

        ActivityLogService::log('delete', "Suppression de l'utilisateur: {$name}", User::class, $id);

        return ApiResponse::success(null, 'Utilisateur supprimé avec succès');
    }

    public function toggleActive(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return ApiResponse::notFound('Utilisateur introuvable');
        }

        $user->update(['is_active' => !$user->is_active]);
        $status = $user->is_active ? 'activé' : 'désactivé';

        ActivityLogService::log('update', "Compte {$status}: {$user->full_name}", User::class, $id);

        return ApiResponse::success($user->fresh(), "Compte {$status} avec succès");
    }
}
