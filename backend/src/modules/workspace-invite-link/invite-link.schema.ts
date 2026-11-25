import { z } from "zod";

export const updateInviteLinkSchema = z.object({
     enabled: z.boolean(),
     defaultJoinRole: z.enum(["EDITOR", "VIEWER"]),
});

export const joinCodeParamSchema = z.object({
     code: z
          .string()
          .trim()
          .min(4, "Invalid invite code")
          .max(32, "Invalid invite code")
          .transform((val) => val.toUpperCase()),
});