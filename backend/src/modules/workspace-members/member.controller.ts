import type { Request, Response } from "express";
import { sendSuccess } from "../../shared/http/index.js";
import { AppError } from "../../shared/errors/index.js";
import { workspaceIdParamSchema } from "../workspace/workspace.schema.js";
import {
     memberIdParamSchema,
     transferOwnershipSchema,
     updateMemberRoleSchema,
} from "./member.schema.js";
import { memberService } from "./member.service.js";

export const memberController = {
     async list(req: Request, res: Response) {
          const { workspaceId } = workspaceIdParamSchema.parse(req.params);
          const members = await memberService.listMembers(workspaceId);
          return sendSuccess(res, { members }, "Members fetched successfully");
     },

     async updateRole(req: Request, res: Response) {
          const { workspaceId, memberId } = memberIdParamSchema.parse(req.params);
          const input = updateMemberRoleSchema.parse(req.body);
          const member = await memberService.updateMemberRole(
               workspaceId,
               memberId,
               input,
          );
          return sendSuccess(res, { member }, "Member role updated successfully");
     },

     async remove(req: Request, res: Response) {
          const { workspaceId, memberId } = memberIdParamSchema.parse(req.params);
          await memberService.removeMember(workspaceId, memberId);
          return sendSuccess(res, null, "Member removed successfully");
     },

     async leave(req: Request, res: Response) {
          if (!req.user) {
               throw new AppError("Authentication required.", 401, "UNAUTHENTICATED");
          }

          const { workspaceId } = workspaceIdParamSchema.parse(req.params);
          await memberService.leaveWorkspace(workspaceId, req.user.id);
          return sendSuccess(res, null, "Left workspace successfully");
     },

     async transferOwnership(req: Request, res: Response) {
          if (!req.user) {
               throw new AppError("Authentication required.", 401, "UNAUTHENTICATED");
          }

          const { workspaceId } = workspaceIdParamSchema.parse(req.params);
          const input = transferOwnershipSchema.parse(req.body);
          const result = await memberService.transferOwnership(
               workspaceId,
               req.user.id,
               input,
          );
          return sendSuccess(
               res,
               result,
               "Workspace ownership transferred successfully",
          );
     },
};