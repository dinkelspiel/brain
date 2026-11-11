import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node } from '@tiptap/pm/model';
import { EditorContent, useEditor } from '@tiptap/react';
import { markdownExtensions } from '@/components/markdown-editor';
import { ADDED_MARKERS, markChanges, REMOVED_MARKERS } from '@/lib/inline-diff';

const ADDED_CLASS =
    'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-300';
const REMOVED_CLASS =
    'bg-red-100 text-red-800 line-through dark:bg-red-950 dark:text-red-300';

const MARKERS: Record<string, string | null> = {
    [ADDED_MARKERS[0]]: ADDED_CLASS,
    [REMOVED_MARKERS[0]]: REMOVED_CLASS,
    [ADDED_MARKERS[1]]: null,
    [REMOVED_MARKERS[1]]: null,
};

function decorations(doc: Node): DecorationSet {
    const found: Decoration[] = [];
    let highlight: string | null = null;

    doc.descendants((node, position) => {
        const text = node.isText ? (node.text ?? '') : '';
        let start = position;

        for (let index = 0; index < text.length; index++) {
            if (!(text[index] in MARKERS)) {
                continue;
            }

            const at = position + index;

            if (highlight && start < at) {
                found.push(Decoration.inline(start, at, { class: highlight }));
            }

            found.push(Decoration.inline(at, at + 1, { class: 'hidden' }));
            highlight = MARKERS[text[index]];
            start = at + 1;
        }

        const end = position + text.length;

        if (highlight && start < end) {
            found.push(Decoration.inline(start, end, { class: highlight }));
        }
    });

    return DecorationSet.create(doc, found);
}

const DiffHighlight = Extension.create({
    name: 'diffHighlight',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                props: {
                    decorations: (state) => decorations(state.doc),
                },
            }),
        ];
    },
});

export function MarkdownDiff({ from, to }: { from: string; to: string }) {
    const editor = useEditor({
        editable: false,
        extensions: [...markdownExtensions, DiffHighlight],
        content: markChanges(from, to),
        contentType: 'markdown',
        editorProps: {
            attributes: {
                class: 'markdown py-4',
            },
        },
    });

    return <EditorContent editor={editor} />;
}
