
import { Router, type Router as ExpressRouter } from "express";

import { getHealthController } from "./health.controller.js";

const healthRouter: ExpressRouter = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Check API health
 *     description: Returns the current API process status.
 *     responses:
 *       200:
 *         description: API is healthy.
 *       429:
 *         description: Rate limit exceeded.
 */
healthRouter.get("/", getHealthController);

export { healthRouter };
