<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database. The account is created on the setup page.
     */
    public function run(): void
    {
        $this->call(DocumentSeeder::class);
    }
}
