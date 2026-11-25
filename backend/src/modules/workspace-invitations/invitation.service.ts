import { prisma } from "../../config/prisma.js";
import type { InviteStatus, WorkspaceRole } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/index.js";
import type {
     CreateInviteInput,
     PublicInviteDetails,
     WorkspaceInviteListItem,
} from "./invitation.types.js";
import {
     generateRawInviteToken,
     getInviteExpiryDate,
     hashInviteToken,
     sendWorkspaceInviteEmail,
} from "./invitation.utils.js";

async function findAndNormalizeInviteByRawToken(rawToken: string) {
     const tokenHash = hashInviteToken(rawToken);

     const invitation = await prisma.workspaceInvitation.findUnique({
          where: { tokenHash },
          include: {
               workspace: {
                    select: {
                         id: true,
                         name: true,
                         slug: true,
                    },
               },
               invitedBy: {
                    select: {
                         id: true,
                         name: true,
                         email: true,
                    },
               },
          },
     });

     if (!invitation) {
          throw new AppError("Invalid invite link.", 404, "INVALID_INVITE");
     }

     const now = new Date();
     if (invitation.status === "PENDING" && invitation.expiresAt < now) {
          const expired = await prisma.workspaceInvitation.update({
               where: { id: invitation.id },
               data: { status: "EXPIRED" },
               include: {
                    workspace: {
                         select: {
                              id: true,
                              name: true,
                              slug: true,
                         },
                    },
                    invitedBy: {
                         select: {
                              id: true,
                              name: true,
                              email: true,
                         },
                    },
               },
          });
          return expired;
     }

     return invitation;
}

