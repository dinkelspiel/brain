import { router } from '@inertiajs/react';
import {
    createContext,
    use,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import type { ReactNode } from 'react';
import { NewDocumentForm } from '@/components/new-document-dialog';
import { NewTagForm } from '@/components/new-tag-form';
import { PaletteList } from '@/components/palette-list';
import type { PaletteItem } from '@/components/palette-list';
import { filterTags, TagPicker } from '@/components/tag-picker';
import { useDocumentSearch, useDocuments } from '@/hooks/use-documents';
import {
    useActiveDocumentId,
    useCloseDocumentTab,
} from '@/hooks/use-open-documents';
import { useDeleteTag, useTagDocument, useTags } from '@/hooks/use-tags';
import { history as documentHistory, show } from '@/routes/documents';
import type { Tag } from '@/types';

const COMMAND_PREFIX = '>';
const TAG_PREFIX = '#';
const TAG_FILTER = /(?:^|\s)tag=(\d+)(?=\s|$)/;
const RECENT_COMMANDS_KEY = 'command-palette.recent';
export const SEARCH_DELAY = 150;

type Command = {
    id: string;
    label: string;
    run: () => void;
};

type Session =
    | { kind: 'palette'; value: string }
    | {
          kind: 'tag-picker';
          label: string;
          withRoot: boolean;
          onPick: (tag: Tag | null) => void;
      }
    | { kind: 'new-tag'; parent: Tag | null }
    | { kind: 'new-document' };

function recentCommandIds(): string[] {
    try {
        const ids: unknown = JSON.parse(
            localStorage.getItem(RECENT_COMMANDS_KEY) ?? '[]',
        );

        return Array.isArray(ids)
            ? ids.filter((id) => typeof id === 'string')
            : [];
    } catch {
        return [];
    }
}

function rememberCommand(id: string) {
    localStorage.setItem(
        RECENT_COMMANDS_KEY,
        JSON.stringify([
            id,
            ...recentCommandIds().filter((recent) => recent !== id),
        ]),
    );
}

function sortByRecentUse(commands: Command[]): Command[] {
    const recent = recentCommandIds();
    const rank = (command: Command) => {
        const position = recent.indexOf(command.id);

        return position === -1 ? recent.length : position;
    };

    return commands.toSorted((a, b) => rank(a) - rank(b));
}

function filterCommands(commands: Command[], query: string): Command[] {
    const search = query.toLowerCase();
    const matches = commands.filter((command) =>
        command.label.toLowerCase().includes(search),
    );

    return matches.toSorted(
        (a, b) =>
            Number(!a.label.toLowerCase().startsWith(search)) -
            Number(!b.label.toLowerCase().startsWith(search)),
    );
}

function parseDocumentQuery(query: string): { text: string; tagId?: number } {
    const match = TAG_FILTER.exec(query);

    return match
        ? {
              text: query.replace(match[0], ' ').trim(),
              tagId: Number(match[1]),
          }
        : { text: query };
}

const CommandPaletteContext = createContext<(value: string) => void>(() => {});

export function useOpenCommandPalette() {
    return use(CommandPaletteContext);
}

export function CommandPalette({ children }: { children: ReactNode }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [session, setSession] = useState<(Session & { key: number }) | null>(
        null,
    );

    const openPalette = useCallback((value: string) => {
        setSession((current) => ({
            kind: 'palette',
            key: (current?.key ?? 0) + 1,
            value,
        }));

        if (!dialogRef.current?.open) {
            dialogRef.current?.showModal();
        }
    }, []);
    const activeDocumentId = useActiveDocumentId();
    const closeDocumentTab = useCloseDocumentTab();
    const deleteTag = useDeleteTag();
    const tagDocument = useTagDocument();

    function open(next: Session) {
        setSession((current) => ({ ...next, key: (current?.key ?? 0) + 1 }));

        if (!dialogRef.current?.open) {
            dialogRef.current?.showModal();
        }
    }

    function close() {
        dialogRef.current?.close();
    }

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (
                !(event.ctrlKey || event.metaKey) ||
                event.altKey ||
                event.key.toLowerCase() !== 'p'
            ) {
                return;
            }

            event.preventDefault();
            openPalette(event.shiftKey ? COMMAND_PREFIX : '');
        }

        window.addEventListener('keydown', onKeyDown, { capture: true });

        return () =>
            window.removeEventListener('keydown', onKeyDown, { capture: true });
    }, [openPalette]);

    const commands: Command[] = [
        {
            id: 'new-document',
            label: 'New document',
            run: () => open({ kind: 'new-document' }),
        },
        {
            id: 'create-tag',
            label: 'Create tag',
            run: () =>
                open({
                    kind: 'tag-picker',
                    label: 'Parent tag',
                    withRoot: true,
                    onPick: (parent) => open({ kind: 'new-tag', parent }),
                }),
        },
        {
            id: 'delete-tag',
            label: 'Delete tag',
            run: () =>
                open({
                    kind: 'tag-picker',
                    label: 'Delete tag',
                    withRoot: false,
                    onPick: (tag) => tag && deleteTag.mutate(tag),
                }),
        },
    ];

    if (activeDocumentId !== undefined) {
        commands.push(
            {
                id: 'close-document',
                label: 'Close document',
                run: () => closeDocumentTab(activeDocumentId),
            },
            {
                id: 'show-history',
                label: 'Show history',
                run: () => router.visit(documentHistory.url(activeDocumentId)),
            },
            {
                id: 'tag-document',
                label: 'Add tag',
                run: () =>
                    open({
                        kind: 'tag-picker',
                        label: 'Add tag',
                        withRoot: false,
                        onPick: (tag) =>
                            tag &&
                            tagDocument.mutate({
                                documentId: activeDocumentId,
                                tagId: tag.id,
                            }),
                    }),
            },
        );
    }

    return (
        <CommandPaletteContext value={openPalette}>
            {children}
            <dialog
                ref={dialogRef}
                aria-label="Command palette"
                onClose={() => {
                    if (!dialogRef.current?.open) {
                        setSession(null);
                    }
                }}
                onClick={(event) => {
                    if (event.target === event.currentTarget) {
                        close();
                    }
                }}
                className="mx-auto mt-[12vh] mb-auto w-full max-w-xl rounded-sm border border-mauve-300 bg-white p-0 text-sm text-mauve-950 backdrop:bg-mauve-950/30 dark:border-mauve-700 dark:bg-mauve-950 dark:text-mauve-100 dark:backdrop:bg-black/50"
            >
                {session?.kind === 'palette' && (
                    <Palette
                        key={session.key}
                        initialValue={session.value}
                        commands={commands}
                        onOpen={open}
                        onClose={close}
                    />
                )}
                {session?.kind === 'tag-picker' && (
                    <TagPicker
                        key={session.key}
                        label={session.label}
                        withRoot={session.withRoot}
                        onPick={session.onPick}
                        onClose={close}
                    />
                )}
                {session?.kind === 'new-tag' && (
                    <NewTagForm
                        key={session.key}
                        parent={session.parent}
                        onClose={close}
                    />
                )}
                {session?.kind === 'new-document' && (
                    <NewDocumentForm key={session.key} onClose={close} />
                )}
            </dialog>
        </CommandPaletteContext>
    );
}

