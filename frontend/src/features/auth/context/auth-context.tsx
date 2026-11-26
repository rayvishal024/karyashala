"use client";

import {
     createContext,
     useCallback,
     useContext,
     useEffect,
     useState,
     type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../api/auth.api";
import type { LoginPayload, RegisterPayload, User } from "../types/auth.types";

interface AuthContextValue {
     user: User | null;
     isLoading: boolean;
     login: (payload: LoginPayload, redirectTo?: string | null) => Promise<void>;
     register: (payload: RegisterPayload, redirectTo?: string | null) => Promise<void>;
     logout: () => Promise<void>;
     refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getSafeRedirect(redirectTo?: string | null): string {
     if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
          return redirectTo;
     }
     return "/dashboard";
}

export function AuthProvider({ children }: { children: ReactNode }) {
     const [user, setUser] = useState<User | null>(null);
     const [isLoading, setIsLoading] = useState(true);
     const router = useRouter();

     const refreshUser = useCallback(async () => {
          try {
               const data = await authApi.getMe();
               setUser(data.user);
          } catch {
               setUser(null);
          } finally {
               setIsLoading(false);
          }
     }, []);

     useEffect(() => {
          refreshUser();
     }, [refreshUser]);

     const login = async (payload: LoginPayload, redirectTo?: string | null) => {
          const data = await authApi.login(payload);
          setUser(data.user);
          router.push(getSafeRedirect(redirectTo));
          router.refresh();
     };

     const register = async (
          payload: RegisterPayload,
          redirectTo?: string | null,
     ) => {
          const data = await authApi.register(payload);
          setUser(data.user);
          router.push(getSafeRedirect(redirectTo));
          router.refresh();
     };

     const logout = async () => {
          await authApi.logout().catch(() => null);
          setUser(null);
          router.push("/login");
          router.refresh();
     };

     return (
          <AuthContext.Provider
               value={{ user, isLoading, login, register, logout, refreshUser }}
          >
               {children}
          </AuthContext.Provider>
     );
}

export function useAuthContext() {
     const context = useContext(AuthContext);
     if (!context) {
          throw new Error("useAuth must be used within an AuthProvider");
     }
     return context;
}