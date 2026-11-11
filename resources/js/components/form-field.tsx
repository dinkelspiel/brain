import { useId } from 'react';
import type { ComponentProps } from 'react';

type FormFieldProps = ComponentProps<'input'> & {
    label: string;
    error?: string;
};

export function FormField({ label, error, ...props }: FormFieldProps) {
    const id = useId();
    const errorId = `${id}-error`;

    return (
        <div className="space-y-1">
            <label htmlFor={id} className="block text-xs font-bold">
                {label}
            </label>
            <input
                id={id}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className="w-full rounded-sm border border-mauve-300 bg-white px-2 py-1 text-mauve-950 focus:border-mauve-700 focus:outline-none dark:border-mauve-700 dark:bg-mauve-900 dark:text-mauve-50 dark:focus:border-mauve-300"
                {...props}
            />
            {error && (
                <p
                    id={errorId}
                    className="text-xs text-red-700 dark:text-red-400"
                >
                    {error}
                </p>
            )}
        </div>
    );
}
