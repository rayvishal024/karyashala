import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/index.js";
import { sendSuccess } from "../../shared/http/index.js";
import { publishDocumentCommentsChanged } from "../doc-collab/doc-collab.server.js";
import {
     createDocumentCommentSchema,
     documentCommentIdParamsSchema,
     documentCommentParamsSchema,
} from "./comment.validator.js";
import { documentCommentService } from "./comment.service.js";

export const documentCommentController = {
     async list(req: Request, res: Response) {
          const { workspaceId, docId } = documentCommentParamsSchema.parse(req.params);
          const comments = await documentCommentService.list(workspaceId, docId);
          return sendSuccess(res, { comments }, "Document comments fetched successfully");
     },

     async create(req: Request, res: Response) {
          if (!req.user) {
               throw new AppError("Authentication required.", 401, "UNAUTHENTICATED");
          }
          const { workspaceId, docId } = documentCommentParamsSchema.parse(req.params);
          const input = createDocumentCommentSchema.parse(req.body);
          const comment = await documentCommentService.create(
               workspaceId,
               docId,
               req.user.id,
               input,
          );
          void publishDocumentCommentsChanged(workspaceId, docId);
          return sendSuccess(res, { comment }, "Document comment created successfully", 201);
     },

     async remove(req: Request, res: Response) {
          if (!req.user) {
               throw new AppError("Authentication required.", 401, "UNAUTHENTICATED");
          }
          const { workspaceId, docId, commentId } =
               documentCommentIdParamsSchema.parse(req.params);
          const role = req.workspaceMembership?.role;
          if (!role) {
               throw new AppError("Workspace membership is required.", 403, "NOT_WORKSPACE_MEMBER");
          }
          const result = await documentCommentService.delete(
               workspaceId,
               docId,
               commentId,
               req.user.id,
               role,
          );
          void publishDocumentCommentsChanged(workspaceId, docId);
          return sendSuccess(res, result, "Document comment deleted successfully");
     },
};
