import { TagBadge } from '@/components/tag-badge';
import { useDocumentTags, useUntagDocument } from '@/hooks/use-tags';

export function DocumentTags({ documentId }: { documentId: number }) {
    const tags = useDocumentTags(documentId);
    const untagDocument = useUntagDocument();

    if (!tags.data?.length) {
        return null;
    }

    return (
        <ul aria-label="Tags" className="flex flex-wrap gap-1 px-1 py-1">
            {tags.data.map((tag) => (
                <li key={tag.id} className="flex">
                    <TagBadge
                        tag={tag}
                        onRemove={() =>
                            untagDocument.mutate({ documentId, tagId: tag.id })
                        }
                    />
                </li>
            ))}
        </ul>
    );
}
