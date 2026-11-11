import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    const { name } = usePage().props;

    return (
        <div className="min-h-screen bg-white text-sm text-mauve-950 dark:bg-mauve-950 dark:text-mauve-100">
            <header className="px-4 pt-3">
                <p className="text-3xl leading-tight text-mauve-950 dark:text-mauve-50">
                    {name}
                </p>
                <div className="mt-3 border-b-[3px] border-mauve-800 dark:border-mauve-300" />
            </header>
            <main className="px-4 py-6">{children}</main>
        </div>
    );
}
