<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    /**
     * Show the document overview.
     */
    public function index(): Response
    {
        return Inertia::render('documents/index');
    }

    /**
     * Show a document in the editor.
     */
    public function show(Document $document): Response
    {
        return Inertia::render('documents/show', [
            'documentId' => $document->id,
        ]);
    }

    /**
     * Show the history of a document.
     */
    public function history(Document $document): Response
    {
        return Inertia::render('documents/history', [
            'documentId' => $document->id,
        ]);
    }
}
