"use client";

import { useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api-client";
import { workspaceApi } from "../api/workspace.api";
import { useWorkspace } from "../hooks/use-workspace";
import type { WorkspaceMemberItem } from "../types/workspace.types";

export function WorkspaceMembersPanel() {
     const { currentWorkspace } = useWorkspace();
     const [members, setMembers] = useState<WorkspaceMemberItem[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
          if (!currentWorkspace?.id) return;
          let active = true;
          setLoading(true);
          setError(null);

          workspaceApi
               .listMembers(currentWorkspace.id)
               .then((res) => {
                    if (active) setMembers(res.members);
               })
               .catch((err) => {
                    if (active) {
                         setError(
                              err instanceof ApiClientError
                                   ? err.message
                                   : "Failed to load members.",
                         );
                    }
               })
               .finally(() => {
                    if (active) setLoading(false);
               });

          return () => {
               active = false;
          };
     }, [currentWorkspace?.id]);

     if (!currentWorkspace) return null;

     return (
          <div className="space-y-4">
               <div>
                    <h1 className="text-lg font-semibold tracking-tight">Members</h1>
                    <p
                         style={{ color: "var(--text-secondary)" }}
                         className="mt-0.5 text-xs"
                    >
                         People who currently have access to {currentWorkspace.name}.
                    </p>
               </div>

               {error && (
                    <div
                         style={{
                              backgroundColor: "var(--danger-bg)",
                              borderColor: "var(--danger-border)",
                              color: "var(--danger-text)",
                         }}
                         className="rounded-md border px-3 py-2 text-xs"
                    >
                         {error}
                    </div>
               )}

               <div
                    style={{
                         backgroundColor: "var(--bg-surface)",
                         borderColor: "var(--border-hairline)",
                    }}
                    className="overflow-hidden rounded-lg border"
               >
                    {loading ? (
                         <div
                              style={{ color: "var(--text-muted)" }}
                              className="p-6 text-center text-xs"
                         >
                              Loading members...
                         </div>
                    ) : members.length === 0 ? (
                         <div
                              style={{ color: "var(--text-muted)" }}
                              className="p-6 text-center text-xs"
                         >
                              No members found.
                         </div>
                    ) : (
                         <div className="divide-y divide-[var(--border-hairline)]">
                              {members.map((m) => (
                                   <div
                                        key={m.id}
                                        className="flex items-center justify-between gap-4 px-4 py-3"
                                   >
                                        <div className="min-w-0">
                                             <p className="truncate text-xs font-medium">
                                                  {m.user.name}
                                             </p>
                                             <p
                                                  style={{ color: "var(--text-muted)" }}
                                                  className="truncate text-xs"
                                             >
                                                  {m.user.email}
                                             </p>
                                        </div>

                                        <span
                                             style={{
                                                  backgroundColor: "var(--bg-subtle)",
                                                  borderColor: "var(--border-hairline)",
                                                  color: "var(--text-secondary)",
                                             }}
                                             className="shrink-0 rounded border px-2 py-0.5 text-[11px] font-medium"
                                        >
                                             {m.role}
                                        </span>
                                   </div>
                              ))}
                         </div>
                    )}
               </div>
          </div>
     );
}