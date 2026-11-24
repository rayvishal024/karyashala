import { Router, type Router as ExpressRouter } from "express";
import { authRateLimiter } from "../../bootstrap/rate-limit.js";
import { authenticate } from "./auth.middleware.js";
import { authController } from "./auth.controller.js";

const authRouter: ExpressRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: "Aarav Sharma" }
 *               email: { type: string, format: email, example: "aarav@example.com" }
 *               password: { type: string, format: password, example: "StrongPass1" }
 *     responses:
 *       201:
 *         description: Account created and HttpOnly cookies set
 */
authRouter.post("/register", authRateLimiter, authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "aarav@example.com" }
 *               password: { type: string, format: password, example: "StrongPass1" }
 *     responses:
 *       200:
 *         description: Logged in and HttpOnly cookies set
 */
authRouter.post("/login", authRateLimiter, authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token and issue a new access token
 *     responses:
 *       200:
 *         description: New access and refresh cookies set
 */
authRouter.post("/refresh", authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current session and clear cookies
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
authRouter.post("/logout", authController.logout);

/**
 * @openapi
 * /auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke all active sessions for the current user
 *     responses:
 *       200:
 *         description: Logged out from all devices
 */
authRouter.post("/logout-all", authenticate, authController.logoutAll);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get currently authenticated user profile
 *     responses:
 *       200:
 *         description: Authenticated user details
 */
authRouter.get("/me", authenticate, authController.me);

/**
 * @openapi
 * /auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Redirect user to Google OAuth 2.0 consent screen
 *     responses:
 *       302:
 *         description: Redirects to Google
 */
authRouter.get("/google", authController.googleRedirect);

/**
 * @openapi
 * /auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Handle Google OAuth 2.0 callback and set auth cookies
 *     responses:
 *       302:
 *         description: Redirects to frontend dashboard or login error
 */
authRouter.get("/google/callback", authController.googleCallback);

export { authRouter };
