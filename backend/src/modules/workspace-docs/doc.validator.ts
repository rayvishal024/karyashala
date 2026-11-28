import { z } from "zod";

const documentJsonSchema = z.record(z.string(), z.json());

export const docParamsSchema = z.object({
     workspaceId: z.string().trim().min(1, "Workspace ID is required"),
     docId: z.string().trim().min(1, "Document ID is required"),
});

export const createDocSchema = z.object({
     title: z
          .string()
          .trim()
          .min(1, "Document title is required")
          .max(200, "Document title must be at most 200 characters")
          .optional(),
     contentJson: documentJsonSchema.optional(),
     contentText: z.string().optional(),
});

export const updateDocSchema = z
     .object({
          title: z
               .string()
               .trim()
               .min(1, "Document title is required")
               .max(200, "Document title must be at most 200 characters")
               .optional(),
          contentJson: documentJsonSchema.optional(),
          contentText: z.string().optional(),
     })
     .refine(
          (input) =>
               input.title !== undefined ||
               input.contentJson !== undefined ||
               input.contentText !== undefined,
          "At least one document field must be provided",
     );
