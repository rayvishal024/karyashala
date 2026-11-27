"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth";
import { ThemeToggle } from "@/shared/theme/theme-toggle";
import { useWorkspace } from "../hooks/use-workspace";
import { WorkspaceSwitcher } from "./workspace-switcher";

interface WorkspaceSidebarProps {
     slug: string;
     onOpenCreate: () => void;
     onOpenJoinCode: () => void;
}

export function WorkspaceSidebar({
     slug,
     onOpenCreate,
     onOpenJoinCode,
}: WorkspaceSidebarProps) {
     const pathname = usePathname();
     const { user, logout } = useAuth();
     const { currentWorkspace } = useWorkspace();

     const navItems = [
          {
               label: "Overview",
               href: `/w/${slug}`,
               icon: LayoutGrid,
               active: pathname === `/w/${slug}`,
          },
          {
               label: "Members",
               href: `/w/${slug}/members`,
               icon: Users,
               active: pathname.startsWith(`/w/${slug}/members`),
          },
          {
               label: "Settings",
               href: `/w/${slug}/settings`,
               icon: Settings,
               active: pathname.startsWith(`/w/${slug}/settings`),
          },
     ];

     return (
          <aside
               style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-hairline)",
               }}
               className="flex w-full shrink-0 flex-col justify-between border-b md:min-h-screen md:w-64 md:border-b-0 md:border-r"
          >
               <div className="p-3.5">
                    {/* Brand + Theme Toggle */}
                    <div className="mb-3 flex items-center justify-between px-1">
                         <Link href="/dashboard" className="flex items-center gap-2">
                              <span
                                   style={{
                                        backgroundColor: "var(--cta-bg)",
                                        color: "var(--cta-fg)",
                                   }}
                                   className="flex h-6 w-6 items-center justify-center rounded text-[11px] font-semibold"
                              >
                                   K
                              </span>
                              <span className="text-xs font-semibold tracking-tight">
                                   Karyashala
                              </span>
                         </Link>
                         <ThemeToggle />
                    </div>

                    {/* Workspace Switcher */}
                    <WorkspaceSwitcher
                         onOpenCreate={onOpenCreate}
                         onOpenJoinCode={onOpenJoinCode}
                    />

                    {/* Workspace Navigation */}
                    <nav aria-label="Workspace navigation" className="mt-4 space-y-0.5">
                         {navItems.map((item) => {
                              const Icon = item.icon;
                              return (
                                   <Link
                                        key={item.href}
                                        href={item.href}
                                        style={{
                                             backgroundColor: item.active
                                                  ? "var(--bg-subtle)"
                                                  : "transparent",
                                             color: item.active
                                                  ? "var(--text-primary)"
                                                  : "var(--text-secondary)",
                                        }}
                                        className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors hover:opacity-95"
                                   >
                                        <Icon className="h-3.5 w-3.5 shrink-0" />
                                        <span>{item.label}</span>
                                   </Link>
                              );
                         })}
                    </nav>

                    {currentWorkspace?.description && (
                         <div
                              style={{
                                   backgroundColor: "var(--bg-subtle)",
                                   borderColor: "var(--border-hairline)",
                              }}
                              className="mt-5 hidden rounded-md border p-2.5 md:block"
                         >
                              <p
                                   style={{ color: "var(--text-muted)" }}
                                   className="text-[10px] font-medium uppercase tracking-wider"
                              >
                                   About
                              </p>
                              <p
                                   style={{ color: "var(--text-secondary)" }}
                                   className="mt-1 line-clamp-3 text-xs leading-relaxed"
                              >
                                   {currentWorkspace.description}
                              </p>
                         </div>
                    )}
               </div>

               {/* User Footer */}
               <div
                    style={{ borderColor: "var(--border-hairline)" }}
                    className="flex items-center justify-between gap-2 border-t p-3.5"
               >
                    <div className="min-w-0">
                         <p className="truncate text-xs font-medium">{user?.name}</p>
                         <p
                              style={{ color: "var(--text-muted)" }}
                              className="truncate text-[11px]"
                         >
                              {user?.email}
                         </p>
                    </div>

                    <button
                         type="button"
                         onClick={logout}
                         title="Sign out"
                         aria-label="Sign out"
                         style={{
                              backgroundColor: "var(--bg-subtle)",
                              borderColor: "var(--border-hairline)",
                              color: "var(--text-secondary)",
                         }}
                         className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-opacity hover:opacity-90"
                    >
                         <LogOut className="h-3.5 w-3.5" />
                    </button>
               </div>
          </aside>
     );
}