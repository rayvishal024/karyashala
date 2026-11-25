import type { RequestHandler } from "express";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors/index.js";

function extractWorkspaceId(params: Record<string, string | string[] | undefined>): string {
     const rawId = params.workspaceId;
     const workspaceId = typeof rawId === "string" ? rawId.trim() : "";

     if (!workspaceId) {
          throw new AppError("Workspace ID is required.", 400, "INVALID_WORKSPACE_ID");
     }
     return workspaceId;
}

export const requireWorkspaceMember: RequestHandler = async (req, _res, next) => {
     if (!req.user) {
          throw new AppError("Authentication required.", 401, "UNAUTHENTICATED");
     }

     const workspaceId = extractWorkspaceId(req.params);

     const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { id: true },
     });

     if (!workspace) {
          throw new AppError("Workspace not found.", 404, "WORKSPACE_NOT_FOUND");
     }

     const membership = await prisma.workspaceMember.findUnique({
          where: {
               workspaceId_userId: {
                    workspaceId,
                    userId: req.user.id,
               },
          },
          select: {
               workspaceId: true,
               userId: true,
               role: true,
          },
     });

     if (!membership) {
          throw new AppError(
               "You are not a member of this workspace.",
               403,
               "NOT_WORKSPACE_MEMBER",
          );
     }

     req.workspaceMembership = membership;
     next();
};

export const requireWorkspaceOwner: RequestHandler = async (req, res, next) => {
     await requireWorkspaceMember(req, res, (err) => {
          if (err) {
               return next(err);
          }

          if (req.workspaceMembership?.role !== "OWNER") {
               return next(
                    new AppError(
                         "Only the workspace owner can perform this action.",
                         403,
                         "OWNER_REQUIRED",
                    ),
               );
          }

          return next();
     });
};