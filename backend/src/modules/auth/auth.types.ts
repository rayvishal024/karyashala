import type { Role, AuthProvider } from "../../generated/prisma/client.js";

export interface AccessTokenPayload {
     sub: string; // userId
     role: Role;
}

export interface RefreshTokenPayload {
     sub: string; // userId
     sessionId: string;
}

export interface RegisterInput {
     name: string;
     email: string;
     password: string;
}

export interface LoginInput {
     email: string;
     password: string;
}

export interface SessionMeta {
     userAgent?: string;
     ipAddress?: string;
}

export interface SafeUser {
     id: string;
     email: string;
     name: string;
     avatar: string | null;
     role: Role;
     provider: AuthProvider;
     isVerified: boolean;
     createdAt: Date;
}

export interface AuthTokens {
     accessToken: string;
     refreshToken: string;
}

export interface AuthResult {
     user: SafeUser;
     tokens: AuthTokens;
}

declare global {
     namespace Express {
          interface Request {
               user?: {
                    id: string;
                    role: Role;
               };
          }
     }
}
