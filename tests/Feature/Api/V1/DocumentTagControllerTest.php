<?php

use App\Models\Document;
use App\Models\Tag;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
    $this->document = Document::factory()->create();
});

describe('index', function () {
    it('lists the tags of the document in tree order', function () {
        $work = Tag::factory()->create(['name' => 'work']);
        $meetings = Tag::factory()->for($work, 'parent')->create(['name' => 'meetings']);
        $home = Tag::factory()->create(['name' => 'home']);
        Tag::factory()->create(['name' => 'unused']);
        $this->document->tags()->attach([$meetings->id, $home->id, $work->id]);
        Document::factory()->create()->tags()->attach(Tag::factory()->create());

        $this->getJson(route('api.v1.documents.tags.index', $this->document))
            ->assertOk()
            ->assertJsonPath('data.*.path', ['home', 'work', 'work/meetings']);
    });
});

describe('store', function () {
    it('tags the document and returns all its tags', function () {
        $home = Tag::factory()->create(['name' => 'home']);
        $work = Tag::factory()->create(['name' => 'work']);
        $this->document->tags()->attach($work);

        $this->postJson(route('api.v1.documents.tags.store', $this->document), ['tag_id' => $home->id])
            ->assertOk()
            ->assertJsonPath('data.*.path', ['home', 'work']);
    });

    it('tags a document only once', function () {
        $tag = Tag::factory()->create();

        $this->postJson(route('api.v1.documents.tags.store', $this->document), ['tag_id' => $tag->id])->assertOk();
        $this->postJson(route('api.v1.documents.tags.store', $this->document), ['tag_id' => $tag->id])
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertDatabaseCount('document_tag', 1);
    });

    it('rejects an invalid tag', function (array $payload) {
        $this->postJson(route('api.v1.documents.tags.store', $this->document), $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrorFor('tag_id');

        $this->assertDatabaseCount('document_tag', 0);
    })->with([
        'missing' => [[]],
        'unknown' => [['tag_id' => 999]],
    ]);

    it('returns not found for a missing document', function () {
        $this->postJson(route('api.v1.documents.tags.store', 999), ['tag_id' => Tag::factory()->create()->id])
            ->assertNotFound();
    });
});

describe('destroy', function () {
    it('removes the tag only from the document', function () {
        $tag = Tag::factory()->create();
        $other = Document::factory()->create();
        $this->document->tags()->attach($tag);
        $other->tags()->attach($tag);

        $this->deleteJson(route('api.v1.documents.tags.destroy', [$this->document, $tag]))->assertNoContent();

        expect($this->document->tags()->exists())->toBeFalse()
            ->and($other->tags()->exists())->toBeTrue()
            ->and($tag->fresh())->not->toBeNull();
    });
});
