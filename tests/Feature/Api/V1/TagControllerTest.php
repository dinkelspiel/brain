<?php

use App\Models\Document;
use App\Models\Tag;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

describe('index', function () {
    it('lists all tags in tree order with their paths', function () {
        $work = Tag::factory()->create(['name' => 'work']);
        $home = Tag::factory()->create(['name' => 'Home']);
        Tag::factory()->for($work, 'parent')->create(['name' => 'meetings']);
        Tag::factory()->for($work, 'parent')->create(['name' => 'admin']);
        Tag::factory()->create(['name' => 'work-archive']);
        Tag::factory()->for($home, 'parent')->create(['name' => 'garden']);

        $response = $this->getJson(route('api.v1.tags.index'));

        $response->assertOk()
            ->assertJsonPath('data.*.path', [
                'Home',
                'Home/garden',
                'work',
                'work/admin',
                'work/meetings',
                'work-archive',
            ])
            ->assertJsonPath('data.3.parent_id', $work->id);
    });
});

describe('store', function () {
    it('creates a root tag', function () {
        $response = $this->postJson(route('api.v1.tags.store'), ['name' => 'work']);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'work')
            ->assertJsonPath('data.path', 'work')
            ->assertJsonPath('data.parent_id', null);
    });

    it('creates a tag below its parent', function () {
        $meetings = Tag::factory()->for(Tag::factory()->state(['name' => 'work']), 'parent')->create(['name' => 'meetings']);

        $response = $this->postJson(route('api.v1.tags.store'), [
            'parent_id' => $meetings->id,
            'name' => 'weekly',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.path', 'work/meetings/weekly')
            ->assertJsonPath('data.parent_id', $meetings->id);
    });

    it('allows the same name below different parents', function () {
        $work = Tag::factory()->create(['name' => 'work']);
        Tag::factory()->create(['name' => 'meetings']);

        $this->postJson(route('api.v1.tags.store'), ['parent_id' => $work->id, 'name' => 'meetings'])
            ->assertCreated()
            ->assertJsonPath('data.path', 'work/meetings');
    });

    it('rejects an invalid tag', function (Closure $payload, string $field) {
        $work = Tag::factory()->create(['name' => 'work']);
        Tag::factory()->for($work, 'parent')->create(['name' => 'meetings']);

        $this->postJson(route('api.v1.tags.store'), $payload($work))
            ->assertUnprocessable()
            ->assertJsonValidationErrorFor($field);

        $this->assertDatabaseCount('tags', 2);
    })->with([
        'missing name' => [fn (Tag $work) => [], 'name'],
        'name with a slash' => [fn (Tag $work) => ['name' => 'a/b'], 'name'],
        'name too long' => [fn (Tag $work) => ['name' => str_repeat('a', 65)], 'name'],
        'existing root tag' => [fn (Tag $work) => ['name' => 'work'], 'name'],
        'existing sibling' => [fn (Tag $work) => ['parent_id' => $work->id, 'name' => 'meetings'], 'name'],
        'missing parent' => [fn (Tag $work) => ['parent_id' => 999, 'name' => 'meetings'], 'parent_id'],
    ]);
});

describe('destroy', function () {
    it('deletes the tag with every tag below it', function () {
        $work = Tag::factory()->create(['name' => 'work']);
        $meetings = Tag::factory()->for($work, 'parent')->create(['name' => 'meetings']);
        $weekly = Tag::factory()->for($meetings, 'parent')->create(['name' => 'weekly']);
        $archive = Tag::factory()->create(['name' => 'work-archive']);
        $document = Document::factory()->hasAttached($weekly)->hasAttached($archive)->create();

        $this->deleteJson(route('api.v1.tags.destroy', $work))->assertNoContent();

        expect(Tag::pluck('id')->all())->toBe([$archive->id])
            ->and($document->tags()->pluck('tags.id')->all())->toBe([$archive->id]);
    });
});
