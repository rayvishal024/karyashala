"use client";

import { Suspense, use, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AuthGuard } from "@/features/auth";
import {
     CreateWorkspaceModal,
     JoinByCodeModal,
     WorkspaceProvider,
     WorkspaceSidebar,
     useWorkspace,
} from "@/features/workspace";

function WorkspaceShell({
     slug,
     children,
}: {
     slug: string;
     children: ReactNode;
}) {
     const {
          currentWorkspace,
          isLoadingCurrent,
          error,
          loadWorkspaceBySlug,
     } = useWorkspace();

     const [createOpen, setCreateOpen] = useState(false);
     const [joinOpen, setJoinOpen] = useState(false);

     useEffect(() => {
          loadWorkspaceBySlug(slug);
     }, [slug, loadWorkspaceBySlug]);

     return (
          <div
               style={{
                    backgroundColor: "var(--bg-canvas)",
                    color: "var(--text-primary)",
               }}
               className="flex min-h-screen flex-col md:flex-row"
          >
               <WorkspaceSidebar
                    slug={slug}
                    onOpenCreate={() => setCreateOpen(true)}
                    onOpenJoinCode={() => setJoinOpen(true)}
               />

               <main className="min-w-0 flex-1 px-6 py-8">
                    <div className="mx-auto max-w-5xl">
                         {isLoadingCurrent ||
                         (!error && currentWorkspace?.slug !== slug) ? (
                              <div className="space-y-4">
                                   <div
                                        style={{ backgroundColor: "var(--bg-surface)" }}
                                        className="h-6 w-48 animate-pulse rounded"
                                   />
                                   <div className="grid gap-4 sm:grid-cols-3">
                                        {[1, 2, 3].map((n) => (
                                             <div
                                                  key={n}
                                                  style={{
                                                       backgroundColor: "var(--bg-surface)",
                                                       borderColor: "var(--border-hairline)",
                                                  }}
                                                  className="h-24 animate-pulse rounded-lg border"
                                             />
                                        ))}
                                   </div>
                              </div>
                         ) : error || !currentWorkspace ? (
                              <div
                                   style={{
                                        backgroundColor: "var(--bg-surface)",
                                        borderColor: "var(--border-hairline)",
                                   }}
                                   className="max-w-md rounded-lg border p-6"
                              >
                                   <h1 className="text-base font-semibold">
                                        Workspace unavailable
                                   </h1>
                                   <p
                                        style={{ color: "var(--text-secondary)" }}
                                        className="mt-1 text-xs leading-relaxed"
                                   >
                                        {error ||
                                             "This workspace does not exist or you do not have access."}
                                   </p>
                                   <div className="mt-4 flex items-center gap-2">
                                        <Link
                                             href="/dashboard"
                                             style={{
                                                  backgroundColor: "var(--cta-bg)",
                                                  color: "var(--cta-fg)",
                                             }}
                                             className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium"
                                        >
                                             Back to dashboard
                                        </Link>
                                        <button
                                             type="button"
                                             onClick={() => setCreateOpen(true)}
                                             style={{
                                                  backgroundColor: "var(--bg-subtle)",
                                                  borderColor: "var(--border-input)",
                                                  color: "var(--text-primary)",
                                             }}
                                             className="inline-flex h-8 cursor-pointer items-center rounded-md border px-3 text-xs font-medium"
                                        >
                                             Create workspace
                                        </button>
                                   </div>
                              </div>
                         ) : (
                              children
                         )}
                    </div>
               </main>

               <CreateWorkspaceModal
                    open={createOpen}
                    onClose={() => setCreateOpen(false)}
               />
               <JoinByCodeModal open={joinOpen} onClose={() => setJoinOpen(false)} />
          </div>
     );
}

function ResolvedWorkspaceLayout({
     children,
     paramsPromise,
}: {
     children: ReactNode;
     paramsPromise: Promise<{ slug: string }>;
}) {
     const { slug } = use(paramsPromise);
     return <WorkspaceShell slug={slug}>{children}</WorkspaceShell>;
}

export default function WorkspaceLayout({
     children,
     params,
}: {
     children: ReactNode;
     params: Promise<{ slug: string }>;
}) {
     return (
          <AuthGuard>
               <WorkspaceProvider>
                    <Suspense
                         fallback={
                              <div
                                   style={{ backgroundColor: "var(--bg-canvas)" }}
                                   className="flex min-h-screen items-center justify-center text-xs"
                              >
                                   Loading workspace...
                              </div>
                         }
                    >
                         <ResolvedWorkspaceLayout paramsPromise={params}>
                              {children}
                         </ResolvedWorkspaceLayout>
                    </Suspense>
               </WorkspaceProvider>
          </AuthGuard>
     );
}