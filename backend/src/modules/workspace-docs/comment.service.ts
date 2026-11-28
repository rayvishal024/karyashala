import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors/index.js";
import type { WorkspaceRole } from "../../generated/prisma/client.js";

const authorSelect = {
     id: true,
     name: true,
     email: true,
     avatar: true,
} as const;

const commentSelect = {
     id: true,
     documentId: true,
     workspaceId: true,
     parentId: true,
     body: true,
     createdAt: true,
     updatedAt: true,
     author: { select: authorSelect },
} as const;

async function ensureDocumentExists(workspaceId: string, docId: string): Promise<void> {
     const document = await prisma.document.findFirst({
          where: { id: docId, workspaceId },
          select: { id: true },
     });
     if (!document) {
          throw new AppError("Document not found.", 404, "DOC_NOT_FOUND");
     }
}

export const documentCommentService = {
     async list(workspaceId: string, docId: string) {
          await ensureDocumentExists(workspaceId, docId);
          return prisma.documentComment.findMany({
               where: { workspaceId, documentId: docId, parentId: null },
               select: {
                    ...commentSelect,
                    replies: {
                         where: { workspaceId, documentId: docId },
                         select: commentSelect,
                         orderBy: { createdAt: "asc" },
                    },
               },
               orderBy: { createdAt: "asc" },
          });
     },

     async create(
          workspaceId: string,
          docId: string,
          authorId: string,
          input: { body: string; parentId?: string },
     ) {
          await ensureDocumentExists(workspaceId, docId);
          if (input.parentId) {
               const parent = await prisma.documentComment.findFirst({
                    where: {
                         id: input.parentId,
                         documentId: docId,
                         workspaceId,
                         parentId: null,
                    },
                    select: { id: true },
               });
               if (!parent) {
                    throw new AppError(
                         "The parent comment was not found or is not a top-level comment.",
                         404,
                         "DOC_COMMENT_PARENT_NOT_FOUND",
                    );
               }
          }

          return prisma.documentComment.create({
               data: {
                    workspaceId,
                    documentId: docId,
                    authorId,
                    parentId: input.parentId,
                    body: input.body,
               },
               select: commentSelect,
          });
     },

     async delete(
          workspaceId: string,
          docId: string,
          commentId: string,
          userId: string,
          role: WorkspaceRole,
     ): Promise<{ id: string }> {
          const comment = await prisma.documentComment.findFirst({
               where: { id: commentId, documentId: docId, workspaceId },
               select: { id: true, authorId: true },
          });
          if (!comment) {
               throw new AppError("Comment not found.", 404, "DOC_COMMENT_NOT_FOUND");
          }
          if (comment.authorId !== userId && role !== "OWNER") {
               throw new AppError(
                    "Only the comment author or a workspace owner can delete this comment.",
                    403,
                    "DOC_COMMENT_DELETE_FORBIDDEN",
               );
          }

          await prisma.documentComment.delete({ where: { id: comment.id } });
          return { id: comment.id };
     },
};
