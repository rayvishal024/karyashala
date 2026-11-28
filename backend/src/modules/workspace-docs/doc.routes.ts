import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { AppError } from "../../shared/errors/index.js";
import { requireWorkspaceMember } from "../workspace/workspace.middleware.js";
import { docController } from "./doc.controller.js";

const requireDocEditor: RequestHandler = (req, _res, next) => {
     const role = req.workspaceMembership?.role;
     if (role !== "OWNER" && role !== "EDITOR") {
          return next(
               new AppError(
                    "Only workspace owners and editors can modify documents.",
                    403,
                    "DOC_EDIT_FORBIDDEN",
               ),
          );
     }
     return next();
};

const workspaceDocsRouter: ExpressRouter = Router();

workspaceDocsRouter.get(
     "/:workspaceId/docs",
     authenticate,
     requireWorkspaceMember,
     docController.list,
);
workspaceDocsRouter.post(
     "/:workspaceId/docs",
     authenticate,
     requireWorkspaceMember,
     requireDocEditor,
     docController.create,
);
workspaceDocsRouter.get(
     "/:workspaceId/docs/:docId",
     authenticate,
     requireWorkspaceMember,
     docController.getById,
);
workspaceDocsRouter.patch(
     "/:workspaceId/docs/:docId",
     authenticate,
     requireWorkspaceMember,
     requireDocEditor,
     docController.update,
);
workspaceDocsRouter.delete(
     "/:workspaceId/docs/:docId",
     authenticate,
     requireWorkspaceMember,
     requireDocEditor,
     docController.remove,
);

export { workspaceDocsRouter };
