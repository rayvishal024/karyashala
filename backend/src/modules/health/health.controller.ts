
import type { RequestHandler } from "express";

import { sendSuccess } from "../../shared/http/index.js";
import { getHealthStatus } from "./health.service.js";

export const getHealthController: RequestHandler = (_req, res) => {
     return sendSuccess(
          res,
          getHealthStatus(),
          "Service is healthy",
     );
};
