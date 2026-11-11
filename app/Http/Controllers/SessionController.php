<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class SessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/login');
    }
}
