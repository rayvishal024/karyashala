import { Router, type Router as ExpressRouter } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireWorkspaceOwner } from "../workspace/workspace.middleware.js";
import { invitationController } from "./invitation.controller.js";

const workspaceInviteRouter: ExpressRouter = Router({ mergeParams: true });

workspaceInviteRouter.post(
     "/:workspaceId/invites",
     authenticate,
     requireWorkspaceOwner,
     invitationController.create,
);

workspaceInviteRouter.get(
     "/:workspaceId/invites",
     authenticate,
     requireWorkspaceOwner,
     invitationController.list,
);

workspaceInviteRouter.post(
     "/:workspaceId/invites/:inviteId/resend",
     authenticate,
     requireWorkspaceOwner,
     invitationController.resend,
);

workspaceInviteRouter.post(
     "/:workspaceId/invites/:inviteId/revoke",
     authenticate,
     requireWorkspaceOwner,
     invitationController.revoke,
);

const publicInviteRouter: ExpressRouter = Router();

publicInviteRouter.get("/:token", invitationController.getByToken);
publicInviteRouter.post("/:token/accept", authenticate, invitationController.accept);
publicInviteRouter.post("/:token/decline", authenticate, invitationController.decline);

export { workspaceInviteRouter, publicInviteRouter };