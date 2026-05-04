<?php

namespace Database\Seeders;

use App\Models\KnowledgeBase;
use App\Models\User;
use Illuminate\Database\Seeder;

class KnowledgeBaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();

        if (!$admin) {
            $admin = User::first();
        }

        // Create 3 procedures
        KnowledgeBase::factory(3)->procedure()->for($admin, 'creator')->create();

        // Create 3 offers
        KnowledgeBase::factory(3)->offre()->for($admin, 'creator')->create();

        // Create 2 CGV
        KnowledgeBase::factory(2)->cgv()->for($admin, 'creator')->create();

        // Create 2 regulations
        KnowledgeBase::factory(2)->reglementation()->for($admin, 'creator')->create();
    }
}
