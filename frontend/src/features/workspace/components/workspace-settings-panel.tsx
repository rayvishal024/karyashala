"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiClientError } from "@/lib/api-client";
import { useWorkspace } from "../hooks/use-workspace";

export function WorkspaceSettingsPanel() {
     const {
          currentWorkspace,
          canManageWorkspace,
          updateCurrentWorkspace,
          deleteCurrentWorkspace,
     } = useWorkspace();

     const [name, setName] = useState("");
     const [description, setDescription] = useState("");
     const [saving, setSaving] = useState(false);
     const [deleting, setDeleting] = useState(false);
     const [statusMsg, setStatusMsg] = useState<string | null>(null);
     const [errorMsg, setErrorMsg] = useState<string | null>(null);

     useEffect(() => {
          if (currentWorkspace) {
               setName(currentWorkspace.name);
               setDescription(currentWorkspace.description ?? "");
          }
     }, [currentWorkspace]);

     if (!currentWorkspace) return null;

     const handleSave = async (e: FormEvent) => {
          e.preventDefault();
          if (!canManageWorkspace || saving) return;
          setErrorMsg(null);
          setStatusMsg(null);
          setSaving(true);

          try {
               await updateCurrentWorkspace({
                    name: name.trim(),
                    description: description.trim() || null,
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
          if (!canManageWorkspace || deleting) return;
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
                              value={name}
                              onChange={(e) => setName(e.target.value)}
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
                              htmlFor="settings-desc"
                              className="mb-1.5 block text-xs font-medium"
                         >
                              Description
                         </label>
                         <textarea
                              id="settings-desc"
                              rows={3}
                              disabled={!canManageWorkspace || saving}
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              style={{
                                   backgroundColor: "var(--bg-subtle)",
                                   borderColor: "var(--border-input)",
                                   color: "var(--text-primary)",
                              }}
                              className="w-full resize-none rounded-md border p-2.5 text-sm focus:outline-none disabled:opacity-60"
                         />
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
                         <button
                              type="button"
                              onClick={handleDelete}
                              disabled={deleting}
                              style={{
                                   backgroundColor: "var(--danger-bg)",
                                   borderColor: "var(--danger-border)",
                                   color: "var(--danger-text)",
                              }}
                              className="mt-4 h-8 cursor-pointer rounded-md border px-3 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                         >
                              {deleting ? "Deleting..." : "Delete workspace"}
                         </button>
                    </div>
               )}
          </div>
     );
}