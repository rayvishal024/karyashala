// src/shared/ui/input.tsx
"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
     hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
     { hasError = false, className = "", ...props },
     ref,
) {
     return (
          <input
               ref={ref}
               className={`h-9 w-full rounded-md border bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:outline-none ${hasError
                         ? "border-[var(--status-danger)] focus:border-[var(--status-danger)]"
                         : "border-[var(--border-subtle)] hover:border-[var(--border-strong)] focus:border-[var(--border-focus)]"
                    } disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
               {...props}
          />
     );
});