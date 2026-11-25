import type { Request, Response } from "express";
import { sendSuccess } from "../../shared/http/index.js";
import { AppError } from "../../shared/errors/index.js";
import {
     createWorkspaceSchema,
     updateWorkspaceSchema,
     workspaceIdParamSchema,
} from "./workspace.schema.js";
import { workspaceService } from "./workspace.service.js";

export const workspaceController = {
     async create(req: Request, res: Response) {
          if (!req.user) {
               throw new AppError("Authentication required.", 401, "UNAUTHENTICATED");
          }

          const input = createWorkspaceSchema.parse(req.body);
          const workspace = await workspaceService.createWorkspace(req.user.id, input);
          return sendSuccess(res, { workspace }, "Workspace created successfully", 201);
     },

     async list(req: Request, res: Response) {
          if (!req.user) {
               throw new AppError("Authentication required.", 401, "UNAUTHENTICATED");
          }

          const workspaces = await workspaceService.listWorkspacesForUser(req.user.id);
          return sendSuccess(res, { workspaces }, "Workspaces fetched successfully");
     },

     async getById(req: Request, res: Response) {
          const { workspaceId } = workspaceIdParamSchema.parse(req.params);
          const membership = req.workspaceMembership!;
          const workspace = await workspaceService.getWorkspaceById(
               workspaceId,
               membership.role,
          );
          return sendSuccess(res, { workspace }, "Workspace fetched successfully");
     },

     async update(req: Request, res: Response) {
          const { workspaceId } = workspaceIdParamSchema.parse(req.params);
          const input = updateWorkspaceSchema.parse(req.body);
          const membership = req.workspaceMembership!;
          const workspace = await workspaceService.renameWorkspace(
               workspaceId,
               membership.role,
               input,
          );
          return sendSuccess(res, { workspace }, "Workspace updated successfully");
     },

     async remove(req: Request, res: Response) {
          const { workspaceId } = workspaceIdParamSchema.parse(req.params);
          await workspaceService.deleteWorkspace(workspaceId);
          return sendSuccess(res, null, "Workspace deleted successfully");
     },
};