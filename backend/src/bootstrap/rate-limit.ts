
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

export const authRateLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     limit: 10, // Max 10 attempts per IP per 15 mins
     standardHeaders: "draft-8",
     legacyHeaders: false,
     skipSuccessfulRequests: true, // Only count failed attempts (optional, great UX)
     message: {
          success: false,
          error: {
               code: "AUTH_RATE_LIMIT_EXCEEDED",
               message: "Too many authentication attempts. Please try again after 15 minutes.",
          },
     },
});
