<?php

use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\DocumentHistoryController;
use App\Http\Controllers\Api\V1\DocumentSearchController;
use App\Http\Controllers\Api\V1\DocumentTagController;
use App\Http\Controllers\Api\V1\OpenDocumentController;
use App\Http\Controllers\Api\V1\SessionController;
use App\Http\Controllers\Api\V1\SetupController;
use App\Http\Controllers\Api\V1\TagController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::post('setup', SetupController::class)->name('setup');
    Route::post('session', [SessionController::class, 'store'])->name('session.store');

    Route::middleware('auth:sanctum')->group(function () {
        Route::delete('session', [SessionController::class, 'destroy'])->name('session.destroy');

        Route::get('documents/search', DocumentSearchController::class)->name('documents.search');
        Route::apiResource('documents', DocumentController::class)->except('destroy');
        Route::apiResource('documents.histories', DocumentHistoryController::class)
            ->only(['index', 'show'])
            ->scoped();
        Route::apiResource('documents.tags', DocumentTagController::class)
            ->only(['index', 'store', 'destroy']);

        Route::apiResource('tags', TagController::class)->only(['index', 'store', 'destroy']);

        Route::apiResource('open-documents', OpenDocumentController::class)
            ->only(['index', 'store', 'destroy'])
            ->parameters(['open-documents' => 'document']);
    });
});
