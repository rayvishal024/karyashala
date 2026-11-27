"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { ApiClientError } from "@/lib/api-client";
import { apiFetch } from "@/lib/api-client";
import type { WorkspaceMemberItem } from "@/features/workspace";

interface TransferOwnershipModalProps {
     open: boolean;
     onClose: () => void;
     workspaceId: string;
     currentUserId: string;
     members: WorkspaceMemberItem[];
     onTransferred: () => void;
}

export function TransferOwnershipModal({
     open,
     onClose,
     workspaceId,
     currentUserId,
     members,
     onTransferred,
}: TransferOwnershipModalProps) {
     const candidates = members.filter((m) => m.userId !== currentUserId);
     const [selectedUserId, setSelectedUserId] = useState(
          candidates[0]?.userId || "",
     );
     const [confirmText, setConfirmText] = useState("");
     const [error, setError] = useState<string | null>(null);
     const [submitting, setSubmitting] = useState(false);

     if (!open) return null;

     const targetCandidate = candidates.find((c) => c.userId === selectedUserId);

     const handleSubmit = async (e: FormEvent) => {
          e.preventDefault();
          if (submitting || !selectedUserId) return;
          if (confirmText.trim().toUpperCase() !== "TRANSFER") {
               setError('Type "TRANSFER" to confirm ownership transfer.');
               return;
          }

          setError(null);
          setSubmitting(true);
          try {
               await apiFetch(
                    `/workspaces/${encodeURIComponent(workspaceId)}/transfer-ownership`,
                    {
                         method: "POST",
                         body: JSON.stringify({ newOwnerId: selectedUserId }),
                    },
               );
               setConfirmText("");
               onTransferred();
               onClose();
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to transfer ownership.",
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
                                   Transfer workspace ownership
                              </h2>
                              <p
                                   style={{ color: "var(--text-secondary)" }}
                                   className="mt-0.5 text-xs"
                              >
                                   Your role will change to EDITOR and the selected member will
                                   become OWNER.
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

                    {candidates.length === 0 ? (
                         <p
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-4 text-xs"
                         >
                              Invite at least one other member before transferring ownership.
                         </p>
                    ) : (
                         <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                              <div>
                                   <label
                                        htmlFor="new-owner"
                                        className="mb-1.5 block text-xs font-medium"
                                   >
                                        New workspace owner
                                   </label>
                                   <select
                                        id="new-owner"
                                        value={selectedUserId || candidates[0]?.userId || ""}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                        style={{
                                             backgroundColor: "var(--bg-subtle)",
                                             borderColor: "var(--border-input)",
                                             color: "var(--text-primary)",
                                        }}
                                        className="h-9 w-full rounded-md border px-3 text-xs font-medium focus:outline-none"
                                   >
                                        {candidates.map((m) => (
                                             <option key={m.id} value={m.userId}>
                                                  {m.user.name} ({m.user.email}) — {m.role}
                                             </option>
                                        ))}
                                   </select>
                              </div>

                              <div>
                                   <label
                                        htmlFor="confirm-transfer"
                                        className="mb-1.5 block text-xs font-medium"
                                   >
                                        Type <span className="font-mono">TRANSFER</span> to confirm
                                        {targetCandidate ? ` for ${targetCandidate.user.name}` : ""}
                                   </label>
                                   <input
                                        id="confirm-transfer"
                                        type="text"
                                        required
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        placeholder="TRANSFER"
                                        style={{
                                             backgroundColor: "var(--bg-subtle)",
                                             borderColor: "var(--border-input)",
                                             color: "var(--text-primary)",
                                        }}
                                        className="h-9 w-full rounded-md border px-3 font-mono text-xs focus:outline-none"
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
                                             backgroundColor: "var(--danger-bg)",
                                             borderColor: "var(--danger-border)",
                                             color: "var(--danger-text)",
                                        }}
                                        className="h-8 cursor-pointer rounded-md border px-3.5 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                                   >
                                        {submitting ? "Transferring..." : "Transfer ownership"}
                                   </button>
                              </div>
                         </form>
                    )}
               </div>
          </div>
     );
}