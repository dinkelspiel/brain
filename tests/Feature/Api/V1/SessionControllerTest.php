<?php

use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['username' => 'willem']);
});

describe('login', function () {
    it('logs in with a username and password', function () {
        $response = $this->postJson(route('api.v1.session.store'), [
            'username' => 'willem',
            'password' => 'password',
        ]);

        $response->assertOk()->assertJsonPath('data.username', 'willem');

        $this->assertAuthenticatedAs($this->user);
    });

    it('rejects a wrong password', function () {
        $this->postJson(route('api.v1.session.store'), [
            'username' => 'willem',
            'password' => 'wrong-password',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['username' => 'These credentials do not match our records.']);

        $this->assertGuest();
    });

    it('locks out after five failed attempts', function () {
        foreach (range(1, 5) as $attempt) {
            $this->postJson(route('api.v1.session.store'), [
                'username' => 'willem',
                'password' => 'wrong-password',
            ])->assertUnprocessable();
        }

        $this->postJson(route('api.v1.session.store'), [
            'username' => 'willem',
            'password' => 'password',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['username' => 'Too many login attempts.']);

        $this->assertGuest();
    });
});

describe('logout', function () {
    it('ends the session', function () {
        $this->actingAs($this->user)
            ->deleteJson(route('api.v1.session.destroy'))
            ->assertNoContent();

        $this->assertGuest('web');
    });
});