function Palette({
    initialValue,
    commands,
    onOpen,
    onClose,
}: {
    initialValue: string;
    commands: Command[];
    onOpen: (session: Session) => void;
    onClose: () => void;
}) {
    const [value, setValue] = useState(initialValue);

    let mode: 'commands' | 'tags' | 'documents' = 'documents';

    if (value.startsWith(COMMAND_PREFIX)) {
        mode = 'commands';
    } else if (value.startsWith(TAG_PREFIX)) {
        mode = 'tags';
    }

    const query = (mode === 'documents' ? value : value.slice(1)).trim();

    const [searchQuery, setSearchQuery] = useState(query);

    useEffect(() => {
        const timeout = setTimeout(() => setSearchQuery(query), SEARCH_DELAY);

        return () => clearTimeout(timeout);
    }, [query]);

    const documents = useDocuments();
    const tags = useTags();
    const searchFilter = parseDocumentQuery(
        mode === 'documents' ? searchQuery : '',
    );
    const search = useDocumentSearch(searchFilter.text, searchFilter.tagId);

    let items: PaletteItem[];
    let isLoading = false;
    let error: string | undefined;

    if (mode === 'commands') {
        items = (
            query === ''
                ? sortByRecentUse(commands)
                : filterCommands(commands, query)
        ).map((command) => ({
            key: command.id,
            label: command.label,
            run: () => {
                rememberCommand(command.id);
                command.run();
            },
        }));
    } else if (mode === 'tags') {
        isLoading = tags.isPending;
        error = tags.isError ? 'Could not load the tags.' : undefined;
        items = filterTags(tags.data ?? [], query).map((tag) => ({
            key: `tag-${tag.id}`,
            label: tag.path,
            run: () => onOpen({ kind: 'palette', value: `tag=${tag.id} ` }),
        }));
    } else {
        const results =
            query === ''
                ? (documents.data ?? []).toSorted((a, b) =>
                      b.updated_at.localeCompare(a.updated_at),
                  )
                : (search.data ?? []);

        isLoading =
            query === ''
                ? documents.isPending
                : search.isPending || query !== searchQuery;
        error = search.isError ? 'Could not search the documents.' : undefined;
        items = results.map((document) => ({
            key: `document-${document.id}`,
            label: document.title,
            excerpt: 'excerpt' in document ? document.excerpt : null,
            date: document.updated_at,
            run: () => router.visit(show.url(document.id)),
        }));
    }

    const labels = {
        commands: 'Commands',
        tags: 'Tags',
        documents: 'Documents',
    };

    return (
        <PaletteList
            value={value}
            onValueChange={setValue}
            items={items}
            label={labels[mode]}
            placeholder="Search documents"
            isLoading={isLoading}
            error={error}
            emptyMessage={`No matching ${labels[mode].toLowerCase()}`}
            onClose={onClose}
        />
    );
}
