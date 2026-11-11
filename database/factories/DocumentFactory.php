<?php

namespace Database\Factories;

use App\Models\Document;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Document>
 */
class DocumentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = rtrim(fake()->sentence(3), '.');

        return [
            'title' => $title,
            'content' => "# {$title}\n\n".fake()->paragraph(4)."\n\n".fake()->paragraph(4)."\n\n".fake()->paragraph(4),
        ];
    }
}
