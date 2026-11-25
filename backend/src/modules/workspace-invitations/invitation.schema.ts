import { z } from "zod";

export const createInviteSchema = z.object({
     email: z
          .string()
          .trim()
          .toLowerCase()
          .email("Please provide a valid email address"),
     role: z.enum(["EDITOR", "VIEWER"]).default("EDITOR"),
});

export const inviteTokenParamSchema = z.object({
     token: z
          .string()
          .trim()
          .min(16, "Invalid invite token")
          .max(256, "Invalid invite token"),
});

export const inviteIdParamSchema = z.object({
     workspaceId: z.string().trim().min(1, "Workspace ID is required"),
     inviteId: z.string().trim().min(1, "Invite ID is required"),
});