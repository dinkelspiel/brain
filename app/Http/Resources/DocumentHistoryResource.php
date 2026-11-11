<?php

namespace App\Http\Resources;

use App\Models\DocumentHistory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin DocumentHistory
 */
class DocumentHistoryResource extends JsonResource
{
    /**
     * Transform the resource into an array. The content is only resolved for a single entry.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isSingleEntry = $request->routeIs('api.v1.documents.histories.show');

        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->when($isSingleEntry, fn (): string => $this->resolveContent()),
            'previous_content' => $this->when($isSingleEntry, fn (): ?string => $this->previous()?->resolveContent()),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
