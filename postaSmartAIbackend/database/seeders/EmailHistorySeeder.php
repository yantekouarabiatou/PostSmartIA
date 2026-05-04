<?php

namespace Database\Seeders;

use App\Models\EmailHistory;
use App\Models\User;
use Illuminate\Database\Seeder;

class EmailHistorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all conseillers
        $conseillers = User::where('role', 'conseiller')->get();

        // For each conseiller, create 5-15 emails
        foreach ($conseillers as $conseiller) {
            $count = fake()->numberBetween(5, 15);
            EmailHistory::factory($count)
                ->for($conseiller, 'user')
                ->create();
        }
    }
}
