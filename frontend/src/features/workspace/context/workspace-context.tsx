"use client";

import {
     createContext,
     useCallback,
     useContext,
     useEffect,
     useMemo,
     useState,
     type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { workspaceApi } from "../api/workspace.api";
import type {
     CreateWorkspacePayload,
     UpdateWorkspacePayload,
     WorkspaceDetail,
     WorkspaceSummary,
} from "../types/workspace.types";

const LAST_WORKSPACE_KEY = "karyashala_last_workspace_slug";

interface WorkspaceContextValue {
     workspaces: WorkspaceSummary[];
     currentWorkspace: WorkspaceDetail | null;
     isLoadingList: boolean;
     isLoadingCurrent: boolean;
     error: string | null;
     canManageWorkspace: boolean;
     canEditWorkspace: boolean;
     refreshWorkspaces: () => Promise<WorkspaceSummary[]>;
     loadWorkspaceBySlug: (slug: string) => Promise<WorkspaceDetail | null>;
     createWorkspace: (payload: CreateWorkspacePayload) => Promise<WorkspaceDetail>;
     updateCurrentWorkspace: (
          payload: UpdateWorkspacePayload,
     ) => Promise<WorkspaceDetail>;
     deleteCurrentWorkspace: () => Promise<void>;
     getLastVisitedSlug: () => string | null;
     clearWorkspaceState: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
     undefined,
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
     const router = useRouter();
     const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
     const [currentWorkspace, setCurrentWorkspace] =
          useState<WorkspaceDetail | null>(null);
     const [isLoadingList, setIsLoadingList] = useState(true);
     const [isLoadingCurrent, setIsLoadingCurrent] = useState(false);
     const [error, setError] = useState<string | null>(null);

     const persistLastSlug = useCallback((slug: string) => {
          if (typeof window !== "undefined") {
               window.localStorage.setItem(LAST_WORKSPACE_KEY, slug);
          }
     }, []);

     const getLastVisitedSlug = useCallback((): string | null => {
          if (typeof window === "undefined") return null;
          return window.localStorage.getItem(LAST_WORKSPACE_KEY);
     }, []);

     const refreshWorkspaces = useCallback(async (): Promise<WorkspaceSummary[]> => {
          setIsLoadingList(true);
          try {
               const data = await workspaceApi.listMyWorkspaces();
               setWorkspaces(data.workspaces);
               return data.workspaces;
          } catch {
               setWorkspaces([]);
               return [];
          } finally {
               setIsLoadingList(false);
          }
     }, []);

     useEffect(() => {
          refreshWorkspaces();
     }, [refreshWorkspaces]);

     const loadWorkspaceBySlug = useCallback(
          async (slug: string): Promise<WorkspaceDetail | null> => {
               setIsLoadingCurrent(true);
               setError(null);
               try {
                    let list = workspaces;
                    if (list.length === 0) {
                         const res = await workspaceApi.listMyWorkspaces();
                         list = res.workspaces;
                         setWorkspaces(list);
                    }

                    const matched = list.find((w) => w.slug === slug);
                    if (!matched) {
                         setCurrentWorkspace(null);
                         setError(
                              "Workspace not found or you do not have access to it.",
                         );
                         return null;
                    }

                    try {
                         const detailRes = await workspaceApi.getWorkspaceById(matched.id);
                         setCurrentWorkspace(detailRes.workspace);
                         persistLastSlug(detailRes.workspace.slug);
                         return detailRes.workspace;
                    } catch {
                         // Fallback to summary fields if owner-only fields are restricted
                         const fallback: WorkspaceDetail = {
                              ...matched,
                              ownerId: "",
                              inviteCode: null,
                              inviteCodeExpiresAt: null,
                              inviteLinkEnabled: false,
                              defaultJoinRole: "EDITOR",
                         };
                         setCurrentWorkspace(fallback);
                         persistLastSlug(fallback.slug);
                         return fallback;
                    }
               } catch (err) {
                    setCurrentWorkspace(null);
                    setError(
                         err instanceof Error ? err.message : "Failed to load workspace.",
                    );
                    return null;
               } finally {
                    setIsLoadingCurrent(false);
               }
          },
          [persistLastSlug, workspaces],
     );

     const createWorkspace = useCallback(
          async (payload: CreateWorkspacePayload): Promise<WorkspaceDetail> => {
               const data = await workspaceApi.createWorkspace(payload);
               const created = data.workspace;
               setWorkspaces((prev) => [
                    {
                         id: created.id,
                         name: created.name,
                         slug: created.slug,
                         description: created.description,
                         role: created.role,
                         memberCount: 1,
                         createdAt: created.createdAt,
                         updatedAt: created.updatedAt,
                    },
                    ...prev,
               ]);
               setCurrentWorkspace(created);
               persistLastSlug(created.slug);
               router.push(`/w/${created.slug}`);
               return created;
          },
          [persistLastSlug, router],
     );

     const updateCurrentWorkspace = useCallback(
          async (payload: UpdateWorkspacePayload): Promise<WorkspaceDetail> => {
               if (!currentWorkspace) {
                    throw new Error("No active workspace selected.");
               }
               const data = await workspaceApi.updateWorkspace(
                    currentWorkspace.id,
                    payload,
               );
               const updated = data.workspace;
               setCurrentWorkspace(updated);
               persistLastSlug(updated.slug);
               setWorkspaces((prev) =>
                    prev.map((w) =>
                         w.id === updated.id
                              ? {
                                   ...w,
                                   name: updated.name,
                                   slug: updated.slug,
                                   description: updated.description,
                              }
                              : w,
                    ),
               );
               if (updated.slug !== currentWorkspace.slug) {
                    router.replace(`/w/${updated.slug}`);
               }
               return updated;
          },
          [currentWorkspace, persistLastSlug, router],
     );

     const deleteCurrentWorkspace = useCallback(async (): Promise<void> => {
          if (!currentWorkspace) {
               throw new Error("No active workspace selected.");
          }
          const deletedId = currentWorkspace.id;
          await workspaceApi.deleteWorkspace(deletedId);

          const remaining = workspaces.filter((w) => w.id !== deletedId);
          setWorkspaces(remaining);
          setCurrentWorkspace(null);

          if (remaining.length > 0) {
               persistLastSlug(remaining[0].slug);
               router.replace(`/w/${remaining[0].slug}`);
          } else {
               if (typeof window !== "undefined") {
                    window.localStorage.removeItem(LAST_WORKSPACE_KEY);
               }
               router.replace("/dashboard");
          }
     }, [currentWorkspace, persistLastSlug, router, workspaces]);

     const clearWorkspaceState = useCallback(() => {
          setCurrentWorkspace(null);
          setError(null);
     }, []);

     const canManageWorkspace = useMemo(
          () => currentWorkspace?.role === "OWNER",
          [currentWorkspace?.role],
     );

     const canEditWorkspace = useMemo(
          () =>
               currentWorkspace?.role === "OWNER" ||
               currentWorkspace?.role === "EDITOR",
          [currentWorkspace?.role],
     );

     return (
          <WorkspaceContext.Provider
               value={{
                    workspaces,
                    currentWorkspace,
                    isLoadingList,
                    isLoadingCurrent,
                    error,
                    canManageWorkspace,
                    canEditWorkspace,
                    refreshWorkspaces,
                    loadWorkspaceBySlug,
                    createWorkspace,
                    updateCurrentWorkspace,
                    deleteCurrentWorkspace,
                    getLastVisitedSlug,
                    clearWorkspaceState,
               }}
          >
               {children}
          </WorkspaceContext.Provider>
     );
}

export function useWorkspaceContext() {
     const ctx = useContext(WorkspaceContext);
     if (!ctx) {
          throw new Error(
               "useWorkspaceContext must be used within a WorkspaceProvider",
          );
     }
     return ctx;
}