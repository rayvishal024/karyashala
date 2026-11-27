// src/features/workspace/components/workspace-overview.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Users, Shield, Hash, Link2 } from "lucide-react";
import { InviteModal } from "@/features/workspace-invites/components/invite-modal";
import { useWorkspace } from "../hooks/use-workspace";

export function WorkspaceOverview() {
     const { currentWorkspace, canManageWorkspace } = useWorkspace();
     const [inviteOpen, setInviteOpen] = useState(false);
     const [inviteTab, setInviteTab] = useState<"email" | "link">("email");

     if (!currentWorkspace) return null;

     const openModal = (tab: "email" | "link") => {
          setInviteTab(tab);
          setInviteOpen(true);
     };

     return (
          <div className="space-y-6">
               {/* Top Workspace Header */}
               <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-hairline)] pb-5 sm:flex-row sm:items-center">
                    <div>
                         <div className="flex items-center gap-2.5">
                              <h1 className="text-xl font-semibold tracking-tight">
                                   {currentWorkspace.name}
                              </h1>
                              <span
                                   style={{
                                        backgroundColor: "var(--bg-subtle)",
                                        borderColor: "var(--border-hairline)",
                                        color: "var(--text-secondary)",
                                   }}
                                   className="rounded-md border px-2 py-0.5 font-mono text-[11px]"
                              >
                                   {currentWorkspace.slug}
                              </span>
                         </div>
                         <p
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-1 text-xs"
                         >
                              {currentWorkspace.description ||
                                   "Manage your workspace members, invite links, and role permissions."}
                         </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                         <Link
                              href={`/w/${currentWorkspace.slug}/members`}
                              style={{
                                   backgroundColor: "var(--bg-surface)",
                                   borderColor: "var(--border-input)",
                                   color: "var(--text-primary)",
                              }}
                              className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-opacity hover:opacity-90"
                         >
                              <Users className="h-3.5 w-3.5" />
                              <span>Members</span>
                         </Link>

                         <button
                              type="button"
                              onClick={() => openModal("email")}
                              style={{
                                   backgroundColor: "var(--cta-bg)",
                                   color: "var(--cta-fg)",
                              }}
                              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3.5 text-xs font-medium transition-opacity hover:opacity-90"
                         >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span>Invite member</span>
                         </button>
                    </div>
               </div>

               {/* Summary Cards */}
               <div className="grid gap-4 sm:grid-cols-3">
                    <div
                         style={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--border-hairline)",
                         }}
                         className="rounded-lg border p-4"
                    >
                         <div className="flex items-center justify-between">
                              <span
                                   style={{ color: "var(--text-secondary)" }}
                                   className="text-xs font-medium"
                              >
                                   Your role
                              </span>
                              <Shield
                                   style={{ color: "var(--text-muted)" }}
                                   className="h-4 w-4"
                              />
                         </div>
                         <p className="mt-2 text-base font-semibold">
                              {currentWorkspace.role || "OWNER"}
                         </p>
                    </div>

                    <div
                         style={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--border-hairline)",
                         }}
                         className="rounded-lg border p-4"
                    >
                         <div className="flex items-center justify-between">
                              <span
                                   style={{ color: "var(--text-secondary)" }}
                                   className="text-xs font-medium"
                              >
                                   Workspace slug
                              </span>
                              <Hash
                                   style={{ color: "var(--text-muted)" }}
                                   className="h-4 w-4"
                              />
                         </div>
                         <p className="mt-2 truncate font-mono text-sm font-medium">
                              {currentWorkspace.slug}
                         </p>
                    </div>

                    <div
                         style={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--border-hairline)",
                         }}
                         className="rounded-lg border p-4"
                    >
                         <div className="flex items-center justify-between">
                              <span
                                   style={{ color: "var(--text-secondary)" }}
                                   className="text-xs font-medium"
                              >
                                   Invite link status
                              </span>
                              <Link2
                                   style={{ color: "var(--text-muted)" }}
                                   className="h-4 w-4"
                              />
                         </div>
                         <p className="mt-2 text-sm font-medium">
                              {currentWorkspace.inviteLinkEnabled
                                   ? `Active (${currentWorkspace.defaultJoinRole})`
                                   : "Disabled"}
                         </p>
                    </div>
               </div>

               {/* Direct Invite & Onboarding Strip */}
               <div
                    style={{
                         backgroundColor: "var(--bg-surface)",
                         borderColor: "var(--border-hairline)",
                    }}
                    className="flex flex-col justify-between gap-4 rounded-lg border p-5 sm:flex-row sm:items-center"
               >
                    <div>
                         <h2 className="text-sm font-semibold tracking-tight">
                              Bring teammates into {currentWorkspace.name}
                         </h2>
                         <p
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-0.5 text-xs"
                         >
                              Send an email invitation with a specific role or share a join link
                              and code.
                         </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                         <button
                              type="button"
                              onClick={() => openModal("link")}
                              style={{
                                   backgroundColor: "var(--bg-subtle)",
                                   borderColor: "var(--border-input)",
                                   color: "var(--text-primary)",
                              }}
                              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-opacity hover:opacity-90"
                         >
                              <Link2 className="h-3.5 w-3.5" />
                              <span>Invite link &amp; code</span>
                         </button>

                         <button
                              type="button"
                              onClick={() => openModal("email")}
                              style={{
                                   backgroundColor: "var(--cta-bg)",
                                   color: "var(--cta-fg)",
                              }}
                              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-opacity hover:opacity-90"
                         >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span>Invite by email</span>
                         </button>
                    </div>
               </div>

               <InviteModal
                    key={`${inviteTab}-${inviteOpen}`}
                    open={inviteOpen}
                    onClose={() => setInviteOpen(false)}
                    workspaceId={currentWorkspace.id}
                    workspaceName={currentWorkspace.name}
                    canManage={canManageWorkspace}
                    initialTab={inviteTab}
               />
          </div>
     );
}