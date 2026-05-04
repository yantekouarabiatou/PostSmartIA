<?php

namespace Database\Factories;

use App\Models\KnowledgeBase;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\KnowledgeBase>
 */
class KnowledgeBaseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence,
            'description' => fake()->paragraph,
            'type' => fake()->randomElement(['procedure', 'offre', 'cgv', 'reglementation']),
            'content' => fake()->paragraphs(5, true),
            'file_path' => null,
            'tags' => [fake()->word, fake()->word],
            'is_active' => true,
            'created_by' => User::factory(),
        ];
    }

    /**
     * Create a procedure
     */
    public function procedure(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'procedure',
            'title' => 'Procédure: ' . fake()->sentence,
        ]);
    }

    /**
     * Create an offer
     */
    public function offre(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'offre',
            'title' => 'Offre: ' . fake()->sentence,
        ]);
    }

    /**
     * Create CGV
     */
    public function cgv(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'cgv',
            'title' => 'CGV: ' . fake()->sentence,
        ]);
    }

    /**
     * Create regulation
     */
    public function reglementation(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'reglementation',
            'title' => 'Réglementation: ' . fake()->sentence,
        ]);
    }

    /**
     * Create an inactive item
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
