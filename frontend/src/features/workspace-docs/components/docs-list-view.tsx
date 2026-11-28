"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
     ArrowUpRight,
     FileText,
     Grid2X2,
     List,
     Plus,
     Search,
     Trash2,
     X,
} from "lucide-react";
import { useWorkspace } from "@/features/workspace";
import { ConfirmDeleteModal } from "./confirm-delete-modal";
import {
     getErrorMessage,
     useWorkspaceDocs,
} from "../hooks/use-workspace-docs";
import type { WorkspaceDoc } from "../types/doc.types";

type DocsView = "list" | "grid";

function formatUpdatedAt(value: string): string {
     const date = new Date(value);
     if (Number.isNaN(date.getTime())) return "Updated recently";
     const relativeMinutes = Math.round((date.getTime() - Date.now()) / 60_000);
     const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
     if (Math.abs(relativeMinutes) < 60) return relative.format(relativeMinutes, "minute");
     const relativeHours = Math.round(relativeMinutes / 60);
     if (Math.abs(relativeHours) < 24) return relative.format(relativeHours, "hour");
     const relativeDays = Math.round(relativeHours / 24);
     if (Math.abs(relativeDays) < 7) return relative.format(relativeDays, "day");
     return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function getDocExcerpt(document: WorkspaceDoc): string {
     return (document.excerpt ?? document.contentText ?? "").trim() || "No content yet";
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
     const [confirmingDoc, setConfirmingDoc] = useState<WorkspaceDoc | null>(null);
     const [deleteError, setDeleteError] = useState<string | null>(null);
     const [view, setView] = useState<DocsView>("list");
     const searchRef = useRef<HTMLInputElement>(null);
     const canEdit =
          currentWorkspace?.role === "OWNER" ||
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

     useEffect(() => {
          const handleShortcut = (event: KeyboardEvent) => {
               if (
                    event.key !== "/" ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.altKey ||
                    event.target instanceof HTMLInputElement ||
                    event.target instanceof HTMLTextAreaElement ||
                    (event.target instanceof HTMLElement && event.target.isContentEditable)
               ) {
                    return;
               }
               event.preventDefault();
               searchRef.current?.focus();
          };
          window.addEventListener("keydown", handleShortcut);
          return () => window.removeEventListener("keydown", handleShortcut);
     }, []);

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

     const handleDelete = async () => {
          if (!confirmingDoc) return;
          setDeletingId(confirmingDoc.id);
          setDeleteError(null);
          try {
               await deleteDoc(confirmingDoc.id);
               setConfirmingDoc(null);
          } catch (deleteFailure) {
               setDeleteError(
                    getErrorMessage(deleteFailure, "Failed to delete doc."),
               );
          } finally {
               setDeletingId(null);
          }
     };

     const openDocument = (document: WorkspaceDoc) => {
          router.push(
               `/w/${encodeURIComponent(currentWorkspace.slug)}/docs/${encodeURIComponent(document.id)}`,
          );
     };

     const renderActions = (document: WorkspaceDoc) => (
          <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
               <button
                    type="button"
                    onClick={() => openDocument(document)}
                    aria-label={`Open ${document.title}`}
                    title="Open doc"
                    style={{ color: "var(--text-secondary)" }}
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--border-input)]"
               >
                    <ArrowUpRight className="h-3.5 w-3.5" />
               </button>
               {canEdit && (
                    <button
                         type="button"
                         onClick={() => {
                              setDeleteError(null);
                              setConfirmingDoc(document);
                         }}
                         aria-label={`Delete ${document.title}`}
                         title="Delete doc"
                         style={{ color: "var(--text-muted)" }}
                         className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--danger-text)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--border-input)]"
                    >
                         <Trash2 className="h-3.5 w-3.5" />
                    </button>
               )}
          </div>
     );

     return (
          <section className="space-y-6">
               <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                         <p
                              style={{ color: "var(--text-muted)" }}
                              className="text-[10px] font-medium uppercase tracking-[0.16em]"
                         >
                              {currentWorkspace.name}
                         </p>
                         <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                              Docs
                         </h1>
                         <p
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-1 text-xs"
                         >
                              {documents.length}{" "}
                              {documents.length === 1 ? "document" : "documents"}
                         </p>
                    </div>
                    <div className="flex items-center gap-2">
                         {!canEdit && (
                              <span
                                   style={{ color: "var(--text-muted)" }}
                                   className="hidden text-xs sm:inline"
                              >
                                   Read-only access
                              </span>
                         )}
                         {canEdit && (
                              <button
                                   type="button"
                                   onClick={() => void handleCreate()}
                                   disabled={creating}
                                   aria-busy={creating}
                                   style={{
                                        backgroundColor: "var(--cta-bg)",
                                        color: "var(--cta-fg)",
                                   }}
                                   className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                   <Plus className="h-3.5 w-3.5" />
                                   {creating ? "Creating..." : "New Doc"}
                              </button>
                         )}
                    </div>
               </header>

               {!canEdit && (
                    <p
                         style={{
                              borderColor: "var(--border-hairline)",
                              color: "var(--text-muted)",
                         }}
                         className="border-l-2 pl-3 text-xs"
                    >
                         You can read and search workspace docs. Editing is limited to owners and editors.
                    </p>
               )}

               <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="relative block w-full max-w-md">
                         <Search
                              aria-hidden="true"
                              style={{ color: "var(--text-muted)" }}
                              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                         />
                         <input
                              ref={searchRef}
                              type="search"
                              value={query}
                              onChange={(event) => setQuery(event.target.value)}
                              placeholder="Search docs..."
                              aria-label="Search docs (press /)"
                              style={{
                                   backgroundColor: "var(--bg-surface)",
                                   borderColor: "var(--border-hairline)",
                                   color: "var(--text-primary)",
                              }}
                              className="h-9 w-full rounded-md border pl-8 pr-16 text-xs outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-input)]"
                         />
                         {query ? (
                              <button
                                   type="button"
                                   onClick={() => {
                                        setQuery("");
                                        searchRef.current?.focus();
                                   }}
                                   aria-label="Clear search"
                                   style={{ color: "var(--text-muted)" }}
                                   className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded hover:bg-[var(--bg-subtle)]"
                              >
                                   <X className="h-3.5 w-3.5" />
                              </button>
                         ) : (
                              <kbd
                                   style={{
                                        borderColor: "var(--border-hairline)",
                                        color: "var(--text-muted)",
                                   }}
                                   className="absolute right-2 top-1/2 -translate-y-1/2 rounded border px-1.5 py-0.5 font-mono text-[9px]"
                              >
                                   /
                              </kbd>
                         )}
                    </label>

                    <div
                         role="group"
                         aria-label="Document view"
                         style={{
                              borderColor: "var(--border-hairline)",
                              backgroundColor: "var(--bg-surface)",
                         }}
                         className="flex h-8 items-center rounded-md border p-0.5"
                    >
                         <button
                              type="button"
                              onClick={() => setView("list")}
                              aria-label="List view"
                              aria-pressed={view === "list"}
                              title="List view"
                              style={{
                                   backgroundColor:
                                        view === "list" ? "var(--bg-subtle)" : "transparent",
                                   color:
                                        view === "list"
                                             ? "var(--text-primary)"
                                             : "var(--text-muted)",
                              }}
                              className="inline-flex h-6 w-7 cursor-pointer items-center justify-center rounded"
                         >
                              <List className="h-3.5 w-3.5" />
                         </button>
                         <button
                              type="button"
                              onClick={() => setView("grid")}
                              aria-label="Grid view"
                              aria-pressed={view === "grid"}
                              title="Grid view"
                              style={{
                                   backgroundColor:
                                        view === "grid" ? "var(--bg-subtle)" : "transparent",
                                   color:
                                        view === "grid"
                                             ? "var(--text-primary)"
                                             : "var(--text-muted)",
                              }}
                              className="inline-flex h-6 w-7 cursor-pointer items-center justify-center rounded"
                         >
                              <Grid2X2 className="h-3.5 w-3.5" />
                         </button>
                    </div>
               </div>

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
                    <div
                         className={
                              view === "grid"
                                   ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                                   : "divide-y divide-[var(--border-hairline)] border-y"
                         }
                         aria-label="Loading docs"
                    >
                         {[1, 2, 3].map((item) => (
                              <div
                                   key={item}
                                   style={{
                                        backgroundColor:
                                             view === "grid"
                                                  ? "var(--bg-surface)"
                                                  : "transparent",
                                        borderColor: "var(--border-hairline)",
                                   }}
                                   className={
                                        view === "grid"
                                             ? "h-32 animate-pulse rounded-md border"
                                             : "h-20 animate-pulse"
                                   }
                              />
                         ))}
                    </div>
               ) : documents.length === 0 ? (
                    <div
                         style={{
                              borderColor: "var(--border-hairline)",
                              backgroundColor: "var(--bg-surface)",
                         }}
                         className="rounded-md border px-5 py-14 text-center"
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
                                   ? "Create your first doc to start capturing workspace knowledge."
                                   : "Docs created in this workspace will appear here."}
                         </p>
                         {canEdit && (
                              <button
                                   type="button"
                                   onClick={() => void handleCreate()}
                                   disabled={creating}
                                   style={{
                                        color: "var(--text-primary)",
                                        borderColor: "var(--border-hairline)",
                                   }}
                                   className="mt-5 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-xs font-medium hover:bg-[var(--bg-subtle)] disabled:opacity-50"
                              >
                                   <Plus className="h-3.5 w-3.5" />
                                   {creating ? "Creating..." : "Create your first doc"}
                              </button>
                         )}
                    </div>
               ) : filteredDocuments.length === 0 ? (
                    <div
                         style={{ borderColor: "var(--border-hairline)" }}
                         className="border-y px-5 py-12 text-center"
                    >
                         <p className="text-sm font-medium">No docs match your search</p>
                         <p
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-1 text-xs"
                         >
                              Try another title or keyword.
                         </p>
                    </div>
               ) : view === "list" ? (
                    <ul className="divide-y divide-[var(--border-hairline)] border-y">
                         {filteredDocuments.map((document) => (
                              <li
                                   key={document.id}
                                   className="group flex items-start gap-3 px-2 py-4 transition-colors hover:bg-[var(--bg-surface)] sm:px-3"
                              >
                                   <span
                                        style={{
                                             backgroundColor: "var(--bg-surface)",
                                             borderColor: "var(--border-hairline)",
                                             color: "var(--text-secondary)",
                                        }}
                                        className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border"
                                   >
                                        <FileText className="h-4 w-4" />
                                   </span>
                                   <button
                                        type="button"
                                        onClick={() => openDocument(document)}
                                        aria-label={`Open ${document.title}`}
                                        className="min-w-0 flex-1 cursor-pointer text-left outline-none focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-[var(--border-input)]"
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
                                             className="mt-2 block text-[10px] tabular-nums"
                                        >
                                             {formatUpdatedAt(document.updatedAt)} ·{" "}
                                             {document.updatedBy?.name ||
                                                  document.createdBy?.name ||
                                                  "Workspace member"}
                                        </span>
                                   </button>
                                   {renderActions(document)}
                              </li>
                         ))}
                    </ul>
               ) : (
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                         {filteredDocuments.map((document) => (
                              <li
                                   key={document.id}
                                   style={{
                                        backgroundColor: "var(--bg-surface)",
                                        borderColor: "var(--border-hairline)",
                                   }}
                                   className="group flex min-h-40 flex-col rounded-md border p-4 transition-colors hover:border-[var(--border-input)]"
                              >
                                   <div className="flex items-start justify-between gap-3">
                                        <span
                                             style={{ color: "var(--text-secondary)" }}
                                             className="inline-flex h-7 w-7 items-center justify-center"
                                        >
                                             <FileText className="h-4 w-4" />
                                        </span>
                                        {renderActions(document)}
                                   </div>
                                   <button
                                        type="button"
                                        onClick={() => openDocument(document)}
                                        className="mt-2 cursor-pointer text-left outline-none focus-visible:underline"
                                   >
                                        <span className="block truncate text-sm font-medium">
                                             {document.title}
                                        </span>
                                        <span
                                             style={{ color: "var(--text-secondary)" }}
                                             className="mt-1 line-clamp-2 text-xs leading-relaxed"
                                        >
                                             {getDocExcerpt(document)}
                                        </span>
                                   </button>
                                   <span
                                        style={{ color: "var(--text-muted)" }}
                                        className="mt-auto pt-4 text-[10px] tabular-nums"
                                   >
                                        {formatUpdatedAt(document.updatedAt)} ·{" "}
                                        {document.updatedBy?.name ||
                                             document.createdBy?.name ||
                                             "Workspace member"}
                                   </span>
                              </li>
                         ))}
                    </ul>
               )}

               <ConfirmDeleteModal
                    open={confirmingDoc !== null}
                    title={confirmingDoc?.title ?? ""}
                    deleting={
                         confirmingDoc !== null && deletingId === confirmingDoc.id
                    }
                    error={deleteError}
                    onCancel={() => {
                         if (!deletingId) setConfirmingDoc(null);
                    }}
                    onConfirm={() => void handleDelete()}
               />
          </section>
     );
}
