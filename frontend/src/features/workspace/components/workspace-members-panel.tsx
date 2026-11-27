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
     const [confirmingLeave, setConfirmingLeave] = useState(false);
     const [confirmingMemberAction, setConfirmingMemberAction] = useState<{
          memberId: string;
          action: "transfer" | "remove";
     } | null>(null);
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
          setPendingMemberId(member.id);
          setError(null);
          setStatus(null);
          try {
               await workspaceApi.transferOwnership(currentWorkspace.id, {
                    newOwnerId: member.userId,
               });
               await Promise.all([refreshCurrentWorkspace(), loadMembers()]);
               setConfirmingMemberAction(null);
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
          setPendingMemberId(member.id);
          setError(null);
          setStatus(null);
          try {
               await workspaceApi.removeMember(currentWorkspace.id, member.id);
               setMembers((previous) =>
                    previous.filter((item) => item.id !== member.id),
               );
               setConfirmingMemberAction(null);
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
                              onClick={() => setConfirmingLeave(true)}
                              disabled={leaving}
                              style={{
                                   backgroundColor: "var(--danger-bg)",
                                   borderColor: "var(--danger-border)",
                                   color: "var(--danger-text)",
                              }}
                              className="h-8 cursor-pointer rounded-md border px-3 text-xs font-medium disabled:opacity-50"
                         >
                              Leave workspace
                         </button>
                    )}
               </div>

               {confirmingLeave && (
                    <div
                         role="group"
                         aria-label="Confirm leaving workspace"
                         style={{
                              backgroundColor: "var(--danger-bg)",
                              borderColor: "var(--danger-border)",
                              color: "var(--danger-text)",
                         }}
                         className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-xs"
                    >
                         <span>
                              Leave <strong className="font-semibold">{currentWorkspace.name}</strong>?
                              You will need a new invitation to rejoin.
                         </span>
                         <div className="flex items-center gap-2">
                              <button
                                   type="button"
                                   onClick={() => setConfirmingLeave(false)}
                                   disabled={leaving}
                                   style={{
                                        backgroundColor: "var(--bg-surface)",
                                        borderColor: "var(--border-input)",
                                        color: "var(--text-secondary)",
                                   }}
                                   className="h-7 cursor-pointer rounded-md border px-2.5 text-[11px] font-medium disabled:opacity-50"
                              >
                                   Cancel
                              </button>
                              <button
                                   type="button"
                                   onClick={() => void handleLeaveWorkspace()}
                                   disabled={leaving}
                                   style={{
                                        backgroundColor: "var(--danger-text)",
                                        color: "var(--bg-canvas)",
                                   }}
                                   className="h-7 cursor-pointer rounded-md px-2.5 text-[11px] font-medium disabled:opacity-50"
                              >
                                   {leaving ? "Leaving..." : "Confirm leave"}
                              </button>
                         </div>
                    </div>
               )}

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
                              aria-label="Loading workspace members"
                              aria-busy="true"
                              className="divide-y divide-[var(--border-hairline)]"
                         >
                              {[0, 1, 2, 3].map((row) => (
                                   <div
                                        key={row}
                                        className="flex items-center justify-between gap-4 px-4 py-3"
                                   >
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                             <div
                                                  style={{ backgroundColor: "var(--bg-subtle)" }}
                                                  className="h-8 w-8 animate-pulse rounded-full"
                                             />
                                             <div className="min-w-0 flex-1 space-y-2">
                                                  <div
                                                       style={{ backgroundColor: "var(--bg-subtle)" }}
                                                       className="h-3 w-36 animate-pulse rounded"
                                                  />
                                                  <div
                                                       style={{ backgroundColor: "var(--bg-subtle)" }}
                                                       className="h-2.5 w-48 max-w-full animate-pulse rounded"
                                                  />
                                             </div>
                                        </div>
                                        <div
                                             style={{ backgroundColor: "var(--bg-subtle)" }}
                                             className="h-7 w-20 animate-pulse rounded-md"
                                        />
                                   </div>
                              ))}
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
                                             <div className="flex min-w-0 items-center gap-3">
                                                  <span
                                                       aria-hidden="true"
                                                       style={{
                                                            backgroundColor: "var(--bg-subtle)",
                                                            color: "var(--text-secondary)",
                                                       }}
                                                       className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                                                  >
                                                       {member.user.name.trim().charAt(0).toUpperCase() || "?"}
                                                  </span>
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
                                                                      setConfirmingMemberAction({
                                                                           memberId: member.id,
                                                                           action: "transfer",
                                                                      })
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
                                                                      setConfirmingMemberAction({
                                                                           memberId: member.id,
                                                                           action: "remove",
                                                                      })
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
                                             {confirmingMemberAction?.memberId === member.id && (
                                                  <div
                                                       role="group"
                                                       aria-label={`Confirm ${confirmingMemberAction.action} for ${member.user.name}`}
                                                       style={{
                                                            backgroundColor: "var(--bg-subtle)",
                                                            borderColor: "var(--border-hairline)",
                                                       }}
                                                       className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                                                  >
                                                       <span
                                                            style={{ color: "var(--text-secondary)" }}
                                                            className="text-[11px]"
                                                       >
                                                            {confirmingMemberAction.action === "transfer"
                                                                 ? `Transfer ownership to ${member.user.name}? Your role will become EDITOR.`
                                                                 : `Remove ${member.user.name} from this workspace?`}
                                                       </span>
                                                       <div className="flex items-center gap-2">
                                                            <button
                                                                 type="button"
                                                                 onClick={() => setConfirmingMemberAction(null)}
                                                                 disabled={isPending}
                                                                 style={{
                                                                      backgroundColor: "var(--bg-surface)",
                                                                      borderColor: "var(--border-input)",
                                                                      color: "var(--text-secondary)",
                                                                 }}
                                                                 className="h-7 cursor-pointer rounded-md border px-2.5 text-[11px] font-medium disabled:opacity-50"
                                                            >
                                                                 Cancel
                                                            </button>
                                                            <button
                                                                 type="button"
                                                                 onClick={() =>
                                                                      confirmingMemberAction.action === "transfer"
                                                                           ? void handleTransferOwnership(member)
                                                                           : void handleRemoveMember(member)
                                                                 }
                                                                 disabled={isPending}
                                                                 style={{
                                                                      backgroundColor:
                                                                           confirmingMemberAction.action === "remove"
                                                                                ? "var(--danger-text)"
                                                                                : "var(--cta-bg)",
                                                                      color: "var(--cta-fg)",
                                                                 }}
                                                                 className="h-7 cursor-pointer rounded-md px-2.5 text-[11px] font-medium disabled:opacity-50"
                                                            >
                                                                 {isPending
                                                                      ? "Saving..."
                                                                      : confirmingMemberAction.action === "transfer"
                                                                           ? "Confirm transfer"
                                                                           : "Confirm removal"}
                                                            </button>
                                                       </div>
                                                  </div>
                                             )}
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
                              loading={loading}
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
