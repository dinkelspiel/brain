<?php

use App\Models\Document;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());

    $this->document = Document::find(
        $this->postJson(route('api.v1.documents.store'), [
            'title' => 'Notes',
            'content' => "one\ntwo",
        ])->json('data.id'),
    );

    $this->travel(Document::HISTORY_WINDOW_MINUTES + 1)->minutes();
    $this->patchJson(route('api.v1.documents.update', $this->document), [
        'title' => 'Renamed',
        'content' => "one\nTWO",
    ])->assertOk();
});

describe('index', function () {
    it('lists the history newest first without content', function () {
        $response = $this->getJson(route('api.v1.documents.histories.index', $this->document));

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.title', 'Renamed')
            ->assertJsonPath('data.1.title', 'Notes')
            ->assertJsonMissingPath('data.0.content');
    });
});

describe('show', function () {
    it('returns the content of an entry and the entry before it', function () {
        $latest = $this->document->histories()->latest('id')->first();

        $response = $this->getJson(route('api.v1.documents.histories.show', [$this->document, $latest]));

        $response->assertOk()
            ->assertJsonPath('data.title', 'Renamed')
            ->assertJsonPath('data.content', "one\nTWO")
            ->assertJsonPath('data.previous_content', "one\ntwo");
    });

    it('has no previous content for the first entry', function () {
        $first = $this->document->histories()->oldest('id')->first();

        $this->getJson(route('api.v1.documents.histories.show', [$this->document, $first]))
            ->assertOk()
            ->assertJsonPath('data.content', "one\ntwo")
            ->assertJsonPath('data.previous_content', null);
    });

    it('returns 404 for an entry of another document', function () {
        $other = Document::factory()->create();
        $entry = $this->document->histories()->first();

        $this->getJson(route('api.v1.documents.histories.show', [$other, $entry]))->assertNotFound();
    });
});
