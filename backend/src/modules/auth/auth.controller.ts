import type { Request, Response } from "express";
import { env } from "../../config/index.js";
import { sendSuccess } from "../../shared/http/index.js";
import { AppError } from "../../shared/errors/index.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { authService } from "./auth.service.js";
import {
     REFRESH_COOKIE_NAME,
     OAUTH_STATE_COOKIE,
     OAUTH_VERIFIER_COOKIE,
     setAuthCookies,
     clearAuthCookies,
     generateOAuthState,
     generateGoogleAuthUrl,
     setOAuthStateCookies,
     clearOAuthStateCookies,
} from "./auth.utils.js";

function extractSessionMeta(req: Request) {
     return {
          userAgent: req.get("user-agent"),
          ipAddress: req.ip,
     };
}

export const authController = {
     async register(req: Request, res: Response) {
          const input = registerSchema.parse(req.body);
          const { user, tokens } = await authService.register(
               input,
               extractSessionMeta(req),
          );

          setAuthCookies(res, tokens);
          return sendSuccess(res, { user }, "Account created successfully", 201);
     },

     async login(req: Request, res: Response) {
          const input = loginSchema.parse(req.body);
          const { user, tokens } = await authService.login(
               input,
               extractSessionMeta(req),
          );

          setAuthCookies(res, tokens);
          return sendSuccess(res, { user }, "Logged in successfully");
     },

     async refresh(req: Request, res: Response) {
          const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

          if (!rawRefreshToken) {
               throw new AppError(
                    "Refresh token missing.",
                    401,
                    "REFRESH_TOKEN_MISSING",
               );
          }

          try {
               const { user, tokens } = await authService.refresh(
                    rawRefreshToken,
                    extractSessionMeta(req),
               );

               setAuthCookies(res, tokens);
               return sendSuccess(res, { user }, "Session refreshed");
          } catch (error) {
               clearAuthCookies(res);
               throw error;
          }
     },

     async logout(req: Request, res: Response) {
          const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
          await authService.logout(rawRefreshToken);

          clearAuthCookies(res);
          return sendSuccess(res, null, "Logged out successfully");
     },

     async logoutAll(req: Request, res: Response) {
          await authService.logoutAll(req.user!.id);

          clearAuthCookies(res);
          return sendSuccess(res, null, "Logged out from all devices");
     },

     async me(req: Request, res: Response) {
          const user = await authService.getCurrentUser(req.user!.id);
          return sendSuccess(res, { user }, "User profile fetched");
     },

     async googleRedirect(_req: Request, res: Response) {
          const state = generateOAuthState();
          const { url, codeVerifier } = await generateGoogleAuthUrl(state);

          setOAuthStateCookies(res, state, codeVerifier);
          return res.redirect(url);
     },

     async googleCallback(req: Request, res: Response) {
          const { code, state } = req.query;
          const storedState = req.cookies?.[OAUTH_STATE_COOKIE];
          const codeVerifier = req.cookies?.[OAUTH_VERIFIER_COOKIE];

          clearOAuthStateCookies(res);

          if (
               typeof code !== "string" ||
               typeof state !== "string" ||
               !storedState ||
               !codeVerifier ||
               state !== storedState
          ) {
               return res.redirect(
                    `${env.FRONTEND_URL}/login?error=oauth_state_mismatch`,
               );
          }

          try {
               const { tokens } = await authService.loginWithGoogle(
                    code,
                    codeVerifier,
                    extractSessionMeta(req),
               );

               setAuthCookies(res, tokens);
               return res.redirect(`${env.FRONTEND_URL}/dashboard`);
          } catch {
               return res.redirect(
                    `${env.FRONTEND_URL}/login?error=google_auth_failed`,
               );
          }
     },

};
