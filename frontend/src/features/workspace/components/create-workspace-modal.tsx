"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { ApiClientError } from "@/lib/api-client";
import { useWorkspace } from "../hooks/use-workspace";

interface CreateWorkspaceModalProps {
     open: boolean;
     onClose: () => void;
}

export function CreateWorkspaceModal({
     open,
     onClose,
}: CreateWorkspaceModalProps) {
     const { createWorkspace } = useWorkspace();
     const [name, setName] = useState("");
     const [description, setDescription] = useState("");
     const [error, setError] = useState<string | null>(null);
     const [submitting, setSubmitting] = useState(false);

     if (!open) return null;

     const handleSubmit = async (e: FormEvent) => {
          e.preventDefault();
          if (submitting) return;
          const trimmedName = name.trim();
          if (trimmedName.length < 2) {
               setError("Workspace name must be at least 2 characters.");
               return;
          }

          setError(null);
          setSubmitting(true);
          try {
               await createWorkspace({
                    name: trimmedName,
                    description: description.trim() || undefined,
               });
               setName("");
               setDescription("");
               onClose();
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Could not create workspace.",
               );
          } finally {
               setSubmitting(false);
          }
     };

     return (
          <div
               className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
               onMouseDown={(e) => {
                    if (e.target === e.currentTarget && !submitting) onClose();
               }}
          >
               <div
                    role="dialog"
                    aria-modal="true"
                    style={{
                         backgroundColor: "var(--bg-surface)",
                         borderColor: "var(--border-hairline)",
                         color: "var(--text-primary)",
                    }}
                    className="w-full max-w-md rounded-lg border p-6"
               >
                    <div className="flex items-start justify-between">
                         <div>
                              <h2 className="text-base font-semibold tracking-tight">
                                   Create workspace
                              </h2>
                              <p
                                   style={{ color: "var(--text-secondary)" }}
                                   className="mt-0.5 text-xs"
                              >
                                   Start a new team space with isolated members and settings.
                              </p>
                         </div>
                         <button
                              type="button"
                              onClick={onClose}
                              disabled={submitting}
                              aria-label="Close modal"
                              style={{ color: "var(--text-muted)" }}
                              className="cursor-pointer rounded-md p-1 hover:opacity-80"
                         >
                              <X className="h-4 w-4" />
                         </button>
                    </div>

                    {error && (
                         <div
                              style={{
                                   backgroundColor: "var(--danger-bg)",
                                   borderColor: "var(--danger-border)",
                                   color: "var(--danger-text)",
                              }}
                              className="mt-4 rounded-md border px-3 py-2 text-xs"
                         >
                              {error}
                         </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                         <div>
                              <label
                                   htmlFor="ws-name"
                                   className="mb-1.5 block text-xs font-medium"
                              >
                                   Workspace name
                              </label>
                              <input
                                   id="ws-name"
                                   type="text"
                                   required
                                   minLength={2}
                                   maxLength={80}
                                   value={name}
                                   onChange={(e) => setName(e.target.value)}
                                   placeholder="Core Engineering"
                                   style={{
                                        backgroundColor: "var(--bg-subtle)",
                                        borderColor: "var(--border-input)",
                                        color: "var(--text-primary)",
                                   }}
                                   className="h-9 w-full rounded-md border px-3 text-sm focus:outline-none"
                              />
                         </div>

                         <div>
                              <label
                                   htmlFor="ws-desc"
                                   className="mb-1.5 block text-xs font-medium"
                              >
                                   Description{" "}
                                   <span style={{ color: "var(--text-muted)" }} className="font-normal">
                                        (optional)
                                   </span>
                              </label>
                              <textarea
                                   id="ws-desc"
                                   rows={2}
                                   maxLength={240}
                                   value={description}
                                   onChange={(e) => setDescription(e.target.value)}
                                   placeholder="Product roadmap, specs, and sprint notes"
                                   style={{
                                        backgroundColor: "var(--bg-subtle)",
                                        borderColor: "var(--border-input)",
                                        color: "var(--text-primary)",
                                   }}
                                   className="w-full resize-none rounded-md border p-2.5 text-sm focus:outline-none"
                              />
                         </div>

                         <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                   type="button"
                                   onClick={onClose}
                                   disabled={submitting}
                                   style={{
                                        backgroundColor: "var(--bg-subtle)",
                                        borderColor: "var(--border-input)",
                                        color: "var(--text-secondary)",
                                   }}
                                   className="h-8 cursor-pointer rounded-md border px-3 text-xs font-medium"
                              >
                                   Cancel
                              </button>
                              <button
                                   type="submit"
                                   disabled={submitting}
                                   style={{
                                        backgroundColor: "var(--cta-bg)",
                                        color: "var(--cta-fg)",
                                   }}
                                   className="h-8 cursor-pointer rounded-md px-3.5 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                              >
                                   {submitting ? "Creating..." : "Create workspace"}
                              </button>
                         </div>
                    </form>
               </div>
          </div>
     );
}