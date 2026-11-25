import type { WorkspaceRole } from "../../generated/prisma/client.js";

export type AssignableMemberRole = Extract<WorkspaceRole, "EDITOR" | "VIEWER">;

export interface WorkspaceMemberItem {
     id: string;
     workspaceId: string;
     userId: string;
     role: WorkspaceRole;
     joinedAt: Date;
     user: {
          id: string;
          name: string;
          email: string;
          avatar: string | null;
     };
}

export interface UpdateMemberRoleInput {
     role: AssignableMemberRole;
}

export interface TransferOwnershipInput {
     newOwnerId: string;
}

export interface TransferOwnershipResult {
     workspaceId: string;
     previousOwnerId: string;
     newOwnerId: string;
}