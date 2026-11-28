
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
     REDIS_URL: z.string().optional().default(""),

     // JWT Authentication Config
     JWT_ACCESS_SECRET: z
          .string()
          .min(32, "JWT_ACCESS_SECRET must be at least 32 characters long"),

     JWT_REFRESH_SECRET: z
          .string()
          .min(32, "JWT_REFRESH_SECRET must be at least 32 characters long"),

     JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),

     JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

     COOKIE_DOMAIN: z.string().optional(),

     GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
     GOOGLE_CLIENT_SECRET: z
          .string()
          .min(1, "GOOGLE_CLIENT_SECRET is required"),
     
     GOOGLE_REDIRECT_URI: z.string().min(1, "GOOGLE_REDIRECT_URI is required"),

     FRONTEND_URL: z.string().min(1, "FRONTEND_URL is required"),

     RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),

     RESEND_FROM_EMAIL: z.string().min(1, "RESEND_FROM_EMAIL is required"),

     APP_URL: z.string().min(1, "APP_URL is required"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
     console.error("Invalid environment configuration:");
     console.error(z.prettifyError(parsedEnv.error));
     process.exit(1);
}

export const env = Object.freeze(parsedEnv.data);
