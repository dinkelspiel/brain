import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<"button"> & {
    size?: "default" | "sm";
};

export function Button({ className, size = "default", ...props }: ButtonProps) {
    return (
        <button
            type="button"
            className={cn(
                "inline-flex items-center gap-1 rounded-sm border border-mauve-300 bg-mauve-50 text-mauve-950 hover:border-mauve-400 hover:bg-mauve-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mauve-700 disabled:pointer-events-none disabled:opacity-50 dark:border-mauve-700 dark:bg-mauve-900 dark:text-mauve-100 dark:hover:border-mauve-600 dark:hover:bg-mauve-800 dark:focus-visible:outline-mauve-300",
                size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
                className,
            )}
            {...props}
        />
    );
}
