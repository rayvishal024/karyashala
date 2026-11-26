import { API_BASE_URL, apiFetch } from "@/lib/api-client";
import type { LoginPayload, RegisterPayload, User } from "../types/auth.types";

export const authApi = {
     getMe(): Promise<{ user: User }> {
          return apiFetch<{ user: User }>("/auth/me");
     },

     login(payload: LoginPayload): Promise<{ user: User }> {
          return apiFetch<{ user: User }>("/auth/login", {
               method: "POST",
               body: JSON.stringify(payload),
          });
     },

     register(payload: RegisterPayload): Promise<{ user: User }> {
          return apiFetch<{ user: User }>("/auth/register", {
               method: "POST",
               body: JSON.stringify(payload),
          });
     },

     logout(): Promise<null> {
          return apiFetch<null>("/auth/logout", {
               method: "POST",
          });
     },

     logoutAll(): Promise<null> {
          return apiFetch<null>("/auth/logout-all", {
               method: "POST",
          });
     },

     getGoogleAuthUrl(): string {
          return `${API_BASE_URL}/auth/google`;
     },
};