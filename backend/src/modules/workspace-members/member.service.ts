import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors/index.js";
import type {
     TransferOwnershipInput,
     TransferOwnershipResult,
     UpdateMemberRoleInput,
     WorkspaceMemberItem,
} from "./member.types.js";

export const memberService = {
     async listMembers(workspaceId: string): Promise<WorkspaceMemberItem[]> {
          const members = await prisma.workspaceMember.findMany({
               where: { workspaceId },
               include: {
                    user: {
                         select: {
                              id: true,
                              name: true,
                              email: true,
                              avatar: true,
                         },
                    },
               },
               orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
          });

          return members.map((m) => ({
               id: m.id,
               workspaceId: m.workspaceId,
               userId: m.userId,
               role: m.role,
               joinedAt: m.joinedAt,
               user: m.user,
          }));
     },

     async updateMemberRole(
          workspaceId: string,
          memberId: string,
          input: UpdateMemberRoleInput,
     ): Promise<WorkspaceMemberItem> {
          const targetMember = await prisma.workspaceMember.findFirst({
               where: {
                    id: memberId,
                    workspaceId,
               },
               include: {
                    user: {
                         select: {
                              id: true,
                              name: true,
                              email: true,
                              avatar: true,
                         },
                    },
               },
          });

          if (!targetMember) {
               throw new AppError(
                    "Workspace member not found.",
                    404,
                    "MEMBER_NOT_FOUND",
               );
          }

          if (targetMember.role === "OWNER") {
               throw new AppError(
                    "Cannot change the workspace owner's role directly. Transfer ownership first.",
                    400,
                    "CANNOT_CHANGE_OWNER_ROLE",
               );
          }

          const updated = await prisma.workspaceMember.update({
               where: { id: targetMember.id },
               data: { role: input.role },
               include: {
                    user: {
                         select: {
                              id: true,
                              name: true,
                              email: true,
                              avatar: true,
                         },
                    },
               },
          });


          return {
               id: updated.id,
               workspaceId: updated.workspaceId,
               userId: updated.userId,
               role: updated.role,
               joinedAt: updated.joinedAt,
               user: updated.user,
          };
     },

     async removeMember(workspaceId: string, memberId: string): Promise<void> {
          const targetMember = await prisma.workspaceMember.findFirst({
               where: {
                    id: memberId,
                    workspaceId,
               },
          });

          if (!targetMember) {
               throw new AppError(
                    "Workspace member not found.",
                    404,
                    "MEMBER_NOT_FOUND",
               );
          }

          if (targetMember.role === "OWNER") {
               throw new AppError(
                    "Cannot remove the workspace owner.",
                    400,
                    "CANNOT_REMOVE_OWNER",
               );
          }

          await prisma.workspaceMember.delete({
               where: { id: targetMember.id },
          });
     },

     async leaveWorkspace(workspaceId: string, userId: string): Promise<void> {
          const membership = await prisma.workspaceMember.findUnique({
               where: {
                    workspaceId_userId: {
                         workspaceId,
                         userId,
                    },
               },
          });

          if (!membership) {
               throw new AppError(
                    "You are not a member of this workspace.",
                    403,
                    "NOT_WORKSPACE_MEMBER",
               );
          }

          if (membership.role === "OWNER") {
               throw new AppError(
                    "Workspace owner must transfer ownership before leaving the workspace.",
                    400,
                    "OWNER_MUST_TRANSFER_FIRST",
               );
          }

          await prisma.workspaceMember.delete({
               where: { id: membership.id },
          });
     },

     async transferOwnership(
          workspaceId: string,
          currentOwnerId: string,
          input: TransferOwnershipInput,
     ): Promise<TransferOwnershipResult> {
          if (input.newOwnerId === currentOwnerId) {
               throw new AppError(
                    "User is already the workspace owner.",
                    400,
                    "ALREADY_WORKSPACE_OWNER",
               );
          }

          return prisma.$transaction(async (tx) => {
               const currentOwnerMember = await tx.workspaceMember.findUnique({
                    where: {
                         workspaceId_userId: {
                              workspaceId,
                              userId: currentOwnerId,
                         },
                    },
               });

               if (!currentOwnerMember || currentOwnerMember.role !== "OWNER") {
                    throw new AppError(
                         "Only the workspace owner can transfer ownership.",
                         403,
                         "OWNER_REQUIRED",
                    );
               }

               const newOwnerMember = await tx.workspaceMember.findUnique({
                    where: {
                         workspaceId_userId: {
                              workspaceId,
                              userId: input.newOwnerId,
                         },
                    },
               });

               if (!newOwnerMember) {
                    throw new AppError(
                         "Target user must already be a member of this workspace.",
                         400,
                         "TARGET_NOT_MEMBER",
                    );
               }

               await tx.workspaceMember.update({
                    where: { id: currentOwnerMember.id },
                    data: { role: "EDITOR" },
               });

               await tx.workspaceMember.update({
                    where: { id: newOwnerMember.id },
                    data: { role: "OWNER" },
               });

               await tx.workspace.update({
                    where: { id: workspaceId },
                    data: { ownerId: input.newOwnerId },
               });

               return {
                    workspaceId,
                    previousOwnerId: currentOwnerId,
                    newOwnerId: input.newOwnerId,
               };
          });
     },
};