import { useState } from 'react';
import type { ReactNode } from 'react';
import { CommandPalette } from '@/components/command-palette';
import { HeaderActionsContext, SiteHeader } from '@/components/site-header';

export default function AppLayout({ children }: { children: ReactNode }) {
    const [actionsContainer, setActionsContainer] =
        useState<HTMLDivElement | null>(null);

    return (
        <HeaderActionsContext value={actionsContainer}>
            <CommandPalette>
                <div className="min-h-screen bg-white text-sm text-mauve-950 dark:bg-mauve-950 dark:text-mauve-100">
                    <SiteHeader actionsRef={setActionsContainer} />
                    <main className="px-4 py-3">{children}</main>
                </div>
            </CommandPalette>
        </HeaderActionsContext>
    );
}
