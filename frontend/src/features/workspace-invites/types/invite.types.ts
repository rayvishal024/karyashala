import type { WorkspaceRole } from "@/features/workspace";

export type InviteRoleOption = Extract<WorkspaceRole, "EDITOR" | "VIEWER">;

export type InvitationStatus =
     | "PENDING"
     | "ACCEPTED"
     | "DECLINED"
     | "EXPIRED"
     | "REVOKED";

export interface WorkspaceInvitationItem {
     id: string;
     workspaceId?: string;
     email: string;
     role: WorkspaceRole;
     status: InvitationStatus;
     expiresAt: string;
     acceptedAt?: string | null;
     createdAt?: string;
     updatedAt?: string;
     invitedBy?: {
          id: string;
          name: string;
          email: string;
     };
}

export interface SendInvitePayload {
     email: string;
     role: InviteRoleOption;
}

export interface InvitePreviewData {
     email: string;
     role: WorkspaceRole;
     status: InvitationStatus;
     expiresAt: string;
     workspace: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
     };
     invitedBy?: {
          name: string;
          email: string;
     };
}

export interface AcceptInviteResult {
     workspaceId: string;
     workspaceSlug: string;
     role: WorkspaceRole;
}

export interface InviteLinkSettings {
     inviteCode: string | null;
     inviteCodeExpiresAt: string | null;
     inviteLinkEnabled: boolean;
     defaultJoinRole: WorkspaceRole;
}

export type UpdateInviteLinkPayload =
     | {
            enabled: boolean;
            defaultJoinRole: InviteRoleOption;
            expiresInDays?: number | null;
            regenerateCode?: false;
       }
     | {
            regenerateCode: true;
            defaultJoinRole?: InviteRoleOption;
       };