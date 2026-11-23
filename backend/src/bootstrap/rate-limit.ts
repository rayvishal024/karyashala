
import rateLimit from "express-rate-limit";

export const globalRateLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     limit: 200,
     standardHeaders: "draft-8",
     legacyHeaders: false,
     message: {
          success: false,
          error: {
               code: "RATE_LIMIT_EXCEEDED",
               message: "Too many requests. Please try again later.",
          },
     },
});
