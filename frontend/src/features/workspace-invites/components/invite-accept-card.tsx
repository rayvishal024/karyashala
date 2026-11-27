// src/features/workspace-invites/components/invite-accept-card.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/features/auth";
import { ThemeToggle } from "@/shared/theme/theme-toggle";
import { inviteApi } from "../api/invite.api";
import type { InvitePreviewData } from "../types/invite.types";

export function InviteAcceptCard({ token }: { token: string }) {
     const router = useRouter();
     const { user, isLoading: authLoading } = useAuth();

     const [preview, setPreview] = useState<InvitePreviewData | null>(null);
     const [loading, setLoading] = useState(true);
     const [accepting, setAccepting] = useState(false);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
          let active = true;
          setLoading(true);
          setError(null);

          inviteApi
               .getInviteByToken(token)
               .then((res) => {
                    if (active) setPreview(res.invitation);
               })
               .catch((err) => {
                    if (active) {
                         setError(
                              err instanceof ApiClientError
                                   ? err.message
                                   : "This invitation is invalid or has expired.",
                         );
                    }
               })
               .finally(() => {
                    if (active) setLoading(false);
               });

          return () => {
               active = false;
          };
     }, [token]);

     const handleAccept = async () => {
          if (accepting) return;
          setError(null);
          setAccepting(true);
          try {
               const result = await inviteApi.acceptInviteByToken(token);
               router.push(`/w/${result.workspaceSlug}`);
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Unable to accept invitation.",
               );
               setAccepting(false);
          }
     };

     const loginRedirectUrl = `/login?redirect=${encodeURIComponent(`/invite/${token}`)}`;

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
                         className="w-full max-w-md rounded-lg border p-6"
                    >
                         {loading || authLoading ? (
                              <p
                                   style={{ color: "var(--text-muted)" }}
                                   className="py-6 text-center text-xs"
                              >
                                   Verifying invitation...
                              </p>
                         ) : error || !preview ? (
                              <div>
                                   <h1 className="text-base font-semibold">Invitation unavailable</h1>
                                   <p
                                        style={{ color: "var(--text-secondary)" }}
                                        className="mt-1.5 text-xs leading-relaxed"
                                   >
                                        {error ||
                                             "This invite link may have been revoked, already used, or expired."}
                                   </p>
                                   <Link
                                        href="/dashboard"
                                        style={{
                                             backgroundColor: "var(--cta-bg)",
                                             color: "var(--cta-fg)",
                                        }}
                                        className="mt-5 inline-flex h-8 items-center rounded-md px-3.5 text-xs font-medium"
                                   >
                                        Go to dashboard
                                   </Link>
                              </div>
                         ) : (
                              <div>
                                   <p
                                        style={{ color: "var(--text-muted)" }}
                                        className="text-[11px] font-medium uppercase tracking-wider"
                                   >
                                        Workspace Invitation
                                   </p>
                                   <h1 className="mt-1 text-lg font-semibold tracking-tight">
                                        Join {preview.workspace.name}
                                   </h1>
                                   {preview.workspace.description && (
                                        <p
                                             style={{ color: "var(--text-secondary)" }}
                                             className="mt-1 text-xs"
                                        >
                                             {preview.workspace.description}
                                        </p>
                                   )}

                                   <div
                                        style={{
                                             backgroundColor: "var(--bg-subtle)",
                                             borderColor: "var(--border-hairline)",
                                        }}
                                        className="mt-4 space-y-1.5 rounded-md border p-3 text-xs"
                                   >
                                        <div className="flex justify-between">
                                             <span style={{ color: "var(--text-muted)" }}>
                                                  Invited email
                                             </span>
                                             <span className="font-medium">{preview.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                             <span style={{ color: "var(--text-muted)" }}>Assigned role</span>
                                             <span className="font-medium">{preview.role}</span>
                                        </div>
                                   </div>

                                   {preview.status !== "PENDING" ? (
                                        <p
                                             style={{ color: "var(--danger-text)" }}
                                             className="mt-4 text-xs"
                                        >
                                             This invitation status is {preview.status.toLowerCase()}.
                                        </p>
                                   ) : !user ? (
                                        <div className="mt-5 space-y-2.5">
                                             <p
                                                  style={{ color: "var(--text-secondary)" }}
                                                  className="text-xs"
                                             >
                                                  Sign in with{" "}
                                                  <strong className="font-medium text-[var(--text-primary)]">
                                                       {preview.email}
                                                  </strong>{" "}
                                                  to accept this invitation.
                                             </p>
                                             <Link
                                                  href={loginRedirectUrl}
                                                  style={{
                                                       backgroundColor: "var(--cta-bg)",
                                                       color: "var(--cta-fg)",
                                                  }}
                                                  className="flex h-9 w-full items-center justify-center rounded-md text-xs font-medium"
                                             >
                                                  Sign in to accept
                                             </Link>
                                        </div>
                                   ) : (
                                        <div className="mt-5 space-y-2.5">
                                             {user.email.toLowerCase() !==
                                                  preview.email.toLowerCase() && (
                                                       <p
                                                            style={{ color: "var(--danger-text)" }}
                                                            className="text-xs"
                                                       >
                                                            You are signed in as {user.email}, but this invite is
                                                            addressed to {preview.email}.
                                                       </p>
                                                  )}
                                             <button
                                                  type="button"
                                                  onClick={handleAccept}
                                                  disabled={accepting}
                                                  style={{
                                                       backgroundColor: "var(--cta-bg)",
                                                       color: "var(--cta-fg)",
                                                  }}
                                                  className="h-9 w-full cursor-pointer rounded-md text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                                             >
                                                  {accepting ? "Accepting..." : "Accept invitation"}
                                             </button>
                                        </div>
                                   )}
                              </div>
                         )}
                    </div>
               </main>
          </div>
     );
}