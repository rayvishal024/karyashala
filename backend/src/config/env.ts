
import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
     NODE_ENV: z
          .enum(["development", "production", "test"])
          .default("development"),

     PORT: z.coerce
          .number()
          .int()
          .min(1)
          .max(65535)
          .default(5000),

     APP_NAME: z.string().min(1).default("Karyashala"),

     API_PREFIX: z.string().startsWith("/").default("/api/v1"),

     CORS_ORIGIN: z
          .string()
          .min(1)
          .transform((value) =>
               value.split(",").map((origin) => origin.trim())
          ),

     DATABASE_URL: z.string().optional().default(""),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
     console.error("Invalid environment configuration:");
     console.error(z.prettifyError(parsedEnv.error));
     process.exit(1);
}

export const env = Object.freeze(parsedEnv.data);
