"use client";

import {
     createContext,
     useContext,
     useEffect,
     useState,
     useCallback,
     type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

export interface User {
     id: string;
     email: string;
     name: string;
     avatar: string | null;
     role: "USER" | "ADMIN";
     provider: "LOCAL" | "GOOGLE";
     isVerified: boolean;
     createdAt: string;
}

interface AuthContextValue {
     user: User | null;
     isLoading: boolean;
     login: (email: string, password: string) => Promise<void>;
     register: (name: string, email: string, password: string) => Promise<void>;
     logout: () => Promise<void>;
     refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
     const [user, setUser] = useState<User | null>(null);
     const [isLoading, setIsLoading] = useState(true);
     const router = useRouter();

     const refreshUser = useCallback(async () => {
          try {
               const data = await apiFetch<{ user: User }>("/auth/me");
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

     const login = async (email: string, password: string) => {
          const data = await apiFetch<{ user: User }>("/auth/login", {
               method: "POST",
               body: JSON.stringify({ email, password }),
          });
          setUser(data.user);
          router.push("/dashboard");
          router.refresh();
     };

     const register = async (name: string, email: string, password: string) => {
          const data = await apiFetch<{ user: User }>("/auth/register", {
               method: "POST",
               body: JSON.stringify({ name, email, password }),
          });
          setUser(data.user);
          router.push("/dashboard");
          router.refresh();
     };

     const logout = async () => {
          await apiFetch("/auth/logout", { method: "POST" }).catch(() => null);
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

export function useAuth() {
     const context = useContext(AuthContext);
     if (!context) {
          throw new Error("useAuth must be used within an AuthProvider");
     }
     return context;
}
