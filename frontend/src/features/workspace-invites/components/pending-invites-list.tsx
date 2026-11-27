"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ApiClientError } from "@/lib/api-client";
import { inviteApi } from "../api/invite.api";
import type { WorkspaceInvitationItem } from "../types/invite.types";

interface PendingInvitesListProps {
     workspaceId: string;
     invitations: WorkspaceInvitationItem[];
     canManage: boolean;
     onChanged: () => void;
}

export function PendingInvitesList({
     workspaceId,
     invitations,
     canManage,
     onChanged,
}: PendingInvitesListProps) {
     const [revokingId, setRevokingId] = useState<string | null>(null);
     const [resendingId, setResendingId] = useState<string | null>(null);
     const [error, setError] = useState<string | null>(null);

     if (invitations.length === 0) {
          return null;
     }

     const handleRevoke = async (inviteId: string) => {
          if (!canManage || revokingId || resendingId) return;
          setError(null);
          setRevokingId(inviteId);
          try {
               await inviteApi.revokeInvite(workspaceId, inviteId);
               onChanged();
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to revoke invitation.",
               );
          } finally {
               setRevokingId(null);
          }
     };

     const handleResend = async (inviteId: string) => {
          if (!canManage || revokingId || resendingId) return;
          setError(null);
          setResendingId(inviteId);
          try {
               await inviteApi.resendInvite(workspaceId, inviteId);
               onChanged();
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to resend invitation.",
               );
          } finally {
               setResendingId(null);
          }
     };

     return (
          <div className="space-y-2.5">
               <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                         Pending Email Invitations ({invitations.length})
                    </h2>
               </div>

               {error && (
                    <div
                         style={{
                              backgroundColor: "var(--danger-bg)",
                              borderColor: "var(--danger-border)",
                              color: "var(--danger-text)",
                         }}
                         className="rounded-md border px-3 py-2 text-xs"
                    >
                         {error}
                    </div>
               )}

               <div
                    style={{
                         backgroundColor: "var(--bg-surface)",
                         borderColor: "var(--border-hairline)",
                    }}
                    className="divide-y divide-[var(--border-hairline)] overflow-hidden rounded-lg border"
               >
                    {invitations.map((inv) => {
                         return (
                              <div
                                   key={inv.id}
                                   className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                              >
                                   <div className="min-w-0">
                                        <p className="truncate text-xs font-medium">{inv.email}</p>
                                        <p
                                             style={{ color: "var(--text-muted)" }}
                                             className="text-[11px]"
                                        >
                                             Expires {new Date(inv.expiresAt).toLocaleDateString()}
                                        </p>
                                   </div>

                                   <div className="flex items-center gap-2">
                                        <span
                                             style={{
                                                  backgroundColor: "var(--bg-subtle)",
                                                  borderColor: "var(--border-hairline)",
                                                  color: "var(--text-secondary)",
                                             }}
                                             className="rounded border px-2 py-0.5 text-[11px] font-medium"
                                        >
                                             {inv.role}
                                        </span>

                                        {canManage && (
                                             <>
                                                  <button
                                                       type="button"
                                                       onClick={() => handleResend(inv.id)}
                                                       disabled={
                                                            revokingId !== null ||
                                                            resendingId !== null
                                                       }
                                                       aria-label={`Resend invite to ${inv.email}`}
                                                       style={{
                                                            backgroundColor: "var(--bg-subtle)",
                                                            borderColor: "var(--border-input)",
                                                            color: "var(--text-secondary)",
                                                       }}
                                                       className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border px-2 text-[11px] font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
                                                  >
                                                       <span>
                                                            {resendingId === inv.id
                                                                 ? "Resending..."
                                                                 : "Resend"}
                                                       </span>
                                                  </button>
                                                  <button
                                                       type="button"
                                                       onClick={() => handleRevoke(inv.id)}
                                                       disabled={
                                                            revokingId !== null ||
                                                            resendingId !== null
                                                       }
                                                       aria-label={`Revoke invite for ${inv.email}`}
                                                       style={{
                                                            backgroundColor: "var(--danger-bg)",
                                                            borderColor: "var(--danger-border)",
                                                            color: "var(--danger-text)",
                                                       }}
                                                       className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border px-2 text-[11px] font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
                                                  >
                                                       <Trash2 className="h-3 w-3" />
                                                       <span>
                                                            {revokingId === inv.id
                                                                 ? "Revoking..."
                                                                 : "Revoke"}
                                                       </span>
                                                  </button>
                                             </>
                                        )}
                                   </div>
                              </div>
                         );
                    })}
               </div>
          </div>
     );
}