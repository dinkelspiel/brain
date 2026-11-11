import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export type EditorSearchTrigger = '#' | '$';

export type EditorSearchRange = {
    trigger: EditorSearchTrigger;
    from: number;
    to: number;
};

const TRIGGERS = ['#', '$'];

const SEARCH_CLASS =
    'rounded-sm border border-mauve-300 bg-mauve-100 dark:border-mauve-700 dark:bg-mauve-800';

export const editorSearchKey = new PluginKey<EditorSearchRange | null>(
    'editorSearch',
);

function isActive(search: EditorSearchRange, state: EditorState): boolean {
    const { doc, selection } = state;

    if (
        search.from >= search.to ||
        doc.textBetween(search.from, search.from + 1) !== search.trigger
    ) {
        return false;
    }

    if (
        !selection.empty ||
        selection.from <= search.from ||
        selection.from > search.to
    ) {
        return false;
    }

    return doc.resolve(search.from).parent === doc.resolve(search.to).parent;
}

export function closeEditorSearch(editor: Editor): void {
    editor.view.dispatch(editor.state.tr.setMeta(editorSearchKey, 'close'));
}

export const EditorSearch = Extension.create({
    name: 'editorSearch',

    addProseMirrorPlugins() {
        return [
            new Plugin<EditorSearchRange | null>({
                key: editorSearchKey,
                state: {
                    init: () => null,
                    apply(tr, search, _oldState, newState) {
                        const meta = tr.getMeta(editorSearchKey) as
                            | EditorSearchRange
                            | 'close'
                            | undefined;

                        if (meta === 'close') {
                            return null;
                        }

                        const next =
                            meta ??
                            (search && {
                                ...search,
                                from: tr.mapping.map(search.from, 1),
                                to: tr.mapping.map(search.to, 1),
                            });

                        return next && isActive(next, newState) ? next : null;
                    },
                },
                props: {
                    decorations(state) {
                        const search = editorSearchKey.getState(state);

                        return search
                            ? DecorationSet.create(state.doc, [
                                  Decoration.inline(search.from, search.to, {
                                      class: SEARCH_CLASS,
                                  }),
                              ])
                            : null;
                    },
                    handleTextInput(view, from, to, text) {
                        const { $from } = view.state.selection;

                        if (
                            !TRIGGERS.includes(text) ||
                            editorSearchKey.getState(view.state) ||
                            $from.parent.type.spec.code ||
                            $from.marks().some((mark) => mark.type.spec.code)
                        ) {
                            return false;
                        }

                        view.dispatch(
                            view.state.tr
                                .insertText(text, from, to)
                                .setMeta(editorSearchKey, {
                                    trigger: text,
                                    from,
                                    to: from + 1,
                                }),
                        );

                        return true;
                    },
                },
            }),
        ];
    },
});
