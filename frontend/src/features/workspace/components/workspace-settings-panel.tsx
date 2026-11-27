"use client";

import { useState, type FormEvent } from "react";
import { ApiClientError } from "@/lib/api-client";
import { useWorkspace } from "../hooks/use-workspace";

export function WorkspaceSettingsPanel() {
     const {
          currentWorkspace,
          canManageWorkspace,
          updateCurrentWorkspace,
          deleteCurrentWorkspace,
     } = useWorkspace();

     const [formDraft, setFormDraft] = useState<{
          workspaceId: string;
          name: string | null;
          slug: string | null;
     }>({
          workspaceId: "",
          name: null,
          slug: null,
     });
     const [saving, setSaving] = useState(false);
     const [deleting, setDeleting] = useState(false);
     const [confirmDelete, setConfirmDelete] = useState(false);
     const [statusMsg, setStatusMsg] = useState<string | null>(null);
     const [errorMsg, setErrorMsg] = useState<string | null>(null);

     if (!currentWorkspace) return null;

     const formValues = {
          name:
               formDraft.workspaceId === currentWorkspace.id && formDraft.name !== null
                    ? formDraft.name
                    : currentWorkspace.name,
          slug:
               formDraft.workspaceId === currentWorkspace.id && formDraft.slug !== null
                    ? formDraft.slug
                    : currentWorkspace.slug,
     };

     const handleSave = async (e: FormEvent) => {
          e.preventDefault();
          if (!canManageWorkspace || saving) return;
          setErrorMsg(null);
          setStatusMsg(null);
          setSaving(true);

          try {
               const updated = await updateCurrentWorkspace({
                    name: formValues.name.trim(),
                    slug: formValues.slug.trim().toLowerCase(),
               });
               setFormDraft({
                    workspaceId: updated.id,
                    name: updated.name,
                    slug: updated.slug,
               });
               setStatusMsg("Workspace settings saved.");
          } catch (err) {
               setErrorMsg(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to update workspace.",
               );
          } finally {
               setSaving(false);
          }
     };

     const handleDelete = async () => {
          if (!canManageWorkspace || deleting || !confirmDelete) return;
          setErrorMsg(null);
          setDeleting(true);

          try {
               await deleteCurrentWorkspace();
          } catch (err) {
               setErrorMsg(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to delete workspace.",
               );
               setDeleting(false);
          }
     };

     return (
          <div className="max-w-xl space-y-6">
               <div>
                    <h1 className="text-lg font-semibold tracking-tight">
                         Workspace settings
                    </h1>
                    <p
                         style={{ color: "var(--text-secondary)" }}
                         className="mt-0.5 text-xs"
                    >
                         Manage general details and ownership controls for{" "}
                         {currentWorkspace.name}.
                    </p>
               </div>

               {!canManageWorkspace && (
                    <div
                         style={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--border-hairline)",
                              color: "var(--text-secondary)",
                         }}
                         className="rounded-lg border px-3.5 py-2.5 text-xs"
                    >
                         Only the workspace <strong className="font-medium">OWNER</strong> can
                         edit general settings or delete this workspace. Your role is{" "}
                         <strong className="font-medium">{currentWorkspace.role}</strong>.
                    </div>
               )}

               {errorMsg && (
                    <div
                         style={{
                              backgroundColor: "var(--danger-bg)",
                              borderColor: "var(--danger-border)",
                              color: "var(--danger-text)",
                         }}
                         className="rounded-md border px-3 py-2 text-xs"
                    >
                         {errorMsg}
                    </div>
               )}

               {statusMsg && (
                    <div
                         style={{
                              backgroundColor: "var(--bg-subtle)",
                              borderColor: "var(--border-hairline)",
                              color: "var(--success-text)",
                         }}
                         className="rounded-md border px-3 py-2 text-xs"
                    >
                         {statusMsg}
                    </div>
               )}

               <form
                    onSubmit={handleSave}
                    style={{
                         backgroundColor: "var(--bg-surface)",
                         borderColor: "var(--border-hairline)",
                    }}
                    className="space-y-4 rounded-lg border p-5"
               >
                    <div>
                         <label
                              htmlFor="settings-name"
                              className="mb-1.5 block text-xs font-medium"
                         >
                              Workspace name
                         </label>
                         <input
                              id="settings-name"
                              type="text"
                              required
                              disabled={!canManageWorkspace || saving}
                              minLength={2}
                              maxLength={80}
                              value={formValues.name}
                              onChange={(e) =>
                                   setFormDraft((previous) => ({
                                        workspaceId: currentWorkspace.id,
                                        name: e.target.value,
                                        slug:
                                             previous.workspaceId === currentWorkspace.id
                                                  ? previous.slug
                                                  : currentWorkspace.slug,
                                   }))
                              }
                              style={{
                                   backgroundColor: "var(--bg-subtle)",
                                   borderColor: "var(--border-input)",
                                   color: "var(--text-primary)",
                              }}
                              className="h-9 w-full rounded-md border px-3 text-sm focus:outline-none disabled:opacity-60"
                         />
                    </div>

                    <div>
                         <label
                              htmlFor="settings-slug"
                              className="mb-1.5 block text-xs font-medium"
                         >
                              Workspace slug
                         </label>
                         <input
                              id="settings-slug"
                              type="text"
                              required
                              minLength={2}
                              maxLength={60}
                              pattern="[a-z0-9]+(-[a-z0-9]+)*"
                              disabled={!canManageWorkspace || saving}
                              value={formValues.slug}
                              onChange={(e) =>
                                   setFormDraft((previous) => ({
                                        workspaceId: currentWorkspace.id,
                                        name:
                                             previous.workspaceId === currentWorkspace.id
                                                  ? previous.name
                                                  : currentWorkspace.name,
                                        slug: e.target.value
                                             .toLowerCase()
                                             .replace(/[^a-z0-9]+/g, "-")
                                             .replace(/^-+|-+$/g, ""),
                                   }))
                              }
                              style={{
                                   backgroundColor: "var(--bg-subtle)",
                                   borderColor: "var(--border-input)",
                                   color: "var(--text-primary)",
                              }}
                              className="h-9 w-full rounded-md border px-3 text-sm focus:outline-none disabled:opacity-60"
                         />
                         <p
                              style={{ color: "var(--text-muted)" }}
                              className="mt-1 text-[11px]"
                         >
                              Use lowercase letters, numbers, and hyphens.
                         </p>
                    </div>

                    {canManageWorkspace && (
                         <div className="flex justify-end">
                              <button
                                   type="submit"
                                   disabled={saving}
                                   style={{
                                        backgroundColor: "var(--cta-bg)",
                                        color: "var(--cta-fg)",
                                   }}
                                   className="h-8 cursor-pointer rounded-md px-3.5 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                              >
                                   {saving ? "Saving..." : "Save changes"}
                              </button>
                         </div>
                    )}
               </form>

               {canManageWorkspace && (
                    <div
                         style={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--danger-border)",
                         }}
                         className="rounded-lg border p-5"
                    >
                         <h2
                              style={{ color: "var(--danger-text)" }}
                              className="text-sm font-semibold"
                         >
                              Delete workspace
                         </h2>
                         <p
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-1 text-xs"
                         >
                              Permanently deletes this workspace, its membership records, and
                              invitations. This cannot be undone.
                         </p>
                         {!confirmDelete ? (
                              <button
                                   type="button"
                                   onClick={() => setConfirmDelete(true)}
                                   disabled={deleting}
                                   style={{
                                        backgroundColor: "var(--danger-bg)",
                                        borderColor: "var(--danger-border)",
                                        color: "var(--danger-text)",
                                   }}
                                   className="mt-4 h-8 cursor-pointer rounded-md border px-3 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                              >
                                   Delete workspace
                              </button>
                         ) : (
                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                   <span
                                        style={{ color: "var(--danger-text)" }}
                                        className="text-xs"
                                   >
                                        This action cannot be undone. Confirm deletion?
                                   </span>
                                   <button
                                        type="button"
                                        onClick={() => setConfirmDelete(false)}
                                        disabled={deleting}
                                        style={{
                                             backgroundColor: "var(--bg-subtle)",
                                             borderColor: "var(--border-input)",
                                             color: "var(--text-secondary)",
                                        }}
                                        className="h-8 cursor-pointer rounded-md border px-3 text-xs font-medium disabled:opacity-50"
                                   >
                                        Cancel
                                   </button>
                                   <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        style={{
                                             backgroundColor: "var(--danger-bg)",
                                             borderColor: "var(--danger-border)",
                                             color: "var(--danger-text)",
                                        }}
                                        className="h-8 cursor-pointer rounded-md border px-3 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                                   >
                                        {deleting ? "Deleting..." : "Delete workspace"}
                                   </button>
                              </div>
                         )}
                    </div>
               )}
          </div>
     );
}