import type { Request, Response } from "express";
import { sendSuccess } from "../../shared/http/index.js";
import { AppError } from "../../shared/errors/index.js";
import { workspaceIdParamSchema } from "../workspace/workspace.schema.js";
import {
     joinCodeParamSchema,
     updateInviteLinkSchema,
} from "./invite-link.schema.js";
import { inviteLinkService } from "./invite-link.service.js";

function readCodeParam(
     params: Record<string, string | string[] | undefined>,
): string {
     const rawCode = params.code;
     const { code } = joinCodeParamSchema.parse({
          code: typeof rawCode === "string" ? rawCode : "",
     });
     return code;
}

export const inviteLinkController = {
     async getConfig(req: Request, res: Response) {
          const { workspaceId } = workspaceIdParamSchema.parse(req.params);
          const config = await inviteLinkService.getInviteLinkConfig(workspaceId);
          return sendSuccess(res, config, "Invite link settings fetched");
     },

     async regenerate(req: Request, res: Response) {
          const { workspaceId } = workspaceIdParamSchema.parse(req.params);
          const config = await inviteLinkService.regenerateInviteCode(workspaceId);
          return sendSuccess(res, config, "Invite code regenerated successfully");
     },

     async updateSettings(req: Request, res: Response) {
          const { workspaceId } = workspaceIdParamSchema.parse(req.params);
          const input = updateInviteLinkSchema.parse(req.body);
          const config = await inviteLinkService.updateInviteLinkSettings(
               workspaceId,
               input,
          );
          return sendSuccess(res, config, "Invite link settings updated");
     },

     async getPublicDetails(req: Request, res: Response) {
          const code = readCodeParam(req.params);
          const details = await inviteLinkService.getPublicJoinDetails(code);
          return sendSuccess(res, details, "Join details fetched");
     },

     async join(req: Request, res: Response) {
          if (!req.user) {
               throw new AppError("Authentication required.", 401, "UNAUTHENTICATED");
          }

          const code = readCodeParam(req.params);
          const result = await inviteLinkService.joinByCode(code, req.user.id);
          return sendSuccess(res, result, "Joined workspace successfully");
     },
};