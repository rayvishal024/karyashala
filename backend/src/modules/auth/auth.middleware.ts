import type { RequestHandler } from "express";
import type { Role } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/index.js";
import { ACCESS_COOKIE_NAME, verifyAccessToken } from "./auth.utils.js";

export const authenticate: RequestHandler = (req, _res, next) => {
     const token = req.cookies?.[ACCESS_COOKIE_NAME];

     if (!token) {
          throw new AppError(
               "Authentication required.",
               401,
               "UNAUTHENTICATED",
          );
     }

     try {
          const payload = verifyAccessToken(token);
          req.user = {
               id: payload.sub,
               role: payload.role,
          };
          next();
     } catch {
          throw new AppError(
               "Access token is invalid or expired.",
               401,
               "INVALID_ACCESS_TOKEN",
          );
     }
};

export const authorize = (...allowedRoles: Role[]): RequestHandler => {
     return (req, _res, next) => {
          if (!req.user) {
               throw new AppError(
                    "Authentication required.",
                    401,
                    "UNAUTHENTICATED",
               );
          }

          if (!allowedRoles.includes(req.user.role)) {
               throw new AppError(
                    "You do not have permission to perform this action.",
                    403,
                    "FORBIDDEN",
               );
          }

          next();
     };
};
