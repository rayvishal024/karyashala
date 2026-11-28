import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors/index.js";
import type {
     CreateDocInput,
     DocumentListItem,
     UpdateDocInput,
     WorkspaceDocument,
} from "./doc.types.js";

const personSelect = {
     id: true,
     name: true,
     avatar: true,
} as const;

const documentSelect = {
     id: true,
     workspaceId: true,
     title: true,
     contentJson: true,
     contentText: true,
     createdAt: true,
     updatedAt: true,
     createdBy: { select: personSelect },
     updatedBy: { select: personSelect },
} as const;

function toExcerpt(text: string): string {
     const excerpt = text.trim();
     return excerpt.length > 160 ? `${excerpt.slice(0, 157)}...` : excerpt;
}

export const docService = {
     async list(workspaceId: string): Promise<DocumentListItem[]> {
          const documents = await prisma.document.findMany({
               where: { workspaceId },
               select: documentSelect,
               orderBy: { updatedAt: "desc" },
          });

          return documents.map(({ contentJson: _contentJson, contentText, ...doc }) => ({
               ...doc,
               excerpt: toExcerpt(contentText),
          }));
     },

     async create(
          workspaceId: string,
          userId: string,
          input: CreateDocInput,
     ): Promise<WorkspaceDocument> {
          const document = await prisma.document.create({
               data: {
                    workspaceId,
                    title: input.title ?? "Untitled Doc",
                    contentJson: input.contentJson ?? {
                         type: "doc",
                         content: [{ type: "paragraph" }],
                    },
                    contentText: input.contentText ?? "",
                    createdById: userId,
                    updatedById: userId,
               },
               select: documentSelect,
          });

          return document;
     },

     async get(workspaceId: string, docId: string): Promise<WorkspaceDocument> {
          const document = await prisma.document.findFirst({
               where: { id: docId, workspaceId },
               select: documentSelect,
          });

          if (!document) {
               throw new AppError("Document not found.", 404, "DOC_NOT_FOUND");
          }

          return document;
     },

     async update(
          workspaceId: string,
          docId: string,
          userId: string,
          input: UpdateDocInput,
     ): Promise<WorkspaceDocument> {
          const result = await prisma.document.updateMany({
               where: { id: docId, workspaceId },
               data: {
                    ...(input.title !== undefined ? { title: input.title } : {}),
                    ...(input.contentJson !== undefined
                         ? { contentJson: input.contentJson }
                         : {}),
                    ...(input.contentText !== undefined
                         ? { contentText: input.contentText }
                         : {}),
                    updatedById: userId,
               },
          });

          if (result.count === 0) {
               throw new AppError("Document not found.", 404, "DOC_NOT_FOUND");
          }

          const document = await prisma.document.findFirst({
               where: { id: docId, workspaceId },
               select: documentSelect,
          });

          if (!document) {
               throw new AppError("Document not found.", 404, "DOC_NOT_FOUND");
          }

          return document;
     },

     async remove(workspaceId: string, docId: string): Promise<void> {
          const result = await prisma.document.deleteMany({
               where: { id: docId, workspaceId },
          });

          if (result.count === 0) {
               throw new AppError("Document not found.", 404, "DOC_NOT_FOUND");
          }
     },
};
