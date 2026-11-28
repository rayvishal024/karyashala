import { z } from "zod";

export const documentCommentParamsSchema = z.object({
     workspaceId: z.string().trim().min(1, "Workspace ID is required"),
     docId: z.string().trim().min(1, "Document ID is required"),
});

export const documentCommentIdParamsSchema =
     documentCommentParamsSchema.extend({
          commentId: z.string().trim().min(1, "Comment ID is required"),
     });

export const createDocumentCommentSchema = z.object({
     body: z
          .string()
          .trim()
          .min(1, "Comment cannot be empty")
          .max(2_000, "Comment must be at most 2,000 characters"),
     parentId: z.string().trim().min(1, "Parent comment ID is required").optional(),
});
