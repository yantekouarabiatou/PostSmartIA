<?php

namespace Tests\Feature;

use App\Models\EmailHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_get_dashboard_stats()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api_token')->plainTextToken;

        // Create emails for today
        EmailHistory::factory(3)->for($user)->create();

        // Create emails for previous days
        EmailHistory::factory(5)->for($user)->create([
            'created_at' => now()->subDays(10),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/dashboard/stats');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'emails_today' => 3,
                    'total_emails' => 8,
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'emails_today',
                    'emails_this_week',
                    'emails_this_month',
                    'total_emails',
                    'top_clients',
                    'status_stats',
                ],
            ]);
    }

    public function test_admin_sees_all_stats()
    {
        $admin = User::factory()->admin()->create();
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token = $admin->createToken('api_token')->plainTextToken;

        EmailHistory::factory(5)->for($user1)->create();
        EmailHistory::factory(7)->for($user2)->create();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/dashboard/stats');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'total_emails' => 12,
                ],
            ]);
    }
}
