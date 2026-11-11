import { Node } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { ReactNodeViewProps } from '@tiptap/react';
import { TagBadge } from '@/components/tag-badge';
import { useTags } from '@/hooks/use-tags';

function EditorTagView({ node, deleteNode }: ReactNodeViewProps) {
    const tags = useTags();
    const path = node.attrs.path as string;
    const tag = tags.data?.find((tag) => tag.path === path);

    return (
        <NodeViewWrapper as="span">
            {tag ? <TagBadge tag={tag} onRemove={deleteNode} /> : `#${path}`}
        </NodeViewWrapper>
    );
}

export const EditorTag = Node.create({
    name: 'tag',
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
        return {
            path: { default: '' },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-tag]',
                getAttrs: (element) => ({
                    path: element.getAttribute('data-tag'),
                }),
            },
        ];
    },

    renderHTML({ node }) {
        return ['span', { 'data-tag': node.attrs.path }, `#${node.attrs.path}`];
    },

    renderText({ node }) {
        return `#${node.attrs.path}`;
    },

    addNodeView() {
        return ReactNodeViewRenderer(EditorTagView);
    },

    markdownTokenizer: {
        name: 'tag',
        level: 'inline',
        start(src) {
            const match = /(^|\s)#[^\s#]/.exec(src);

            return match ? match.index + match[1].length : -1;
        },
        tokenize(src) {
            const match = /^#([^\s#]*[^\s#.,;:!?)\]*_~])/.exec(src);

            if (!match) {
                return undefined;
            }

            return { type: 'tag', raw: match[0], path: match[1] };
        },
    },

    parseMarkdown(token, helpers) {
        return helpers.createNode('tag', { path: token.path });
    },

    renderMarkdown(node) {
        return `#${node.attrs?.path}`;
    },
});
