import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { MarkdownDiff } from '@/components/markdown-diff';
import {
    useDocumentHistories,
    useDocumentHistory,
} from '@/hooks/use-documents';
import { useOpenDocumentTab } from '@/hooks/use-open-documents';
import { cn, formatDateTime } from '@/lib/utils';
import { show } from '@/routes/documents';

export default function DocumentsHistory({
    documentId,
}: {
    documentId: number;
}) {
    const histories = useDocumentHistories(documentId);
    const [selectedId, setSelectedId] = useState<number>();

    useOpenDocumentTab(documentId);

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (
                event.key !== 'Escape' ||
                event.defaultPrevented ||
                (event.target instanceof Element &&
                    event.target.closest('dialog'))
            ) {
                return;
            }

            event.preventDefault();
            router.visit(show.url(documentId));
        }

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [documentId]);

    const activeId = selectedId ?? histories.data?.[0]?.id;

    return (
        <>
            <Head title="History" />

            <div className="flex gap-4">
                <nav
                    aria-label="History"
                    className="w-48 shrink-0 border-r border-mauve-200 pr-2 dark:border-mauve-800"
                >
                    <Link
                        href={show.url(documentId)}
                        className="block px-2 py-1 text-mauve-800 hover:underline dark:text-mauve-300"
                    >
                        &larr; back
                    </Link>
                    {histories.isPending && (
                        <div className="animate-pulse space-y-2 py-1">
                            <div className="h-3 w-full rounded-sm bg-mauve-100 dark:bg-mauve-900" />
                            <div className="h-3 w-full rounded-sm bg-mauve-100 dark:bg-mauve-900" />
                            <div className="h-3 w-full rounded-sm bg-mauve-100 dark:bg-mauve-900" />
                        </div>
                    )}
                    {histories.isError && (
                        <p className="py-1 text-red-700 dark:text-red-400">
                            Could not load the history.
                        </p>
                    )}
                    {histories.data?.length === 0 && (
                        <p className="py-1 text-mauve-500 dark:text-mauve-400">
                            No history yet
                        </p>
                    )}
                    <ul className="divide-y divide-mauve-200 dark:divide-mauve-800">
                        {histories.data?.map((entry) => (
                            <li key={entry.id}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedId(entry.id)}
                                    aria-current={
                                        entry.id === activeId
                                            ? 'true'
                                            : undefined
                                    }
                                    className={cn(
                                        'w-full px-2 py-1 text-left font-mono text-xs text-mauve-700 hover:bg-mauve-50 dark:text-mauve-300 dark:hover:bg-mauve-900',
                                        entry.id === activeId &&
                                            'bg-mauve-100 text-mauve-950 dark:bg-mauve-900 dark:text-mauve-50',
                                    )}
                                >
                                    {formatDateTime(entry.updated_at)}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="min-w-0 flex-1">
                    {activeId !== undefined && (
                        <HistoryEntry
                            key={activeId}
                            documentId={documentId}
                            historyId={activeId}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

function HistoryEntry({
    documentId,
    historyId,
}: {
    documentId: number;
    historyId: number;
}) {
    const entry = useDocumentHistory(documentId, historyId);

    if (entry.isPending) {
        return (
            <div className="mx-auto max-w-3xl animate-pulse space-y-3 py-4">
                <div className="h-6 w-1/2 rounded-sm bg-mauve-100 dark:bg-mauve-900" />
                <div className="h-3 w-full rounded-sm bg-mauve-100 dark:bg-mauve-900" />
                <div className="h-3 w-5/6 rounded-sm bg-mauve-100 dark:bg-mauve-900" />
            </div>
        );
    }

    if (entry.isError) {
        return (
            <p className="py-8 text-center text-red-700 dark:text-red-400">
                Could not load this version.
            </p>
        );
    }

    return (
        <div className="mx-auto max-w-3xl">
            <div className="px-1 py-0.5 text-xl font-semibold text-mauve-950 dark:text-mauve-50">
                {entry.data.title}
            </div>
            <MarkdownDiff
                from={entry.data.previous_content ?? ''}
                to={entry.data.content ?? ''}
            />
        </div>
    );
}
