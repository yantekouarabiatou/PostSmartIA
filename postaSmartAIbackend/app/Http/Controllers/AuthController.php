<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\ApiResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Login user
     */
    public function login(LoginRequest $request): JsonResponse
    {
        if (!Auth::attempt($request->validated())) {
            return ApiResponse::error(
                ['email' => 'Invalid credentials'],
                'Authentication failed',
                401
            );
        }

        $user = Auth::user();
        $token = $user->createToken('api_token')->plainTextToken;

        return ApiResponse::success([
            'user' => $user,
            'token' => $token,
        ], 'Login successful', 200);
    }

    /**
     * Register new user (admin only)
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'avatar' => $request->avatar,
        ]);

        return ApiResponse::success($user, 'User registered successfully', 201);
    }

    /**
     * Get authenticated user
     */
    public function user(Request $request): JsonResponse
    {
        return ApiResponse::success($request->user(), 'User retrieved successfully', 200);
    }

    /**
     * Logout user
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return ApiResponse::success(null, 'Logged out successfully', 200);
    }
}
