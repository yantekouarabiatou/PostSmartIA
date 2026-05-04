<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\ApiResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display a listing of users (admin only)
     */
    public function index(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return ApiResponse::forbidden('Only admins can access this resource');
        }

        $query = User::query();

        // Filter by role
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        $users = $query
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return ApiResponse::success($users, 'Users retrieved successfully', 200);
    }

    /**
     * Store a newly created user (admin only)
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'avatar' => $request->avatar,
        ]);

        return ApiResponse::success($user, 'User created successfully', 201);
    }

    /**
     * Display the specified user
     */
    public function show(User $user, Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin() && $request->user()->id !== $user->id) {
            return ApiResponse::forbidden('You cannot access this user');
        }

        return ApiResponse::success($user, 'User retrieved successfully', 200);
    }

    /**
     * Update the specified user
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        // Hash password if provided
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return ApiResponse::success($user, 'User updated successfully', 200);
    }

    /**
     * Delete the specified user (admin only)
     */
    public function destroy(User $user, Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return ApiResponse::forbidden('Only admins can delete users');
        }

        if ($request->user()->id === $user->id) {
            return ApiResponse::error(null, 'You cannot delete your own account', 400);
        }

        $user->delete();

        return ApiResponse::success(null, 'User deleted successfully', 200);
    }
}
