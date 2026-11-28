"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Reply, Send, Trash2 } from "lucide-react";
import { docApi } from "../api/doc.api";
import type { DocumentComment } from "../types/doc.types";

function getInitials(name: string): string {
     return name
          .trim()
          .split(/\s+/u)
          .slice(0, 2)
          .map((part) => part[0] ?? "")
          .join("")
          .toUpperCase();
}

function formatCommentTime(value: string): string {
     const timestamp = new Date(value).getTime();
     if (Number.isNaN(timestamp)) return "Recently";
     const elapsedSeconds = Math.round((timestamp - Date.now()) / 1_000);
     const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
          ["year", 31_536_000],
          ["month", 2_592_000],
          ["week", 604_800],
          ["day", 86_400],
          ["hour", 3_600],
          ["minute", 60],
     ];
     const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
     for (const [unit, secondsPerUnit] of units) {
          if (Math.abs(elapsedSeconds) >= secondsPerUnit) {
               return formatter.format(Math.round(elapsedSeconds / secondsPerUnit), unit);
          }
     }
     return formatter.format(elapsedSeconds, "second");
}

function getErrorMessage(error: unknown): string {
     return error instanceof Error ? error.message : "Something went wrong.";
}

function CommentComposer({
     value,
     onChange,
     onSubmit,
     submitting,
     placeholder,
     compact = false,
}: {
     value: string;
     onChange: (value: string) => void;
     onSubmit: () => void;
     submitting: boolean;
     placeholder: string;
     compact?: boolean;
}) {
     return (
          <div className={compact ? "mt-2" : ""}>
               <textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={(event) => {
                         if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                              event.preventDefault();
                              onSubmit();
                         }
                    }}
                    maxLength={2_000}
                    rows={compact ? 2 : 3}
                    placeholder={placeholder}
                    aria-label={placeholder}
                    style={{
                         backgroundColor: "var(--bg-canvas)",
                         borderColor: "var(--border-input)",
                         color: "var(--text-primary)",
                    }}
                    className="block w-full resize-y rounded-md border px-2.5 py-2 text-xs leading-relaxed outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)]"
               />
               <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span
                         style={{ color: "var(--text-muted)" }}
                         className="font-mono text-[9px] tabular-nums"
                    >
                         {value.length}/2000 · Ctrl/Cmd + Enter
                    </span>
                    <button
                         type="button"
                         onClick={onSubmit}
                         disabled={submitting || !value.trim() || value.length > 2_000}
                         style={{
                              backgroundColor: "var(--cta-bg)",
                              color: "var(--cta-fg)",
                         }}
                         className="inline-flex h-7 cursor-pointer items-center gap-1 rounded px-2.5 text-[10px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
                    >
                         {compact ? <Reply className="h-3 w-3" /> : <Send className="h-3 w-3" />}
                         {submitting ? "Posting..." : compact ? "Reply" : "Comment"}
                    </button>
               </div>
          </div>
     );
}

