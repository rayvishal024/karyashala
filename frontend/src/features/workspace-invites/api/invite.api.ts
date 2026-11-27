import { apiFetch } from "@/lib/api-client";
import type {
     AcceptInviteResult,
     InvitationStatus,
     InviteLinkSettings,
     InvitePreviewData,
     SendInvitePayload,
     UpdateInviteLinkPayload,
     WorkspaceInvitationItem,
} from "../types/invite.types";
import type { WorkspaceRole } from "@/features/workspace";

interface RawInvitePreview {
     email?: string;
     invitedEmail?: string;
     role?: WorkspaceRole;
     status?: InvitationStatus;
     expiresAt?: string;
     workspace?: Partial<InvitePreviewData["workspace"]>;
     workspaceName?: string;
     workspaceSlug?: string;
     invitedBy?: InvitePreviewData["invitedBy"];
     inviterName?: string;
}

interface RawInviteLinkSettings {
     inviteCode: string | null;
     inviteCodeExpiresAt?: string | null;
     expiresAt?: string | null;
     inviteLinkEnabled: boolean;
     defaultJoinRole: WorkspaceRole;
}

type InviteLinkSettingsResponse =
     | RawInviteLinkSettings
     | { inviteLink: RawInviteLinkSettings };

function normalizeInviteLinkSettings(
     response: InviteLinkSettingsResponse,
): { inviteLink: InviteLinkSettings } {
     const settings = "inviteCode" in response
          ? response
          : response.inviteLink;

     return {
          inviteLink: {
               inviteCode: settings.inviteCode,
               inviteCodeExpiresAt:
                    settings.inviteCodeExpiresAt ?? settings.expiresAt ?? null,
               inviteLinkEnabled: settings.inviteLinkEnabled,
               defaultJoinRole: settings.defaultJoinRole,
          },
     };
}

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

     resendInvite(
          workspaceId: string,
          inviteId: string,
     ): Promise<{ invitation: WorkspaceInvitationItem }> {
          return apiFetch(
               `/workspaces/${encodeURIComponent(workspaceId)}/invites/${encodeURIComponent(inviteId)}/resend`,
               { method: "POST" },
          );
     },

     revokeInvite(
          workspaceId: string,
          inviteId: string,
     ): Promise<{ invitation: WorkspaceInvitationItem }> {
          return apiFetch(
               `/workspaces/${encodeURIComponent(workspaceId)}/invites/${encodeURIComponent(inviteId)}/revoke`,
               { method: "POST" },
          );
     },

     async getInviteByToken(
          token: string,
     ): Promise<{ invitation: InvitePreviewData }> {
          const response = await apiFetch<
               RawInvitePreview & {
                    invite?: RawInvitePreview;
                    invitation?: RawInvitePreview;
               }
          >(`/invites/${encodeURIComponent(token)}`);
          const raw = response.invitation ?? response.invite ?? response;
          const email = raw.email ?? raw.invitedEmail;
          const workspace = raw.workspace ?? {
               id: "",
               name: raw.workspaceName,
               slug: raw.workspaceSlug,
               description: null,
          };

          if (
               email === undefined ||
               raw.role === undefined ||
               raw.status === undefined ||
               raw.expiresAt === undefined ||
               workspace.name === undefined ||
               workspace.slug === undefined
          ) {
               throw new Error("Invitation response was invalid.");
          }

          return {
               invitation: {
                    email,
                    role: raw.role,
                    status: raw.status,
                    expiresAt: raw.expiresAt,
                    workspace: {
                         id: workspace.id ?? "",
                         name: workspace.name,
                         slug: workspace.slug,
                         description: workspace.description ?? null,
                    },
                    invitedBy:
                         raw.invitedBy ??
                         (raw.inviterName
                              ? { name: raw.inviterName, email: "" }
                              : undefined),
               },
          };
     },

     declineInviteByToken(
          token: string,
     ): Promise<{ status: InvitationStatus }> {
          return apiFetch(`/invites/${encodeURIComponent(token)}/decline`, {
               method: "POST",
          });
     },

     acceptInviteByToken(token: string): Promise<AcceptInviteResult> {
          return apiFetch(`/invites/${encodeURIComponent(token)}/accept`, {
               method: "POST",
          });
     },

     async getInviteLinkSettings(
          workspaceId: string,
     ): Promise<{ inviteLink: InviteLinkSettings }> {
          const response = await apiFetch<InviteLinkSettingsResponse>(
               `/workspaces/${encodeURIComponent(workspaceId)}/invite-link`,
          );
          return normalizeInviteLinkSettings(response);
     },

     async updateInviteLinkSettings(
          workspaceId: string,
          payload: UpdateInviteLinkPayload,
     ): Promise<{ inviteLink: InviteLinkSettings }> {
          if (payload.regenerateCode) {
               const response = await apiFetch<InviteLinkSettingsResponse>(
                    `/workspaces/${encodeURIComponent(workspaceId)}/regenerate-invite-code`,
                    {
                         method: "POST",
                    },
               );
               return normalizeInviteLinkSettings(response);
          }

          const response = await apiFetch<InviteLinkSettingsResponse>(
               `/workspaces/${encodeURIComponent(workspaceId)}/invite-link`,
               {
                    method: "PATCH",
                    body: JSON.stringify({
                         enabled: payload.enabled,
                         defaultJoinRole: payload.defaultJoinRole,
                    }),
               },
          );
          return normalizeInviteLinkSettings(response);
     },

     joinByCode(code: string): Promise<{
          workspaceId: string;
          workspaceSlug: string;
          role: WorkspaceRole;
          alreadyMember: boolean;
     }> {
          return apiFetch(`/join/${encodeURIComponent(code.trim().toUpperCase())}`, {
               method: "POST",
          });
     },
};