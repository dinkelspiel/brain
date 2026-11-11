import { createInertiaApp } from '@inertiajs/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const queryClient = new QueryClient();

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => (name.startsWith('auth/') ? AuthLayout : AppLayout),
    withApp: (app) => (
        <QueryClientProvider client={queryClient}>
            {app}
            <Toaster position="top-center" />
        </QueryClientProvider>
    ),
    progress: {
        color: 'var(--color-mauve-700)',
    },
});
