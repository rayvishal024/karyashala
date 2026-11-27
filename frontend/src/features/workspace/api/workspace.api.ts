import { apiFetch } from "@/lib/api-client";
import type {
     CreateWorkspacePayload,
     UpdateWorkspacePayload,
     WorkspaceDetail,
     WorkspaceMemberItem,
     WorkspaceRole,
     WorkspaceSummary,
} from "../types/workspace.types";

function normalizeRole(raw: unknown): WorkspaceRole {
     if (raw === "OWNER" || raw === "EDITOR" || raw === "VIEWER") return raw;
     return "VIEWER";
}

function normalizeWorkspaceSummary(raw: Record<string, unknown>): WorkspaceSummary {
     return {
          id: String(raw.id ?? ""),
          name: String(raw.name ?? "Untitled Workspace"),
          slug: String(raw.slug ?? ""),
          description: (raw.description as string | null) ?? null,
          role: normalizeRole(raw.role ?? raw.memberRole ?? raw.currentUserRole),
          memberCount:
               typeof raw.memberCount === "number" ? raw.memberCount : undefined,
          createdAt: String(raw.createdAt ?? new Date().toISOString()),
          updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
     };
}

function normalizeWorkspaceDetail(raw: Record<string, unknown>): WorkspaceDetail {
     return {
          ...normalizeWorkspaceSummary(raw),
          ownerId: String(raw.ownerId ?? ""),
          inviteCode: (raw.inviteCode as string | null) ?? null,
          inviteCodeExpiresAt: (raw.inviteCodeExpiresAt as string | null) ?? null,
          inviteLinkEnabled: Boolean(raw.inviteLinkEnabled ?? false),
          defaultJoinRole: normalizeRole(raw.defaultJoinRole ?? "EDITOR"),
     };
}

export const workspaceApi = {
     async listMyWorkspaces(): Promise<{ workspaces: WorkspaceSummary[] }> {
          const data = await apiFetch<{
               workspaces?: Record<string, unknown>[];
          }>("/workspaces");
          const list = Array.isArray(data.workspaces)
               ? data.workspaces.map(normalizeWorkspaceSummary)
               : [];
          return { workspaces: list };
     },

     async createWorkspace(
          payload: CreateWorkspacePayload,
     ): Promise<{ workspace: WorkspaceDetail }> {
          const data = await apiFetch<{ workspace: Record<string, unknown> }>(
               "/workspaces",
               {
                    method: "POST",
                    body: JSON.stringify(payload),
               },
          );
          return { workspace: normalizeWorkspaceDetail(data.workspace) };
     },

     async getWorkspaceById(
          workspaceId: string,
     ): Promise<{
          workspace: WorkspaceDetail;
          members?: WorkspaceMemberItem[];
     }> {
          const data = await apiFetch<{
               workspace?: Record<string, unknown>;
               members?: WorkspaceMemberItem[];
          }>(`/workspaces/${encodeURIComponent(workspaceId)}`);

          const rawWs = data.workspace ?? (data as unknown as Record<string, unknown>);
          const members =
               data.members ??
               (Array.isArray(rawWs.members)
                    ? (rawWs.members as WorkspaceMemberItem[])
                    : undefined);

          return {
               workspace: normalizeWorkspaceDetail(rawWs),
               members,
          };
     },

     async updateWorkspace(
          workspaceId: string,
          payload: UpdateWorkspacePayload,
     ): Promise<{ workspace: WorkspaceDetail }> {
          const data = await apiFetch<{ workspace: Record<string, unknown> }>(
               `/workspaces/${encodeURIComponent(workspaceId)}`,
               {
                    method: "PATCH",
                    body: JSON.stringify(payload),
               },
          );
          return { workspace: normalizeWorkspaceDetail(data.workspace) };
     },

     deleteWorkspace(workspaceId: string): Promise<null> {
          return apiFetch<null>(`/workspaces/${encodeURIComponent(workspaceId)}`, {
               method: "DELETE",
          });
     },

     async listMembers(
          workspaceId: string,
     ): Promise<{ members: WorkspaceMemberItem[] }> {
          return apiFetch<{ members: WorkspaceMemberItem[] }>(
               `/workspaces/${encodeURIComponent(workspaceId)}/members`,
          );
     },

     updateMemberRole(
          workspaceId: string,
          memberId: string,
          role: Extract<WorkspaceRole, "EDITOR" | "VIEWER">,
     ): Promise<{ member: WorkspaceMemberItem }> {
          return apiFetch(
               `/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(memberId)}/role`,
               {
                    method: "PATCH",
                    body: JSON.stringify({ role }),
               },
          );
     },

     removeMember(workspaceId: string, memberId: string): Promise<null> {
          return apiFetch(
               `/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(memberId)}`,
               { method: "DELETE" },
          );
     },

     leaveWorkspace(workspaceId: string): Promise<null> {
          return apiFetch(
               `/workspaces/${encodeURIComponent(workspaceId)}/leave`,
               { method: "POST" },
          );
     },

     transferOwnership(
          workspaceId: string,
          payload: { newOwnerId: string },
     ): Promise<{
          workspaceId: string;
          previousOwnerId: string;
          newOwnerId: string;
     }> {
          return apiFetch(
               `/workspaces/${encodeURIComponent(workspaceId)}/transfer-ownership`,
               {
                    method: "POST",
                    body: JSON.stringify(payload),
               },
          );
     },

     joinByCode(code: string): Promise<{
          workspaceSlug: string;
          workspaceId: string;
          role: WorkspaceRole;
          alreadyMember: boolean;
     }> {
          return apiFetch(`/join/${encodeURIComponent(code.trim().toUpperCase())}`, {
               method: "POST",
          });
     },
};