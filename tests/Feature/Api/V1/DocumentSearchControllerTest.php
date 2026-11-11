<?php

use App\Models\Document;
use App\Models\Tag;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

it('finds documents by title and by content', function () {
    $byTitle = Document::factory()->create(['title' => 'Meeting 26/07', 'content' => 'Agenda']);
    $byContent = Document::factory()->create(['title' => 'Untitled', 'content' => "# Notes\n\n- A meeting was held today"]);
    Document::factory()->create(['title' => 'Groceries', 'content' => 'Milk']);

    $response = $this->getJson(route('api.v1.documents.search', ['query' => 'meeting']));

    $response->assertOk()->assertJsonCount(2, 'data');

    $results = collect($response->json('data'))->keyBy('id');

    expect($results[$byTitle->id])->toMatchArray(['title' => 'Meeting 26/07', 'excerpt' => null])
        ->and($results[$byContent->id])->toMatchArray(['title' => 'Untitled', 'excerpt' => 'A meeting was held today'])
        ->and($results[$byContent->id])->not->toHaveKey('content');
});

it('cuts the excerpt around the match', function () {
    Document::factory()->create([
        'title' => 'Untitled',
        'content' => str_repeat('filler ', 20).'needle'.str_repeat(' filler', 20),
    ]);

    $excerpt = $this->getJson(route('api.v1.documents.search', ['query' => 'needle']))
        ->assertOk()
        ->json('data.0.excerpt');

    expect($excerpt)->toStartWith('...')
        ->toEndWith('...')
        ->toContain('needle')
        ->and(mb_strlen($excerpt))->toBeLessThan(100);
});

it('requires a query', function (array $parameters) {
    $this->getJson(route('api.v1.documents.search', $parameters))
        ->assertUnprocessable()
        ->assertJsonValidationErrorFor('query');
})->with([
    'missing' => [[]],
    'too long' => [['query' => str_repeat('a', 256)]],
]);

it('finds only documents tagged with the tag or a tag below it', function () {
    $work = Tag::factory()->create(['name' => 'work']);
    $meetings = Tag::factory()->for($work, 'parent')->create(['name' => 'meetings']);
    $weekly = Tag::factory()->for($meetings, 'parent')->create(['name' => 'weekly']);
    $home = Tag::factory()->create(['name' => 'home']);

    $direct = Document::factory()->hasAttached($work)->create(['title' => 'Meeting with the team']);
    $nested = Document::factory()->hasAttached($weekly)->create(['title' => 'Weekly meeting']);
    Document::factory()->hasAttached($home)->create(['title' => 'Meeting the neighbours']);
    Document::factory()->create(['title' => 'Untagged meeting']);
    Document::factory()->hasAttached($work)->create(['title' => 'Groceries']);

    $ids = $this->getJson(route('api.v1.documents.search', ['query' => 'meeting', 'tag' => $work->id]))
        ->assertOk()
        ->json('data.*.id');

    expect($ids)->toEqualCanonicalizing([$direct->id, $nested->id]);
});

it('lists every document below a tag without a query', function () {
    $work = Tag::factory()->create(['name' => 'work']);
    $meetings = Tag::factory()->for($work, 'parent')->create(['name' => 'meetings']);

    $tagged = Document::factory()->hasAttached($meetings)->create();
    Document::factory()->create();

    $this->getJson(route('api.v1.documents.search', ['tag' => $work->id]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $tagged->id);
});

it('finds nothing when no document has the tag', function () {
    Document::factory()->create(['title' => 'Meeting']);

    $this->getJson(route('api.v1.documents.search', ['query' => 'meeting', 'tag' => Tag::factory()->create()->id]))
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('rejects a missing tag', function () {
    $this->getJson(route('api.v1.documents.search', ['query' => 'meeting', 'tag' => 999]))
        ->assertUnprocessable()
        ->assertJsonValidationErrorFor('tag');
});
