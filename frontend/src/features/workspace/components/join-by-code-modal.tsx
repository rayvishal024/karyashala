"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { ApiClientError } from "@/lib/api-client";
import { workspaceApi } from "../api/workspace.api";
import { useWorkspace } from "../hooks/use-workspace";

interface JoinByCodeModalProps {
     open: boolean;
     onClose: () => void;
}

export function JoinByCodeModal({ open, onClose }: JoinByCodeModalProps) {
     const router = useRouter();
     const { refreshWorkspaces } = useWorkspace();
     const [code, setCode] = useState("");
     const [error, setError] = useState<string | null>(null);
     const [submitting, setSubmitting] = useState(false);

     if (!open) return null;

     const handleSubmit = async (e: FormEvent) => {
          e.preventDefault();
          if (submitting) return;
          const normalized = code.trim().toUpperCase();
          if (normalized.length < 4) {
               setError("Please enter a valid invite code.");
               return;
          }

          setError(null);
          setSubmitting(true);
          try {
               const result = await workspaceApi.joinByCode(normalized);
               await refreshWorkspaces();
               setCode("");
               onClose();
               router.push(`/w/${result.workspaceSlug}`);
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Unable to join workspace with this code.",
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
                                   Join workspace by code
                              </h2>
                              <p
                                   style={{ color: "var(--text-secondary)" }}
                                   className="mt-0.5 text-xs"
                              >
                                   Enter a 7-character invite code shared by a workspace owner.
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
                                   htmlFor="join-code"
                                   className="mb-1.5 block text-xs font-medium"
                              >
                                   Invite code
                              </label>
                              <input
                                   id="join-code"
                                   type="text"
                                   required
                                   value={code}
                                   onChange={(e) => setCode(e.target.value.toUpperCase())}
                                   placeholder="K7M9P2X"
                                   style={{
                                        backgroundColor: "var(--bg-subtle)",
                                        borderColor: "var(--border-input)",
                                        color: "var(--text-primary)",
                                   }}
                                   className="h-9 w-full rounded-md border px-3 font-mono text-sm uppercase tracking-wider focus:outline-none"
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
                                   {submitting ? "Joining..." : "Join workspace"}
                              </button>
                         </div>
                    </form>
               </div>
          </div>
     );
}