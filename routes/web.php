<?php

use App\Http\Controllers\DocumentController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\SetupController;
use App\Http\Middleware\EnsureSetupIsComplete;
use Illuminate\Support\Facades\Route;

Route::get('/setup', [SetupController::class, 'show'])->name('setup');

Route::middleware(EnsureSetupIsComplete::class)->group(function () {
    Route::get('/login', [SessionController::class, 'create'])->middleware('guest')->name('login');

    Route::middleware('auth')->group(function () {
        Route::get('/', [DocumentController::class, 'index'])->name('home');
        Route::get('/documents/{document}', [DocumentController::class, 'show'])->name('documents.show');
        Route::get('/documents/{document}/history', [DocumentController::class, 'history'])->name('documents.history');
    });
});
