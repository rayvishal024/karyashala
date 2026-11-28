import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/index.js";
import { sendSuccess } from "../../shared/http/index.js";
import { workspaceIdParamSchema } from "../workspace/workspace.schema.js";
import { docService } from "./doc.service.js";
import {
     createDocSchema,
     docParamsSchema,
     updateDocSchema,
} from "./doc.validator.js";

export const docController = {
     async list(req: Request, res: Response) {
          const { workspaceId } = workspaceIdParamSchema.parse(req.params);
          const documents = await docService.list(workspaceId);
          return sendSuccess(res, { documents }, "Documents fetched successfully");
     },

     async create(req: Request, res: Response) {
          if (!req.user) {
               throw new AppError("Authentication required.", 401, "UNAUTHENTICATED");
          }

          const { workspaceId } = workspaceIdParamSchema.parse(req.params);
          const input = createDocSchema.parse(req.body);
          const document = await docService.create(workspaceId, req.user.id, input);
          return sendSuccess(res, { document }, "Document created successfully", 201);
     },

     async getById(req: Request, res: Response) {
          const { workspaceId, docId } = docParamsSchema.parse(req.params);
          const document = await docService.get(workspaceId, docId);
          return sendSuccess(res, { document }, "Document fetched successfully");
     },

     async update(req: Request, res: Response) {
          if (!req.user) {
               throw new AppError("Authentication required.", 401, "UNAUTHENTICATED");
          }

          const { workspaceId, docId } = docParamsSchema.parse(req.params);
          const input = updateDocSchema.parse(req.body);
          const document = await docService.update(
               workspaceId,
               docId,
               req.user.id,
               input,
          );
          return sendSuccess(res, { document }, "Document updated successfully");
     },

     async remove(req: Request, res: Response) {
          const { workspaceId, docId } = docParamsSchema.parse(req.params);
          await docService.remove(workspaceId, docId);
          return sendSuccess(res, { id: docId }, "Document deleted successfully");
     },
};
