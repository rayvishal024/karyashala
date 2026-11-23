import cors from "cors";

import { env } from "../config/index.js";

export const corsMiddleware = cors({
     origin(origin, callback) {
          // Allow requests without an Origin header (e.g. server-to-server).
          if (!origin || env.CORS_ORIGIN.includes(origin)) {
               callback(null, true);
               return;
          }

          callback(new Error("Not allowed by CORS"));
     },

     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

     allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],

     credentials: true,
});