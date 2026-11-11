import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { cn, formatDateTime } from '@/lib/utils';

export type PaletteItem = {
    key: string;
    label: string;
    excerpt?: string | null;
    date?: string;
    run: () => void;
};

export function PaletteOptions({
    id,
    label,
    items,
    selectedIndex,
    onSelect,
    onRun,
    className,
}: {
    id: string;
    label: string;
    items: PaletteItem[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    onRun: (item: PaletteItem) => void;
    className?: string;
}) {
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        listRef.current
            ?.querySelector('[aria-selected="true"]')
            ?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    return (
        <ul
            ref={listRef}
            id={id}
            role="listbox"
            aria-label={label}
            className={cn(
                'divide-y divide-mauve-100 overflow-y-auto dark:divide-mauve-900',
                className,
            )}
        >
            {items.map((item, index) => (
                <li
                    key={item.key}
                    id={`${id}-${index}`}
                    role="option"
                    aria-selected={index === selectedIndex}
                    onMouseMove={() => onSelect(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onRun(item)}
                    className={cn(
                        'flex cursor-pointer items-baseline gap-3 px-3 py-1',
                        index === selectedIndex &&
                            'bg-mauve-100 dark:bg-mauve-900',
                    )}
                >
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-mauve-800 dark:text-mauve-300">
                            {item.label}
                        </div>
                        {item.excerpt && (
                            <div className="truncate text-xs text-mauve-600 dark:text-mauve-400">
                                {item.excerpt}
                            </div>
                        )}
                    </div>
                    {item.date && (
                        <span className="shrink-0 font-mono text-xs text-mauve-600 dark:text-mauve-400">
                            {formatDateTime(item.date)}
                        </span>
                    )}
                </li>
            ))}
        </ul>
    );
}

export function PaletteList({
    value,
    onValueChange,
    items,
    label,
    placeholder,
    isLoading = false,
    error,
    emptyMessage,
    onClose,
}: {
    value: string;
    onValueChange: (value: string) => void;
    items: PaletteItem[];
    label: string;
    placeholder: string;
    isLoading?: boolean;
    error?: string;
    emptyMessage: string;
    onClose: () => void;
}) {
    const listId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const selectedIndex = Math.min(activeIndex, items.length - 1);

    useEffect(() => {
        const input = inputRef.current;

        input?.setSelectionRange(input.value.length, input.value.length);
    }, []);

    function run(item: PaletteItem | undefined) {
        if (!item) {
            return;
        }

        onClose();
        item.run();
    }

    function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
        if (items.length === 0) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((selectedIndex + 1) % items.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((selectedIndex - 1 + items.length) % items.length);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            run(items[selectedIndex]);
        }
    }

    return (
        <div>
            <input
                ref={inputRef}
                autoFocus
                value={value}
                onChange={(event) => {
                    onValueChange(event.target.value);
                    setActiveIndex(0);
                }}
                onKeyDown={onKeyDown}
                role="combobox"
                aria-label={label}
                aria-expanded
                aria-controls={listId}
                aria-activedescendant={
                    items[selectedIndex]
                        ? `${listId}-${selectedIndex}`
                        : undefined
                }
                placeholder={placeholder}
                spellCheck={false}
                autoComplete="off"
                className="w-full border-b border-mauve-200 bg-transparent px-3 py-2 font-mono text-sm outline-none placeholder:text-mauve-500 dark:border-mauve-800 dark:placeholder:text-mauve-400"
            />
            <PaletteOptions
                id={listId}
                label={label}
                items={items}
                selectedIndex={selectedIndex}
                onSelect={setActiveIndex}
                onRun={run}
                className="max-h-96"
            />
            {error ? (
                <p className="px-3 py-2 text-center text-red-700 dark:text-red-400">
                    {error}
                </p>
            ) : (
                items.length === 0 &&
                !isLoading && (
                    <p className="px-3 py-2 text-center text-mauve-600 dark:text-mauve-400">
                        {emptyMessage}
                    </p>
                )
            )}
        </div>
    );
}
