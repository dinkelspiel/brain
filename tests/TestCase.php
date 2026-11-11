<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Send requests as the first-party frontend so Sanctum starts a session for API calls.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('Referer', (string) config('app.url'));
    }
}
