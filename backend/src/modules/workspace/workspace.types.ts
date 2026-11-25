import type { WorkspaceRole } from "../../generated/prisma/client.js";

export interface CreateWorkspaceInput {
     name: string;
}

export interface UpdateWorkspaceInput {
     name: string;
}

export interface WorkspaceSummary {
     id: string;
     name: string;
     slug: string;
     ownerId: string;
     role: WorkspaceRole;
     inviteLinkEnabled: boolean;
     defaultJoinRole: WorkspaceRole;
     createdAt: Date;
     updatedAt: Date;
}

export interface WorkspaceDetail {
     id: string;
     name: string;
     slug: string;
     ownerId: string;
     currentUserRole: WorkspaceRole;
     inviteCode: string | null;
     inviteCodeExpiresAt: Date | null;
     inviteLinkEnabled: boolean;
     defaultJoinRole: WorkspaceRole;
     createdAt: Date;
     updatedAt: Date;
}

declare global {
     namespace Express {
          interface Request {
               workspaceMembership?: {
                    workspaceId: string;
                    userId: string;
                    role: WorkspaceRole;
               };
          }
     }
}