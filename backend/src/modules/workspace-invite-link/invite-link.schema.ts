import { z } from "zod";

export const updateInviteLinkSchema = z.object({
     enabled: z.boolean(),
     defaultJoinRole: z.enum(["EDITOR", "VIEWER"]),
     expiresInDays: z
          .number()
          .int()
          .min(1, "Invite code expiry must be at least one day")
          .max(365, "Invite code expiry cannot exceed 365 days")
          .nullable()
          .optional(),
});

export const joinCodeParamSchema = z.object({
     code: z
          .string()
          .trim()
          .min(4, "Invalid invite code")
          .max(32, "Invalid invite code")
          .transform((val) => val.toUpperCase()),
});