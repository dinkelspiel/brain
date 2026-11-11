import { useOpenCommandPalette } from '@/components/command-palette';
import { useTags } from '@/hooks/use-tags';
import type { Tag } from '@/types';

export function TagBadge({
    tag,
    onRemove,
}: {
    tag: Pick<Tag, 'id' | 'path'>;
    onRemove: () => void;
}) {
    const allTags = useTags();
    const openCommandPalette = useOpenCommandPalette();

    const tagIdsByPath = new Map(
        (allTags.data ?? []).map((tag) => [tag.path, tag.id]),
    );
    const names = tag.path.split('/');

    return (
        <span className="inline-flex items-baseline rounded-sm border border-mauve-300 font-mono text-xs text-mauve-700 dark:border-mauve-700 dark:text-mauve-300">
            <span className="pl-1.5">
                {names.map((name, index) => {
                    const path = names.slice(0, index + 1).join('/');

                    return (
                        <span key={path}>
                            {index > 0 && '/'}
                            <button
                                type="button"
                                onClick={() =>
                                    openCommandPalette(
                                        `tag=${tagIdsByPath.get(path) ?? tag.id} `,
                                    )
                                }
                                className="rounded-sm hover:bg-mauve-100 hover:text-mauve-950 dark:hover:bg-mauve-800 dark:hover:text-mauve-50"
                            >
                                {name}
                            </button>
                        </span>
                    );
                })}
            </span>
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${tag.path}`}
                className="px-1.5 opacity-70 hover:opacity-100"
            >
                ×
            </button>
        </span>
    );
}
