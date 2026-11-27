"use client";

import {
     createContext,
     useCallback,
     useContext,
     useEffect,
     useMemo,
     useRef,
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
     leaveCurrentWorkspace: () => Promise<void>;
     refreshCurrentWorkspace: () => Promise<WorkspaceDetail | null>;
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
     const workspaceLoadId = useRef(0);
     const workspaceListRef = useRef<WorkspaceSummary[]>([]);

     const replaceWorkspaceList = useCallback((next: WorkspaceSummary[]) => {
          workspaceListRef.current = next;
          setWorkspaces(next);
     }, []);

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
               replaceWorkspaceList(data.workspaces);
               setError(null);
               return data.workspaces;
          } catch (loadError) {
               setError(
                    loadError instanceof Error
                         ? loadError.message
                         : "Failed to load workspaces.",
               );
               return workspaceListRef.current;
          } finally {
               setIsLoadingList(false);
          }
     }, [replaceWorkspaceList]);

     useEffect(() => {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Load the user's workspaces on mount.
          refreshWorkspaces();
     }, [refreshWorkspaces]);

     const loadWorkspaceBySlug = useCallback(
          async (slug: string): Promise<WorkspaceDetail | null> => {
               const requestId = ++workspaceLoadId.current;
               setIsLoadingCurrent(true);
               setError(null);
               try {
                    let list = workspaceListRef.current;
                    if (list.length === 0 || !list.some((workspace) => workspace.slug === slug)) {
                         const res = await workspaceApi.listMyWorkspaces();
                         list = res.workspaces;
                         replaceWorkspaceList(list);
                    }

                    const matched = list.find((w) => w.slug === slug);
                    if (!matched) {
                         if (requestId === workspaceLoadId.current) {
                              setCurrentWorkspace(null);
                              setError(
                                   "Workspace not found or you do not have access to it.",
                              );
                         }
                         return null;
                    }

                    const detailRes = await workspaceApi.getWorkspaceById(matched.id);
                    if (requestId !== workspaceLoadId.current) return null;
                    setCurrentWorkspace(detailRes.workspace);
                    persistLastSlug(detailRes.workspace.slug);
                    return detailRes.workspace;
               } catch (loadError) {
                    if (requestId === workspaceLoadId.current) {
                         setCurrentWorkspace(null);
                         setError(
                              loadError instanceof Error
                                   ? loadError.message
                                   : "Failed to load workspace.",
                         );
                    }
                    return null;
               } finally {
                    if (requestId === workspaceLoadId.current) {
                         setIsLoadingCurrent(false);
                    }
               }
          },
          [persistLastSlug, replaceWorkspaceList],
     );

     const createWorkspace = useCallback(
          async (payload: CreateWorkspacePayload): Promise<WorkspaceDetail> => {
               const data = await workspaceApi.createWorkspace(payload);
               const created = data.workspace;
               replaceWorkspaceList([
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
                    ...workspaceListRef.current,
               ]);
               setCurrentWorkspace(created);
               persistLastSlug(created.slug);
               router.push(`/w/${created.slug}`);
               return created;
          },
          [persistLastSlug, replaceWorkspaceList, router],
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
               replaceWorkspaceList(
                    workspaceListRef.current.map((w) =>
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
                    router.replace(`/w/${updated.slug}/settings`);
               }
               return updated;
          },
          [
               currentWorkspace,
               persistLastSlug,
               replaceWorkspaceList,
               router,
          ],
     );

     const deleteCurrentWorkspace = useCallback(async (): Promise<void> => {
          if (!currentWorkspace) {
               throw new Error("No active workspace selected.");
          }
          const deletedId = currentWorkspace.id;
          await workspaceApi.deleteWorkspace(deletedId);

          replaceWorkspaceList(
               workspaceListRef.current.filter((w) => w.id !== deletedId),
          );
          setCurrentWorkspace(null);
          if (typeof window !== "undefined") {
               window.localStorage.removeItem(LAST_WORKSPACE_KEY);
          }
          router.replace("/dashboard");
     }, [currentWorkspace, replaceWorkspaceList, router]);

     const leaveCurrentWorkspace = useCallback(async (): Promise<void> => {
          if (!currentWorkspace) {
               throw new Error("No active workspace selected.");
          }
          const workspaceId = currentWorkspace.id;
          await workspaceApi.leaveWorkspace(workspaceId);
          replaceWorkspaceList(
               workspaceListRef.current.filter((w) => w.id !== workspaceId),
          );
          setCurrentWorkspace(null);
          if (typeof window !== "undefined") {
               window.localStorage.removeItem(LAST_WORKSPACE_KEY);
          }
          router.replace("/dashboard");
     }, [currentWorkspace, replaceWorkspaceList, router]);

     const refreshCurrentWorkspace = useCallback(async (): Promise<WorkspaceDetail | null> => {
          if (!currentWorkspace) return null;
          const [data] = await Promise.all([
               workspaceApi.getWorkspaceById(currentWorkspace.id),
               refreshWorkspaces(),
          ]);
          setCurrentWorkspace(data.workspace);
          persistLastSlug(data.workspace.slug);
          return data.workspace;
     }, [currentWorkspace, persistLastSlug, refreshWorkspaces]);

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
                    leaveCurrentWorkspace,
                    refreshCurrentWorkspace,
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