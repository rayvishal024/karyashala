"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Mail, X, Check } from "lucide-react";
import { ApiClientError } from "@/lib/api-client";
import { inviteApi } from "../api/invite.api";
import type { InviteRoleOption } from "../types/invite.types";

interface InviteMemberModalProps {
     open: boolean;
     onClose: () => void;
     workspaceId: string;
     workspaceName: string;
     onInviteSent?: () => void;
}

export function InviteMemberModal({
     open,
     onClose,
     workspaceId,
     workspaceName,
     onInviteSent,
}: InviteMemberModalProps) {
     const [email, setEmail] = useState("");
     const [role, setRole] = useState<InviteRoleOption>("EDITOR");
     const [error, setError] = useState<string | null>(null);
     const [successMsg, setSuccessMsg] = useState<string | null>(null);
     const [submitting, setSubmitting] = useState(false);

     useEffect(() => {
          if (!open) return;
          const handleKeyDown = (event: KeyboardEvent) => {
               if (event.key === "Escape" && !submitting) onClose();
          };
          window.addEventListener("keydown", handleKeyDown);
          return () => window.removeEventListener("keydown", handleKeyDown);
     }, [onClose, open, submitting]);

     if (!open) return null;

     const handleSubmit = async (e: FormEvent) => {
          e.preventDefault();
          if (submitting) return;
          const trimmedEmail = email.trim().toLowerCase();
          if (!trimmedEmail) return;

          setError(null);
          setSuccessMsg(null);
          setSubmitting(true);

          try {
               await inviteApi.sendInvite(workspaceId, {
                    email: trimmedEmail,
                    role,
               });
               setSuccessMsg(`Invitation sent to ${trimmedEmail} as ${role}.`);
               setEmail("");
               onInviteSent?.();
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Unable to send invitation.",
               );
          } finally {
               setSubmitting(false);
          }
     };

     return (
          <div
               className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
               onMouseDown={(e) => {
                    if (e.target === e.currentTarget && !submitting) onClose();
               }}
          >
               <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="invite-member-modal-title"
                    style={{
                         backgroundColor: "var(--bg-surface)",
                         borderColor: "var(--border-hairline)",
                         color: "var(--text-primary)",
                    }}
                    className="w-full max-w-md rounded-lg border p-6"
               >
                    <div className="flex items-start justify-between">
                         <div>
                              <h2 id="invite-member-modal-title" className="text-base font-semibold tracking-tight">
                                   Invite to {workspaceName}
                              </h2>
                              <p
                                   style={{ color: "var(--text-secondary)" }}
                                   className="mt-0.5 text-xs"
                              >
                                   Send a single-use invitation link via email.
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

                    {successMsg && (
                         <div
                              style={{
                                   backgroundColor: "var(--bg-subtle)",
                                   borderColor: "var(--border-hairline)",
                                   color: "var(--success-text)",
                              }}
                              className="mt-4 flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
                         >
                              <Check className="h-3.5 w-3.5 shrink-0" />
                              <span>{successMsg}</span>
                         </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                         <div>
                              <label
                                   htmlFor="invite-email"
                                   className="mb-1.5 block text-xs font-medium"
                              >
                                   Teammate email
                              </label>
                              <div className="relative">
                                   <Mail
                                        style={{ color: "var(--text-muted)" }}
                                        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                                   />
                                   <input
                                        id="invite-email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="teammate@company.com"
                                        style={{
                                             backgroundColor: "var(--bg-subtle)",
                                             borderColor: "var(--border-input)",
                                             color: "var(--text-primary)",
                                        }}
                                        className="h-9 w-full rounded-md border pl-9 pr-3 text-sm focus:outline-none"
                                   />
                              </div>
                         </div>

                         <div>
                              <label
                                   htmlFor="invite-role"
                                   className="mb-1.5 block text-xs font-medium"
                              >
                                   Role on join
                              </label>
                              <select
                                   id="invite-role"
                                   value={role}
                                   onChange={(e) => setRole(e.target.value as InviteRoleOption)}
                                   style={{
                                        backgroundColor: "var(--bg-subtle)",
                                        borderColor: "var(--border-input)",
                                        color: "var(--text-primary)",
                                   }}
                                   className="h-9 w-full rounded-md border px-3 text-xs font-medium focus:outline-none"
                              >
                                   <option value="EDITOR">EDITOR — Can create and edit content</option>
                                   <option value="VIEWER">VIEWER — Read-only workspace access</option>
                              </select>
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
                                   Done
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
                                   {submitting ? "Sending..." : "Send invitation"}
                              </button>
                         </div>
                    </form>
               </div>
          </div>
     );
}