<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentTagRequest;
use App\Http\Resources\TagResource;
use App\Models\Document;
use App\Models\Tag;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class DocumentTagController extends Controller
{
    /**
     * List the tags of the document in tree order.
     */
    public function index(Document $document): AnonymousResourceCollection
    {
        return TagResource::collection(Tag::inTreeOrder($document->tags()->get()));
    }

    /**
     * Tag the document and return all its tags.
     */
    public function store(StoreDocumentTagRequest $request, Document $document): AnonymousResourceCollection
    {
        $document->tags()->syncWithoutDetaching([$request->integer('tag_id')]);

        return $this->index($document);
    }

    /**
     * Remove a tag from the document.
     */
    public function destroy(Document $document, Tag $tag): Response
    {
        $document->tags()->detach($tag);

        return response()->noContent();
    }
}
