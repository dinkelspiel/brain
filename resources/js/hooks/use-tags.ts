import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import documentTags from '@/actions/App/Http/Controllers/Api/V1/DocumentTagController';
import {
    destroy,
    index,
    store,
} from '@/actions/App/Http/Controllers/Api/V1/TagController';
import { documentKeys } from '@/hooks/use-documents';
import { apiRequest } from '@/lib/api';
import type { Tag, TagInput } from '@/types';

type Wrapped<T> = { data: T };

type DocumentTag = { documentId: number; tagId: number };

export const tagKeys = {
    list: ['tags'] as const,
    documents: ['document-tags'] as const,
    document: (documentId: number) => ['document-tags', documentId] as const,
};

export function useTags() {
    return useQuery({
        queryKey: tagKeys.list,
        queryFn: async () => (await apiRequest<Wrapped<Tag[]>>(index())).data,
    });
}

export function useCreateTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: TagInput) =>
            (await apiRequest<Wrapped<Tag>>(store(), input)).data,
        onSuccess: (tag) => {
            void queryClient.invalidateQueries({ queryKey: tagKeys.list });
            toast.success(`Tag ${tag.path} created`);
        },
        onError: (error) => {
            toast.error(`Could not create the tag: ${error.message}`);
        },
    });
}

export function useDeleteTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (tag: Tag) => apiRequest<null>(destroy(tag.id)),
        onSuccess: (_, tag) => {
            void queryClient.invalidateQueries({ queryKey: tagKeys.list });
            void queryClient.invalidateQueries({
                queryKey: tagKeys.documents,
            });
            void queryClient.invalidateQueries({
                queryKey: documentKeys.searches,
            });
            toast.success(`Tag ${tag.path} deleted`);
        },
        onError: (error) => {
            toast.error(`Could not delete the tag: ${error.message}`);
        },
    });
}

export function useDocumentTags(documentId: number) {
    return useQuery({
        queryKey: tagKeys.document(documentId),
        queryFn: async () =>
            (await apiRequest<Wrapped<Tag[]>>(documentTags.index(documentId)))
                .data,
    });
}

export function useTagDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ documentId, tagId }: DocumentTag) =>
            (
                await apiRequest<Wrapped<Tag[]>>(
                    documentTags.store(documentId),
                    { tag_id: tagId },
                )
            ).data,
        onSuccess: (tags, { documentId }) => {
            queryClient.setQueryData(tagKeys.document(documentId), tags);
            void queryClient.invalidateQueries({
                queryKey: documentKeys.searches,
            });
            toast.success('Tag added');
        },
        onError: (error) => {
            toast.error(`Could not add the tag: ${error.message}`);
        },
    });
}

export function useUntagDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ documentId, tagId }: DocumentTag) =>
            apiRequest<null>(
                documentTags.destroy({ document: documentId, tag: tagId }),
            ),
        onSuccess: (_, { documentId, tagId }) => {
            queryClient.setQueryData<Tag[]>(
                tagKeys.document(documentId),
                (tags) => tags?.filter((tag) => tag.id !== tagId),
            );
            void queryClient.invalidateQueries({
                queryKey: documentKeys.searches,
            });
            toast.success('Tag removed');
        },
        onError: (error) => {
            toast.error(`Could not remove the tag: ${error.message}`);
        },
    });
}
