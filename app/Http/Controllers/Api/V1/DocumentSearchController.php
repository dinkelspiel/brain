<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SearchDocumentsRequest;
use App\Http\Resources\DocumentSearchResultResource;
use App\Models\Document;
use App\Models\Tag;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DocumentSearchController extends Controller
{
    private const LIMIT = 20;

    /**
     * Search the titles and contents of all documents, best match first. With a tag only
     * documents tagged with that tag or with a tag below it are searched.
     */
    public function __invoke(SearchDocumentsRequest $request): AnonymousResourceCollection
    {
        $search = Document::search($request->string('query')->toString());

        if ($request->filled('tag')) {
            $tagIds = Tag::findOrFail($request->integer('tag'))->subtreeIds();
            $documentIds = Document::query()
                ->whereHas('tags', fn (Builder $query) => $query->whereKey($tagIds))
                ->pluck('id')
                ->all();

            if ($documentIds === []) {
                return DocumentSearchResultResource::collection([]);
            }

            $search->whereIn('id', $documentIds);
        }

        return DocumentSearchResultResource::collection($search->take(self::LIMIT)->get());
    }
}
