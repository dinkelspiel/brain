import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Markdown } from '@tiptap/markdown';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useRef } from 'react';
import { EditorDocumentLink } from '@/components/editor-document-link';
import { EditorSearch } from '@/components/editor-search';
import { EditorSearchMenu } from '@/components/editor-search-menu';
import type { SearchMenuKeyDown } from '@/components/editor-search-menu';
import { EditorTag } from '@/components/editor-tag';

type MarkdownEditorProps = {
    markdown: string;
    onChange: (markdown: string) => void;
    autoFocus?: boolean;
};

export const markdownExtensions = [
    StarterKit.configure({
        underline: false,
        link: { openOnClick: false },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Markdown,
];

const editorExtensions = [
    ...markdownExtensions,
    EditorTag,
    EditorDocumentLink,
    EditorSearch,
];

export function MarkdownEditor({
    markdown,
    onChange,
    autoFocus = false,
}: MarkdownEditorProps) {
    const searchMenuKeyDown = useRef<SearchMenuKeyDown>(() => false);

    const editor = useEditor({
        autofocus: autoFocus,
        extensions: editorExtensions,
        content: markdown,
        contentType: 'markdown',
        editorProps: {
            attributes: {
                class: 'markdown min-h-96 py-4 focus:outline-none',
            },
            handleKeyDown: (_view, event) => searchMenuKeyDown.current(event),
        },
        onUpdate: ({ editor }) => onChange(editor.getMarkdown()),
    });

    return (
        <div className="relative">
            <EditorContent editor={editor} />
            {editor && (
                <EditorSearchMenu
                    editor={editor}
                    keyDownRef={searchMenuKeyDown}
                />
            )}
        </div>
    );
}
