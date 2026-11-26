"use client";

import Link from "next/link";
import { ShieldCheck, Layers, Users } from "lucide-react";
import { ThemeToggle } from "@/shared/theme/theme-toggle";

export function AuthShell({ children }: { children: React.ReactNode }) {
     return (
          <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] lg:grid lg:grid-cols-12">
               {/* Left Context Panel — Grounded Product Architecture */}
               <aside className="hidden border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 lg:col-span-5 lg:flex lg:flex-col lg:justify-between">
                    <div>
                         <Link href="/" className="inline-flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-primary)] text-xs font-bold text-[var(--accent-primary-fg)]">
                                   K
                              </span>
                              <span className="text-sm font-semibold tracking-tight">
                                   Karyashala
                              </span>
                         </Link>

                         <div className="mt-16 max-w-sm">
                              <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                                   Multi-Tenant Workspace Engine
                              </p>
                              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                                   Isolated workspaces with explicit role boundaries.
                              </h2>
                              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                                   Organize projects, members, and permissions inside dedicated
                                   tenant boundaries built for fast daily execution.
                              </p>
                         </div>

                         <div className="mt-10 space-y-4 border-t border-[var(--border-subtle)] pt-8">
                              <div className="flex items-start gap-3">
                                   <Layers className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
                                   <div>
                                        <p className="text-xs font-medium text-[var(--text-primary)]">
                                             Strict Tenant Isolation
                                        </p>
                                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                             Every resource is scoped to its workspace and verified at the
                                             API layer.
                                        </p>
                                   </div>
                              </div>

                              <div className="flex items-start gap-3">
                                   <Users className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
                                   <div>
                                        <p className="text-xs font-medium text-[var(--text-primary)]">
                                             Email &amp; Instant Link Invites
                                        </p>
                                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                             Invite teammates with single-use email tokens or revocable
                                             workspace codes.
                                        </p>
                                   </div>
                              </div>

                              <div className="flex items-start gap-3">
                                   <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
                                   <div>
                                        <p className="text-xs font-medium text-[var(--text-primary)]">
                                             Least-Privilege Access
                                        </p>
                                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                             Clear Owner, Editor, and Viewer permissions with single-owner
                                             governance.
                                        </p>
                                   </div>
                              </div>
                         </div>
                    </div>

                    <p className="text-xs text-[var(--text-muted)]">
                         karyashala.tech
                    </p>
               </aside>

               {/* Right Auth Form Column */}
               <div className="flex min-h-screen flex-col lg:col-span-7">
                    <header className="flex items-center justify-between px-6 py-4">
                         <Link href="/" className="inline-flex items-center gap-2 lg:hidden">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-primary)] text-xs font-bold text-[var(--accent-primary-fg)]">
                                   K
                              </span>
                              <span className="text-sm font-semibold tracking-tight">
                                   Karyashala
                              </span>
                         </Link>
                         <div className="ml-auto">
                              <ThemeToggle />
                         </div>
                    </header>

                    <main className="flex flex-1 items-center justify-center px-4 pb-12">
                         <div className="w-full max-w-[380px]">{children}</div>
                    </main>
               </div>
          </div>
     );
}