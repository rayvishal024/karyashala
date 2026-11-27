import type { WorkspaceRole } from "@/features/workspace";

export type InviteRoleOption = Extract<WorkspaceRole, "EDITOR" | "VIEWER">;

export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export interface WorkspaceInvitationItem {
     id: string;
     workspaceId: string;
     email: string;
     role: WorkspaceRole;
     status: InvitationStatus;
     expiresAt: string;
     createdAt: string;
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

export interface UpdateInviteLinkPayload {
     enabled?: boolean;
     defaultJoinRole?: InviteRoleOption;
     regenerateCode?: boolean;
     expiresInDays?: number | null;
}