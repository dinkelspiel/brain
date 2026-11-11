<?php

namespace App\Models;

use App\Support\LineDiff;
use Database\Factories\DocumentHistoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A point in the history of a document. Keyframes store the full content, the entries
 * in between store a line diff against the entry before them.
 *
 * @phpstan-import-type Operation from LineDiff
 *
 * @property int $id
 * @property int $document_id
 * @property string $title
 * @property string|null $content
 * @property list<Operation>|null $diff
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Fillable(['title', 'content', 'diff'])]
class DocumentHistory extends Model
{
    /** @use HasFactory<DocumentHistoryFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'diff' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Document, $this>
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function isKeyframe(): bool
    {
        return $this->content !== null;
    }

    public function previous(): ?self
    {
        return self::query()
            ->where('document_id', $this->document_id)
            ->where('id', '<', $this->id)
            ->latest('id')
            ->first();
    }

    /**
     * Rebuild the full content at this entry from the nearest keyframe before it.
     */
    public function resolveContent(): string
    {
        if ($this->content !== null) {
            return $this->content;
        }

        $keyframe = self::query()
            ->where('document_id', $this->document_id)
            ->where('id', '<', $this->id)
            ->whereNotNull('content')
            ->latest('id')
            ->firstOrFail();

        return self::query()
            ->where('document_id', $this->document_id)
            ->whereBetween('id', [$keyframe->id + 1, $this->id])
            ->orderBy('id')
            ->get()
            ->reduce(
                fn (string $content, self $entry): string => LineDiff::apply($content, $entry->diff ?? []),
                (string) $keyframe->content,
            );
    }
}
