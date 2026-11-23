
import pino from "pino";

import { env } from "../../config/index.js";

export const logger = pino({
     level: env.NODE_ENV === "production" ? "info" : "debug",

     transport:
          env.NODE_ENV === "development"
               ? {
                    target: "pino-pretty",
                    options: {
                         colorize: true,
                         translateTime: "SYS:standard",
                         ignore: "pid,hostname",
                    },
               }
               : undefined,

     redact: {
          paths: [
               "password",
               "*.password",
               "authorization",
               "cookie",
               "set-cookie",
               "*.token",
               "*.secret",
          ],
          censor: "[REDACTED]",
     },
});
