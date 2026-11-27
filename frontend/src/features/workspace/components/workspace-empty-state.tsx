"use client";

import { Plus, KeyRound, FolderKanban } from "lucide-react";

interface WorkspaceEmptyStateProps {
     onCreateClick: () => void;
     onJoinClick: () => void;
}

export function WorkspaceEmptyState({
     onCreateClick,
     onJoinClick,
}: WorkspaceEmptyStateProps) {
     return (
          <div
               style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-hairline)",
               }}
               className="mx-auto mt-10 max-w-lg rounded-xl border p-8 text-center"
          >
               <div
                    style={{
                         backgroundColor: "var(--bg-subtle)",
                         borderColor: "var(--border-hairline)",
                         color: "var(--text-secondary)",
                    }}
                    className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border"
               >
                    <FolderKanban className="h-5 w-5" />
               </div>

               <h1 className="mt-4 text-base font-semibold tracking-tight">
                    No workspaces yet
               </h1>
               <p
                    style={{ color: "var(--text-secondary)" }}
                    className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed"
               >
                    Create your first workspace to organize work with your team, or join an
                    existing workspace using an invite code.
               </p>

               <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                    <button
                         type="button"
                         onClick={onCreateClick}
                         style={{
                              backgroundColor: "var(--cta-bg)",
                              color: "var(--cta-fg)",
                         }}
                         className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md px-4 text-xs font-medium transition-opacity hover:opacity-90"
                    >
                         <Plus className="h-3.5 w-3.5" />
                         <span>Create workspace</span>
                    </button>

                    <button
                         type="button"
                         onClick={onJoinClick}
                         style={{
                              backgroundColor: "var(--bg-subtle)",
                              borderColor: "var(--border-input)",
                              color: "var(--text-primary)",
                         }}
                         className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border px-4 text-xs font-medium transition-opacity hover:opacity-90"
                    >
                         <KeyRound className="h-3.5 w-3.5" />
                         <span>Join with code</span>
                    </button>
               </div>
          </div>
     );
}