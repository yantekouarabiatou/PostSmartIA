<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_users()
    {
        $admin = User::factory()->admin()->create();
        $token = $admin->createToken('api_token')->plainTextToken;

        User::factory(5)->create();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/users');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_non_admin_cannot_list_users()
    {
        $user = User::factory()->create();
        $token = $user->createToken('api_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/users');

        $response->assertStatus(403);
    }

    public function test_admin_can_create_user()
    {
        $admin = User::factory()->admin()->create();
        $token = $admin->createToken('api_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/users', [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'role' => 'conseiller',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'role' => 'conseiller',
        ]);
    }

    public function test_admin_can_update_user()
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();
        $token = $admin->createToken('api_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/users/{$user->id}", [
                'role' => 'manager',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'manager',
        ]);
    }

    public function test_admin_can_delete_user()
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();
        $token = $admin->createToken('api_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/users/{$user->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertSoftDeleted($user);
    }

    public function test_admin_cannot_delete_own_account()
    {
        $admin = User::factory()->admin()->create();
        $token = $admin->createToken('api_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/users/{$admin->id}");

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
            ]);
    }
}
