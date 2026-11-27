"use client";

import { useState, type FormEvent } from "react";
import { Mail, Link2, X, Check } from "lucide-react";
import { ApiClientError } from "@/lib/api-client";
import { inviteApi } from "../api/invite.api";
import type { InviteRoleOption } from "../types/invite.types";
import { InviteLinkCard } from "./invite-link-card";

interface InviteModalProps {
     open: boolean;
     onClose: () => void;
     workspaceId: string;
     workspaceName: string;
     canManage: boolean;
     initialTab?: "email" | "link";
     onInviteSent?: () => void;
}

export function InviteModal({
     open,
     onClose,
     workspaceId,
     workspaceName,
     canManage,
     initialTab = "email",
     onInviteSent,
}: InviteModalProps) {
     const [tab, setTab] = useState<"email" | "link">(initialTab);
     const [email, setEmail] = useState("");
     const [role, setRole] = useState<InviteRoleOption>("EDITOR");
     const [error, setError] = useState<string | null>(null);
     const [successMsg, setSuccessMsg] = useState<string | null>(null);
     const [submitting, setSubmitting] = useState(false);

     if (!open) return null;

     const handleEmailSubmit = async (e: FormEvent) => {
          e.preventDefault();
          if (submitting || !canManage) return;
          const trimmed = email.trim().toLowerCase();
          if (!trimmed) return;

          setError(null);
          setSuccessMsg(null);
          setSubmitting(true);

          try {
               await inviteApi.sendInvite(workspaceId, { email: trimmed, role });
               setSuccessMsg(`Invitation sent to ${trimmed} (${role}).`);
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
                    className="w-full max-w-lg rounded-xl border p-6"
               >
                    <div className="flex items-start justify-between gap-3">
                         <div>
                              <h2 className="text-base font-semibold tracking-tight">
                                   Invite people to {workspaceName}
                              </h2>
                              <p
                                   style={{ color: "var(--text-secondary)" }}
                                   className="mt-0.5 text-xs"
                              >
                                   Invite teammates directly by email or share an invite link &amp;
                                   code.
                              </p>
                         </div>
                         <button
                              type="button"
                              onClick={onClose}
                              disabled={submitting}
                              aria-label="Close invite modal"
                              style={{ color: "var(--text-muted)" }}
                              className="cursor-pointer rounded-md p-1 hover:opacity-80"
                         >
                              <X className="h-4 w-4" />
                         </button>
                    </div>

                    {/* Mode Switcher Tabs */}
                    <div
                         style={{
                              backgroundColor: "var(--bg-subtle)",
                              borderColor: "var(--border-hairline)",
                         }}
                         className="mt-4 grid grid-cols-2 gap-1 rounded-lg border p-1"
                    >
                         <button
                              type="button"
                              onClick={() => {
                                   setTab("email");
                                   setError(null);
                              }}
                              style={{
                                   backgroundColor:
                                        tab === "email" ? "var(--bg-surface)" : "transparent",
                                   color:
                                        tab === "email"
                                             ? "var(--text-primary)"
                                             : "var(--text-secondary)",
                              }}
                              className="flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors"
                         >
                              <Mail className="h-3.5 w-3.5" />
                              <span>Email invite</span>
                         </button>

                         <button
                              type="button"
                              onClick={() => {
                                   setTab("link");
                                   setError(null);
                              }}
                              style={{
                                   backgroundColor:
                                        tab === "link" ? "var(--bg-surface)" : "transparent",
                                   color:
                                        tab === "link"
                                             ? "var(--text-primary)"
                                             : "var(--text-secondary)",
                              }}
                              className="flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors"
                         >
                              <Link2 className="h-3.5 w-3.5" />
                              <span>Invite link &amp; code</span>
                         </button>
                    </div>

                    <div className="mt-4">
                         {tab === "email" ? (
                              !canManage ? (
                                   <p
                                        style={{ color: "var(--text-secondary)" }}
                                        className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-4 text-xs"
                                   >
                                        Only the workspace owner can send email invitations. You can
                                        still copy or use the invite link tab.
                                   </p>
                              ) : (
                                   <div>
                                        {error && (
                                             <div
                                                  style={{
                                                       backgroundColor: "var(--danger-bg)",
                                                       borderColor: "var(--danger-border)",
                                                       color: "var(--danger-text)",
                                                  }}
                                                  className="mb-3 rounded-md border px-3 py-2 text-xs"
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
                                                  className="mb-3 flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
                                             >
                                                  <Check className="h-3.5 w-3.5 shrink-0" />
                                                  <span>{successMsg}</span>
                                             </div>
                                        )}

                                        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                                             <div>
                                                  <label
                                                       htmlFor="modal-invite-email"
                                                       className="mb-1.5 block text-xs font-medium"
                                                  >
                                                       Email address
                                                  </label>
                                                  <input
                                                       id="modal-invite-email"
                                                       type="email"
                                                       required
                                                       value={email}
                                                       onChange={(e) => setEmail(e.target.value)}
                                                       placeholder="colleague@company.com"
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
                                                       htmlFor="modal-invite-role"
                                                       className="mb-1.5 block text-xs font-medium"
                                                  >
                                                       Role
                                                  </label>
                                                  <select
                                                       id="modal-invite-role"
                                                       value={role}
                                                       onChange={(e) =>
                                                            setRole(e.target.value as InviteRoleOption)
                                                       }
                                                       style={{
                                                            backgroundColor: "var(--bg-subtle)",
                                                            borderColor: "var(--border-input)",
                                                            color: "var(--text-primary)",
                                                       }}
                                                       className="h-9 w-full rounded-md border px-3 text-xs font-medium focus:outline-none"
                                                  >
                                                       <option value="EDITOR">
                                                            EDITOR — Can create &amp; edit items
                                                       </option>
                                                       <option value="VIEWER">VIEWER — Read-only access</option>
                                                  </select>
                                             </div>

                                             <div className="flex items-center justify-end gap-2 pt-2">
                                                  <button
                                                       type="button"
                                                       onClick={onClose}
                                                       style={{
                                                            backgroundColor: "var(--bg-subtle)",
                                                            borderColor: "var(--border-input)",
                                                            color: "var(--text-secondary)",
                                                       }}
                                                       className="h-8 cursor-pointer rounded-md border px-3 text-xs font-medium"
                                                  >
                                                       Close
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
                                                       {submitting ? "Sending..." : "Send invite"}
                                                  </button>
                                             </div>
                                        </form>
                                   </div>
                              )
                         ) : (
                              <InviteLinkCard
                                   workspaceId={workspaceId}
                                   canManage={canManage}
                              />
                         )}
                    </div>
               </div>
          </div>
     );
}