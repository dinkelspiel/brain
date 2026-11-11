<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SetupController extends Controller
{
    /**
     * Show the setup page until the first account exists.
     */
    public function show(): Response|RedirectResponse
    {
        if (User::query()->exists()) {
            return to_route('login');
        }

        return Inertia::render('auth/setup');
    }
}
