import { router, usePage } from '@inertiajs/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import {
    destroy,
    index,
    store,
} from '@/actions/App/Http/Controllers/Api/V1/OpenDocumentController';
import { apiRequest } from '@/lib/api';
import { home } from '@/routes';
import { show } from '@/routes/documents';
import type { DocumentData } from '@/types';

type Wrapped<T> = { data: T };

export const openDocumentKeys = {
    list: ['open-documents'] as const,
};

export function useOpenDocuments() {
    return useQuery({
        queryKey: openDocumentKeys.list,
        queryFn: async () =>
            (await apiRequest<Wrapped<DocumentData[]>>(index())).data,
        refetchInterval: 30_000,
    });
}

export function useOpenDocumentTab(documentId: number) {
    const queryClient = useQueryClient();
    const { mutate } = useMutation({
        mutationFn: async (id: number) =>
            (
                await apiRequest<Wrapped<DocumentData[]>>(store(), {
                    document_id: id,
                })
            ).data,
        onSuccess: (documents) => {
            queryClient.setQueryData(openDocumentKeys.list, documents);
        },
    });

    useEffect(() => {
        mutate(documentId);
    }, [documentId, mutate]);
}

export function useCloseDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiRequest<null>(destroy(id)),
        onMutate: async (id) => {
            await queryClient.cancelQueries({
                queryKey: openDocumentKeys.list,
            });

            queryClient.setQueryData<DocumentData[]>(
                openDocumentKeys.list,
                (documents) =>
                    documents?.filter((document) => document.id !== id),
            );
        },
        onError: (error) => {
            toast.error(`Could not close the document: ${error.message}`);
        },
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: openDocumentKeys.list }),
    });
}

export function useActiveDocumentId() {
    const { component, props } = usePage<{ documentId?: number }>();

    return component === 'documents/show' || component === 'documents/history'
        ? props.documentId
        : undefined;
}

/**
 * Closes a tab, moving to its neighbour first when it is the one being viewed.
 */
export function useCloseDocumentTab() {
    const openDocuments = useOpenDocuments();
    const closeDocument = useCloseDocument();
    const activeDocumentId = useActiveDocumentId();

    return (id: number) => {
        const documents = openDocuments.data ?? [];

        if (id === activeDocumentId) {
            const position = documents.findIndex(
                (document) => document.id === id,
            );
            const neighbour =
                documents[position + 1] ?? documents[position - 1];

            router.visit(neighbour ? show.url(neighbour.id) : home.url());
        }

        closeDocument.mutate(id);
    };
}

/**
 * Alt+Shift+Left and Alt+Shift+Right move to the previous and next open document, wrapping around at the ends.
 */
export function useDocumentTabShortcuts() {
    const openDocuments = useOpenDocuments();
    const activeDocumentId = useActiveDocumentId();
    const documents = openDocuments.data;

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];

            if (
                step === undefined ||
                !event.altKey ||
                !event.shiftKey ||
                event.ctrlKey ||
                event.metaKey ||
                !documents?.length ||
                (event.target instanceof Element &&
                    event.target.closest('dialog'))
            ) {
                return;
            }

            event.preventDefault();

            const position = documents.findIndex(
                (document) => document.id === activeDocumentId,
            );
            const next =
                position === -1
                    ? step === 1
                        ? 0
                        : documents.length - 1
                    : (position + step + documents.length) % documents.length;

            if (documents[next].id !== activeDocumentId) {
                router.visit(show.url(documents[next].id));
            }
        }

        window.addEventListener('keydown', onKeyDown, { capture: true });

        return () =>
            window.removeEventListener('keydown', onKeyDown, { capture: true });
    }, [documents, activeDocumentId]);
}
