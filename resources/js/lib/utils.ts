import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDateTime(value: string) {
    return new Date(value).toLocaleString('sv-SE', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}
