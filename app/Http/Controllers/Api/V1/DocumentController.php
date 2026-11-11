<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\UpdateDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class DocumentController extends Controller
{
    /**
     * List the documents, newest first, without their content.
     */
    public function index(): AnonymousResourceCollection
    {
        $documents = Document::query()
            ->latest()
            ->latest('id')
            ->get(['id', 'title', 'created_at', 'updated_at']);

        return DocumentResource::collection($documents);
    }

    /**
     * Store a newly created document.
     */
    public function store(StoreDocumentRequest $request): DocumentResource
    {
        $document = DB::transaction(function () use ($request): Document {
            $document = Document::create($request->validated());
            $document->recordHistory();

            return $document;
        });

        return new DocumentResource($document);
    }

    /**
     * Display the specified document.
     */
    public function show(Document $document): DocumentResource
    {
        return new DocumentResource($document);
    }

    /**
     * Update the specified document and record the change in its history.
     */
    public function update(UpdateDocumentRequest $request, Document $document): DocumentResource
    {
        DB::transaction(function () use ($request, $document): void {
            $document->update($request->validated());

            if ($document->wasChanged(['title', 'content'])) {
                $document->recordHistory();
            }
        });

        return new DocumentResource($document);
    }
}
