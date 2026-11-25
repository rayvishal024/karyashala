import type { InviteStatus, WorkspaceRole } from "../../generated/prisma/client.js";

export type InvitableRole = Extract<WorkspaceRole, "EDITOR" | "VIEWER">;

export interface CreateInviteInput {
     email: string;
     role: InvitableRole;
}

export interface SendWorkspaceInviteEmailParams {
     toEmail: string;
     workspaceName: string;
     inviterName: string;
     role: WorkspaceRole;
     rawToken: string;
}

export interface PublicInviteDetails {
     workspaceName: string;
     workspaceSlug: string;
     inviterName: string;
     invitedEmail: string;
     role: WorkspaceRole;
     status: InviteStatus;
     expiresAt: Date;
}

export interface WorkspaceInviteListItem {
     id: string;
     email: string;
     role: WorkspaceRole;
     status: InviteStatus;
     expiresAt: Date;
     acceptedAt: Date | null;
     createdAt: Date;
     updatedAt: Date;
}