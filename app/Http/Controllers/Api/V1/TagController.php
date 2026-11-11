<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTagRequest;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TagController extends Controller
{
    /**
     * List all tags in tree order.
     */
    public function index(): AnonymousResourceCollection
    {
        return TagResource::collection(Tag::inTreeOrder(Tag::all()));
    }

    /**
     * Store a new root tag, or a new tag below its parent.
     */
    public function store(StoreTagRequest $request): TagResource
    {
        return new TagResource(Tag::create($request->validated()));
    }

    /**
     * Delete the tag together with every tag below it.
     */
    public function destroy(Tag $tag): Response
    {
        Tag::query()->whereKey($tag->subtreeIds())->delete();

        return response()->noContent();
    }
}
