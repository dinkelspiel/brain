import { Link } from '@inertiajs/react';
import { Node } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { ReactNodeViewProps } from '@tiptap/react';
import { show } from '@/routes/documents';

const DOCUMENT_LINK = /^\[((?:\\.|[^\]\\])*)\]\(\/documents\/(\d+)\)/;

function DocumentLinkView({ node, deleteNode }: ReactNodeViewProps) {
    const title = node.attrs.title as string;

    return (
        <NodeViewWrapper as="span">
            <Link href={show.url(node.attrs.id as number)}>{title}</Link>
            <button
                type="button"
                onClick={deleteNode}
                aria-label={`Remove link to ${title}`}
                className="px-1 text-xs text-mauve-600 opacity-70 hover:opacity-100 dark:text-mauve-400"
            >
                ×
            </button>
        </NodeViewWrapper>
    );
}

export const EditorDocumentLink = Node.create({
    name: 'documentLink',
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
        return {
            id: { default: null },
            title: { default: '' },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'a[data-document-link]',
                getAttrs: (element) => ({
                    id: Number(element.getAttribute('data-document-link')),
                    title: element.textContent,
                }),
            },
        ];
    },

    renderHTML({ node }) {
        return [
            'a',
            {
                href: show.url(node.attrs.id),
                'data-document-link': node.attrs.id,
            },
            node.attrs.title,
        ];
    },

    renderText({ node }) {
        return node.attrs.title;
    },

    addNodeView() {
        return ReactNodeViewRenderer(DocumentLinkView);
    },

    markdownTokenizer: {
        name: 'documentLink',
        level: 'inline',
        start: (src) => src.indexOf('['),
        tokenize(src) {
            const match = DOCUMENT_LINK.exec(src);

            if (!match) {
                return undefined;
            }

            return {
                type: 'documentLink',
                raw: match[0],
                title: match[1].replace(/\\(.)/g, '$1'),
                id: Number(match[2]),
            };
        },
    },

    parseMarkdown(token, helpers) {
        return helpers.createNode('documentLink', {
            id: token.id,
            title: token.title,
        });
    },

    renderMarkdown(node) {
        const title = String(node.attrs?.title ?? '').replace(
            /[\\[\]]/g,
            '\\$&',
        );

        return `[${title}](${show.url(node.attrs?.id)})`;
    },
});
