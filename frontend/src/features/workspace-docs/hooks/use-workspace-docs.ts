"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api-client";
import { docApi } from "../api/doc.api";
import type { CreateDocPayload, WorkspaceDoc } from "../types/doc.types";

export function getErrorMessage(error: unknown, fallback: string): string {
     return error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : fallback;
}

export function useWorkspaceDocs(workspaceId: string | undefined) {
     const [documents, setDocuments] = useState<WorkspaceDoc[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);

     const loadDocs = useCallback(async () => {
          if (!workspaceId) {
               setLoading(false);
               return;
          }
          setLoading(true);
          try {
               const response = await docApi.listDocs(workspaceId);
               setDocuments(response.documents);
               setError(null);
          } catch (loadError) {
               setError(getErrorMessage(loadError, "Failed to load docs."));
          } finally {
               setLoading(false);
          }
     }, [workspaceId]);

     useEffect(() => {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Load documents when the workspace changes.
          void loadDocs();
     }, [loadDocs]);

     const createDoc = useCallback(
          async (payload?: CreateDocPayload) => {
               if (!workspaceId) {
                    throw new Error("No active workspace selected.");
               }
               return docApi.createDoc(workspaceId, payload);
          },
          [workspaceId],
     );

     const deleteDoc = useCallback(
          async (docId: string) => {
               if (!workspaceId) {
                    throw new Error("No active workspace selected.");
               }
               const result = await docApi.deleteDoc(workspaceId, docId);
               setDocuments((current) =>
                    current.filter((document) => document.id !== result.id),
               );
               return result;
          },
          [workspaceId],
     );

     return { documents, loading, error, loadDocs, createDoc, deleteDoc, setError };
}
