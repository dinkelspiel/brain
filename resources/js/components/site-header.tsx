import { Link, usePage } from '@inertiajs/react';
import { createContext, use } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
    useActiveDocumentId,
    useCloseDocumentTab,
    useDocumentTabShortcuts,
    useOpenDocuments,
} from '@/hooks/use-open-documents';
import { useLogout } from '@/hooks/use-session';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { show } from '@/routes/documents';

export const HeaderActionsContext = createContext<HTMLElement | null>(null);

const TAB_TITLE_LENGTH = 10;

const tabClassName = (isActive: boolean) =>
    cn(
        'flex shrink-0 items-center',
        isActive
            ? 'bg-mauve-800 text-white dark:bg-mauve-800 dark:text-mauve-50'
            : 'text-mauve-700 dark:text-mauve-300',
    );

function tabTitle(title: string): string {
    return title.length > TAB_TITLE_LENGTH
        ? `${title.slice(0, TAB_TITLE_LENGTH)}...`
        : title;
}

export function HeaderActions({ children }: { children: ReactNode }) {
    const container = use(HeaderActionsContext);

    return container ? createPortal(children, container) : null;
}

export function SiteHeader({
    actionsRef,
}: {
    actionsRef: (element: HTMLDivElement | null) => void;
}) {
    const { component, props } = usePage();
    const openDocuments = useOpenDocuments();
    const close = useCloseDocumentTab();
    const activeDocumentId = useActiveDocumentId();
    const logout = useLogout();

    useDocumentTabShortcuts();

    return (
        <header className="px-4 pt-3">
            <nav className="flex items-end gap-1 border-b-[3px] border-mauve-800 text-sm dark:border-mauve-800">
                <div className="flex min-w-0 items-end gap-1 overflow-x-auto">
                    <Link
                        href={home.url()}
                        className={cn(
                            tabClassName(component === 'documents/index'),
                            'px-3 py-0.5 hover:underline',
                        )}
                    >
                        index
                    </Link>
                    {openDocuments.data?.map((document) => (
                        <div
                            key={document.id}
                            className={tabClassName(
                                document.id === activeDocumentId,
                            )}
                        >
                            <Link
                                href={show.url(document.id)}
                                title={document.title}
                                className="py-0.5 pl-3 whitespace-nowrap hover:underline"
                            >
                                {tabTitle(document.title)}
                            </Link>
                            <button
                                type="button"
                                onClick={() => close(document.id)}
                                aria-label={`Close ${document.title}`}
                                className="px-2 py-0.5 opacity-70 hover:opacity-100"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex flex-1 items-baseline gap-2 pb-1">
                    <div
                        ref={actionsRef}
                        className="flex flex-1 items-baseline gap-2"
                    />
                    {props.auth.user && (
                        <div className="flex shrink-0 items-baseline gap-2 text-xs text-mauve-600 dark:text-mauve-400">
                            <span>{props.auth.user.username}</span>
                            <span aria-hidden>-</span>
                            <button
                                type="button"
                                onClick={() => logout.mutate()}
                                disabled={logout.isPending}
                                className="text-mauve-700 hover:underline disabled:opacity-50 dark:text-mauve-300"
                            >
                                log out
                            </button>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
}
