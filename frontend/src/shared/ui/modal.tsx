// src/shared/ui/modal.tsx
"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
     open: boolean;
     onClose: () => void;
     title: string;
     description?: string;
     maxWidthClass?: string;
     children: ReactNode;
}

export function Modal({
     open,
     onClose,
     title,
     description,
     maxWidthClass = "max-w-md",
     children,
}: ModalProps) {
     useEffect(() => {
          if (!open) return;
          const onKeyDown = (e: KeyboardEvent) => {
               if (e.key === "Escape") onClose();
          };
          document.addEventListener("keydown", onKeyDown);
          document.body.style.overflow = "hidden";
          return () => {
               document.removeEventListener("keydown", onKeyDown);
               document.body.style.overflow = "";
          };
     }, [open, onClose]);

     if (!open) return null;

     return (
          <div
               className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
               onMouseDown={(e) => {
                    if (e.target === e.currentTarget) onClose();
               }}
          >
               <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    className={`w-full ${maxWidthClass} rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-modal)]`}
               >
                    <div className="flex items-start justify-between border-b border-[var(--border-subtle)] px-5 py-4">
                         <div>
                              <h2
                                   id="modal-title"
                                   className="text-sm font-semibold text-[var(--text-primary)]"
                              >
                                   {title}
                              </h2>
                              {description && (
                                   <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                                        {description}
                                   </p>
                              )}
                         </div>
                         <button
                              type="button"
                              onClick={onClose}
                              aria-label="Close modal"
                              className="rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                         >
                              <X className="h-4 w-4" />
                         </button>
                    </div>
                    <div className="p-5">{children}</div>
               </div>
          </div>
     );
}