import type { WorkspaceRole } from "../../generated/prisma/client.js";

export type JoinableRole = Extract<WorkspaceRole, "EDITOR" | "VIEWER">;

export interface InviteLinkConfigResponse {
     inviteCode: string | null;
     inviteLink: string | null;
     expiresAt: Date | null;
     inviteLinkEnabled: boolean;
     defaultJoinRole: WorkspaceRole;
}

export interface UpdateInviteLinkInput {
     enabled: boolean;
     defaultJoinRole: JoinableRole;
}

export interface PublicJoinDetails {
     workspaceName: string;
     ownerName: string;
     defaultJoinRole: WorkspaceRole;
     expiresAt: Date | null;
}

export interface JoinWorkspaceResult {
     workspaceSlug: string;
     workspaceId: string;
     role: WorkspaceRole;
     alreadyMember: boolean;
}