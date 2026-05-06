<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(['email' => 'admin@laposte.fr'], [
            'first_name' => 'Admin',
            'last_name'  => 'Système',
            'password'   => Hash::make('Admin@2024!'),
            'role'       => 'admin',
            'equipe'     => 'Direction',
            'is_active'  => true,
        ]);

        User::firstOrCreate(['email' => 'manager@laposte.fr'], [
            'first_name' => 'Sophie',
            'last_name'  => 'Dupont',
            'password'   => Hash::make('Manager@2024!'),
            'role'       => 'manager',
            'equipe'     => 'Équipe A',
            'is_active'  => true,
        ]);

        $conseillers = [
            ['first_name' => 'Jean',   'last_name' => 'Martin',  'email' => 'jean.martin@laposte.fr',   'equipe' => 'Équipe A'],
            ['first_name' => 'Marie',  'last_name' => 'Bernard', 'email' => 'marie.bernard@laposte.fr', 'equipe' => 'Équipe A'],
            ['first_name' => 'Pierre', 'last_name' => 'Leroy',   'email' => 'pierre.leroy@laposte.fr',  'equipe' => 'Équipe B'],
        ];

        foreach ($conseillers as $data) {
            User::firstOrCreate(['email' => $data['email']], array_merge($data, [
                'password'  => Hash::make('Conseiller@2024!'),
                'role'      => 'conseiller',
                'is_active' => true,
            ]));
        }
    }
}
