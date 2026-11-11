import { useState } from 'react';
import type { FormEvent } from 'react';
import { useCreateTag } from '@/hooks/use-tags';
import { ApiError } from '@/lib/api';
import type { Tag } from '@/types';

export function NewTagForm({
    parent,
    onClose,
}: {
    parent: Tag | null;
    onClose: () => void;
}) {
    const createTag = useCreateTag();
    const [name, setName] = useState('');

    const nameError =
        createTag.error instanceof ApiError
            ? (createTag.error.errors.name?.[0] ??
              createTag.error.errors.parent_id?.[0])
            : undefined;

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (createTag.isPending) {
            return;
        }

        createTag.mutate(
            { parent_id: parent?.id ?? null, name },
            { onSuccess: onClose },
        );
    }

    return (
        <form onSubmit={submit}>
            <div className="flex items-baseline px-3 py-2 font-mono">
                {parent && (
                    <span className="text-mauve-600 dark:text-mauve-400">
                        {parent.path}/
                    </span>
                )}
                <input
                    autoFocus
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    aria-label="Name"
                    aria-invalid={nameError ? true : undefined}
                    placeholder="New tag"
                    spellCheck={false}
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-mauve-500 dark:placeholder:text-mauve-400"
                />
            </div>
            {nameError && (
                <p className="border-t border-mauve-200 px-3 py-1 text-xs text-red-700 dark:border-mauve-800 dark:text-red-400">
                    {nameError}
                </p>
            )}
        </form>
    );
}
