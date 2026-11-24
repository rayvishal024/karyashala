
import { Router, type Router as ExpressRouter } from 'express';

import { healthRouter } from "../modules/health/index.js";
import { authRouter } from "../modules/auth/index.js";

const apiRouter: ExpressRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);

export { apiRouter };
