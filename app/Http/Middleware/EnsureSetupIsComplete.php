<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSetupIsComplete
{
    /**
     * Send every visitor to the setup page until the first account exists.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (User::query()->doesntExist()) {
            return to_route('setup');
        }

        return $next($request);
    }
}
