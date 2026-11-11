<?php

namespace App\Models;

use App\Support\LineDiff;
use Database\Factories\DocumentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Laravel\Scout\Searchable;

/**
 * @property int $id
 * @property string $title
 * @property string $content
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['title', 'content'])]
class Document extends Model
{
    /** @use HasFactory<DocumentFactory> */
    use HasFactory, Searchable;

    /**
     * Saves within this many minutes of the latest history entry are folded into it.
     */
    public const HISTORY_WINDOW_MINUTES = 20;

    /**
     * Every this many history entries the full content is stored as a keyframe.
     */
    public const HISTORY_KEYFRAME_INTERVAL = 10;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'content' => '',
    ];

    /**
     * The markdown body of the document. An emptied document is stored as an empty string.
     *
     * @return Attribute<string, string|null>
     */
    protected function content(): Attribute
    {
        return Attribute::set(fn (?string $value): string => $value ?? '');
    }

    /**
     * @return HasMany<DocumentHistory, $this>
     */
    public function histories(): HasMany
    {
        return $this->hasMany(DocumentHistory::class);
    }

    /**
     * @return BelongsToMany<Tag, $this>
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class)->withTimestamps();
    }

    /**
     * The ranking of the fields is set in the Meilisearch index settings in config/scout.php.
     *
     * @return array{id: int, title: string, content: string, updated_at: int|null}
     */
    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'updated_at' => $this->updated_at?->getTimestamp(),
        ];
    }

    /**
     * The first line of the content that contains the query, or else its longest word, around the match.
     */
    public function excerpt(string $query, int $radius = 40): ?string
    {
        $words = preg_split('/\s+/u', trim($query), flags: PREG_SPLIT_NO_EMPTY) ?: [];
        $terms = collect([trim($query), ...$words])
            ->filter()
            ->unique()
            ->sortByDesc(fn (string $term): int => mb_strlen($term));

        $lines = collect(preg_split('/\R/u', $this->content) ?: [])
            ->map(fn (string $line): string => trim((string) preg_replace('/^\s*(?:#+|>+|[-*+](?:\s+\[[ xX]\])?|\d+\.)\s+/u', '', $line)));

        foreach ($terms as $term) {
            $line = $lines->first(fn (string $line): bool => mb_stripos($line, $term) !== false);

            if ($line !== null) {
                return Str::excerpt($line, $term, ['radius' => $radius]);
            }
        }

        return null;
    }

    /**
     * Record the current title and content in the history. When the latest entry is still
     * within the history window it is replaced by the current state instead.
     */
    public function recordHistory(): void
    {
        $latest = $this->histories()->latest('id')->first();

        if ($latest !== null && $latest->created_at->isAfter(now()->subMinutes(self::HISTORY_WINDOW_MINUTES))) {
            $latest->update($this->historyEntry($latest->isKeyframe() ? null : $latest->previous()?->resolveContent()));

            return;
        }

        $isKeyframe = $latest === null
            || $this->histories()->count() % self::HISTORY_KEYFRAME_INTERVAL === 0;

        $this->histories()->create($this->historyEntry($isKeyframe ? null : $latest->resolveContent()));
    }

    /**
     * A keyframe when there is no base to diff against, otherwise a diff from the base.
     *
     * @return array<string, mixed>
     */
    private function historyEntry(?string $base): array
    {
        return [
            'title' => $this->title,
            'content' => $base === null ? $this->content : null,
            'diff' => $base === null ? null : LineDiff::compute($base, $this->content),
        ];
    }
}
