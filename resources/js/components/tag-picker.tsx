import { useState } from 'react';
import { PaletteList } from '@/components/palette-list';
import type { PaletteItem } from '@/components/palette-list';
import { useTags } from '@/hooks/use-tags';
import { fuzzyFilter } from '@/lib/fuzzy';
import type { Tag } from '@/types';

const ROOT_LABEL = '/';

export function filterTags(tags: Tag[], query: string): Tag[] {
    return fuzzyFilter(tags, query, (tag) => tag.path);
}

export function TagPicker({
    label,
    withRoot,
    onPick,
    onClose,
}: {
    label: string;
    withRoot: boolean;
    onPick: (tag: Tag | null) => void;
    onClose: () => void;
}) {
    const tags = useTags();
    const [value, setValue] = useState('');
    const query = value.trim();

    const items: PaletteItem[] = filterTags(tags.data ?? [], query).map(
        (tag) => ({
            key: `tag-${tag.id}`,
            label: tag.path,
            run: () => onPick(tag),
        }),
    );

    if (withRoot && (query === '' || query === ROOT_LABEL)) {
        items.unshift({
            key: 'root',
            label: ROOT_LABEL,
            run: () => onPick(null),
        });
    }

    return (
        <PaletteList
            value={value}
            onValueChange={setValue}
            items={items}
            label={label}
            placeholder={label}
            isLoading={tags.isPending}
            error={tags.isError ? 'Could not load the tags.' : undefined}
            emptyMessage="No matching tags"
            onClose={onClose}
        />
    );
}
