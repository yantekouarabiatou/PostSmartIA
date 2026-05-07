<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\User;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionController extends Controller
{
    public function index()
    {
        return ApiResponse::success([
            'roles'       => Role::with('permissions')->get(),
            'permissions' => Permission::orderBy('name')->get(),
            'users'       => User::with('roles', 'permissions')->get(['id', 'first_name', 'last_name', 'email', 'role']),
        ]);
    }

    public function assignRole(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'role'    => 'required|exists:roles,name',
        ]);

        $user = User::findOrFail($request->user_id);
        $user->syncRoles([$request->role]);

        return ApiResponse::success(null, 'Rôle assigné avec succès.');
    }

    public function assignPermission(Request $request)
    {
        $request->validate([
            'user_id'    => 'required|exists:users,id',
            'permission' => 'required|exists:permissions,name',
        ]);

        $user = User::findOrFail($request->user_id);
        $user->givePermissionTo($request->permission);

        return ApiResponse::success(null, 'Permission accordée avec succès.');
    }

    public function revokePermission(Request $request)
    {
        $request->validate([
            'user_id'    => 'required|exists:users,id',
            'permission' => 'required|exists:permissions,name',
        ]);

        $user = User::findOrFail($request->user_id);
        $user->revokePermissionTo($request->permission);

        return ApiResponse::success(null, 'Permission révoquée avec succès.');
    }
}
