<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentHistoryResource;
use App\Models\Document;
use App\Models\DocumentHistory;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DocumentHistoryController extends Controller
{
    /**
     * List the history entries of a document, newest first, without their content.
     */
    public function index(Document $document): AnonymousResourceCollection
    {
        $histories = $document->histories()
            ->latest('id')
            ->get(['id', 'document_id', 'title', 'created_at', 'updated_at']);

        return DocumentHistoryResource::collection($histories);
    }

    /**
     * Display a history entry with its content and the content of the entry before it.
     */
    public function show(Document $document, DocumentHistory $history): DocumentHistoryResource
    {
        return new DocumentHistoryResource($history);
    }
}
