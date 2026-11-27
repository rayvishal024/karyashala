"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, KeyRound } from "lucide-react";
import { AuthGuard, useAuth } from "@/features/auth";
import {
     CreateWorkspaceModal,
     JoinByCodeModal,
     WorkspaceEmptyState,
     WorkspaceProvider,
     useWorkspace,
} from "@/features/workspace";
import { ThemeToggle } from "@/shared/theme/theme-toggle";

function DashboardResolver() {
     const router = useRouter();
     const { logout } = useAuth();
     const { workspaces, isLoadingList, getLastVisitedSlug } = useWorkspace();
     const hasPostAuthRedirect = useRef(false);

     const [createOpen, setCreateOpen] = useState(false);
     const [joinOpen, setJoinOpen] = useState(false);

     useEffect(() => {
          let redirect: string | null;
          try {
               redirect = window.sessionStorage.getItem("post_auth_redirect");
               window.sessionStorage.removeItem("post_auth_redirect");
          } catch {
               return;
          }

          if (
               redirect &&
               redirect.startsWith("/") &&
               !redirect.startsWith("//") &&
               !redirect.includes("\\") &&
               !/[\u0000-\u001f\u007f]/.test(redirect)
          ) {
               hasPostAuthRedirect.current = true;
               router.replace(redirect);
          }
     }, [router]);

     useEffect(() => {
          if (
               hasPostAuthRedirect.current ||
               isLoadingList ||
               workspaces.length === 0
          ) {
               return;
          }

          const lastSlug = getLastVisitedSlug();
          const target =
               workspaces.find((w) => w.slug === lastSlug) || workspaces[0];

          if (target) {
               router.replace(`/w/${target.slug}`);
          }
     }, [isLoadingList, workspaces, getLastVisitedSlug, router]);

     return (
          <div
               style={{
                    backgroundColor: "var(--bg-canvas)",
                    color: "var(--text-primary)",
               }}
               className="min-h-screen"
          >
               <header
                    style={{
                         backgroundColor: "var(--bg-surface)",
                         borderColor: "var(--border-hairline)",
                    }}
                    className="border-b px-6 py-3.5"
               >
                    <div className="mx-auto flex max-w-5xl items-center justify-between">
                         <div className="flex items-center gap-2.5">
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
                         </div>

                         <div className="flex items-center gap-2">
                              <button
                                   type="button"
                                   onClick={() => setJoinOpen(true)}
                                   style={{
                                        backgroundColor: "var(--bg-subtle)",
                                        borderColor: "var(--border-input)",
                                        color: "var(--text-primary)",
                                   }}
                                   className="hidden h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-xs font-medium sm:inline-flex"
                              >
                                   <KeyRound className="h-3.5 w-3.5" />
                                   <span>Join code</span>
                              </button>

                              <button
                                   type="button"
                                   onClick={() => setCreateOpen(true)}
                                   style={{
                                        backgroundColor: "var(--cta-bg)",
                                        color: "var(--cta-fg)",
                                   }}
                                   className="hidden h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium sm:inline-flex"
                              >
                                   <Plus className="h-3.5 w-3.5" />
                                   <span>New workspace</span>
                              </button>

                              <ThemeToggle />

                              <button
                                   type="button"
                                   onClick={logout}
                                   style={{
                                        backgroundColor: "var(--bg-subtle)",
                                        borderColor: "var(--border-input)",
                                        color: "var(--text-secondary)",
                                   }}
                                   className="h-8 cursor-pointer rounded-md border px-3 text-xs font-medium"
                              >
                                   Sign out
                              </button>
                         </div>
                    </div>
               </header>

               <main className="mx-auto max-w-5xl px-4 py-10">
                    {isLoadingList ? (
                         <div
                              style={{ color: "var(--text-muted)" }}
                              className="flex items-center justify-center py-20 text-xs"
                         >
                              Loading workspaces...
                         </div>
                    ) : workspaces.length === 0 ? (
                         <WorkspaceEmptyState
                              onCreateClick={() => setCreateOpen(true)}
                              onJoinClick={() => setJoinOpen(true)}
                         />
                    ) : (
                         <div
                              style={{ color: "var(--text-muted)" }}
                              className="flex items-center justify-center py-20 text-xs"
                         >
                              Opening workspace...
                         </div>
                    )}
               </main>

               <CreateWorkspaceModal
                    open={createOpen}
                    onClose={() => setCreateOpen(false)}
               />
               <JoinByCodeModal open={joinOpen} onClose={() => setJoinOpen(false)} />
          </div>
     );
}

export default function DashboardPage() {
     return (
          <AuthGuard>
               <WorkspaceProvider>
                    <DashboardResolver />
               </WorkspaceProvider>
          </AuthGuard>
     );
}