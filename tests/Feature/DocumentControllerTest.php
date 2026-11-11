<?php

use App\Models\Document;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

it('renders the document overview on the home page', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('documents/index'));
});

it('renders the editor with only the document id', function () {
    $document = Document::factory()->create();

    $this->get(route('documents.show', $document))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('documents/show')
            ->where('documentId', $document->id)
            ->missing('document'));
});

it('returns 404 for a missing document', function () {
    $this->get(route('documents.show', 999))->assertNotFound();
});

it('renders the history page with only the document id', function () {
    $document = Document::factory()->create();

    $this->get(route('documents.history', $document))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('documents/history')
            ->where('documentId', $document->id));
});
