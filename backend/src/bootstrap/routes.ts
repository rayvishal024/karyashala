
import type { Express } from "express";

import { env } from "../config/index.js";
import { apiRouter } from "../routes/index.js";

export function registerRoutes(app: Express): void {
     app.use(env.API_PREFIX, apiRouter);
}
