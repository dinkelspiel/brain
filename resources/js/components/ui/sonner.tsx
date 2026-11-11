import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";

export function Toaster(props: ComponentProps<typeof Sonner>) {
    return (
        <Sonner
            theme="dark"
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: "flex w-full items-center gap-2 rounded-sm border border-mauve-300 bg-white px-3 py-2 font-sans text-sm text-mauve-950 dark:border-mauve-700 dark:bg-mauve-900 dark:text-mauve-100",
                    success: "border-mauve-300 dark:border-mauve-700",
                    error: "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400",
                    description: "text-mauve-600 dark:text-mauve-400",
                },
            }}
            {...props}
        />
    );
}
