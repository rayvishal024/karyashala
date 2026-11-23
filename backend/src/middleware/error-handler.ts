
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";

import { AppError } from "../shared/errors/index.js";
import { logger } from "../shared/logger/index.js";

export const errorHandler: ErrorRequestHandler = (
     error,
     req,
     res,
     _next,
) => {
     const requestId = String(req.id ?? "unknown");

     if (res.headersSent) {
          return;
     }

     let statusCode = 500;
     let code = "INTERNAL_SERVER_ERROR";
     let message = "An unexpected error occurred.";
     let details: unknown;

     if (error instanceof AppError) {
          statusCode = error.statusCode;
          code = error.code;
          message = error.message;
          details = error.details;
     } else if (error instanceof ZodError) {
          statusCode = 400;
          code = "VALIDATION_ERROR";
          message = "Invalid request data.";
          details = error.issues.map((issue) => ({
               path: issue.path.join("."),
               message: issue.message,
          }));
     } else if (
          error instanceof Prisma.PrismaClientKnownRequestError
     ) {
          switch (error.code) {
               case "P2002":
                    statusCode = 409;
                    code = "RESOURCE_ALREADY_EXISTS";
                    message = "A record with this value already exists.";
                    break;

               case "P2025":
                    statusCode = 404;
                    code = "RESOURCE_NOT_FOUND";
                    message = "The requested record was not found.";
                    break;

               case "P2003":
                    statusCode = 400;
                    code = "RELATED_RECORD_NOT_FOUND";
                    message = "A related record could not be found.";
                    break;
          }
     }

     if (statusCode >= 500) {
          logger.error({ err: error, requestId }, "Request failed");
     } else {
          logger.warn({ err: error, requestId }, "Request rejected");
     }

     res.status(statusCode).json({
          success: false,
          error: {
               code,
               message,
               ...(details !== undefined ? { details } : {}),
          },
          requestId,
     });
};
