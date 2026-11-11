<?php

use App\Models\Document;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

describe('index', function () {
    it('lists documents newest first without their content', function () {
        $older = Document::factory()->create(['created_at' => now()->subDay(), 'updated_at' => now()]);
        $newer = Document::factory()->create(['created_at' => now(), 'updated_at' => now()->subDay()]);

        $response = $this->getJson(route('api.v1.documents.index'));

        $response->assertOk()
            ->assertJsonPath('data.0.id', $newer->id)
            ->assertJsonPath('data.1.id', $older->id)
            ->assertJsonMissingPath('data.0.content');
    });
});

describe('store', function () {
    it('creates a document', function () {
        $response = $this->postJson(route('api.v1.documents.store'), [
            'title' => 'Notes',
            'content' => "# Notes\n\nFirst line.",
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.title', 'Notes')
            ->assertJsonPath('data.content', "# Notes\n\nFirst line.");

        $this->assertDatabaseHas('documents', [
            'title' => 'Notes',
            'content' => "# Notes\n\nFirst line.",
        ]);
    });

    it('stores an empty document when no content is given', function () {
        $response = $this->postJson(route('api.v1.documents.store'), [
            'title' => 'Untitled',
        ]);

        $response->assertCreated()->assertJsonPath('data.content', '');
    });

    it('rejects a document without a title', function () {
        $response = $this->postJson(route('api.v1.documents.store'), [
            'content' => 'Body',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['title' => 'The title field is required.']);

        $this->assertDatabaseCount('documents', 0);
    });
});

describe('show', function () {
    it('returns the document with its markdown content', function () {
        $document = Document::factory()->create(['content' => '**bold**']);

        $response = $this->getJson(route('api.v1.documents.show', $document));

        $response->assertOk()
            ->assertJsonPath('data.id', $document->id)
            ->assertJsonPath('data.content', '**bold**');
    });

    it('returns 404 for a missing document', function () {
        $this->getJson(route('api.v1.documents.show', 999))->assertNotFound();
    });
});

describe('update', function () {
    it('updates the title and content', function () {
        $document = Document::factory()->create();

        $response = $this->patchJson(route('api.v1.documents.update', $document), [
            'title' => 'Renamed',
            'content' => '- item',
        ]);

        $response->assertOk()->assertJsonPath('data.title', 'Renamed');

        expect($document->refresh())
            ->title->toBe('Renamed')
            ->content->toBe('- item');
    });

    it('stores an emptied document as an empty string', function () {
        $document = Document::factory()->create();

        $this->patchJson(route('api.v1.documents.update', $document), [
            'content' => '',
        ])->assertOk();

        expect($document->refresh()->content)->toBe('');
    });

    it('rejects a title longer than 255 characters', function () {
        $document = Document::factory()->create(['title' => 'Original']);

        $response = $this->patchJson(route('api.v1.documents.update', $document), [
            'title' => str_repeat('a', 256),
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['title' => 'The title field must not be greater than 255 characters.']);

        expect($document->refresh()->title)->toBe('Original');
    });
});
