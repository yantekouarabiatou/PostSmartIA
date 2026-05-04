<?php

namespace Tests\Feature;

use App\Models\EmailHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmailHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_email_history()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/email-histories', [
                'client_email' => 'client@example.com',
                'client_name' => 'Client Name',
                'subject' => 'Test Email',
                'content' => 'This is a test email content',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Email history created successfully',
            ]);

        $this->assertDatabaseHas('email_histories', [
            'user_id' => $user->id,
            'client_email' => 'client@example.com',
        ]);
    }

    public function test_user_can_retrieve_own_emails()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api_token')->plainTextToken;

        EmailHistory::factory(5)->for($user)->create();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/email-histories');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertCount(5, $response->json('data.data'));
    }

    public function test_user_can_filter_emails_by_status()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api_token')->plainTextToken;

        EmailHistory::factory(3)->sent()->for($user)->create();
        EmailHistory::factory(2)->draft()->for($user)->create();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/email-histories?status=sent');

        $response->assertStatus(200);

        $this->assertCount(3, $response->json('data.data'));
    }

    public function test_user_can_generate_email()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/email-histories/generate', [
                'notes' => 'Customer needs assistance with account',
                'client_email' => 'client@example.com',
                'client_name' => 'John Doe',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Email generated successfully',
            ]);

        $this->assertDatabaseHas('email_histories', [
            'user_id' => $user->id,
            'client_email' => 'client@example.com',
            'status' => 'draft',
        ]);
    }

    public function test_user_can_update_own_email()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api_token')->plainTextToken;
        $email = EmailHistory::factory()->for($user)->create();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/email-histories/{$email->id}", [
                'subject' => 'Updated Subject',
                'status' => 'modified',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('email_histories', [
            'id' => $email->id,
            'subject' => 'Updated Subject',
            'status' => 'modified',
        ]);
    }

    public function test_user_cannot_update_other_users_email()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $token = $user2->createToken('api_token')->plainTextToken;
        $email = EmailHistory::factory()->for($user1)->create();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/email-histories/{$email->id}", [
                'subject' => 'Updated Subject',
            ]);

        $response->assertStatus(403);
    }
}
