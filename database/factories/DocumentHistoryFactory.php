<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\DocumentHistory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentHistory>
 */
class DocumentHistoryFactory extends Factory
{
    /**
     * Define the model's default state, a keyframe.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'document_id' => Document::factory(),
            'title' => rtrim(fake()->sentence(3), '.'),
            'content' => fake()->paragraph(),
            'diff' => null,
        ];
    }
}
