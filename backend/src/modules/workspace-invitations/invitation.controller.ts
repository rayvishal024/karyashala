import type { Request, Response } from "express";
import { sendSuccess } from "../../shared/http/index.js";
import { AppError } from "../../shared/errors/index.js";
import { workspaceIdParamSchema } from "../workspace/workspace.schema.js";
import {
     createInviteSchema,
     inviteIdParamSchema,
     inviteTokenParamSchema,
} from "./invitation.schema.js";
import { invitationService } from "./invitation.service.js";

function readTokenParam(params: Record<string, string | string[] | undefined>): string {
     const rawToken = params.token;
     const { token } = inviteTokenParamSchema.parse({
          token: typeof rawToken === "string" ? rawToken : "",
     });
     return token;
}

export const invitationController = {
     async create(req: Request, res: Response) {
          if (!req.user) {
               throw new AppError("Authentication required.", 401, "UNAUTHENTICATED");
          }

          const { workspaceId } = workspaceIdParamSchema.parse(req.params);
          const input = createInviteSchema.parse(req.body);

          const invitation = await invitationService.createInvite(
               workspaceId,
               req.user.id,
               input,
          );

          return sendSuccess(
               res,
               { invitation },
               "Invitation sent successfully",
               201,
          );
     },

     async getByToken(req: Request, res: Response) {
          const token = readTokenParam(req.params);
          const invite = await invitationService.getInviteDetails(token);
          return sendSuccess(res, { invite }, "Invitation details fetched");
     },

     async accept(req: Request, res: Response) {
          if (!req.user) {
               throw new AppError("Authentication required.", 401, "UNAUTHENTICATED");
          }

          const token = readTokenParam(req.params);
          const result = await invitationService.acceptInvite(token, req.user.id);
          return sendSuccess(res, result, "Invitation accepted successfully");
     },

     async decline(req: Request, res: Response) {
          if (!req.user) {
               throw new AppError("Authentication required.", 401, "UNAUTHENTICATED");
          }

          const token = readTokenParam(req.params);
          const result = await invitationService.declineInvite(token, req.user.id);
          return sendSuccess(res, result, "Invitation declined");
     },

     async list(req: Request, res: Response) {
          const { workspaceId } = workspaceIdParamSchema.parse(req.params);
          const invitations = await invitationService.listWorkspaceInvites(workspaceId);
          return sendSuccess(res, { invitations }, "Invitations fetched");
     },

     async resend(req: Request, res: Response) {
          if (!req.user) {
               throw new AppError("Authentication required.", 401, "UNAUTHENTICATED");
          }

          const { workspaceId, inviteId } = inviteIdParamSchema.parse(req.params);
          const invitation = await invitationService.resendInvite(
               workspaceId,
               inviteId,
               req.user.id,
          );

          return sendSuccess(res, { invitation }, "Invitation resent successfully");
     },

     async revoke(req: Request, res: Response) {
          const { workspaceId, inviteId } = inviteIdParamSchema.parse(req.params);
          const invitation = await invitationService.revokeInvite(workspaceId, inviteId);
          return sendSuccess(res, { invitation }, "Invitation revoked successfully");
     },
};