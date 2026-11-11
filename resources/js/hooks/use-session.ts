import { router } from '@inertiajs/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    destroy,
    store,
} from '@/actions/App/Http/Controllers/Api/V1/SessionController';
import SetupController from '@/actions/App/Http/Controllers/Api/V1/SetupController';
import { apiRequest } from '@/lib/api';
import { home, login } from '@/routes';
import type { User } from '@/types';

type Wrapped<T> = { data: T };

export type SetupInput = {
    username: string;
    password: string;
    password_confirmation: string;
};

export type LoginInput = {
    username: string;
    password: string;
    remember: boolean;
};

export function useSetup() {
    return useMutation({
        mutationFn: async (input: SetupInput) =>
            (await apiRequest<Wrapped<User>>(SetupController(), input)).data,
        onSuccess: (user) => {
            toast.success(`Account ${user.username} created`);
            router.visit(home.url());
        },
    });
}

export function useLogin() {
    return useMutation({
        mutationFn: async (input: LoginInput) =>
            (await apiRequest<Wrapped<User>>(store(), input)).data,
        onSuccess: () => router.visit(home.url()),
    });
}

export function useLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => apiRequest<null>(destroy()),
        onSuccess: () => {
            queryClient.clear();
            router.visit(login.url());
        },
        onError: (error) => {
            toast.error(`Could not log out: ${error.message}`);
        },
    });
}
