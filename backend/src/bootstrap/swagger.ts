
import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

import { openApiSpecification } from "../config/swagger.js";

export function registerSwagger(app: Express): void {
     app.get("/api-docs.json", (_req, res) => {
          res.json(openApiSpecification);
     });

     app.use(
          "/api-docs",
          swaggerUi.serve,
          swaggerUi.setup(openApiSpecification, {
               customSiteTitle: "Karyashala API Documentation",
               explorer: true,
          }),
     );
}
