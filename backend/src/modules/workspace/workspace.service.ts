import { prisma } from "../../config/prisma.js";
import type { WorkspaceRole } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/index.js";
import type {
     CreateWorkspaceInput,
     UpdateWorkspaceInput,
     WorkspaceSummary,
     WorkspaceDetail,
} from "./workspace.types.js";
import {
     generateWorkspaceSlug,
     generateInviteCode,
     getInviteCodeExpiryDate,
} from "./workspace.utils.js";

async function generateUniqueSlug(name: string): Promise<string> {
     for (let attempt = 0; attempt < 10; attempt++) {
          const candidate = generateWorkspaceSlug(name);
          const existing = await prisma.workspace.findUnique({
               where: { slug: candidate },
               select: { id: true },
          });
          if (!existing) {
               return candidate;
          }
     }
     throw new AppError(
          "Unable to generate a unique workspace slug. Please try again.",
          500,
          "SLUG_GENERATION_FAILED",
     );
}

async function generateUniqueInviteCode(): Promise<string> {
     for (let attempt = 0; attempt < 10; attempt++) {
          const candidate = generateInviteCode();
          const existing = await prisma.workspace.findUnique({
               where: { inviteCode: candidate },
               select: { id: true },
          });
          if (!existing) {
               return candidate;
          }
     }
     throw new AppError(
          "Unable to generate a unique invite code. Please try again.",
          500,
          "INVITE_CODE_GENERATION_FAILED",
     );
}

export const workspaceService = {
     async createWorkspace(
          userId: string,
          input: CreateWorkspaceInput,
     ): Promise<WorkspaceDetail> {
          const slug = await generateUniqueSlug(input.name);
          const inviteCode = await generateUniqueInviteCode();
          const inviteCodeExpiresAt = getInviteCodeExpiryDate();

          const workspace = await prisma.$transaction(async (tx) => {
               const created = await tx.workspace.create({
                    data: {
                         name: input.name,
                         slug,
                         ownerId: userId,
                         inviteCode,
                         inviteCodeExpiresAt,
                         inviteLinkEnabled: true,
                         defaultJoinRole: "EDITOR",
                    },
               });

               await tx.workspaceMember.create({
                    data: {
                         workspaceId: created.id,
                         userId,
                         role: "OWNER",
                    },
               });

               return created;
          });

          return {
               ...workspace,
               currentUserRole: "OWNER",
          };
     },

     async listWorkspacesForUser(userId: string): Promise<WorkspaceSummary[]> {
          const memberships = await prisma.workspaceMember.findMany({
               where: { userId },
               include: {
                    workspace: true,
               },
               orderBy: {
                    joinedAt: "asc",
               },
          });

          return memberships.map((m) => ({
               id: m.workspace.id,
               name: m.workspace.name,
               slug: m.workspace.slug,
               ownerId: m.workspace.ownerId,
               role: m.role,
               inviteLinkEnabled: m.workspace.inviteLinkEnabled,
               defaultJoinRole: m.workspace.defaultJoinRole,
               createdAt: m.workspace.createdAt,
               updatedAt: m.workspace.updatedAt,
          }));
     },

     async getWorkspaceById(
          workspaceId: string,
          role: WorkspaceRole,
     ): Promise<WorkspaceDetail> {
          const workspace = await prisma.workspace.findUnique({
               where: { id: workspaceId },
          });

          if (!workspace) {
               throw new AppError("Workspace not found.", 404, "WORKSPACE_NOT_FOUND");
          }

          return {
               ...workspace,
               currentUserRole: role,
          };
     },

     async renameWorkspace(
          workspaceId: string,
          role: WorkspaceRole,
          input: UpdateWorkspaceInput,
     ): Promise<WorkspaceDetail> {
          const updated = await prisma.workspace.update({
               where: { id: workspaceId },
               data: {
                    name: input.name,
               },
          });

          return {
               ...updated,
               currentUserRole: role,
          };
     },

     async deleteWorkspace(workspaceId: string): Promise<void> {
          await prisma.$transaction(async (tx) => {
               await tx.workspaceInvitation.deleteMany({
                    where: { workspaceId },
               });

               await tx.workspaceMember.deleteMany({
                    where: { workspaceId },
               });

               await tx.workspace.delete({
                    where: { id: workspaceId },
               });
          });
     },
};