export function DocCommentsPanel({
     workspaceId,
     docId,
     userId,
     isOwner,
     open,
     refreshKey,
     onCountChange,
}: {
     workspaceId: string;
     docId: string;
     userId: string;
     isOwner: boolean;
     open: boolean;
     refreshKey: number;
     onCountChange: (count: number) => void;
}) {
     const [comments, setComments] = useState<DocumentComment[]>([]);
     const [loading, setLoading] = useState(true);
     const [loadError, setLoadError] = useState<string | null>(null);
     const [submitError, setSubmitError] = useState<string | null>(null);
     const [body, setBody] = useState("");
     const [replyBody, setReplyBody] = useState("");
     const [replyingTo, setReplyingTo] = useState<string | null>(null);
     const [pendingAction, setPendingAction] = useState<string | null>(null);

     const loadComments = useCallback(async () => {
          setLoading(true);
          setLoadError(null);
          try {
               const response = await docApi.listDocComments(workspaceId, docId);
               setComments(response.comments);
               onCountChange(
                    response.comments.reduce(
                         (count, comment) => count + 1 + (comment.replies?.length ?? 0),
                         0,
                    ),
               );
          } catch (error) {
               setLoadError(getErrorMessage(error));
          } finally {
               setLoading(false);
          }
     }, [docId, onCountChange, workspaceId]);

     useEffect(() => {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Load comments after document or room changes.
          void loadComments();
     }, [loadComments, refreshKey]);

     const createComment = async (parentId?: string) => {
          const value = parentId ? replyBody : body;
          if (!value.trim() || pendingAction) return;
          setPendingAction(parentId ?? "new");
          setSubmitError(null);
          try {
               await docApi.createDocComment(workspaceId, docId, {
                    body: value,
                    ...(parentId ? { parentId } : {}),
               });
               if (parentId) {
                    setReplyBody("");
                    setReplyingTo(null);
               } else {
                    setBody("");
               }
               await loadComments();
          } catch (error) {
               setSubmitError(getErrorMessage(error));
          } finally {
               setPendingAction(null);
          }
     };

     const deleteComment = async (commentId: string) => {
          setPendingAction(commentId);
          setSubmitError(null);
          try {
               await docApi.deleteDocComment(workspaceId, docId, commentId);
               await loadComments();
          } catch (error) {
               setSubmitError(getErrorMessage(error));
          } finally {
               setPendingAction(null);
          }
     };

     if (!open) return null;

     return (
          <aside
               aria-label="Document comments"
               style={{ borderColor: "var(--border-hairline)" }}
               className="border-t pt-5 lg:sticky lg:top-6 lg:mt-12 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"
          >
               <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs font-semibold">Comments</h2>
                    <span
                         style={{ color: "var(--text-muted)" }}
                         className="font-mono text-[10px] tabular-nums"
                    >
                         {comments.reduce(
                              (count, comment) => count + 1 + (comment.replies?.length ?? 0),
                              0,
                         )}
                    </span>
               </div>
               <div
                    style={{ borderColor: "var(--border-hairline)" }}
                    className="mt-3 border-b pb-3"
               >
                    <CommentComposer
                         value={body}
                         onChange={setBody}
                         onSubmit={() => void createComment()}
                         submitting={pendingAction === "new"}
                         placeholder="Write a comment..."
                    />
               </div>
               {submitError && (
                    <p
                         role="alert"
                         style={{ color: "var(--danger-text)" }}
                         className="mt-2 text-[10px] leading-relaxed"
                    >
                         {submitError}
                    </p>
               )}
               {loading ? (
                    <p style={{ color: "var(--text-muted)" }} className="py-5 text-center text-xs">
                         Loading comments...
                    </p>
               ) : loadError ? (
                    <div className="py-5 text-center">
                         <p role="alert" style={{ color: "var(--danger-text)" }} className="text-xs">
                              {loadError}
                         </p>
                         <button
                              type="button"
                              onClick={() => void loadComments()}
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-2 cursor-pointer text-[10px] underline underline-offset-2"
                         >
                              Try again
                         </button>
                    </div>
               ) : comments.length === 0 ? (
                    <div
                         style={{ color: "var(--text-muted)" }}
                         className="py-8 text-center"
                    >
                         <MessageSquare className="mx-auto h-4 w-4" />
                         <p className="mx-auto mt-2 max-w-48 text-[11px] leading-relaxed">
                              No comments yet. Start a discussion around this document.
                         </p>
                    </div>
               ) : (
                    <ol className="divide-y" style={{ borderColor: "var(--border-hairline)" }}>
                         {comments.map((comment) => (
                              <li key={comment.id} className="py-3">
                                   <CommentEntry
                                        comment={comment}
                                        currentUserId={userId}
                                        canDelete={isOwner || comment.author.id === userId}
                                        pendingAction={pendingAction}
                                        replyingTo={replyingTo}
                                        onToggleReply={() => {
                                             setReplyingTo((current) =>
                                                  current === comment.id ? null : comment.id,
                                             );
                                             setReplyBody("");
                                             setSubmitError(null);
                                        }}
                                        onDelete={() => void deleteComment(comment.id)}
                                   />
                                   {comment.replies?.length ? (
                                        <ol
                                             style={{ borderColor: "var(--border-hairline)" }}
                                             className="ml-3 mt-3 space-y-3 border-l pl-3"
                                        >
                                             {comment.replies.map((reply) => (
                                                  <li key={reply.id}>
                                                       <CommentEntry
                                                            comment={reply}
                                                            currentUserId={userId}
                                                            canDelete={isOwner || reply.author.id === userId}
                                                            pendingAction={pendingAction}
                                                            onDelete={() => void deleteComment(reply.id)}
                                                       />
                                                  </li>
                                             ))}
                                        </ol>
                                   ) : null}
                                   {replyingTo === comment.id && (
                                        <CommentComposer
                                             value={replyBody}
                                             onChange={setReplyBody}
                                             onSubmit={() => void createComment(comment.id)}
                                             submitting={pendingAction === comment.id}
                                             placeholder="Write a reply..."
                                             compact
                                        />
                                   )}
                              </li>
                         ))}
                    </ol>
               )}
          </aside>
     );
}

