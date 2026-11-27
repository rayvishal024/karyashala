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
          const base = normalizeWorkspaceSummary(data.workspace);
          return {
               workspace: {
                    ...base,
                    ownerId: String(data.workspace.ownerId ?? ""),
                    inviteCode: (data.workspace.inviteCode as string | null) ?? null,
                    inviteCodeExpiresAt:
                         (data.workspace.inviteCodeExpiresAt as string | null) ?? null,
                    inviteLinkEnabled: Boolean(data.workspace.inviteLinkEnabled ?? false),
                    defaultJoinRole: normalizeRole(data.workspace.defaultJoinRole ?? "EDITOR"),
               },
          };
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
          const base = normalizeWorkspaceSummary(rawWs);
          const members =
               data.members ??
               (Array.isArray(rawWs.members)
                    ? (rawWs.members as WorkspaceMemberItem[])
                    : undefined);

          return {
               workspace: {
                    ...base,
                    ownerId: String(rawWs.ownerId ?? ""),
                    inviteCode: (rawWs.inviteCode as string | null) ?? null,
                    inviteCodeExpiresAt:
                         (rawWs.inviteCodeExpiresAt as string | null) ?? null,
                    inviteLinkEnabled: Boolean(rawWs.inviteLinkEnabled ?? false),
                    defaultJoinRole: normalizeRole(rawWs.defaultJoinRole ?? "EDITOR"),
               },
               members,
          };
     },

     updateWorkspace(
          workspaceId: string,
          payload: UpdateWorkspacePayload,
     ): Promise<{ workspace: WorkspaceDetail }> {
          return apiFetch<{ workspace: WorkspaceDetail }>(
               `/workspaces/${encodeURIComponent(workspaceId)}`,
               {
                    method: "PATCH",
                    body: JSON.stringify(payload),
               },
          );
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