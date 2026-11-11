import type { Editor, JSONContent } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { useEffect, useId, useState } from 'react';
import type { RefObject } from 'react';
import { SEARCH_DELAY } from '@/components/command-palette';
import { PaletteOptions } from '@/components/palette-list';
import type { PaletteItem } from '@/components/palette-list';
import { filterTags } from '@/components/tag-picker';
import { closeEditorSearch, editorSearchKey } from '@/components/editor-search';
import type { EditorSearchRange } from '@/components/editor-search';
import { useDocumentSearch, useDocuments } from '@/hooks/use-documents';
import { useTags } from '@/hooks/use-tags';

export type SearchMenuKeyDown = (event: KeyboardEvent) => boolean;

type EditorSearch = EditorSearchRange & { query: string };

type ResultsProps = {
    editor: Editor;
    search: EditorSearch;
    keyDownRef: RefObject<SearchMenuKeyDown>;
};

function sameSearch(a: EditorSearch | null, b: EditorSearch | null): boolean {
    return (
        a?.trigger === b?.trigger &&
        a?.from === b?.from &&
        a?.to === b?.to &&
        a?.query === b?.query
    );
}

function replaceSearch(
    editor: Editor,
    search: EditorSearch,
    node: JSONContent,
): void {
    editor
        .chain()
        .focus()
        .insertContentAt({ from: search.from, to: search.to }, [
            node,
            { type: 'text', text: ' ' },
        ])
        .run();
}

export function EditorSearchMenu({
    editor,
    keyDownRef,
}: {
    editor: Editor;
    keyDownRef: RefObject<SearchMenuKeyDown>;
}) {
    const search = useEditorState({
        editor,
        selector: ({ editor }): EditorSearch | null => {
            const range = editorSearchKey.getState(editor.state);

            return range
                ? {
                      ...range,
                      query: editor.state.doc.textBetween(
                          range.from + 1,
                          range.to,
                      ),
                  }
                : null;
        },
        equalityFn: sameSearch,
    });

    if (!search) {
        return null;
    }

    return search.trigger === '#' ? (
        <TagResults editor={editor} search={search} keyDownRef={keyDownRef} />
    ) : (
        <DocumentResults
            editor={editor}
            search={search}
            keyDownRef={keyDownRef}
        />
    );
}

function TagResults({ editor, search, keyDownRef }: ResultsProps) {
    const tags = useTags();

    const items = filterTags(tags.data ?? [], search.query.trim()).map(
        (tag) => ({
            key: `tag-${tag.id}`,
            label: tag.path,
            run: () =>
                replaceSearch(editor, search, {
                    type: 'tag',
                    attrs: { path: tag.path },
                }),
        }),
    );

    return (
        <SearchDropdown
            editor={editor}
            search={search}
            keyDownRef={keyDownRef}
            items={items}
            label="Tags"
            isLoading={tags.isPending}
        />
    );
}

function DocumentResults({ editor, search, keyDownRef }: ResultsProps) {
    const query = search.query.trim();
    const [searchQuery, setSearchQuery] = useState(query);

    useEffect(() => {
        const timeout = setTimeout(() => setSearchQuery(query), SEARCH_DELAY);

        return () => clearTimeout(timeout);
    }, [query]);

    const documents = useDocuments();
    const results = useDocumentSearch(searchQuery);

    const found =
        query === ''
            ? (documents.data ?? []).toSorted((a, b) =>
                  b.updated_at.localeCompare(a.updated_at),
              )
            : (results.data ?? []);

    const items = found.map((document) => ({
        key: `document-${document.id}`,
        label: document.title,
        run: () =>
            replaceSearch(editor, search, {
                type: 'documentLink',
                attrs: { id: document.id, title: document.title },
            }),
    }));

    return (
        <SearchDropdown
            editor={editor}
            search={search}
            keyDownRef={keyDownRef}
            items={items}
            label="Documents"
            isLoading={
                query === ''
                    ? documents.isPending
                    : results.isPending || query !== searchQuery
            }
        />
    );
}

function SearchDropdown({
    editor,
    search,
    keyDownRef,
    items,
    label,
    isLoading,
}: ResultsProps & {
    items: PaletteItem[];
    label: string;
    isLoading: boolean;
}) {
    const listId = useId();
    const [active, setActive] = useState({ query: search.query, index: 0 });

    const selectedIndex =
        active.query === search.query
            ? Math.min(active.index, items.length - 1)
            : 0;

    useEffect(() => {
        keyDownRef.current = (event) => {
            if (event.key === 'Escape') {
                closeEditorSearch(editor);

                return true;
            }

            if (items.length === 0) {
                return false;
            }

            if (event.key === 'ArrowDown') {
                setActive({
                    query: search.query,
                    index: (selectedIndex + 1) % items.length,
                });
            } else if (event.key === 'ArrowUp') {
                setActive({
                    query: search.query,
                    index: (selectedIndex - 1 + items.length) % items.length,
                });
            } else if (event.key === 'Enter' || event.key === 'Tab') {
                items[selectedIndex].run();
            } else {
                return false;
            }

            return true;
        };

        return () => {
            keyDownRef.current = () => false;
        };
    });

    if (items.length === 0 && isLoading) {
        return null;
    }

    const coords = editor.view.coordsAtPos(search.from);
    const box = editor.view.dom.getBoundingClientRect();

    return (
        <div
            style={{
                left: coords.left - box.left,
                top: coords.bottom - box.top,
            }}
            className="absolute z-10 w-72 rounded-sm border border-mauve-300 bg-white text-sm dark:border-mauve-700 dark:bg-mauve-950"
        >
            {items.length === 0 ? (
                <p className="px-3 py-1 text-mauve-600 dark:text-mauve-400">
                    No matching {label.toLowerCase()}
                </p>
            ) : (
                <PaletteOptions
                    id={listId}
                    label={label}
                    items={items}
                    selectedIndex={selectedIndex}
                    onSelect={(index) =>
                        setActive({ query: search.query, index })
                    }
                    onRun={(item) => item.run()}
                    className="max-h-64"
                />
            )}
        </div>
    );
}
