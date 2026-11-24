
import app from "./app.js";

import { env } from "./config/index.js";
import {
     connectDatabase,
     disconnectDatabase,
} from "./config/prisma.js";
import { logger } from "./shared/logger/index.js";

async function startServer(): Promise<void> {
     try {
          // Connect to Neon before accepting requests.
          await connectDatabase();

          const server = app.listen(env.PORT, () => {
               logger.info(
                    {
                         app: env.APP_NAME,
                         port: env.PORT,
                         environment: env.NODE_ENV,
                    },
                    "Application server started",
               );
          });

          let isShuttingDown = false;

          async function shutdown(signal: NodeJS.Signals): Promise<void> {
               if (isShuttingDown) return;

               isShuttingDown = true;

               logger.info({ signal }, "Graceful shutdown initiated");

               server.close(async (error) => {
                    if (error) {
                         logger.error({ err: error }, "HTTP server shutdown failed");
                         process.exitCode = 1;
                    }

                    try {
                         await disconnectDatabase();
                         logger.info("Database connection closed");
                    } catch (disconnectError) {
                         logger.error(
                              { err: disconnectError },
                              "Database disconnection failed",
                         );

                         process.exitCode = 1;
                    }
               });
          }

          process.once("SIGINT", () => void shutdown("SIGINT"));
          process.once("SIGTERM", () => void shutdown("SIGTERM"));

          server.on("error", (error) => {
               logger.fatal({ err: error }, "HTTP server error");
               process.exitCode = 1;
          });
     } catch (error) {
          logger.fatal({ err: error }, "Application startup failed");
          process.exitCode = 1;
     }
}

void startServer();
