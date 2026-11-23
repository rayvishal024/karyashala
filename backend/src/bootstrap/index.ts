
import type { Express } from "express";

import { securityMiddleware } from "./security.js";
import { corsMiddleware } from "./cors.js";
import { parsingMiddleware } from "./parsing.js";
import { globalRateLimiter } from "./rate-limit.js";

import { requestLogger } from "../middleware/request-logger.js";

export function registerGlobalMiddleware(app: Express): void {
     // 1. Request logging and request ID
     app.use(requestLogger);

     // 2. Security headers
     app.use(securityMiddleware);

     // 3. Cross-origin resource sharing
     app.use(corsMiddleware);

     // 4. Rate limiting
     app.use(globalRateLimiter);

     // 5. Request body and cookie parsing
     app.use(...parsingMiddleware);
}
