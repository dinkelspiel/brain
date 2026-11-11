import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    index,
    show,
    store,
    update,
} from '@/actions/App/Http/Controllers/Api/V1/DocumentController';
import search from '@/actions/App/Http/Controllers/Api/V1/DocumentSearchController';
import * as histories from '@/actions/App/Http/Controllers/Api/V1/DocumentHistoryController';
import { openDocumentKeys } from '@/hooks/use-open-documents';
import { apiRequest } from '@/lib/api';
import type {
    DocumentData,
    DocumentHistoryEntry,
    DocumentInput,
    DocumentSearchResult,
} from '@/types';

type Wrapped<T> = { data: T };

export const documentKeys = {
    list: ['documents', 'list'] as const,
    detail: (id: number) => ['documents', 'detail', id] as const,
    searches: ['documents', 'search'] as const,
    search: (query: string, tagId?: number) =>
        ['documents', 'search', query, tagId ?? null] as const,
    histories: (id: number) => ['documents', 'histories', id] as const,
    history: (id: number, historyId: number) =>
        ['documents', 'histories', id, historyId] as const,
};

export function useDocuments() {
    return useQuery({
        queryKey: documentKeys.list,
        queryFn: async () =>
            (await apiRequest<Wrapped<DocumentData[]>>(index())).data,
    });
}

export function useDocument(id: number) {
    return useQuery({
        queryKey: documentKeys.detail(id),
        queryFn: async () =>
            (await apiRequest<Wrapped<DocumentData>>(show(id))).data,
    });
}

export function useDocumentSearch(query: string, tagId?: number) {
    return useQuery({
        queryKey: documentKeys.search(query, tagId),
        queryFn: async () =>
            (
                await apiRequest<Wrapped<DocumentSearchResult[]>>(
                    search({ query: { query, tag: tagId } }),
                )
            ).data,
        enabled: query !== '' || tagId !== undefined,
        placeholderData: keepPreviousData,
    });
}

export function useDocumentHistories(id: number) {
    return useQuery({
        queryKey: documentKeys.histories(id),
        queryFn: async () =>
            (
                await apiRequest<Wrapped<DocumentHistoryEntry[]>>(
                    histories.index(id),
                )
            ).data,
    });
}

export function useDocumentHistory(id: number, historyId: number) {
    return useQuery({
        queryKey: documentKeys.history(id, historyId),
        queryFn: async () =>
            (
                await apiRequest<Wrapped<DocumentHistoryEntry>>(
                    histories.show({ document: id, history: historyId }),
                )
            ).data,
    });
}

export function useCreateDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: Partial<DocumentInput>) =>
            (await apiRequest<Wrapped<DocumentData>>(store(), input)).data,
        onSuccess: (document) => {
            queryClient.setQueryData(
                documentKeys.detail(document.id),
                document,
            );
            void queryClient.invalidateQueries({ queryKey: documentKeys.list });
            toast.success('Document created');
        },
        onError: (error) => {
            toast.error(`Could not create the document: ${error.message}`);
        },
    });
}

export function useUpdateDocument(id: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: Partial<DocumentInput>) =>
            (await apiRequest<Wrapped<DocumentData>>(update.patch(id), input))
                .data,
        onSuccess: (document) => {
            queryClient.setQueryData(documentKeys.detail(id), document);
            void queryClient.invalidateQueries({ queryKey: documentKeys.list });
            void queryClient.invalidateQueries({
                queryKey: openDocumentKeys.list,
            });
        },
    });
}
