// src/features/workspace-invites/components/join-code-card.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/features/auth";
import { ThemeToggle } from "@/shared/theme/theme-toggle";
import { inviteApi } from "../api/invite.api";

export function JoinCodeCard({ code }: { code: string }) {
     const router = useRouter();
     const { user, isLoading: authLoading } = useAuth();
     const normalizedCode = code.trim().toUpperCase();

     const [joining, setJoining] = useState(false);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
          if (authLoading || !user || !normalizedCode) return;

          let active = true;
          setJoining(true);
          setError(null);

          inviteApi
               .joinByCode(normalizedCode)
               .then((res) => {
                    if (active) {
                         router.replace(`/w/${res.workspaceSlug}`);
                    }
               })
               .catch((err) => {
                    if (active) {
                         setError(
                              err instanceof ApiClientError
                                   ? err.message
                                   : "Invalid or disabled invite code.",
                         );
                         setJoining(false);
                    }
               });

          return () => {
               active = false;
          };
     }, [authLoading, user, normalizedCode, router]);

     const loginRedirectUrl = `/login?redirect=${encodeURIComponent(`/join/${normalizedCode}`)}`;

     return (
          <div
               style={{
                    backgroundColor: "var(--bg-canvas)",
                    color: "var(--text-primary)",
               }}
               className="flex min-h-screen flex-col"
          >
               <header className="flex items-center justify-between px-6 py-4">
                    <Link href="/dashboard" className="flex items-center gap-2">
                         <span
                              style={{
                                   backgroundColor: "var(--cta-bg)",
                                   color: "var(--cta-fg)",
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold"
                         >
                              K
                         </span>
                         <span className="text-sm font-semibold tracking-tight">
                              Karyashala
                         </span>
                    </Link>
                    <ThemeToggle />
               </header>

               <main className="flex flex-1 items-center justify-center px-4 pb-12">
                    <div
                         style={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--border-hairline)",
                         }}
                         className="w-full max-w-md rounded-lg border p-6 text-center"
                    >
                         <p
                              style={{ color: "var(--text-muted)" }}
                              className="text-[11px] font-medium uppercase tracking-wider"
                         >
                              Workspace Invite Code
                         </p>
                         <p className="mt-1 font-mono text-base font-semibold tracking-widest">
                              {normalizedCode}
                         </p>

                         {authLoading ? (
                              <p
                                   style={{ color: "var(--text-secondary)" }}
                                   className="mt-4 text-xs"
                              >
                                   Checking session...
                              </p>
                         ) : !user ? (
                              <div className="mt-5 space-y-3">
                                   <p
                                        style={{ color: "var(--text-secondary)" }}
                                        className="text-xs"
                                   >
                                        Sign in to your Karyashala account to join this workspace.
                                   </p>
                                   <Link
                                        href={loginRedirectUrl}
                                        style={{
                                             backgroundColor: "var(--cta-bg)",
                                             color: "var(--cta-fg)",
                                        }}
                                        className="inline-flex h-9 w-full items-center justify-center rounded-md text-xs font-medium"
                                   >
                                        Sign in to join
                                   </Link>
                              </div>
                         ) : joining ? (
                              <p
                                   style={{ color: "var(--text-secondary)" }}
                                   className="mt-4 text-xs"
                              >
                                   Joining workspace...
                              </p>
                         ) : error ? (
                              <div className="mt-4 space-y-3">
                                   <p style={{ color: "var(--danger-text)" }} className="text-xs">
                                        {error}
                                   </p>
                                   <Link
                                        href="/dashboard"
                                        style={{
                                             backgroundColor: "var(--bg-subtle)",
                                             borderColor: "var(--border-input)",
                                             color: "var(--text-primary)",
                                        }}
                                        className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium"
                                   >
                                        Back to dashboard
                                   </Link>
                              </div>
                         ) : null}
                    </div>
               </main>
          </div>
     );
}