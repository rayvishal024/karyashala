"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function ConfirmDeleteModal({
     open,
     title,
     deleting = false,
     error,
     onCancel,
     onConfirm,
}: {
     open: boolean;
     title: string;
     deleting?: boolean;
     error?: string | null;
     onCancel: () => void;
     onConfirm: () => void;
}) {
     const cancelRef = useRef<HTMLButtonElement>(null);
     const cancelActionRef = useRef(onCancel);
     const deletingRef = useRef(deleting);

     useEffect(() => {
          cancelActionRef.current = onCancel;
          deletingRef.current = deleting;
     }, [deleting, onCancel]);

     useEffect(() => {
          if (!open) return;

          const previousOverflow = document.body.style.overflow;
          const previousFocus = document.activeElement;
          document.body.style.overflow = "hidden";
          cancelRef.current?.focus();

          const handleKeyDown = (event: KeyboardEvent) => {
               if (event.key === "Escape") {
                    event.preventDefault();
                    if (!deletingRef.current) cancelActionRef.current();
                    return;
               }

               if (event.key !== "Tab") return;
               const dialog = cancelRef.current?.closest("[role='dialog']");
               if (!dialog) return;
               const focusable = Array.from(
                    dialog.querySelectorAll<HTMLElement>(
                         "button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex='-1'])",
                    ),
               );
               if (focusable.length === 0) return;

               const first = focusable[0];
               const last = focusable[focusable.length - 1];
               if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
               } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
               }
          };

          document.addEventListener("keydown", handleKeyDown);
          return () => {
               document.removeEventListener("keydown", handleKeyDown);
               document.body.style.overflow = previousOverflow;
               if (previousFocus instanceof HTMLElement) previousFocus.focus();
          };
     }, [open]);

     if (!open || typeof document === "undefined") return null;

     return createPortal(
          <div
               className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
               onClick={(event) => {
                    if (
                         event.target === event.currentTarget &&
                         !deletingRef.current
                    ) {
                         cancelActionRef.current();
                    }
               }}
          >
               <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-delete-title"
                    aria-describedby="confirm-delete-description"
                    style={{
                         backgroundColor: "var(--bg-surface)",
                         borderColor: "var(--border-hairline)",
                         color: "var(--text-primary)",
                    }}
                    className="w-full max-w-md rounded-lg border p-5 text-left"
               >
                    <h2
                         id="confirm-delete-title"
                         className="text-sm font-semibold tracking-tight"
                    >
                         Delete document?
                    </h2>
                    <p
                         id="confirm-delete-description"
                         style={{ color: "var(--text-secondary)" }}
                         className="mt-2 text-xs leading-relaxed"
                    >
                         Delete{" "}
                         <span className="font-medium text-[var(--text-primary)]">
                              &ldquo;{title}&rdquo;
                         </span>
                         ? This action cannot be undone.
                    </p>
                    {error && (
                         <p
                              role="alert"
                              style={{ color: "var(--danger-text)" }}
                              className="mt-3 text-xs"
                         >
                              {error}
                         </p>
                    )}
                    <div className="mt-6 flex justify-end gap-2">
                         <button
                              ref={cancelRef}
                              type="button"
                              onClick={onCancel}
                              disabled={deleting}
                              style={{
                                   borderColor: "var(--border-hairline)",
                                   color: "var(--text-secondary)",
                              }}
                              className="h-8 cursor-pointer rounded-md border px-3 text-xs font-medium transition-colors hover:bg-[var(--bg-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
                         >
                              Cancel
                         </button>
                         <button
                              type="button"
                              onClick={onConfirm}
                              disabled={deleting}
                              style={{
                                   backgroundColor: "var(--danger-text)",
                                   color: "var(--bg-canvas)",
                              }}
                              className="h-8 cursor-pointer rounded-md px-3 text-xs font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                         >
                              {deleting ? "Deleting..." : "Delete document"}
                         </button>
                    </div>
               </section>
          </div>,
          document.body,
     );
}
