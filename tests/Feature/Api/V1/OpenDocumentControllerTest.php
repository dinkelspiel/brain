<?php

use App\Models\Document;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

describe('index', function () {
    it('lists the documents the user opened, in the order they were opened, without content', function () {
        [$first, $second, $notOpen] = Document::factory()->count(3)->create();
        $this->user->openDocuments()->attach($second);
        $this->user->openDocuments()->attach($first);
        User::factory()->create()->openDocuments()->attach($notOpen);

        $response = $this->getJson(route('api.v1.open-documents.index'));

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $second->id)
            ->assertJsonPath('data.1.id', $first->id)
            ->assertJsonMissingPath('data.0.content');
    });
});

describe('store', function () {
    it('opens a document and returns all open documents', function () {
        $open = Document::factory()->create();
        $new = Document::factory()->create(['title' => 'A rather long title']);
        $this->user->openDocuments()->attach($open);

        $response = $this->postJson(route('api.v1.open-documents.store'), [
            'document_id' => $new->id,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.0.id', $open->id)
            ->assertJsonPath('data.1.id', $new->id)
            ->assertJsonPath('data.1.title', 'A rather long title');
    });

    it('keeps a document open only once', function () {
        $document = Document::factory()->create();

        $this->postJson(route('api.v1.open-documents.store'), ['document_id' => $document->id])->assertOk();
        $this->postJson(route('api.v1.open-documents.store'), ['document_id' => $document->id])
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertDatabaseCount('open_documents', 1);
    });

    it('rejects a missing document', function () {
        $this->postJson(route('api.v1.open-documents.store'), ['document_id' => 999])
            ->assertUnprocessable()
            ->assertJsonValidationErrorFor('document_id');

        $this->assertDatabaseCount('open_documents', 0);
    });
});

describe('destroy', function () {
    it('closes the document only for the user', function () {
        $document = Document::factory()->create();
        $other = User::factory()->create();
        $this->user->openDocuments()->attach($document);
        $other->openDocuments()->attach($document);

        $this->deleteJson(route('api.v1.open-documents.destroy', $document))->assertNoContent();

        expect($this->user->openDocuments()->exists())->toBeFalse()
            ->and($other->openDocuments()->exists())->toBeTrue();
    });
});