function CommentEntry({
     comment,
     currentUserId,
     canDelete,
     pendingAction,
     replyingTo,
     onToggleReply,
     onDelete,
}: {
     comment: DocumentComment;
     currentUserId: string;
     canDelete: boolean;
     pendingAction: string | null;
     replyingTo?: string | null;
     onToggleReply?: () => void;
     onDelete: () => void;
}) {
     return (
          <div>
               <div className="flex items-start gap-2">
                    <span
                         aria-hidden="true"
                         style={{
                              backgroundColor: "var(--bg-subtle)",
                              color: "var(--text-secondary)",
                         }}
                         className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold"
                    >
                         {getInitials(comment.author.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                         <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
                              <span
                                   title={comment.author.email}
                                   className="max-w-36 truncate text-[11px] font-medium"
                              >
                                   {comment.author.name}
                              </span>
                              {comment.author.id === currentUserId && (
                                   <span style={{ color: "var(--text-muted)" }} className="text-[9px]">
                                        you
                                   </span>
                              )}
                              <time
                                   dateTime={comment.createdAt}
                                   title={new Date(comment.createdAt).toLocaleString()}
                                   style={{ color: "var(--text-muted)" }}
                                   className="ml-auto shrink-0 font-mono text-[9px] tabular-nums"
                              >
                                   {formatCommentTime(comment.createdAt)}
                              </time>
                         </div>
                         <p
                              style={{ color: "var(--text-secondary)" }}
                              className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-relaxed"
                         >
                              {comment.body}
                         </p>
                         <div className="mt-1 flex items-center gap-3">
                              {onToggleReply && (
                                   <button
                                        type="button"
                                        onClick={onToggleReply}
                                        aria-expanded={replyingTo === comment.id}
                                        className="cursor-pointer text-[10px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                                   >
                                        Reply
                                   </button>
                              )}
                              {canDelete && (
                                   <button
                                        type="button"
                                        onClick={onDelete}
                                        disabled={pendingAction === comment.id}
                                        style={{ color: "var(--text-muted)" }}
                                        className="inline-flex cursor-pointer items-center gap-1 text-[10px] transition-colors hover:text-[var(--danger-text)] disabled:cursor-wait disabled:opacity-50"
                                   >
                                        <Trash2 className="h-3 w-3" />
                                        {pendingAction === comment.id ? "Deleting..." : "Delete"}
                                   </button>
                              )}
                         </div>
                    </div>
               </div>
          </div>
     );
}
