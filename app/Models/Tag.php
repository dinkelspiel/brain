<?php

namespace App\Models;

use Database\Factories\TagFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * A tag is a root tag when it has no parent, otherwise it sits below its parent in the tag tree.
 *
 * @property int $id
 * @property int|null $parent_id
 * @property string $name
 * @property string $path
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['parent_id', 'name'])]
class Tag extends Model
{
    /** @use HasFactory<TagFactory> */
    use HasFactory;

    public const PATH_SEPARATOR = '/';

    protected static function booted(): void
    {
        static::creating(function (Tag $tag): void {
            $tag->path = $tag->parent === null
                ? $tag->name
                : $tag->parent->path.self::PATH_SEPARATOR.$tag->name;
        });
    }

    /**
     * @return BelongsTo<Tag, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Tag::class);
    }

    /**
     * @return BelongsToMany<Document, $this>
     */
    public function documents(): BelongsToMany
    {
        return $this->belongsToMany(Document::class)->withTimestamps();
    }

    /**
     * The ids of this tag and of every tag below it.
     *
     * @return array<int, int>
     */
    public function subtreeIds(): array
    {
        return static::query()
            ->get(['id', 'path'])
            ->filter(fn (Tag $tag): bool => $tag->path === $this->path || str_starts_with($tag->path, $this->path.self::PATH_SEPARATOR))
            ->map(fn (Tag $tag): int => $tag->id)
            ->all();
    }

    /**
     * The tags in tree order, every tag followed by the tags below it.
     *
     * @param  Collection<int, Tag>  $tags
     * @return Collection<int, Tag>
     */
    public static function inTreeOrder(Collection $tags): Collection
    {
        return $tags
            ->sortBy(fn (Tag $tag): string => str_replace(self::PATH_SEPARATOR, "\0", mb_strtolower($tag->path)), SORT_STRING)
            ->values();
    }
}
