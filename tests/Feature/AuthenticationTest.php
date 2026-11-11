<?php

use App\Models\Document;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Arr;
use Inertia\Testing\AssertableInertia as Assert;

describe('before setup', function () {
    it('sends every page to the setup page while no account exists', function (string $route) {
        $this->get(route($route))->assertRedirect(route('setup'));
    })->with(['home', 'login']);

    it('renders the setup page', function () {
        $this->get(route('setup'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('auth/setup'));
    });
});

describe('after setup', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
    });

    it('sends the setup page to the login page', function () {
        $this->get(route('setup'))->assertRedirect(route('login'));
    });

    it('sends guests to the login page', function () {
        $document = Document::factory()->create();

        $this->get(route('home'))->assertRedirect(route('login'));
        $this->get(route('documents.show', $document))->assertRedirect(route('login'));
        $this->get(route('documents.history', $document))->assertRedirect(route('login'));
    });

    it('renders the login page for guests', function () {
        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/login')
                ->where('auth.user', null));
    });

    it('sends logged in users from the login page to the home page', function () {
        $this->actingAs($this->user)
            ->get(route('login'))
            ->assertRedirect(route('home'));
    });

    it('shares only the id and username of the logged in user', function () {
        $this->actingAs($this->user)
            ->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user', ['id' => $this->user->id, 'username' => $this->user->username]));
    });
});

it('rejects guests on the protected API endpoints', function (string $method, string $route, array $bindings = []) {
    $models = ['document' => Document::factory()->create(), 'tag' => Tag::factory()->create()];

    $this->json($method, route($route, Arr::only($models, $bindings)))->assertUnauthorized();
})->with([
    'documents index' => ['GET', 'api.v1.documents.index'],
    'documents search' => ['GET', 'api.v1.documents.search'],
    'documents store' => ['POST', 'api.v1.documents.store'],
    'documents show' => ['GET', 'api.v1.documents.show', ['document']],
    'documents update' => ['PATCH', 'api.v1.documents.update', ['document']],
    'document histories index' => ['GET', 'api.v1.documents.histories.index', ['document']],
    'document tags index' => ['GET', 'api.v1.documents.tags.index', ['document']],
    'document tags store' => ['POST', 'api.v1.documents.tags.store', ['document']],
    'document tags destroy' => ['DELETE', 'api.v1.documents.tags.destroy', ['document', 'tag']],
    'tags index' => ['GET', 'api.v1.tags.index'],
    'tags store' => ['POST', 'api.v1.tags.store'],
    'tags destroy' => ['DELETE', 'api.v1.tags.destroy', ['tag']],
    'open documents index' => ['GET', 'api.v1.open-documents.index'],
    'open documents store' => ['POST', 'api.v1.open-documents.store'],
    'open documents destroy' => ['DELETE', 'api.v1.open-documents.destroy', ['document']],
    'logout' => ['DELETE', 'api.v1.session.destroy'],
]);
