<?php

namespace Database\Factories;

use App\Models\EmailHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EmailHistory>
 */
class EmailHistoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'client_email' => fake()->safeEmail(),
            'client_name' => fake()->firstName() . ' ' . fake()->lastName(),
            'subject' => fake()->sentence,
            'content' => fake()->paragraphs(3, true),
            'status' => fake()->randomElement(['draft', 'sent', 'modified']),
        ];
    }

    /**
     * Create a draft email
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
        ]);
    }

    /**
     * Create a sent email
     */
    public function sent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'sent',
        ]);
    }

    /**
     * Create a modified email
     */
    public function modified(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'modified',
        ]);
    }
}
