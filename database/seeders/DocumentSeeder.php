<?php

namespace Database\Seeders;

use App\Models\Document;
use Illuminate\Database\Seeder;

class DocumentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Document::factory()->create([
            'title' => 'Welcome',
            'content' => <<<'MARKDOWN'
                # Welcome

                This is a **markdown** document. Click anywhere in the text to edit it.

                ## Formatting

                - Type `#` and a space to start a heading
                - Type `-` and a space to start a list
                - Wrap text in backticks for `inline code`

                > Documents are stored as markdown.
                MARKDOWN,
        ]);
    }
}
