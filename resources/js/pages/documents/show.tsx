import { Head } from '@inertiajs/react';
import { useEffect, useEffectEvent, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { DocumentTags } from '@/components/document-tags';
import { MarkdownEditor } from '@/components/markdown-editor';
import { HeaderActions } from '@/components/site-header';
import { useDocument, useUpdateDocument } from '@/hooks/use-documents';
import { useOpenDocumentTab } from '@/hooks/use-open-documents';
import { ApiError } from '@/lib/api';
import type { DocumentData } from '@/types';

const AUTOSAVE_DELAY_MS = 2000;

export default function DocumentsShow({ documentId }: { documentId: number }) {
    const document = useDocument(documentId);

    useOpenDocumentTab(documentId);

    if (document.isPending) {
        return (
            <div className="mx-auto max-w-3xl animate-pulse space-y-3 py-4">
                <div className="h-6 w-1/2 rounded-sm bg-mauve-100 dark:bg-mauve-900" />
                <div className="h-3 w-full rounded-sm bg-mauve-100 dark:bg-mauve-900" />
                <div className="h-3 w-5/6 rounded-sm bg-mauve-100 dark:bg-mauve-900" />
            </div>
        );
    }

    if (document.isError) {
        return (
            <p className="py-8 text-center text-red-700 dark:text-red-400">
                Could not load the document.
            </p>
        );
    }

    return <DocumentEditor key={document.data.id} document={document.data} />;
}

function DocumentEditor({ document }: { document: DocumentData }) {
    const updateDocument = useUpdateDocument(document.id);
    const [saved, setSaved] = useState({
        title: document.title,
        content: document.content ?? '',
    });
    const [title, setTitle] = useState(saved.title);
    const [content, setContent] = useState(saved.content);

    const isDirty = title !== saved.title || content !== saved.content;
    const titleError =
        updateDocument.error instanceof ApiError
            ? updateDocument.error.errors.title?.[0]
            : undefined;

    function save(notify = false) {
        if (!isDirty || updateDocument.isPending) {
            return;
        }

        const input = { title, content };

        updateDocument.mutate(input, {
            onSuccess: () => {
                setSaved(input);

                if (notify) {
                    toast.success('Document saved');
                }
            },
            onError: (error) => {
                if (notify) {
                    toast.error(
                        `Could not save the document: ${error.message}`,
                    );
                }
            },
        });
    }

    const autosave = useEffectEvent(() => save());

    useEffect(() => {
        const timeout = window.setTimeout(autosave, AUTOSAVE_DELAY_MS);

        return () => window.clearTimeout(timeout);
    }, [title, content, saved]);

    const flush = useEffectEvent(() => {
        if (isDirty) {
            updateDocument.mutate({ title, content });
        }
    });

    useEffect(() => () => flush(), []);

    useEffect(() => {
        if (!isDirty) {
            return;
        }

        const warn = (event: BeforeUnloadEvent) => event.preventDefault();

        window.addEventListener('beforeunload', warn);

        return () => window.removeEventListener('beforeunload', warn);
    }, [isDirty]);

    function handleKeyDown(event: KeyboardEvent) {
        if ((event.metaKey || event.ctrlKey) && event.key === 's') {
            event.preventDefault();
            save(true);
        }
    }

    let status = 'saved';

    if (updateDocument.isPending) {
        status = 'saving…';
    } else if (isDirty && updateDocument.isError) {
        status = 'save failed';
    } else if (isDirty) {
        status = 'unsaved changes';
    }

    return (
        <>
            <Head title={saved.title} />
            <HeaderActions>
                <span
                    role="status"
                    className="ml-auto font-mono text-xs text-mauve-500 dark:text-mauve-400"
                >
                    {status}
                </span>
            </HeaderActions>

            <div className="mx-auto max-w-3xl" onKeyDown={handleKeyDown}>
                <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    aria-label="Title"
                    aria-invalid={titleError ? true : undefined}
                    className="w-full rounded-sm border border-transparent bg-transparent px-1 py-0.5 text-xl font-semibold text-mauve-950 hover:border-mauve-200 focus:border-mauve-300 focus:outline-none dark:text-mauve-50 dark:hover:border-mauve-800 dark:focus:border-mauve-700"
                />
                {titleError && (
                    <p className="px-1 text-xs text-red-700 dark:text-red-400">
                        {titleError}
                    </p>
                )}
                <DocumentTags documentId={document.id} />
                <MarkdownEditor
                    markdown={content}
                    onChange={setContent}
                    autoFocus={!document.content}
                />
            </div>
        </>
    );
}
