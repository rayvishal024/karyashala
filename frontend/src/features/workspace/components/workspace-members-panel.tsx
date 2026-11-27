"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { ApiClientError } from "@/lib/api-client";
import { workspaceApi } from "../api/workspace.api";
import { useWorkspace } from "../hooks/use-workspace";
import {
     InviteLinkCard,
     InviteMemberModal,
     PendingInvitesList,
     inviteApi,
     type WorkspaceInvitationItem,
} from "@/features/workspace-invites";
import type {
     WorkspaceMemberItem,
     WorkspaceRole,
} from "../types/workspace.types";

export function WorkspaceMembersPanel() {
     const {
          currentWorkspace,
          leaveCurrentWorkspace,
          refreshCurrentWorkspace,
     } = useWorkspace();
     const [members, setMembers] = useState<WorkspaceMemberItem[]>([]);
     const [invitations, setInvitations] = useState<WorkspaceInvitationItem[]>([]);
     const [loading, setLoading] = useState(true);
     const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
     const [leaving, setLeaving] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const [status, setStatus] = useState<string | null>(null);
     const [inviteOpen, setInviteOpen] = useState(false);
     const workspaceId = currentWorkspace?.id;
     const canManageMembers = currentWorkspace?.role === "OWNER";

     const loadMembers = useCallback(async () => {
          if (!workspaceId) return;
          setLoading(true);
          try {
               const response = await workspaceApi.listMembers(workspaceId);
               setMembers(response.members);
               if (canManageMembers) {
                    const inviteResponse =
                         await inviteApi.listPendingInvites(workspaceId);
                    setInvitations(inviteResponse.invitations);
               } else {
                    setInvitations([]);
               }
               setError(null);
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to load members.",
               );
          } finally {
               setLoading(false);
          }
     }, [canManageMembers, workspaceId]);

     useEffect(() => {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetch members when the workspace changes.
          void loadMembers();
     }, [loadMembers]);

     if (!currentWorkspace) return null;

     const handleRoleChange = async (
          member: WorkspaceMemberItem,
          role: Extract<WorkspaceRole, "EDITOR" | "VIEWER">,
     ) => {
          setPendingMemberId(member.id);
          setError(null);
          setStatus(null);
          try {
               const response = await workspaceApi.updateMemberRole(
                    currentWorkspace.id,
                    member.id,
                    role,
               );
               setMembers((previous) =>
                    previous.map((item) =>
                         item.id === member.id ? response.member : item,
                    ),
               );
               setStatus(`Updated ${member.user.name}'s role.`);
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to update member role.",
               );
          } finally {
               setPendingMemberId(null);
          }
     };

     const handleTransferOwnership = async (member: WorkspaceMemberItem) => {
          if (
               !window.confirm(
                    `Transfer workspace ownership to ${member.user.name}? You will become an editor.`,
               )
          ) {
               return;
          }
          setPendingMemberId(member.id);
          setError(null);
          setStatus(null);
          try {
               await workspaceApi.transferOwnership(currentWorkspace.id, {
                    newOwnerId: member.userId,
               });
               await Promise.all([refreshCurrentWorkspace(), loadMembers()]);
               setStatus(`Ownership transferred to ${member.user.name}.`);
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to transfer workspace ownership.",
               );
          } finally {
               setPendingMemberId(null);
          }
     };

     const handleRemoveMember = async (member: WorkspaceMemberItem) => {
          if (!window.confirm(`Remove ${member.user.name} from this workspace?`)) {
               return;
          }
          setPendingMemberId(member.id);
          setError(null);
          setStatus(null);
          try {
               await workspaceApi.removeMember(currentWorkspace.id, member.id);
               setMembers((previous) =>
                    previous.filter((item) => item.id !== member.id),
               );
               setStatus(`${member.user.name} was removed from the workspace.`);
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to remove member.",
               );
          } finally {
               setPendingMemberId(null);
          }
     };

     const handleLeaveWorkspace = async () => {
          if (!window.confirm("Leave this workspace?")) return;
          setLeaving(true);
          setError(null);
          try {
               await leaveCurrentWorkspace();
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to leave workspace.",
               );
               setLeaving(false);
          }
     };

     return (
          <div className="space-y-4">
               <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                         <h1 className="text-lg font-semibold tracking-tight">Members</h1>
                         <p
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-0.5 text-xs"
                         >
                              Manage members and invitations for {currentWorkspace.name}.
                         </p>
                    </div>
                    {canManageMembers && (
                         <button
                              type="button"
                              onClick={() => setInviteOpen(true)}
                              style={{
                                   backgroundColor: "var(--cta-bg)",
                                   color: "var(--cta-fg)",
                              }}
                              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium"
                         >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span>Invite member</span>
                         </button>
                    )}
                    {currentWorkspace.role !== "OWNER" && (
                         <button
                              type="button"
                              onClick={handleLeaveWorkspace}
                              disabled={leaving}
                              style={{
                                   backgroundColor: "var(--danger-bg)",
                                   borderColor: "var(--danger-border)",
                                   color: "var(--danger-text)",
                              }}
                              className="h-8 cursor-pointer rounded-md border px-3 text-xs font-medium disabled:opacity-50"
                         >
                              {leaving ? "Leaving..." : "Leave workspace"}
                         </button>
                    )}
               </div>

               {error && (
                    <div
                         role="alert"
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
               {status && (
                    <div
                         role="status"
                         style={{
                              backgroundColor: "var(--bg-subtle)",
                              borderColor: "var(--border-hairline)",
                              color: "var(--success-text)",
                         }}
                         className="rounded-md border px-3 py-2 text-xs"
                    >
                         {status}
                    </div>
               )}

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
                              {members.map((member) => {
                                   const isPending = pendingMemberId === member.id;
                                   const canManageMember =
                                        canManageMembers && member.role !== "OWNER";
                                   return (
                                        <div
                                             key={member.id}
                                             className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                                        >
                                             <div className="min-w-0">
                                                  <p className="truncate text-xs font-medium">
                                                       {member.user.name}
                                                  </p>
                                                  <p
                                                       style={{ color: "var(--text-muted)" }}
                                                       className="truncate text-xs"
                                                  >
                                                       {member.user.email}
                                                  </p>
                                             </div>

                                             <div className="flex flex-wrap items-center justify-end gap-2">
                                                  {canManageMember ? (
                                                       <select
                                                            aria-label={`Role for ${member.user.name}`}
                                                            value={member.role}
                                                            disabled={isPending}
                                                            onChange={(event) =>
                                                                 void handleRoleChange(
                                                                      member,
                                                                      event.target.value as Extract<
                                                                           WorkspaceRole,
                                                                           "EDITOR" | "VIEWER"
                                                                      >,
                                                                 )
                                                            }
                                                            style={{
                                                                 backgroundColor: "var(--bg-subtle)",
                                                                 borderColor: "var(--border-input)",
                                                                 color: "var(--text-primary)",
                                                            }}
                                                            className="h-8 rounded-md border px-2 text-[11px] disabled:opacity-50"
                                                       >
                                                            <option value="EDITOR">EDITOR</option>
                                                            <option value="VIEWER">VIEWER</option>
                                                       </select>
                                                  ) : (
                                                       <span
                                                            style={{
                                                                 backgroundColor: "var(--bg-subtle)",
                                                                 borderColor: "var(--border-hairline)",
                                                                 color: "var(--text-secondary)",
                                                            }}
                                                            className="shrink-0 rounded border px-2 py-0.5 text-[11px] font-medium"
                                                       >
                                                            {member.role}
                                                       </span>
                                                  )}
                                                  {canManageMember && (
                                                       <>
                                                            <button
                                                                 type="button"
                                                                 onClick={() =>
                                                                      void handleTransferOwnership(
                                                                           member,
                                                                      )
                                                                 }
                                                                 disabled={isPending}
                                                                 style={{
                                                                      backgroundColor: "var(--bg-subtle)",
                                                                      borderColor: "var(--border-input)",
                                                                      color: "var(--text-secondary)",
                                                                 }}
                                                                 className="h-8 cursor-pointer rounded-md border px-2.5 text-[11px] font-medium disabled:opacity-50"
                                                            >
                                                                 Transfer ownership
                                                            </button>
                                                            <button
                                                                 type="button"
                                                                 onClick={() =>
                                                                      void handleRemoveMember(member)
                                                                 }
                                                                 disabled={isPending}
                                                                 style={{
                                                                      backgroundColor: "var(--danger-bg)",
                                                                      borderColor: "var(--danger-border)",
                                                                      color: "var(--danger-text)",
                                                                 }}
                                                                 className="h-8 cursor-pointer rounded-md border px-2.5 text-[11px] font-medium disabled:opacity-50"
                                                            >
                                                                 Remove
                                                            </button>
                                                       </>
                                                  )}
                                             </div>
                                        </div>
                                   );
                              })}
                         </div>
                    )}
               </div>
               {canManageMembers && (
                    <>
                         <PendingInvitesList
                              workspaceId={currentWorkspace.id}
                              invitations={invitations}
                              canManage={canManageMembers}
                              onChanged={() => void loadMembers()}
                         />
                         <InviteLinkCard
                              workspaceId={currentWorkspace.id}
                              canManage={canManageMembers}
                         />
                         <InviteMemberModal
                              open={inviteOpen}
                              onClose={() => setInviteOpen(false)}
                              workspaceId={currentWorkspace.id}
                              workspaceName={currentWorkspace.name}
                              onInviteSent={() => void loadMembers()}
                         />
                    </>
               )}
          </div>
     );
}
