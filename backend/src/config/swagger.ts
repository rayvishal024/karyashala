
import swaggerJsdoc from "swagger-jsdoc";

import { env } from "./index.js";

const swaggerOptions: swaggerJsdoc.Options = {
     definition: {
          openapi: "3.0.3",

          info: {
               title: `${env.APP_NAME} API`,
               version: "1.0.0",
               description: "API documentation for the Karyashala platform.",
          },

          servers: [
               {
                    url: env.API_PREFIX,
                    description: "Current API server",
               },
          ],
     },

     apis: ["./src/modules/**/*.route.ts"],
};

export const openApiSpecification = swaggerJsdoc(swaggerOptions);
