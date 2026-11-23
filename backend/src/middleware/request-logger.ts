
import { randomUUID } from "node:crypto";
import pinoHttpModule from 'pino-http';

const pinoHttp = pinoHttpModule.default ?? pinoHttpModule;

import { logger } from "../shared/logger/index.js";

export const requestLogger = pinoHttp({
     logger,

     genReqId: () => randomUUID(),

     customLogLevel(_req, res, err) {
          if (err || res.statusCode >= 500) {
               return "error";
          }

          if (res.statusCode >= 400) {
               return "warn";
          }

          return "info";
     },
});
