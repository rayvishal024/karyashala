"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus, KeyRound } from "lucide-react";
import { useWorkspace } from "../hooks/use-workspace";

interface WorkspaceSwitcherProps {
     onOpenCreate: () => void;
     onOpenJoinCode: () => void;
}

export function WorkspaceSwitcher({
     onOpenCreate,
     onOpenJoinCode,
}: WorkspaceSwitcherProps) {
     const router = useRouter();
     const { workspaces, currentWorkspace } = useWorkspace();
     const [open, setOpen] = useState(false);
     const containerRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
          if (!open) return;
          const handleClickOutside = (e: MouseEvent) => {
               if (
                    containerRef.current &&
                    !containerRef.current.contains(e.target as Node)
               ) {
                    setOpen(false);
               }
          };
          const handleEscape = (e: KeyboardEvent) => {
               if (e.key === "Escape") setOpen(false);
          };
          document.addEventListener("mousedown", handleClickOutside);
          document.addEventListener("keydown", handleEscape);
          return () => {
               document.removeEventListener("mousedown", handleClickOutside);
               document.removeEventListener("keydown", handleEscape);
          };
     }, [open]);

     const activeName = currentWorkspace?.name || "Select workspace";
     const activeRole = currentWorkspace?.role;
     const activeInitial = activeName.charAt(0).toUpperCase() || "W";

     return (
          <div ref={containerRef} className="relative">
               <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    aria-expanded={open}
                    style={{
                         backgroundColor: "var(--bg-subtle)",
                         borderColor: "var(--border-hairline)",
                         color: "var(--text-primary)",
                    }}
                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left transition-colors hover:opacity-95"
               >
                    <div className="flex min-w-0 items-center gap-2.5">
                         <span
                              style={{
                                   backgroundColor: "var(--cta-bg)",
                                   color: "var(--cta-fg)",
                              }}
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-semibold"
                         >
                              {activeInitial}
                         </span>
                         <div className="min-w-0">
                              <p className="truncate text-xs font-semibold leading-tight">
                                   {activeName}
                              </p>
                              {activeRole && (
                                   <p
                                        style={{ color: "var(--text-muted)" }}
                                        className="text-[10px] font-medium uppercase tracking-wider"
                                   >
                                        {activeRole}
                                   </p>
                              )}
                         </div>
                    </div>
                    <ChevronsUpDown
                         style={{ color: "var(--text-muted)" }}
                         className="h-3.5 w-3.5 shrink-0"
                    />
               </button>

               {open && (
                    <div
                         style={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--border-hairline)",
                         }}
                         className="absolute left-0 right-0 z-40 mt-1.5 rounded-lg border p-1.5 shadow-lg"
                    >
                         <p
                              style={{ color: "var(--text-muted)" }}
                              className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider"
                         >
                              Your Workspaces ({workspaces.length})
                         </p>

                         <div className="max-h-52 space-y-0.5 overflow-y-auto">
                              {workspaces.map((ws) => {
                                   const isSelected = currentWorkspace?.id === ws.id;
                                   return (
                                        <button
                                             key={ws.id}
                                             type="button"
                                             onClick={() => {
                                                  setOpen(false);
                                                  router.push(`/w/${ws.slug}`);
                                             }}
                                             style={{
                                                  backgroundColor: isSelected
                                                       ? "var(--bg-subtle)"
                                                       : "transparent",
                                                  color: "var(--text-primary)",
                                             }}
                                             className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:opacity-90"
                                        >
                                             <div className="flex min-w-0 items-center gap-2">
                                                  <span
                                                       style={{
                                                            backgroundColor: "var(--bg-hover)",
                                                            color: "var(--text-primary)",
                                                       }}
                                                       className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold"
                                                  >
                                                       {ws.name.charAt(0).toUpperCase()}
                                                  </span>
                                                  <span className="truncate font-medium">{ws.name}</span>
                                             </div>
                                             <div className="flex shrink-0 items-center gap-1.5">
                                                  <span
                                                       style={{ color: "var(--text-muted)" }}
                                                       className="text-[10px]"
                                                  >
                                                       {ws.role}
                                                  </span>
                                                  {isSelected && <Check className="h-3.5 w-3.5" />}
                                             </div>
                                        </button>
                                   );
                              })}
                         </div>

                         <div
                              style={{ borderColor: "var(--border-hairline)" }}
                              className="mt-1.5 space-y-0.5 border-t pt-1.5"
                         >
                              <button
                                   type="button"
                                   onClick={() => {
                                        setOpen(false);
                                        onOpenCreate();
                                   }}
                                   style={{ color: "var(--text-primary)" }}
                                   className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-opacity hover:opacity-80"
                              >
                                   <Plus className="h-3.5 w-3.5" />
                                   <span>Create workspace</span>
                              </button>

                              <button
                                   type="button"
                                   onClick={() => {
                                        setOpen(false);
                                        onOpenJoinCode();
                                   }}
                                   style={{ color: "var(--text-secondary)" }}
                                   className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-opacity hover:opacity-80"
                              >
                                   <KeyRound className="h-3.5 w-3.5" />
                                   <span>Join with code</span>
                              </button>
                         </div>
                    </div>
               )}
          </div>
     );
}