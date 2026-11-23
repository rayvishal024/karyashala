
import { Router, type Router as ExpressRouter } from 'express';

import { healthRouter } from "../modules/health/index.js";

const apiRouter: ExpressRouter = Router();

apiRouter.use("/health", healthRouter);

export { apiRouter };
