
import type { Express } from "express";

import {
     errorHandler,
     notFoundHandler,
} from "../middleware/index.js";

export function registerErrorHandling(app: Express): void {
     
     app.use(notFoundHandler);

     
     app.use(errorHandler);
}
