<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOpenDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class OpenDocumentController extends Controller
{
    /**
     * List the documents the user has open, in the order they were opened, without their content.
     */
    public function index(#[CurrentUser] User $user): AnonymousResourceCollection
    {
        $documents = $user->openDocuments()
            ->get(['documents.id', 'documents.title', 'documents.created_at', 'documents.updated_at']);

        return DocumentResource::collection($documents);
    }

    /**
     * Open a document for the user and return all open documents.
     */
    public function store(StoreOpenDocumentRequest $request, #[CurrentUser] User $user): AnonymousResourceCollection
    {
        $user->openDocuments()->syncWithoutDetaching([$request->integer('document_id')]);

        return $this->index($user);
    }

    /**
     * Close a document for the user.
     */
    public function destroy(Document $document, #[CurrentUser] User $user): Response
    {
        $user->openDocuments()->detach($document);

        return response()->noContent();
    }
}
