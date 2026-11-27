import { apiFetch } from "@/lib/api-client";
import type {
     AcceptInviteResult,
     InviteLinkSettings,
     InvitePreviewData,
     SendInvitePayload,
     UpdateInviteLinkPayload,
     WorkspaceInvitationItem,
} from "../types/invite.types";

export const inviteApi = {
     sendInvite(
          workspaceId: string,
          payload: SendInvitePayload,
     ): Promise<{ invitation: WorkspaceInvitationItem; inviteUrl?: string }> {
          return apiFetch(`/workspaces/${encodeURIComponent(workspaceId)}/invites`, {
               method: "POST",
               body: JSON.stringify(payload),
          });
     },

     listPendingInvites(
          workspaceId: string,
     ): Promise<{ invitations: WorkspaceInvitationItem[] }> {
          return apiFetch(
               `/workspaces/${encodeURIComponent(workspaceId)}/invites?status=PENDING`,
          );
     },

     resendInvite(workspaceId: string, inviteId: string): Promise<null> {
          return apiFetch(
               `/workspaces/${encodeURIComponent(workspaceId)}/invites/${encodeURIComponent(inviteId)}/resend`,
               { method: "POST" },
          );
     },

     revokeInvite(workspaceId: string, inviteId: string): Promise<null> {
          return apiFetch(
               `/workspaces/${encodeURIComponent(workspaceId)}/invites/${encodeURIComponent(inviteId)}/revoke`,
               { method: "POST" },
          );
     },

     getInviteByToken(token: string): Promise<{ invitation: InvitePreviewData }> {
          return apiFetch(`/invites/${encodeURIComponent(token)}`);
     },

     acceptInviteByToken(token: string): Promise<AcceptInviteResult> {
          return apiFetch(`/invites/${encodeURIComponent(token)}/accept`, {
               method: "POST",
          });
     },

     getInviteLinkSettings(
          workspaceId: string,
     ): Promise<{ inviteLink: InviteLinkSettings }> {
          return apiFetch(
               `/workspaces/${encodeURIComponent(workspaceId)}/invite-link`,
          );
     },

     updateInviteLinkSettings(
          workspaceId: string,
          payload: UpdateInviteLinkPayload,
     ): Promise<{ inviteLink: InviteLinkSettings }> {
          if (payload.regenerateCode) {
               return apiFetch(
                    `/workspaces/${encodeURIComponent(workspaceId)}/regenerate-invite-code`,
                    {
                         method: "POST",
                         body: JSON.stringify({
                              ...(payload.defaultJoinRole
                                   ? { defaultJoinRole: payload.defaultJoinRole }
                                   : {}),
                         }),
                    },
               );
          }

          return apiFetch(
               `/workspaces/${encodeURIComponent(workspaceId)}/invite-link`,
               {
                    method: "PATCH",
                    body: JSON.stringify({
                         ...(typeof payload.enabled === "boolean"
                              ? { enabled: payload.enabled, inviteLinkEnabled: payload.enabled }
                              : {}),
                         ...(payload.defaultJoinRole
                              ? { defaultJoinRole: payload.defaultJoinRole }
                              : {}),
                         ...(payload.expiresInDays !== undefined
                              ? { expiresInDays: payload.expiresInDays }
                              : {}),
                    }),
               },
          );
     },

     joinByCode(code: string): Promise<{
          workspaceId: string;
          workspaceSlug: string;
          role: string;
          alreadyMember?: boolean;
     }> {
          return apiFetch(`/join/${encodeURIComponent(code.trim().toUpperCase())}`, {
               method: "POST",
          });
     },
};