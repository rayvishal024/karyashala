"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, LogOut, ArrowRightLeft, UserMinus } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/features/auth";
import {
     InviteLinkCard,
     InviteMemberModal,
     PendingInvitesList,
     inviteApi,
     type WorkspaceInvitationItem,
} from "@/features/workspace-invites";
import {
     workspaceApi,
     useWorkspace,
     type WorkspaceMemberItem,
} from "@/features/workspace";
import { TransferOwnershipModal } from "./transfer-ownership-modal";

export function WorkspaceMembersPanel() {
     const router = useRouter();
     const { user } = useAuth();
     const {
          currentWorkspace,
          canManageWorkspace,
          loadWorkspaceBySlug,
          refreshWorkspaces,
     } = useWorkspace();

     const [members, setMembers] = useState<WorkspaceMemberItem[]>([]);
     const [invitations, setInvitations] = useState<WorkspaceInvitationItem[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     const [actionBusyId, setActionBusyId] = useState<string | null>(null);
     const [leaving, setLeaving] = useState(false);

     const [inviteModalOpen, setInviteModalOpen] = useState(false);
     const [transferModalOpen, setTransferModalOpen] = useState(false);
     const workspaceId = currentWorkspace?.id;

     const loadData = useCallback(async () => {
          if (!workspaceId) return;
          try {
               const membersRes = await workspaceApi.listMembers(workspaceId);
               setMembers(membersRes.members);

               if (canManageWorkspace) {
                    try {
                         const invitesRes = await inviteApi.listPendingInvites(
                              workspaceId,
                         );
                         setInvitations(invitesRes.invitations);
                    } catch {
                         setInvitations([]);
                    }
               } else {
                    setInvitations([]);
               }
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to load members.",
               );
          } finally {
               setLoading(false);
          }
     }, [workspaceId, canManageWorkspace]);

     useEffect(() => {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Load members when the workspace changes.
          loadData();
     }, [loadData]);

     if (!currentWorkspace || !user) return null;

     const handleRoleChange = async (
          memberId: string,
          role: "EDITOR" | "VIEWER",
     ) => {
          if (!canManageWorkspace || actionBusyId) return;
          setError(null);
          setActionBusyId(memberId);
          try {
               await apiFetch(
                    `/workspaces/${encodeURIComponent(currentWorkspace.id)}/members/${encodeURIComponent(memberId)}/role`,
                    {
                         method: "PATCH",
                         body: JSON.stringify({ role }),
                    },
               );
               await loadData();
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to update member role.",
               );
          } finally {
               setActionBusyId(null);
          }
     };

     const handleRemoveMember = async (memberId: string) => {
          if (!canManageWorkspace || actionBusyId) return;
          setError(null);
          setActionBusyId(memberId);
          try {
               await apiFetch(
                    `/workspaces/${encodeURIComponent(currentWorkspace.id)}/members/${encodeURIComponent(memberId)}`,
                    {
                         method: "DELETE",
                    },
               );
               await loadData();
          } catch (err) {
               setError(
                    err instanceof ApiClientError ? err.message : "Failed to remove member.",
               );
          } finally {
               setActionBusyId(null);
          }
     };

     const handleLeaveWorkspace = async () => {
          if (leaving) return;
          setError(null);
          setLeaving(true);
          try {
               await apiFetch(
                    `/workspaces/${encodeURIComponent(currentWorkspace.id)}/leave`,
                    {
                         method: "POST",
                    },
               );
               await refreshWorkspaces();
               router.replace("/dashboard");
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Unable to leave workspace.",
               );
               setLeaving(false);
          }
     };

     const handleOwnershipTransferred = async () => {
          await loadWorkspaceBySlug(currentWorkspace.slug);
          await loadData();
     };

     return (
          <div className="space-y-6">
               {/* Header & Actions */}
               <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                         <h1 className="text-lg font-semibold tracking-tight">Members</h1>
                         <p
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-0.5 text-xs"
                         >
                              Manage team access and roles inside {currentWorkspace.name}.
                         </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                         {canManageWorkspace && (
                              <>
                                   <button
                                        type="button"
                                        onClick={() => setTransferModalOpen(true)}
                                        style={{
                                             backgroundColor: "var(--bg-surface)",
                                             borderColor: "var(--border-input)",
                                             color: "var(--text-primary)",
                                        }}
                                        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-xs font-medium"
                                   >
                                        <ArrowRightLeft className="h-3.5 w-3.5" />
                                        <span>Transfer ownership</span>
                                   </button>

                                   <button
                                        type="button"
                                        onClick={() => setInviteModalOpen(true)}
                                        style={{
                                             backgroundColor: "var(--cta-bg)",
                                             color: "var(--cta-fg)",
                                        }}
                                        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium"
                                   >
                                        <UserPlus className="h-3.5 w-3.5" />
                                        <span>Invite member</span>
                                   </button>
                              </>
                         )}

                         {!canManageWorkspace && (
                              <button
                                   type="button"
                                   onClick={handleLeaveWorkspace}
                                   disabled={leaving}
                                   style={{
                                        backgroundColor: "var(--danger-bg)",
                                        borderColor: "var(--danger-border)",
                                        color: "var(--danger-text)",
                                   }}
                                   className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-xs font-medium disabled:opacity-50"
                              >
                                   <LogOut className="h-3.5 w-3.5" />
                                   <span>{leaving ? "Leaving..." : "Leave workspace"}</span>
                              </button>
                         )}
                    </div>
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

               {/* Active Members Table/List */}
               <div
                    style={{
                         backgroundColor: "var(--bg-surface)",
                         borderColor: "var(--border-hairline)",
                    }}
                    className="overflow-hidden rounded-lg border"
               >
                    {loading ? (
                         <div
                              style={{ color: "var(--text-muted)" }}
                              className="p-6 text-center text-xs"
                         >
                              Loading members...
                         </div>
                    ) : members.length === 0 ? (
                         <div
                              style={{ color: "var(--text-muted)" }}
                              className="p-6 text-center text-xs"
                         >
                              No members found.
                         </div>
                    ) : (
                         <div className="divide-y divide-[var(--border-hairline)]">
                              {members.map((m) => {
                                   const isOwner = m.role === "OWNER";
                                   const isSelf = m.userId === user.id;
                                   const isBusy = actionBusyId === m.id;

                                   return (
                                        <div
                                             key={m.id}
                                             className="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
                                        >
                                             <div className="min-w-0">
                                                  <div className="flex items-center gap-2">
                                                       <p className="truncate text-xs font-medium">
                                                            {m.user.name}
                                                       </p>
                                                       {isSelf && (
                                                            <span
                                                                 style={{ color: "var(--text-muted)" }}
                                                                 className="text-[10px]"
                                                            >
                                                                 (you)
                                                            </span>
                                                       )}
                                                  </div>
                                                  <p
                                                       style={{ color: "var(--text-muted)" }}
                                                       className="truncate text-xs"
                                                  >
                                                       {m.user.email}
                                                  </p>
                                             </div>

                                             <div className="flex items-center gap-2">
                                                  {canManageWorkspace && !isOwner ? (
                                                       <>
                                                            <select
                                                                 aria-label={`Role for ${m.user.name}`}
                                                                 value={m.role === "VIEWER" ? "VIEWER" : "EDITOR"}
                                                                 disabled={isBusy}
                                                                 onChange={(e) =>
                                                                      handleRoleChange(
                                                                           m.id,
                                                                           e.target.value as "EDITOR" | "VIEWER",
                                                                      )
                                                                 }
                                                                 style={{
                                                                      backgroundColor: "var(--bg-subtle)",
                                                                      borderColor: "var(--border-input)",
                                                                      color: "var(--text-primary)",
                                                                 }}
                                                                 className="h-7 rounded border px-2 text-xs font-medium focus:outline-none disabled:opacity-50"
                                                            >
                                                                 <option value="EDITOR">EDITOR</option>
                                                                 <option value="VIEWER">VIEWER</option>
                                                            </select>

                                                            <button
                                                                 type="button"
                                                                 onClick={() => handleRemoveMember(m.id)}
                                                                 disabled={isBusy}
                                                                 aria-label={`Remove ${m.user.name}`}
                                                                 style={{
                                                                      backgroundColor: "var(--danger-bg)",
                                                                      borderColor: "var(--danger-border)",
                                                                      color: "var(--danger-text)",
                                                                 }}
                                                                 className="inline-flex h-7 cursor-pointer items-center gap-1 rounded border px-2 text-[11px] font-medium disabled:opacity-50"
                                                            >
                                                                 <UserMinus className="h-3 w-3" />
                                                                 <span>Remove</span>
                                                            </button>
                                                       </>
                                                  ) : (
                                                       <span
                                                            style={{
                                                                 backgroundColor: "var(--bg-subtle)",
                                                                 borderColor: "var(--border-hairline)",
                                                                 color: "var(--text-secondary)",
                                                            }}
                                                            className="rounded border px-2 py-0.5 text-[11px] font-medium"
                                                       >
                                                            {m.role}
                                                       </span>
                                                  )}
                                             </div>
                                        </div>
                                   );
                              })}
                         </div>
                    )}
               </div>

               {/* Pending Invites (Owner) */}
               {canManageWorkspace && (
                    <PendingInvitesList
                         workspaceId={currentWorkspace.id}
                         invitations={invitations}
                         canManage={canManageWorkspace}
                         onChanged={loadData}
                    />
               )}

               {/* Invite Link & Code Card */}
               <InviteLinkCard
                    workspaceId={currentWorkspace.id}
                    canManage={canManageWorkspace}
               />

               {/* Modals */}
               <InviteMemberModal
                    open={inviteModalOpen}
                    onClose={() => setInviteModalOpen(false)}
                    workspaceId={currentWorkspace.id}
                    workspaceName={currentWorkspace.name}
                    onInviteSent={loadData}
               />

               <TransferOwnershipModal
                    open={transferModalOpen}
                    onClose={() => setTransferModalOpen(false)}
                    workspaceId={currentWorkspace.id}
                    currentUserId={user.id}
                    members={members}
                    onTransferred={handleOwnershipTransferred}
               />
          </div>
     );
}