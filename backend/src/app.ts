
import express, { type Express} from "express";

import { registerGlobalMiddleware } from "./bootstrap/index.js";
import { registerRoutes } from "./bootstrap/routes.js";
import { registerErrorHandling } from "./bootstrap/error-handling.js";
import { registerSwagger } from "./bootstrap/swagger.js";

const app : Express = express();

registerGlobalMiddleware(app);
registerSwagger(app);
registerRoutes(app);
registerErrorHandling(app);

export default app;
