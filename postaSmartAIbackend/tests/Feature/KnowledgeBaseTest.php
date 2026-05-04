<?php

namespace Tests\Feature;

use App\Models\KnowledgeBase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KnowledgeBaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_anyone_can_list_knowledge_base_items()
    {
        $admin = User::factory()->admin()->create();
        KnowledgeBase::factory(5)->for($admin, 'creator')->create();

        $response = $this->getJson('/api/knowledge-base');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_manager_can_create_knowledge_base_item()
    {
        $manager = User::factory()->manager()->create();
        $token = $manager->createToken('api_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/knowledge-base', [
                'title' => 'New Procedure',
                'description' => 'This is a new procedure',
                'type' => 'procedure',
                'content' => 'Detailed procedure content here',
                'tags' => ['procedure', 'urgent'],
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('knowledge_base_items', [
            'title' => 'New Procedure',
            'type' => 'procedure',
        ]);
    }

    public function test_user_cannot_create_knowledge_base_item()
    {
        $user = User::factory()->conseiller()->create();
        $token = $user->createToken('api_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/knowledge-base', [
                'title' => 'New Procedure',
                'description' => 'This is a new procedure',
                'type' => 'procedure',
                'content' => 'Detailed procedure content here',
            ]);

        $response->assertStatus(403);
    }

    public function test_knowledge_base_can_be_searched()
    {
        $admin = User::factory()->admin()->create();
        KnowledgeBase::factory()->procedure()->for($admin, 'creator')->create([
            'title' => 'Important Procedure',
        ]);
        KnowledgeBase::factory()->offre()->for($admin, 'creator')->create([
            'title' => 'Special Offer',
        ]);

        $response = $this->getJson('/api/knowledge-base?search=Important');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.data'));
        $this->assertEquals('Important Procedure', $response->json('data.data.0.title'));
    }

    public function test_knowledge_base_can_be_filtered_by_type()
    {
        $admin = User::factory()->admin()->create();
        KnowledgeBase::factory(3)->procedure()->for($admin, 'creator')->create();
        KnowledgeBase::factory(2)->offre()->for($admin, 'creator')->create();

        $response = $this->getJson('/api/knowledge-base?type=procedure');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data.data'));
    }
}
