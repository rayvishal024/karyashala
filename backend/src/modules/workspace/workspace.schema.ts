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
     slug: z
          .string()
          .trim()
          .toLowerCase()
          .min(2, "Workspace slug must be at least 2 characters")
          .max(60, "Workspace slug must be at most 60 characters")
          .regex(
               /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
               "Workspace slug can contain lowercase letters, numbers, and single hyphens",
          ),
});

export const workspaceIdParamSchema = z.object({
     workspaceId: z.string().trim().min(1, "Workspace ID is required"),
});