export const invitationService = {
     async createInvite(
          workspaceId: string,
          invitedById: string,
          input: CreateInviteInput,
     ): Promise<{ id: string; email: string; role: WorkspaceRole; status: InviteStatus; expiresAt: Date }> {
          const normalizedEmail = input.email.trim().toLowerCase();

          const workspace = await prisma.workspace.findUnique({
               where: { id: workspaceId },
               select: { id: true, name: true },
          });

          if (!workspace) {
               throw new AppError("Workspace not found.", 404, "WORKSPACE_NOT_FOUND");
          }

          const inviter = await prisma.user.findUnique({
               where: { id: invitedById },
               select: { id: true, name: true },
          });

          if (!inviter) {
               throw new AppError("Inviter account not found.", 404, "USER_NOT_FOUND");
          }

          // Check if target email already belongs to an existing workspace member
          const existingUser = await prisma.user.findUnique({
               where: { email: normalizedEmail },
               select: { id: true },
          });

          if (existingUser) {
               const existingMember = await prisma.workspaceMember.findUnique({
                    where: {
                         workspaceId_userId: {
                              workspaceId,
                              userId: existingUser.id,
                         },
                    },
                    select: { id: true },
               });

               if (existingMember) {
                    throw new AppError("Already a member", 400, "ALREADY_MEMBER");
               }
          }

          // Check for an existing PENDING invite for same workspaceId + email
          const existingPending = await prisma.workspaceInvitation.findFirst({
               where: {
                    workspaceId,
                    email: normalizedEmail,
                    status: "PENDING",
               },
               orderBy: { createdAt: "desc" },
          });

          if (existingPending) {
               if (existingPending.expiresAt < new Date()) {
                    await prisma.workspaceInvitation.update({
                         where: { id: existingPending.id },
                         data: { status: "EXPIRED" },
                    });
               } else {
                    throw new AppError(
                         "Pending invite already exists",
                         400,
                         "PENDING_INVITE_EXISTS",
                         { inviteId: existingPending.id },
                    );
               }
          }

          const rawToken = generateRawInviteToken();
          const tokenHash = hashInviteToken(rawToken);
          const expiresAt = getInviteExpiryDate();

          const invitation = await prisma.workspaceInvitation.create({
               data: {
                    workspaceId,
                    email: normalizedEmail,
                    role: input.role,
                    invitedById,
                    tokenHash,
                    status: "PENDING",
                    expiresAt,
               },
               select: {
                    id: true,
                    email: true,
                    role: true,
                    status: true,
                    expiresAt: true,
               },
          });

          await sendWorkspaceInviteEmail({
               toEmail: normalizedEmail,
               workspaceName: workspace.name,
               inviterName: inviter.name,
               role: input.role,
               rawToken,
          });

          return invitation;
     },

     async getInviteDetails(rawToken: string): Promise<PublicInviteDetails> {
          const invitation = await findAndNormalizeInviteByRawToken(rawToken);

          return {
               workspaceName: invitation.workspace.name,
               workspaceSlug: invitation.workspace.slug,
               inviterName: invitation.invitedBy.name,
               invitedEmail: invitation.email,
               role: invitation.role,
               status: invitation.status,
               expiresAt: invitation.expiresAt,
          };
     },

     async acceptInvite(
          rawToken: string,
          currentUserId: string,
     ): Promise<{ workspaceSlug: string; workspaceId: string; role: WorkspaceRole }> {
          const currentUser = await prisma.user.findUnique({
               where: { id: currentUserId },
               select: { id: true, email: true },
          });

          if (!currentUser) {
               throw new AppError("User not found.", 404, "USER_NOT_FOUND");
          }

          const currentUserEmail = currentUser.email.trim().toLowerCase();

          return prisma.$transaction(async (tx) => {
               const tokenHash = hashInviteToken(rawToken);

               const invitation = await tx.workspaceInvitation.findUnique({
                    where: { tokenHash },
                    include: {
                         workspace: {
                              select: {
                                   id: true,
                                   slug: true,
                              },
                         },
                    },
               });

               if (!invitation) {
                    throw new AppError("Invalid invite link.", 404, "INVALID_INVITE");
               }

               if (invitation.status !== "PENDING") {
                    throw new AppError(
                         `This invitation is ${invitation.status.toLowerCase()}.`,
                         400,
                         `INVITE_${invitation.status}`,
                    );
               }

               if (invitation.expiresAt < new Date()) {
                    await tx.workspaceInvitation.update({
                         where: { id: invitation.id },
                         data: { status: "EXPIRED" },
                    });
                    throw new AppError("This invitation has expired.", 400, "INVITE_EXPIRED");
               }

               if (currentUserEmail !== invitation.email.toLowerCase()) {
                    throw new AppError(
                         "This invite is for a different email. Please login with correct email.",
                         403,
                         "INVITE_EMAIL_MISMATCH",
                    );
               }

               const existingMember = await tx.workspaceMember.findUnique({
                    where: {
                         workspaceId_userId: {
                              workspaceId: invitation.workspaceId,
                              userId: currentUser.id,
                         },
                    },
                    select: { id: true },
               });

               if (!existingMember) {
                    await tx.workspaceMember.create({
                         data: {
                              workspaceId: invitation.workspaceId,
                              userId: currentUser.id,
                              role: invitation.role,
                         },
                    });
               }

               await tx.workspaceInvitation.update({
                    where: { id: invitation.id },
                    data: {
                         status: "ACCEPTED",
                         acceptedAt: new Date(),
                    },
               });

               return {
                    workspaceSlug: invitation.workspace.slug,
                    workspaceId: invitation.workspace.id,
                    role: invitation.role,
               };
          });
     },

     async declineInvite(
          rawToken: string,
          currentUserId: string,
     ): Promise<{ status: InviteStatus }> {
          const currentUser = await prisma.user.findUnique({
               where: { id: currentUserId },
               select: { id: true, email: true },
          });

          if (!currentUser) {
               throw new AppError("User not found.", 404, "USER_NOT_FOUND");
          }

          const currentUserEmail = currentUser.email.trim().toLowerCase();

          return prisma.$transaction(async (tx) => {
               const tokenHash = hashInviteToken(rawToken);

               const invitation = await tx.workspaceInvitation.findUnique({
                    where: { tokenHash },
               });

               if (!invitation) {
                    throw new AppError("Invalid invite link.", 404, "INVALID_INVITE");
               }

               if (invitation.status !== "PENDING") {
                    throw new AppError(
                         `This invitation is ${invitation.status.toLowerCase()}.`,
                         400,
                         `INVITE_${invitation.status}`,
                    );
               }

               if (invitation.expiresAt < new Date()) {
                    await tx.workspaceInvitation.update({
                         where: { id: invitation.id },
                         data: { status: "EXPIRED" },
                    });
                    throw new AppError("This invitation has expired.", 400, "INVITE_EXPIRED");
               }

               if (currentUserEmail !== invitation.email.toLowerCase()) {
                    throw new AppError(
                         "This invite is for a different email. Please login with correct email.",
                         403,
                         "INVITE_EMAIL_MISMATCH",
                    );
               }

               const updated = await tx.workspaceInvitation.update({
                    where: { id: invitation.id },
                    data: { status: "DECLINED" },
                    select: { status: true },
               });

               return { status: updated.status };
          });
     },

     async listWorkspaceInvites(
          workspaceId: string,
     ): Promise<WorkspaceInviteListItem[]> {
          return prisma.workspaceInvitation.findMany({
               where: { workspaceId },
               select: {
                    id: true,
                    email: true,
                    role: true,
                    status: true,
                    expiresAt: true,
                    acceptedAt: true,
                    createdAt: true,
                    updatedAt: true,
               },
               orderBy: { createdAt: "desc" },
          });
     },

     async resendInvite(
          workspaceId: string,
          inviteId: string,
          actorUserId: string,
     ): Promise<WorkspaceInviteListItem> {
          const invitation = await prisma.workspaceInvitation.findFirst({
               where: {
                    id: inviteId,
                    workspaceId,
               },
               include: {
                    workspace: {
                         select: { name: true },
                    },
               },
          });

          if (!invitation) {
               throw new AppError("Invitation not found.", 404, "INVITE_NOT_FOUND");
          }

          if (invitation.status !== "PENDING") {
               throw new AppError(
                    "Only pending invitations can be resent.",
                    400,
                    "INVITE_NOT_PENDING",
               );
          }

          const sender = await prisma.user.findUnique({
               where: { id: actorUserId },
               select: { name: true },
          });

          const rawToken = generateRawInviteToken();
          const tokenHash = hashInviteToken(rawToken);
          const expiresAt = getInviteExpiryDate();

          const updated = await prisma.workspaceInvitation.update({
               where: { id: invitation.id },
               data: {
                    tokenHash,
                    expiresAt,
               },
               select: {
                    id: true,
                    email: true,
                    role: true,
                    status: true,
                    expiresAt: true,
                    acceptedAt: true,
                    createdAt: true,
                    updatedAt: true,
               },
          });

          await sendWorkspaceInviteEmail({
               toEmail: updated.email,
               workspaceName: invitation.workspace.name,
               inviterName: sender?.name || "Workspace Owner",
               role: updated.role,
               rawToken,
          });

          return updated;
     },

     async revokeInvite(
          workspaceId: string,
          inviteId: string,
     ): Promise<WorkspaceInviteListItem> {
          const invitation = await prisma.workspaceInvitation.findFirst({
               where: {
                    id: inviteId,
                    workspaceId,
               },
          });

          if (!invitation) {
               throw new AppError("Invitation not found.", 404, "INVITE_NOT_FOUND");
          }

          if (invitation.status !== "PENDING") {
               throw new AppError(
                    "Only pending invitations can be revoked.",
                    400,
                    "INVITE_NOT_PENDING",
               );
          }

          return prisma.workspaceInvitation.update({
               where: { id: invitation.id },
               data: { status: "REVOKED" },
               select: {
                    id: true,
                    email: true,
                    role: true,
                    status: true,
                    expiresAt: true,
                    acceptedAt: true,
                    createdAt: true,
                    updatedAt: true,
               },
          });
     },
};