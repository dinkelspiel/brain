import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useCreateDocument } from '@/hooks/use-documents';
import { ApiError } from '@/lib/api';
import { show } from '@/routes/documents';

export function NewDocumentDialog({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (open) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [open]);

    return (
        <dialog
            ref={dialogRef}
            aria-label="New document"
            onClose={onClose}
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    dialogRef.current?.close();
                }
            }}
            className="mx-auto mt-[12vh] mb-auto w-full max-w-xl rounded-sm border border-mauve-300 bg-white p-0 text-sm text-mauve-950 backdrop:bg-mauve-950/30 dark:border-mauve-700 dark:bg-mauve-950 dark:text-mauve-100 dark:backdrop:bg-black/50"
        >
            {open && <NewDocumentForm onClose={onClose} />}
        </dialog>
    );
}

export function NewDocumentForm({ onClose }: { onClose: () => void }) {
    const createDocument = useCreateDocument();
    const [title, setTitle] = useState('');

    const titleError =
        createDocument.error instanceof ApiError
            ? createDocument.error.errors.title?.[0]
            : undefined;

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (createDocument.isPending) {
            return;
        }

        createDocument.mutate(
            { title: title.trim() === '' ? 'Untitled' : title },
            {
                onSuccess: (document) => {
                    onClose();
                    router.visit(show.url(document.id));
                },
            },
        );
    }

    return (
        <form onSubmit={submit}>
            <input
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-label="Title"
                aria-invalid={titleError ? true : undefined}
                placeholder="Untitled"
                spellCheck={false}
                autoComplete="off"
                className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-mauve-500 dark:placeholder:text-mauve-400"
            />
            {titleError && (
                <p className="border-t border-mauve-200 px-3 py-1 text-xs text-red-700 dark:border-mauve-800 dark:text-red-400">
                    {titleError}
                </p>
            )}
        </form>
    );
}
