"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, Link2 } from "lucide-react";
import { ApiClientError } from "@/lib/api-client";
import { useWorkspace } from "@/features/workspace";
import { inviteApi } from "../api/invite.api";
import type {
     InviteLinkSettings,
     InviteRoleOption,
} from "../types/invite.types";

interface InviteLinkCardProps {
     workspaceId: string;
     canManage: boolean;
}

export function InviteLinkCard({
     workspaceId,
     canManage,
}: InviteLinkCardProps) {
     const { currentWorkspace, loadWorkspaceBySlug } = useWorkspace();

     const [updating, setUpdating] = useState(false);
     const [copiedKey, setCopiedKey] = useState<"code" | "link" | null>(null);
     const [error, setError] = useState<string | null>(null);

     const settings: InviteLinkSettings | null =
          currentWorkspace?.id === workspaceId
               ? {
                      inviteCode: currentWorkspace.inviteCode ?? null,
                      inviteCodeExpiresAt:
                           currentWorkspace.inviteCodeExpiresAt ?? null,
                      inviteLinkEnabled: currentWorkspace.inviteLinkEnabled,
                      defaultJoinRole: currentWorkspace.defaultJoinRole,
                 }
               : null;

     const joinUrl =
          typeof window !== "undefined" && settings?.inviteCode
               ? `${window.location.origin}/join/${settings.inviteCode}`
               : settings?.inviteCode
                    ? `/join/${settings.inviteCode}`
                    : "";

     const syncWorkspace = async () => {
          if (currentWorkspace?.slug) {
               await loadWorkspaceBySlug(currentWorkspace.slug);
          }
     };

     const handleCopy = async (text: string, key: "code" | "link") => {
          if (!text) return;
          try {
               await navigator.clipboard.writeText(text);
               setCopiedKey(key);
               setTimeout(() => setCopiedKey(null), 1800);
          } catch {
               setError("Clipboard access denied.");
          }
     };

     const handleToggleEnabled = async (enabled: boolean) => {
          if (!canManage || updating || !settings) return;
          setError(null);
          setUpdating(true);
          try {
               await inviteApi.updateInviteLinkSettings(workspaceId, {
                    enabled,
                    defaultJoinRole: settings.defaultJoinRole === "VIEWER" ? "VIEWER" : "EDITOR",
               });
               await syncWorkspace();
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to update invite link status.",
               );
          } finally {
               setUpdating(false);
          }
     };

     const handleRoleChange = async (defaultJoinRole: InviteRoleOption) => {
          if (!canManage || updating || !settings) return;
          setError(null);
          setUpdating(true);
          try {
               await inviteApi.updateInviteLinkSettings(workspaceId, {
                    enabled: settings.inviteLinkEnabled,
                    defaultJoinRole,
               });
               await syncWorkspace();
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to update default join role.",
               );
          } finally {
               setUpdating(false);
          }
     };

     const handleRegenerate = async () => {
          if (!canManage || updating || !settings) return;
          setError(null);
          setUpdating(true);
          try {
               await inviteApi.updateInviteLinkSettings(workspaceId, {
                    regenerateCode: true,
               });
               await syncWorkspace();
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to regenerate invite code.",
               );
          } finally {
               setUpdating(false);
          }
     };

     const handleExpiryChange = async (value: string) => {
          if (!canManage || updating || !settings || value === "custom") return;
          setError(null);
          setUpdating(true);
          try {
               await inviteApi.updateInviteLinkSettings(workspaceId, {
                    enabled: settings.inviteLinkEnabled,
                    defaultJoinRole:
                         settings.defaultJoinRole === "VIEWER" ? "VIEWER" : "EDITOR",
                    expiresInDays: value === "never" ? null : Number(value),
               });
               await syncWorkspace();
          } catch (err) {
               setError(
                    err instanceof ApiClientError
                         ? err.message
                         : "Failed to update invite code expiry.",
               );
          } finally {
               setUpdating(false);
          }
     };

     return (
          <div
               style={{
                    backgroundColor: "var(--bg-subtle)",
                    borderColor: "var(--border-hairline)",
               }}
               className="space-y-4 rounded-lg border p-4"
          >
               <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                         <Link2
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-0.5 h-4 w-4 shrink-0"
                         />
                         <div>
                              <h3 className="text-xs font-semibold tracking-tight">
                                   Invite link &amp; join code
                              </h3>
                              <p
                                   style={{ color: "var(--text-secondary)" }}
                                   className="mt-0.5 text-[11px]"
                              >
                                   Share a join link or code so teammates can join directly.
                              </p>
                         </div>
                    </div>

                    {canManage && settings && (
                         <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium">
                              <input
                                   type="checkbox"
                                   checked={settings.inviteLinkEnabled}
                                   disabled={updating}
                                   onChange={(e) => handleToggleEnabled(e.target.checked)}
                                   className="h-3.5 w-3.5 cursor-pointer accent-[var(--text-primary)]"
                              />
                              <span>Enabled</span>
                         </label>
                    )}
               </div>

               {error && (
                    <div
                         style={{
                              backgroundColor: "var(--danger-bg)",
                              borderColor: "var(--danger-border)",
                              color: "var(--danger-text)",
                         }}
                         className="rounded-md border px-3 py-2 text-xs"
                    >
                         {error}
                    </div>
               )}

               {!settings ? (
                    <p style={{ color: "var(--text-muted)" }} className="text-xs">
                         Loading invite link details...
                    </p>
               ) : (
                    <div className="space-y-3">
                         <div className="grid gap-3 sm:grid-cols-3">
                              <div>
                                   <span
                                        style={{ color: "var(--text-muted)" }}
                                        className="mb-1 block text-[11px] font-medium"
                                   >
                                        Invite code
                                   </span>
                                   <div
                                        style={{
                                             backgroundColor: "var(--bg-surface)",
                                             borderColor: "var(--border-input)",
                                        }}
                                        className="flex h-9 items-center justify-between rounded-md border px-3"
                                   >
                                        <span className="font-mono text-xs font-semibold tracking-wider">
                                             {settings.inviteCode || "NONE"}
                                        </span>
                                        {settings.inviteCode && (
                                             <button
                                                  type="button"
                                                  onClick={() => handleCopy(settings.inviteCode!, "code")}
                                                  style={{ color: "var(--text-secondary)" }}
                                                  className="inline-flex cursor-pointer items-center gap-1 text-[11px] hover:opacity-80"
                                             >
                                                  {copiedKey === "code" ? (
                                                       <>
                                                            <Check className="h-3 w-3" />
                                                            <span>Copied</span>
                                                       </>
                                                  ) : (
                                                       <>
                                                            <Copy className="h-3 w-3" />
                                                            <span>Copy</span>
                                                       </>
                                                  )}
                                             </button>
                                        )}
                                   </div>
                              </div>

                              <div>
                                   <span
                                        style={{ color: "var(--text-muted)" }}
                                        className="mb-1 block text-[11px] font-medium"
                                   >
                                        Default role on join
                                   </span>
                                   <select
                                        value={
                                             settings.defaultJoinRole === "VIEWER" ? "VIEWER" : "EDITOR"
                                        }
                                        disabled={!canManage || updating}
                                        onChange={(e) =>
                                             handleRoleChange(e.target.value as InviteRoleOption)
                                        }
                                        style={{
                                             backgroundColor: "var(--bg-surface)",
                                             borderColor: "var(--border-input)",
                                             color: "var(--text-primary)",
                                        }}
                                        className="h-9 w-full rounded-md border px-3 text-xs font-medium focus:outline-none disabled:opacity-60"
                                   >
                                        <option value="EDITOR">EDITOR</option>
                                        <option value="VIEWER">VIEWER</option>
                                   </select>
                              </div>

                              <div>
                                   <span
                                        style={{ color: "var(--text-muted)" }}
                                        className="mb-1 block text-[11px] font-medium"
                                   >
                                        Invite code expiry
                                   </span>
                                   <select
                                        value={
                                             settings.inviteCodeExpiresAt ? "custom" : "never"
                                        }
                                        disabled={!canManage || updating}
                                        onChange={(event) =>
                                             void handleExpiryChange(event.target.value)
                                        }
                                        style={{
                                             backgroundColor: "var(--bg-surface)",
                                             borderColor: "var(--border-input)",
                                             color: "var(--text-primary)",
                                        }}
                                        className="h-9 w-full rounded-md border px-3 text-xs font-medium focus:outline-none disabled:opacity-60"
                                   >
                                        <option value="custom" disabled>
                                             {settings.inviteCodeExpiresAt
                                                  ? `Current expiry (${new Date(
                                                         settings.inviteCodeExpiresAt,
                                                    ).toLocaleDateString()})`
                                                  : "Custom"}
                                        </option>
                                        <option value="7">7 days</option>
                                        <option value="30">30 days</option>
                                        <option value="90">90 days</option>
                                        <option value="never">Never</option>
                                   </select>
                              </div>
                         </div>

                         {settings.inviteCode && (
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                                   <p
                                        style={{ color: "var(--text-muted)" }}
                                        className="truncate font-mono text-[11px]"
                                   >
                                        {joinUrl}
                                   </p>

                                   <div className="flex items-center gap-2">
                                        <button
                                             type="button"
                                             onClick={() => handleCopy(joinUrl, "link")}
                                             style={{
                                                  backgroundColor: "var(--bg-surface)",
                                                  borderColor: "var(--border-input)",
                                                  color: "var(--text-primary)",
                                             }}
                                             className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium"
                                        >
                                             {copiedKey === "link" ? (
                                                  <>
                                                       <Check className="h-3.5 w-3.5" />
                                                       <span>Link copied</span>
                                                  </>
                                             ) : (
                                                  <>
                                                       <Copy className="h-3.5 w-3.5" />
                                                       <span>Copy link</span>
                                                  </>
                                             )}
                                        </button>

                                        {canManage && (
                                             <button
                                                  type="button"
                                                  onClick={handleRegenerate}
                                                  disabled={updating}
                                                  style={{
                                                       backgroundColor: "var(--bg-surface)",
                                                       borderColor: "var(--border-input)",
                                                       color: "var(--text-primary)",
                                                  }}
                                                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium disabled:opacity-50"
                                             >
                                                  <RefreshCw
                                                       className={`h-3.5 w-3.5 ${updating ? "animate-spin" : ""}`}
                                                  />
                                                  <span>Regenerate code</span>
                                             </button>
                                        )}
                                   </div>
                              </div>
                         )}
                    </div>
               )}
          </div>
     );
}