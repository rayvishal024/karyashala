import { Router, type Router as ExpressRouter } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import {
     requireWorkspaceMember,
     requireWorkspaceOwner,
} from "../workspace/workspace.middleware.js";
import { memberController } from "./member.controller.js";

const workspaceMemberRouter: ExpressRouter = Router({ mergeParams: true });

workspaceMemberRouter.get(
     "/:workspaceId/members",
     authenticate,
     requireWorkspaceMember,
     memberController.list,
);

workspaceMemberRouter.patch(
     "/:workspaceId/members/:memberId/role",
     authenticate,
     requireWorkspaceOwner,
     memberController.updateRole,
);

workspaceMemberRouter.delete(
     "/:workspaceId/members/:memberId",
     authenticate,
     requireWorkspaceOwner,
     memberController.remove,
);

workspaceMemberRouter.post(
     "/:workspaceId/leave",
     authenticate,
     requireWorkspaceMember,
     memberController.leave,
);

workspaceMemberRouter.post(
     "/:workspaceId/transfer-ownership",
     authenticate,
     requireWorkspaceOwner,
     memberController.transferOwnership,
);

export { workspaceMemberRouter };