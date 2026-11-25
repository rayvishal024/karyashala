import { Router, type Router as ExpressRouter } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import {
     requireWorkspaceMember,
     requireWorkspaceOwner,
} from "./workspace.middleware.js";
import { workspaceController } from "./workspace.controller.js";

const workspaceRouter: ExpressRouter = Router();

workspaceRouter.use(authenticate);

workspaceRouter.post("/", workspaceController.create);
workspaceRouter.get("/", workspaceController.list);
workspaceRouter.get(
     "/:workspaceId",
     requireWorkspaceMember,
     workspaceController.getById,
);
workspaceRouter.patch(
     "/:workspaceId",
     requireWorkspaceOwner,
     workspaceController.update,
);
workspaceRouter.delete(
     "/:workspaceId",
     requireWorkspaceOwner,
     workspaceController.remove,
);

export { workspaceRouter };