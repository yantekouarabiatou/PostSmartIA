<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::factory()->admin()->create([
            'first_name' => 'Admin',
            'last_name' => 'PostSmartAI',
            'email' => 'admin@postsmartai.com',
            'password' => Hash::make('password'),
        ]);

        // Create managers
        User::factory(2)->manager()->create();

        // Create conseillers
        User::factory(10)->conseiller()->create();
    }
}
