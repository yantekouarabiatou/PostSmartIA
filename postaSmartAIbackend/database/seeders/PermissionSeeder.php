<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Mails
            'view emails', 'process emails', 'delete emails',
            // Appels
            'create call reports', 'view call reports',
            // Utilisateurs
            'view users', 'create users', 'edit users', 'delete users',
            // Permissions
            'manage permissions', 'view logs',
            // Chatbot
            'use chatbot',
            // Dashboard
            'view dashboard', 'view analytics',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        $conseiller = Role::firstOrCreate(['name' => 'conseiller']);
        $conseiller->syncPermissions([
            'view emails', 'process emails',
            'create call reports', 'view call reports',
            'use chatbot', 'view dashboard',
        ]);

        $manager = Role::firstOrCreate(['name' => 'manager']);
        $manager->syncPermissions([
            'view emails', 'process emails', 'delete emails',
            'create call reports', 'view call reports',
            'view users', 'create users', 'edit users',
            'use chatbot', 'view dashboard', 'view analytics',
        ]);

        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions(Permission::all());

        \App\Models\User::all()->each(function ($user) {
            if (!$user->hasAnyRole(['conseiller', 'manager', 'admin'])) {
                $user->assignRole($user->role ?? 'conseiller');
            }
        });
    }
}
