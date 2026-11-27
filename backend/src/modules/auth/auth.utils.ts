import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Response, CookieOptions } from "express";

import { env } from "../../config/index.js";
import type {
     AccessTokenPayload,
     RefreshTokenPayload,
     AuthTokens,
} from "./auth.types.js";

import { OAuth2Client, CodeChallengeMethod } from "google-auth-library";

const SALT_ROUNDS = 12;

export const ACCESS_COOKIE_NAME = "access_token";
export const REFRESH_COOKIE_NAME = "refresh_token";

export const googleOAuthClient = new OAuth2Client({
     clientId: env.GOOGLE_CLIENT_ID,
     clientSecret: env.GOOGLE_CLIENT_SECRET,
     redirectUri: env.GOOGLE_REDIRECT_URI,
});

export const OAUTH_STATE_COOKIE = "google_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "google_oauth_verifier";


export function isSafeInternalRedirect(value: unknown): value is string {
     return (
          typeof value === "string" &&
          value.startsWith("/") &&
          !value.startsWith("//") &&
          !value.includes("\\") &&
          !/[\u0000-\u001f\u007f]/.test(value)
     );
}

export function generateOAuthState(redirect?: unknown): string {
     const payload = {
          nonce: crypto.randomBytes(32).toString("base64url"),
          ...(isSafeInternalRedirect(redirect) ? { redirect } : {}),
     };
     return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function getOAuthStateRedirect(state: string): string | undefined {
     try {
          const payload: unknown = JSON.parse(
               Buffer.from(state, "base64url").toString("utf8"),
          );
          if (
               typeof payload === "object" &&
               payload !== null &&
               "redirect" in payload &&
               isSafeInternalRedirect(payload.redirect)
          ) {
               return payload.redirect;
          }
     } catch {
          return undefined;
     }
     return undefined;
}

export async function generateGoogleAuthUrl(state: string): Promise<{
     url: string;
     codeVerifier: string;
}> {
     const { codeVerifier, codeChallenge } =
          await googleOAuthClient.generateCodeVerifierAsync();

     const url = googleOAuthClient.generateAuthUrl({
          access_type: "offline",
          scope: ["openid", "email", "profile"],
          state,
          code_challenge: codeChallenge,
          code_challenge_method: CodeChallengeMethod.S256,
     });

     return { url, codeVerifier };
}

// --- Password & Token Hashing ---

export async function hashPassword(plainPassword: string): Promise<string> {
     return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function comparePassword(
     plainPassword: string,
     passwordHash: string,
): Promise<boolean> {
     return bcrypt.compare(plainPassword, passwordHash);
}

export function hashToken(rawToken: string): string {
     return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// --- JWT Sign & Verify ---

export function signAccessToken(payload: AccessTokenPayload): string {
     return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
          expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
     });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
     return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
          expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
     });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
     return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
     return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

// --- Cookie Helpers ---

function getBaseCookieOptions(): CookieOptions {
     const isProd = env.NODE_ENV === "production";
     return {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? "none" : "lax",
          ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
     };
}

export function setAuthCookies(res: Response, tokens: AuthTokens): void {
     const baseOptions = getBaseCookieOptions();

     res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
          ...baseOptions,
          path: "/",
          maxAge: 15 * 60 * 1000, // 15 minutes
     });

     res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
          ...baseOptions,
          path: `${env.API_PREFIX}/auth`, // Restrict refresh cookie strictly to /auth routes
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
     });
}

export function clearAuthCookies(res: Response): void {
     const baseOptions = getBaseCookieOptions();

     res.clearCookie(ACCESS_COOKIE_NAME, {
          ...baseOptions,
          path: "/",
     });

     res.clearCookie(REFRESH_COOKIE_NAME, {
          ...baseOptions,
          path: `${env.API_PREFIX}/auth`,
     });
}

export function setOAuthStateCookies(
     res: Response,
     state: string,
     codeVerifier: string,
): void {
     const baseOptions = getBaseCookieOptions();
     const oauthCookieOptions: CookieOptions = {
          ...baseOptions,
          path: `${env.API_PREFIX}/auth/google`,
          maxAge: 10 * 60 * 1000, // 10 minutes
     };

     res.cookie(OAUTH_STATE_COOKIE, state, oauthCookieOptions);
     res.cookie(OAUTH_VERIFIER_COOKIE, codeVerifier, oauthCookieOptions);
}

export function clearOAuthStateCookies(res: Response): void {
     const baseOptions = getBaseCookieOptions();
     const oauthCookieOptions: CookieOptions = {
          ...baseOptions,
          path: `${env.API_PREFIX}/auth/google`,
     };

     res.clearCookie(OAUTH_STATE_COOKIE, oauthCookieOptions);
     res.clearCookie(OAUTH_VERIFIER_COOKIE, oauthCookieOptions);
}
