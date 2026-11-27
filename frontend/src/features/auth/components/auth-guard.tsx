"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/use-auth";

export function AuthGuard({ children }: { children: ReactNode }) {
     const { user, isLoading } = useAuth();
     const router = useRouter();

     useEffect(() => {
          if (!isLoading && !user) {
               const currentPath =
                    typeof window !== "undefined" ? window.location.pathname : "/dashboard";
               const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
               router.replace(loginUrl);
          }
     }, [isLoading, user, router]);

     if (isLoading) {
          return (
               <div className="flex min-h-screen items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
               </div>
          );
     }

     if (!user) {
          return null;
     }

     return <>{children}</>;
}