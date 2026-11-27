import crypto from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/index.js";
import { AppError } from "../../shared/errors/index.js";
import type {
     InviteLinkConfigResponse,
     JoinWorkspaceResult,
     PublicJoinDetails,
     UpdateInviteLinkInput,
} from "./invite-link.types.js";

const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 7 chars, excludes 0/O/1/I
const INVITE_CODE_LENGTH = 7;
const CODE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function buildJoinUrl(code: string | null): string | null {
     if (!code) return null;
     const baseUrl = (env.APP_URL || "https://karyashala.tech").replace(/\/+$/, "");
     return `${baseUrl}/join/${code}`;
}

function generateRandomCode(length = INVITE_CODE_LENGTH): string {
     let code = "";
     for (let i = 0; i < length; i++) {
          const idx = crypto.randomInt(0, INVITE_CODE_CHARS.length);
          code += INVITE_CODE_CHARS[idx];
     }
     return code;
}

async function generateUniqueInviteCode(): Promise<string> {
     for (let attempt = 0; attempt < 10; attempt++) {
          const candidate = generateRandomCode();
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

function validateJoinableWorkspace(workspace: {
     id: string;
     name: string;
     slug: string;
     ownerId: string;
     inviteCode: string | null;
     inviteCodeExpiresAt: Date | null;
     inviteLinkEnabled: boolean;
     defaultJoinRole: InviteLinkConfigResponse["defaultJoinRole"];
     owner: { name: string };
}) {
     if (!workspace.inviteCode) {
          throw new AppError("Invalid invite code.", 404, "INVALID_INVITE_CODE");
     }

     if (!workspace.inviteLinkEnabled) {
          throw new AppError(
               "Invite link is currently disabled for this workspace.",
               403,
               "INVITE_LINK_DISABLED",
          );
     }

     if (
          workspace.inviteCodeExpiresAt &&
          workspace.inviteCodeExpiresAt.getTime() < Date.now()
     ) {
          throw new AppError(
               "This invite code has expired.",
               410,
               "INVITE_CODE_EXPIRED",
          );
     }
}

export const inviteLinkService = {
     async getInviteLinkConfig(
          workspaceId: string,
     ): Promise<InviteLinkConfigResponse> {
          const workspace = await prisma.workspace.findUnique({
               where: { id: workspaceId },
               select: {
                    inviteCode: true,
                    inviteCodeExpiresAt: true,
                    inviteLinkEnabled: true,
                    defaultJoinRole: true,
               },
          });

          if (!workspace) {
               throw new AppError("Workspace not found.", 404, "WORKSPACE_NOT_FOUND");
          }

          return {
               inviteCode: workspace.inviteCode,
               inviteLink: buildJoinUrl(workspace.inviteCode),
               expiresAt: workspace.inviteCodeExpiresAt,
               inviteLinkEnabled: workspace.inviteLinkEnabled,
               defaultJoinRole: workspace.defaultJoinRole,
          };
     },

     async regenerateInviteCode(
          workspaceId: string,
     ): Promise<InviteLinkConfigResponse> {
          const newCode = await generateUniqueInviteCode();
          const newExpiry = new Date(Date.now() + CODE_TTL_MS);

          const updated = await prisma.workspace.update({
               where: { id: workspaceId },
               data: {
                    inviteCode: newCode,
                    inviteCodeExpiresAt: newExpiry,
               },
               select: {
                    inviteCode: true,
                    inviteCodeExpiresAt: true,
                    inviteLinkEnabled: true,
                    defaultJoinRole: true,
               },
          });

          return {
               inviteCode: updated.inviteCode,
               inviteLink: buildJoinUrl(updated.inviteCode),
               expiresAt: updated.inviteCodeExpiresAt,
               inviteLinkEnabled: updated.inviteLinkEnabled,
               defaultJoinRole: updated.defaultJoinRole,
          };
     },

     async updateInviteLinkSettings(
          workspaceId: string,
          input: UpdateInviteLinkInput,
     ): Promise<InviteLinkConfigResponse> {
          const updated = await prisma.workspace.update({
               where: { id: workspaceId },
               data: {
                    inviteLinkEnabled: input.enabled,
                    defaultJoinRole: input.defaultJoinRole,
                    ...(input.expiresInDays !== undefined
                         ? {
                                inviteCodeExpiresAt:
                                     input.expiresInDays === null
                                          ? null
                                          : new Date(
                                                 Date.now() +
                                                      input.expiresInDays *
                                                           24 *
                                                           60 *
                                                           60 *
                                                           1000,
                                            ),
                           }
                         : {}),
               },
               select: {
                    inviteCode: true,
                    inviteCodeExpiresAt: true,
                    inviteLinkEnabled: true,
                    defaultJoinRole: true,
               },
          });

          return {
               inviteCode: updated.inviteCode,
               inviteLink: buildJoinUrl(updated.inviteCode),
               expiresAt: updated.inviteCodeExpiresAt,
               inviteLinkEnabled: updated.inviteLinkEnabled,
               defaultJoinRole: updated.defaultJoinRole,
          };
     },

     async getPublicJoinDetails(rawCode: string): Promise<PublicJoinDetails> {
          const normalizedCode = rawCode.trim().toUpperCase();

          const workspace = await prisma.workspace.findUnique({
               where: { inviteCode: normalizedCode },
               select: {
                    id: true,
                    name: true,
                    slug: true,
                    ownerId: true,
                    inviteCode: true,
                    inviteCodeExpiresAt: true,
                    inviteLinkEnabled: true,
                    defaultJoinRole: true,
                    owner: {
                         select: { name: true },
                    },
               },
          });

          if (!workspace) {
               throw new AppError("Invalid invite code.", 404, "INVALID_INVITE_CODE");
          }

          validateJoinableWorkspace(workspace);

          return {
               workspaceName: workspace.name,
               ownerName: workspace.owner.name,
               defaultJoinRole: workspace.defaultJoinRole,
               expiresAt: workspace.inviteCodeExpiresAt,
          };
     },

     async joinByCode(
          rawCode: string,
          userId: string,
     ): Promise<JoinWorkspaceResult> {
          const normalizedCode = rawCode.trim().toUpperCase();

          const workspace = await prisma.workspace.findUnique({
               where: { inviteCode: normalizedCode },
               select: {
                    id: true,
                    name: true,
                    slug: true,
                    ownerId: true,
                    inviteCode: true,
                    inviteCodeExpiresAt: true,
                    inviteLinkEnabled: true,
                    defaultJoinRole: true,
                    owner: {
                         select: { name: true },
                    },
               },
          });

          if (!workspace) {
               throw new AppError("Invalid invite code.", 404, "INVALID_INVITE_CODE");
          }

          validateJoinableWorkspace(workspace);

          const existingMember = await prisma.workspaceMember.findUnique({
               where: {
                    workspaceId_userId: {
                         workspaceId: workspace.id,
                         userId,
                    },
               },
               select: {
                    role: true,
               },
          });

          if (existingMember) {
               return {
                    workspaceSlug: workspace.slug,
                    workspaceId: workspace.id,
                    role: existingMember.role,
                    alreadyMember: true,
               };
          }

          if (workspace.ownerId === userId) {
               return {
                    workspaceSlug: workspace.slug,
                    workspaceId: workspace.id,
                    role: "OWNER",
                    alreadyMember: true,
               };
          }

          const member = await prisma.workspaceMember.create({
               data: {
                    workspaceId: workspace.id,
                    userId,
                    role: workspace.defaultJoinRole,
               },
               select: {
                    role: true,
               },
          });

          return {
               workspaceSlug: workspace.slug,
               workspaceId: workspace.id,
               role: member.role,
               alreadyMember: false,
          };
     },
};