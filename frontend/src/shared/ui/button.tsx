// src/shared/ui/button.tsx
"use client";

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
     variant?: ButtonVariant;
     size?: ButtonSize;
     loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
     primary:
          "bg-[var(--accent-primary)] text-[var(--accent-primary-fg)] hover:bg-[var(--accent-primary-hover)] border border-transparent shadow-[var(--shadow-sm)]",
     secondary:
          "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] shadow-[var(--shadow-sm)]",
     ghost:
          "bg-transparent text-[var(--text-secondary)] border border-transparent hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
     danger:
          "bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger-border)] hover:opacity-90",
};

const sizeStyles: Record<ButtonSize, string> = {
     sm: "h-8 px-2.5 text-xs gap-1.5",
     md: "h-9 px-3.5 text-sm gap-2",
     lg: "h-10 px-4 text-sm gap-2",
};

export function Button({
     variant = "primary",
     size = "md",
     loading = false,
     disabled,
     className = "",
     children,
     ...props
}: ButtonProps) {
     return (
          <button
               disabled={disabled || loading}
               className={`inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
               {...props}
          >
               {loading && (
                    <span
                         aria-hidden="true"
                         className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                    />
               )}
               {children}
          </button>
     );
}