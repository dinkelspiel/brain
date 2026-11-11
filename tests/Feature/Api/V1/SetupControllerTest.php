<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('creates the first account and logs in with it', function () {
    $response = $this->postJson(route('api.v1.setup'), [
        'username' => 'willem',
        'password' => 'secret-password',
        'password_confirmation' => 'secret-password',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.username', 'willem')
        ->assertJsonMissingPath('data.password');

    $user = User::sole();

    expect(Hash::check('secret-password', $user->password))->toBeTrue();
    $this->assertAuthenticatedAs($user);
});

it('is closed once an account exists', function () {
    User::factory()->create();

    $this->postJson(route('api.v1.setup'), [
        'username' => 'intruder',
        'password' => 'secret-password',
        'password_confirmation' => 'secret-password',
    ])->assertForbidden();

    $this->assertDatabaseCount('users', 1);
    $this->assertGuest();
});

it('validates the account', function (array $input, string $field) {
    $this->postJson(route('api.v1.setup'), [
        'username' => 'willem',
        'password' => 'secret-password',
        'password_confirmation' => 'secret-password',
        ...$input,
    ])->assertUnprocessable()->assertJsonValidationErrorFor($field);

    $this->assertDatabaseCount('users', 0);
})->with([
    'missing username' => [['username' => ''], 'username'],
    'username with spaces' => [['username' => 'will em'], 'username'],
    'missing password' => [['password' => '', 'password_confirmation' => ''], 'password'],
    'unconfirmed password' => [['password_confirmation' => 'other-password'], 'password'],
]);
