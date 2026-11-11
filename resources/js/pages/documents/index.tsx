import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { NewDocumentDialog } from '@/components/new-document-dialog';
import { Button } from '@/components/ui/button';
import { HeaderActions } from '@/components/site-header';
import { useDocuments } from '@/hooks/use-documents';
import { formatDateTime } from '@/lib/utils';
import { show } from '@/routes/documents';

export default function DocumentsIndex() {
    const documents = useDocuments();
    const [isCreating, setIsCreating] = useState(false);

    return (
        <>
            <Head title="Documents" />
            <HeaderActions>
                <div className="ml-auto">
                    <Button size="sm" onClick={() => setIsCreating(true)}>
                        New document
                    </Button>
                </div>
            </HeaderActions>
            <NewDocumentDialog
                open={isCreating}
                onClose={() => setIsCreating(false)}
            />

            {documents.isPending && (
                <div className="animate-pulse space-y-2 py-2">
                    <div className="h-3 w-1/3 rounded-sm bg-mauve-100 dark:bg-mauve-900" />
                    <div className="h-3 w-1/4 rounded-sm bg-mauve-100 dark:bg-mauve-900" />
                </div>
            )}

            {documents.isError && (
                <p className="py-8 text-center text-red-700 dark:text-red-400">
                    Could not load the documents.
                </p>
            )}

            {documents.data?.length === 0 && (
                <p className="py-8 text-center text-mauve-600 dark:text-mauve-400">
                    No documents yet
                </p>
            )}

            {documents.data && documents.data.length > 0 && (
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-mauve-200 text-left text-xs dark:border-mauve-800">
                            <th className="px-2 py-1 font-bold">Document</th>
                            <th className="px-2 py-1 text-right font-bold">
                                Created
                            </th>
                            <th className="px-2 py-1 text-right font-bold">
                                Updated
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-mauve-100 dark:divide-mauve-900">
                        {documents.data.map((document) => (
                            <tr
                                key={document.id}
                                className="hover:bg-mauve-50 dark:hover:bg-mauve-900"
                            >
                                <td className="px-2 py-1">
                                    <Link
                                        href={show.url(document.id)}
                                        className="text-mauve-800 hover:underline dark:text-mauve-300"
                                    >
                                        {document.title}
                                    </Link>
                                </td>
                                <td className="px-2 py-1 text-right font-mono text-xs text-mauve-600 dark:text-mauve-400">
                                    {formatDateTime(document.created_at)}
                                </td>
                                <td className="px-2 py-1 text-right font-mono text-xs text-mauve-600 dark:text-mauve-400">
                                    {formatDateTime(document.updated_at)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
}
