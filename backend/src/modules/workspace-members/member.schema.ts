import { z } from "zod";

export const updateMemberRoleSchema = z.object({
     role: z.enum(["EDITOR", "VIEWER"]),
});

export const memberIdParamSchema = z.object({
     workspaceId: z.string().trim().min(1, "Workspace ID is required"),
     memberId: z.string().trim().min(1, "Member ID is required"),
});

export const transferOwnershipSchema = z.object({
     newOwnerId: z.string().trim().min(1, "New owner user ID is required"),
});