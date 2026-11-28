import type { Prisma } from "../../generated/prisma/client.js";
import type {
     createDocSchema,
     updateDocSchema,
} from "./doc.validator.js";

export type CreateDocInput = ReturnType<typeof createDocSchema.parse>;
export type UpdateDocInput = ReturnType<typeof updateDocSchema.parse>;

export interface DocumentPerson {
     id: string;
     name: string;
     avatar: string | null;
}

export interface DocumentListItem {
     id: string;
     title: string;
     excerpt: string;
     createdAt: Date;
     updatedAt: Date;
     createdBy: DocumentPerson;
     updatedBy: DocumentPerson;
}

export interface WorkspaceDocument extends Omit<DocumentListItem, "excerpt"> {
     workspaceId: string;
     contentJson: Prisma.JsonValue | null;
     contentText: string;
}
