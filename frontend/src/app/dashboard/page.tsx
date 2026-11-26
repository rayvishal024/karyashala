"use client";

import { AuthGuard, useAuth } from "@/features/auth";
import { ThemeToggle } from "@/shared/theme/theme-toggle";

function DashboardContent() {
     const { user, logout } = useAuth();

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
                         <div className="flex items-center gap-2">
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

                         <div className="flex items-center gap-2.5">
                              <ThemeToggle />
                              <button
                                   type="button"
                                   onClick={logout}
                                   style={{
                                        backgroundColor: "var(--bg-subtle)",
                                        borderColor: "var(--border-input)",
                                        color: "var(--text-primary)",
                                   }}
                                   className="h-8 cursor-pointer rounded-md border px-3 text-xs font-medium transition-opacity hover:opacity-90"
                              >
                                   Sign out
                              </button>
                         </div>
                    </div>
               </header>

               <main className="mx-auto max-w-3xl px-4 py-12">
                    <div
                         style={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--border-hairline)",
                         }}
                         className="rounded-xl border p-6"
                    >
                         <h1 className="text-lg font-semibold tracking-tight">
                              Welcome, {user?.name}
                         </h1>
                         <p
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-1 text-xs"
                         >
                              {user?.email} · {user?.provider} · {user?.role}
                         </p>
                    </div>
               </main>
          </div>
     );
}

export default function DashboardPage() {
     return (
          <AuthGuard>
               <DashboardContent />
          </AuthGuard>
     );
}