import { Router, type Router as ExpressRouter } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireWorkspaceOwner } from "../workspace/workspace.middleware.js";
import { inviteLinkController } from "./invite-link.controller.js";

const workspaceInviteLinkRouter: ExpressRouter = Router({ mergeParams: true });

workspaceInviteLinkRouter.get(
     "/:workspaceId/invite-link",
     authenticate,
     requireWorkspaceOwner,
     inviteLinkController.getConfig,
);

workspaceInviteLinkRouter.post(
     "/:workspaceId/regenerate-invite-code",
     authenticate,
     requireWorkspaceOwner,
     inviteLinkController.regenerate,
);

workspaceInviteLinkRouter.patch(
     "/:workspaceId/invite-link",
     authenticate,
     requireWorkspaceOwner,
     inviteLinkController.updateSettings,
);

const publicJoinRouter: ExpressRouter = Router();

publicJoinRouter.get("/:code", inviteLinkController.getPublicDetails);
publicJoinRouter.post("/:code", authenticate, inviteLinkController.join);

export { workspaceInviteLinkRouter, publicJoinRouter };