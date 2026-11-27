export type WorkspaceRole = "OWNER" | "EDITOR" | "VIEWER";

export interface WorkspaceSummary {
     id: string;
     name: string;
     slug: string;
     description: string | null;
     role: WorkspaceRole;
     memberCount?: number;
     createdAt: string;
     updatedAt: string;
}

export interface WorkspaceDetail extends WorkspaceSummary {
     ownerId: string;
     inviteCode: string | null;
     inviteCodeExpiresAt: string | null;
     inviteLinkEnabled: boolean;
     defaultJoinRole: WorkspaceRole;
}

export interface WorkspaceMemberItem {
     id: string;
     workspaceId: string;
     userId: string;
     role: WorkspaceRole;
     joinedAt: string;
     user: {
          id: string;
          name: string;
          email: string;
          avatar: string | null;
     };
}

export interface CreateWorkspacePayload {
     name: string;
     description?: string;
}

export interface UpdateWorkspacePayload {
     name: string;
     slug: string;
}