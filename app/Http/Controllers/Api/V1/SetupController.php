<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SetupRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class SetupController extends Controller
{
    /**
     * Create the first account and log in with it.
     */
    public function __invoke(SetupRequest $request): JsonResponse
    {
        $user = User::create($request->safe()->only(['username', 'password']));

        Auth::guard('web')->login($user);

        $request->session()->regenerate();

        return (new UserResource($user))->response()->setStatusCode(201);
    }
}
