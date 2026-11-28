"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Search, Trash2 } from "lucide-react";
import { useWorkspace } from "@/features/workspace";
import {
     getErrorMessage,
     useWorkspaceDocs,
} from "../hooks/use-workspace-docs";
import type { WorkspaceDoc } from "../types/doc.types";

function formatUpdatedAt(value: string): string {
     const date = new Date(value);
     if (Number.isNaN(date.getTime())) return "Updated recently";
     return `Updated ${new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
     }).format(date)}`;
}

function getDocExcerpt(document: WorkspaceDoc): string {
     const excerpt = document.excerpt ?? document.contentText ?? "";
     return excerpt.trim() || "No content yet";
}

export function DocsListView() {
     const router = useRouter();
     const { currentWorkspace } = useWorkspace();
     const {
          documents,
          loading,
          error,
          loadDocs,
          createDoc,
          deleteDoc,
          setError,
     } = useWorkspaceDocs(currentWorkspace?.id);
     const [query, setQuery] = useState("");
     const [creating, setCreating] = useState(false);
     const [deletingId, setDeletingId] = useState<string | null>(null);
     const [confirmingId, setConfirmingId] = useState<string | null>(null);
     const canEdit = currentWorkspace?.role === "OWNER" ||
          currentWorkspace?.role === "EDITOR";

     const filteredDocuments = useMemo(() => {
          const normalizedQuery = query.trim().toLocaleLowerCase();
          if (!normalizedQuery) return documents;
          return documents.filter((document) =>
               `${document.title} ${getDocExcerpt(document)}`
                    .toLocaleLowerCase()
                    .includes(normalizedQuery),
          );
     }, [documents, query]);

     if (!currentWorkspace) return null;

     const handleCreate = async () => {
          setCreating(true);
          setError(null);
          try {
               const response = await createDoc();
               router.push(
                    `/w/${encodeURIComponent(currentWorkspace.slug)}/docs/${encodeURIComponent(response.document.id)}`,
               );
          } catch (createError) {
               setError(getErrorMessage(createError, "Failed to create doc."));
               setCreating(false);
          }
     };

     const handleDelete = async (document: WorkspaceDoc) => {
          setDeletingId(document.id);
          setError(null);
          try {
               await deleteDoc(document.id);
               setConfirmingId(null);
          } catch (deleteError) {
               setError(getErrorMessage(deleteError, "Failed to delete doc."));
          } finally {
               setDeletingId(null);
          }
     };

     return (
          <section className="space-y-5">
               <header className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                         <h1 className="text-lg font-semibold tracking-tight">Docs</h1>
                         <p
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-0.5 text-xs"
                         >
                              {documents.length} {documents.length === 1 ? "doc" : "docs"} in{" "}
                              {currentWorkspace.name}
                         </p>
                    </div>
                    {canEdit ? (
                         <button
                              type="button"
                              onClick={() => void handleCreate()}
                              disabled={creating}
                              style={{
                                   backgroundColor: "var(--cta-bg)",
                                   color: "var(--cta-fg)",
                              }}
                              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                         >
                              <Plus className="h-3.5 w-3.5" />
                              {creating ? "Creating..." : "New Doc"}
                         </button>
                    ) : (
                         <p
                              style={{ color: "var(--text-muted)" }}
                              className="pt-2 text-xs"
                         >
                              Read-only access
                         </p>
                    )}
               </header>

               <label className="relative block max-w-sm">
                    <Search
                         aria-hidden="true"
                         style={{ color: "var(--text-muted)" }}
                         className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                    />
                    <input
                         type="search"
                         value={query}
                         onChange={(event) => setQuery(event.target.value)}
                         placeholder="Search docs..."
                         aria-label="Search docs"
                         style={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--border-hairline)",
                              color: "var(--text-primary)",
                         }}
                         className="h-9 w-full rounded-md border pl-8 pr-3 text-xs outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-input)]"
                    />
               </label>

               {error && (
                    <div
                         role="alert"
                         style={{
                              backgroundColor: "var(--danger-bg)",
                              borderColor: "var(--danger-border)",
                              color: "var(--danger-text)",
                         }}
                         className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-xs"
                    >
                         <span>{error}</span>
                         <button
                              type="button"
                              onClick={() => void loadDocs()}
                              className="cursor-pointer font-medium underline underline-offset-2"
                         >
                              Retry
                         </button>
                    </div>
               )}

               {loading ? (
                    <div className="space-y-2" aria-label="Loading docs">
                         {[1, 2, 3].map((item) => (
                              <div
                                   key={item}
                                   style={{
                                        backgroundColor: "var(--bg-surface)",
                                        borderColor: "var(--border-hairline)",
                                   }}
                                   className="h-20 animate-pulse rounded-lg border"
                              />
                         ))}
                    </div>
               ) : documents.length === 0 ? (
                    <div
                         style={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--border-hairline)",
                         }}
                         className="rounded-lg border px-5 py-12 text-center"
                    >
                         <FileText
                              aria-hidden="true"
                              style={{ color: "var(--text-muted)" }}
                              className="mx-auto h-5 w-5"
                         />
                         <h2 className="mt-3 text-sm font-medium">No docs yet</h2>
                         <p
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-1 text-xs"
                         >
                              {canEdit
                                   ? "Create a doc to start capturing your workspace notes."
                                   : "Docs created in this workspace will appear here."}
                         </p>
                    </div>
               ) : filteredDocuments.length === 0 ? (
                    <div
                         style={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--border-hairline)",
                         }}
                         className="rounded-lg border px-5 py-10 text-center"
                    >
                         <p className="text-sm font-medium">No docs match your search</p>
                         <p
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-1 text-xs"
                         >
                              Try another title or keyword.
                         </p>
                    </div>
               ) : (
                    <ul
                         style={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--border-hairline)",
                         }}
                         className="divide-y divide-[var(--border-hairline)] overflow-hidden rounded-lg border"
                    >
                         {filteredDocuments.map((document) => (
                              <li
                                   key={document.id}
                                   className="flex items-start justify-between gap-4 p-4"
                              >
                                   <button
                                        type="button"
                                        onClick={() =>
                                             router.push(
                                                  `/w/${encodeURIComponent(currentWorkspace.slug)}/docs/${encodeURIComponent(document.id)}`,
                                             )
                                        }
                                        className="min-w-0 flex-1 cursor-pointer text-left"
                                   >
                                        <span className="block truncate text-sm font-medium">
                                             {document.title}
                                        </span>
                                        <span
                                             style={{ color: "var(--text-secondary)" }}
                                             className="mt-1 block line-clamp-2 text-xs leading-relaxed"
                                        >
                                             {getDocExcerpt(document)}
                                        </span>
                                        <span
                                             style={{ color: "var(--text-muted)" }}
                                             className="mt-2 block text-[11px]"
                                        >
                                             {formatUpdatedAt(document.updatedAt)} ·{" "}
                                             {document.updatedBy?.name ||
                                                  document.createdBy?.name ||
                                                  "Workspace member"}
                                        </span>
                                   </button>
                                   {canEdit && (
                                        <div className="flex shrink-0 items-center gap-2">
                                             {confirmingId === document.id ? (
                                                  <>
                                                       <button
                                                            type="button"
                                                            onClick={() =>
                                                                 void handleDelete(document)
                                                            }
                                                            disabled={
                                                                 deletingId === document.id
                                                            }
                                                            style={{
                                                                 color: "var(--danger-text)",
                                                            }}
                                                            className="cursor-pointer text-xs font-medium disabled:opacity-50"
                                                       >
                                                            {deletingId === document.id
                                                                 ? "Deleting..."
                                                                 : "Delete"}
                                                       </button>
                                                       <button
                                                            type="button"
                                                            onClick={() =>
                                                                 setConfirmingId(null)
                                                            }
                                                            disabled={
                                                                 deletingId === document.id
                                                            }
                                                            style={{
                                                                 color: "var(--text-secondary)",
                                                            }}
                                                            className="cursor-pointer text-xs font-medium disabled:opacity-50"
                                                       >
                                                            Cancel
                                                       </button>
                                                  </>
                                             ) : (
                                                  <button
                                                       type="button"
                                                       onClick={() =>
                                                            setConfirmingId(document.id)
                                                       }
                                                       aria-label={`Delete ${document.title}`}
                                                       title="Delete doc"
                                                       style={{
                                                            color: "var(--text-muted)",
                                                       }}
                                                       className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--danger-text)]"
                                                  >
                                                       <Trash2 className="h-3.5 w-3.5" />
                                                  </button>
                                             )}
                                        </div>
                                   )}
                              </li>
                         ))}
                    </ul>
               )}
          </section>
     );
}
