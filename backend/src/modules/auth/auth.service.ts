import crypto from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors/index.js";
import type { User } from "../../generated/prisma/client.js";
import {
     hashPassword,
     comparePassword,
     hashToken,
     signAccessToken,
     signRefreshToken,
     verifyRefreshToken,
    
} from "./auth.utils.js";
import { googleOAuthClient } from "./auth.utils.js";
import type {
     RegisterInput,
     LoginInput,
     SessionMeta,
     SafeUser,
     AuthResult,
} from "./auth.types.js";

import { env } from "../../config/env.js";

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function toSafeUser(user: User): SafeUser {
     return {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          provider: user.provider,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
     };
}

async function createUserSession(user: User, meta: SessionMeta): Promise<AuthResult> {
     const sessionId = crypto.randomUUID();

     const accessToken = signAccessToken({ sub: user.id, role: user.role });
     const refreshToken = signRefreshToken({ sub: user.id, sessionId });

     await prisma.session.create({
          data: {
               id: sessionId,
               userId: user.id,
               refreshTokenHash: hashToken(refreshToken),
               userAgent: meta.userAgent ?? null,
               ipAddress: meta.ipAddress ?? null,
               expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
          },
     });

     return {
          user: toSafeUser(user),
          tokens: { accessToken, refreshToken },
     };
}

export const authService = {
     async register(input: RegisterInput, meta: SessionMeta): Promise<AuthResult> {
          const existingUser = await prisma.user.findUnique({
               where: { email: input.email },
          });

          if (existingUser) {
               throw new AppError(
                    "An account with this email already exists.",
                    409,
                    "EMAIL_ALREADY_EXISTS",
               );
          }

          const passwordHash = await hashPassword(input.password);

          const user = await prisma.user.create({
               data: {
                    name: input.name,
                    email: input.email,
                    passwordHash,
                    provider: "LOCAL",
               },
          });

          return createUserSession(user, meta);
     },

     async login(input: LoginInput, meta: SessionMeta): Promise<AuthResult> {
          const user = await prisma.user.findUnique({
               where: { email: input.email },
          });

          if (!user || !user.passwordHash) {
               throw new AppError(
                    "Invalid email or password.",
                    401,
                    "INVALID_CREDENTIALS",
               );
          }

          const isPasswordValid = await comparePassword(
               input.password,
               user.passwordHash,
          );

          if (!isPasswordValid) {
               throw new AppError(
                    "Invalid email or password.",
                    401,
                    "INVALID_CREDENTIALS",
               );
          }

          return createUserSession(user, meta);
     },

     async refresh(rawRefreshToken: string, meta: SessionMeta): Promise<AuthResult> {
          let payload;
          try {
               payload = verifyRefreshToken(rawRefreshToken);
          } catch {
               throw new AppError(
                    "Invalid or expired refresh token.",
                    401,
                    "INVALID_REFRESH_TOKEN",
               );
          }

          const incomingHash = hashToken(rawRefreshToken);
          const session = await prisma.session.findUnique({
               where: { id: payload.sessionId },
               include: { user: true },
          });

          // Reuse detection: valid JWT signature, but session already rotated/deleted
          if (!session || session.refreshTokenHash !== incomingHash) {
               await prisma.session.deleteMany({
                    where: { userId: payload.sub },
               });
               throw new AppError(
                    "Session compromised or expired. Please log in again.",
                    401,
                    "TOKEN_REUSE_DETECTED",
               );
          }

          if (session.expiresAt < new Date()) {
               await prisma.session.delete({ where: { id: session.id } });
               throw new AppError(
                    "Refresh token has expired. Please log in again.",
                    401,
                    "REFRESH_TOKEN_EXPIRED",
               );
          }

          // Rotate: remove old session and issue fresh token pair
          await prisma.session.delete({ where: { id: session.id } });

          return createUserSession(session.user, meta);
     },

     async logout(rawRefreshToken?: string): Promise<void> {
          if (!rawRefreshToken) return;

          try {
               const payload = verifyRefreshToken(rawRefreshToken);
               await prisma.session.deleteMany({
                    where: { id: payload.sessionId },
               });
          } catch {
               // Ignore invalid/expired token on logout; cookies will still be cleared
          }
     },

     async logoutAll(userId: string): Promise<void> {
          await prisma.session.deleteMany({
               where: { userId },
          });
     },

     async getCurrentUser(userId: string): Promise<SafeUser> {
          const user = await prisma.user.findUnique({
               where: { id: userId },
          });

          if (!user) {
               throw new AppError("User not found.", 404, "USER_NOT_FOUND");
          }

          return toSafeUser(user);
     },

     async loginWithGoogle(
          code: string,
          codeVerifier: string,
          meta: SessionMeta,
     ): Promise<AuthResult> {
          let payload;
          try {
               const { tokens } = await googleOAuthClient.getToken({
                    code,
                    codeVerifier,
               });

               if (!tokens.id_token) {
                    throw new Error("Missing ID token from Google");
               }

               const ticket = await googleOAuthClient.verifyIdToken({
                    idToken: tokens.id_token,
                    audience: env.GOOGLE_CLIENT_ID,
               });

               payload = ticket.getPayload();
          } catch {
               throw new AppError(
                    "Failed to verify Google authorization code.",
                    401,
                    "GOOGLE_AUTH_FAILED",
               );
          }

          if (!payload?.sub || !payload?.email) {
               throw new AppError(
                    "Google account did not provide required profile details.",
                    400,
                    "GOOGLE_PROFILE_INCOMPLETE",
               );
          }

          const normalizedEmail = payload.email.toLowerCase().trim();

          let user = await prisma.user.findFirst({
               where: {
                    OR: [{ googleId: payload.sub }, { email: normalizedEmail }],
               },
          });

          if (user) {
               if (!user.googleId || !user.isVerified) {
                    user = await prisma.user.update({
                         where: { id: user.id },
                         data: {
                              googleId: payload.sub,
                              avatar: user.avatar ?? payload.picture ?? null,
                              isVerified: true,
                         },
                    });
               }
          } else {
               user = await prisma.user.create({
                    data: {
                         email: normalizedEmail,
                         name: payload.name || normalizedEmail.split("@")[0] || "User",
                         googleId: payload.sub,
                         avatar: payload.picture ?? null,
                         provider: "GOOGLE",
                         isVerified: true,
                    },
               });
          }

          return createUserSession(user, meta);
     },

};
