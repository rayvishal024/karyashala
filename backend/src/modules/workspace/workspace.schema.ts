import { z } from "zod";

export const createWorkspaceSchema = z.object({
     name: z
          .string()
          .trim()
          .min(2, "Workspace name must be at least 2 characters")
          .max(80, "Workspace name must be at most 80 characters"),
});

export const updateWorkspaceSchema = z.object({
     name: z
          .string()
          .trim()
          .min(2, "Workspace name must be at least 2 characters")
          .max(80, "Workspace name must be at most 80 characters"),
});

export const workspaceIdParamSchema = z.object({
     workspaceId: z.string().trim().min(1, "Workspace ID is required"),
});