
import { Router, type Router as ExpressRouter } from 'express';

import { healthRouter } from "../modules/health/index.js";
import { authRouter } from "../modules/auth/index.js";
import { workspaceRouter } from "../modules/workspace/index.js";
import { workspaceInviteRouter } from "../modules/workspace-invitations/index.js";
import { workspaceInviteLinkRouter } from "../modules/workspace-invite-link/index.js"
import { workspaceMemberRouter } from "../modules/workspace-members/index.js";
import { publicInviteRouter } from "../modules/workspace-invitations/index.js";
import { publicJoinRouter } from "../modules/workspace-invite-link/index.js";
import { workspaceDocsRouter } from "../modules/workspace-docs/index.js";

const apiRouter: ExpressRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/workspaces", workspaceRouter);
apiRouter.use("/workspaces", workspaceInviteRouter);
apiRouter.use("/workspaces", workspaceInviteLinkRouter);
apiRouter.use("/workspaces", workspaceMemberRouter);
apiRouter.use("/workspaces", workspaceDocsRouter);

apiRouter.use("/invites", publicInviteRouter);
apiRouter.use("/join", publicJoinRouter);

export { apiRouter };
