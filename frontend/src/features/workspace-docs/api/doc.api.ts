import { apiFetch } from "@/lib/api-client";
import type {
     CreateDocPayload,
     DocumentPerson,
     WorkspaceDoc,
} from "../types/doc.types";

function isDocumentPerson(value: unknown): value is DocumentPerson {
     if (typeof value !== "object" || value === null) return false;
     const person = value as Record<string, unknown>;
     return (
          typeof person.id === "string" &&
          typeof person.name === "string" &&
          (typeof person.avatar === "string" || person.avatar === null)
     );
}

function isWorkspaceDoc(value: unknown): value is WorkspaceDoc {
     if (typeof value !== "object" || value === null) return false;
     const document = value as Record<string, unknown>;
     return (
          typeof document.id === "string" &&
          typeof document.workspaceId === "string" &&
          typeof document.title === "string" &&
          typeof document.createdAt === "string" &&
          typeof document.updatedAt === "string" &&
          isDocumentPerson(document.createdBy) &&
          isDocumentPerson(document.updatedBy)
     );
}

export const docApi = {
     async listDocs(workspaceId: string): Promise<{ documents: WorkspaceDoc[] }> {
          const response = await apiFetch<unknown>(
               `/workspaces/${encodeURIComponent(workspaceId)}/docs`,
          );

          if (Array.isArray(response) && response.every(isWorkspaceDoc)) {
               return { documents: response };
          }

          if (
               typeof response === "object" &&
               response !== null &&
               "documents" in response &&
               Array.isArray(response.documents) &&
               response.documents.every(isWorkspaceDoc)
          ) {
               return { documents: response.documents };
          }

          throw new Error("Docs response has an invalid shape.");
     },

     async createDoc(
          workspaceId: string,
          payload?: CreateDocPayload,
     ): Promise<{ document: WorkspaceDoc }> {
          return apiFetch<{ document: WorkspaceDoc }>(
               `/workspaces/${encodeURIComponent(workspaceId)}/docs`,
               {
                    method: "POST",
                    body: JSON.stringify(payload ?? {}),
               },
          );
     },

     async deleteDoc(
          workspaceId: string,
          docId: string,
     ): Promise<{ id: string }> {
          return apiFetch<{ id: string }>(
               `/workspaces/${encodeURIComponent(workspaceId)}/docs/${encodeURIComponent(docId)}`,
               { method: "DELETE" },
          );
     },
};
