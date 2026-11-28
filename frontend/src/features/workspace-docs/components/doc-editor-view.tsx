"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
     ArrowLeft,
     AlignLeft,
     Bold,
     Code2,
     Heading1,
     Heading2,
     Heading3,
     Info,
     Italic,
     List,
     ListOrdered,
     ListTodo,
     MessageSquare,
     Minus,
     RotateCcw,
     Strikethrough,
     Trash2,
     Undo2,
     Redo2,
     Quote,
} from "lucide-react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/features/auth";
import { useWorkspace } from "@/features/workspace";
import { docApi } from "../api/doc.api";
import {
     createCollaborationRoom,
     getCollaborationColor,
     type CollaborationPresence,
     type CollaborationStatus,
     type CollaborationUser,
} from "../collab/collab-room";
import { DocCommentsPanel } from "./doc-comments-panel";
import { ConfirmDeleteModal } from "./confirm-delete-modal";
import { getErrorMessage } from "../hooks/use-workspace-docs";
import type { UpdateDocPayload, WorkspaceDoc } from "../types/doc.types";

const SAVE_DELAY = 850;

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

function formatUpdatedAt(value: string): string {
     const date = new Date(value);
     if (Number.isNaN(date.getTime())) return "Last updated recently";
     return `Last updated ${new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
     }).format(date)}`;
}

function ToolbarButton({
     label,
     title,
     active = false,
     disabled = false,
     onClick,
     children,
}: {
     label: string;
     title: string;
     active?: boolean;
     disabled?: boolean;
     onClick: () => void;
     children: React.ReactNode;
}) {
     return (
          <button
               type="button"
               title={title}
               aria-label={label}
               aria-pressed={active}
               disabled={disabled}
               onClick={onClick}
               style={{
                    backgroundColor: active ? "var(--bg-subtle)" : "transparent",
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
               }}
               className="inline-flex h-7 min-w-7 cursor-pointer items-center justify-center gap-1 rounded px-1.5 text-xs transition-colors hover:bg-[var(--bg-subtle)] disabled:cursor-not-allowed disabled:opacity-40"
          >
               {children}
          </button>
     );
}

function ToolbarDivider() {
     return (
          <span
               aria-hidden="true"
               style={{ backgroundColor: "var(--border-hairline)" }}
               className="mx-1 h-4 w-px"
          />
     );
}

function FormattingToolbar({
     editor,
     disabled,
}: {
     editor: ReturnType<typeof useEditor> | null;
     disabled: boolean;
}) {
     const state = useEditorState({
          editor,
          selector: ({ editor: currentEditor }) => {
               if (!currentEditor) return null;
               return {
                    heading1: currentEditor.isActive("heading", { level: 1 }),
                    heading2: currentEditor.isActive("heading", { level: 2 }),
                    heading3: currentEditor.isActive("heading", { level: 3 }),
                    paragraph: currentEditor.isActive("paragraph"),
                    bold: currentEditor.isActive("bold"),
                    italic: currentEditor.isActive("italic"),
                    strike: currentEditor.isActive("strike"),
                    code: currentEditor.isActive("code"),
                    bulletList: currentEditor.isActive("bulletList"),
                    orderedList: currentEditor.isActive("orderedList"),
                    taskList: currentEditor.isActive("taskList"),
                    codeBlock: currentEditor.isActive("codeBlock"),
                    blockquote: currentEditor.isActive("blockquote"),
               };
          },
     });

     if (!editor) return null;

     return (
          <div
               role="toolbar"
               aria-label="Document formatting"
               style={{
                    borderColor: "var(--border-hairline)",
                    backgroundColor: "var(--bg-surface)",
               }}
               className="flex flex-wrap items-center gap-x-0.5 gap-y-1 border-y px-1 py-1"
          >
               <ToolbarButton
                         label="Paragraph"
                         title="Paragraph"
                         active={state?.paragraph}
                         disabled={disabled}
                         onClick={() => editor.chain().focus().setParagraph().run()}
                    >
                         <AlignLeft className="h-3.5 w-3.5" />
                    </ToolbarButton>
                    <ToolbarButton
                    label="Heading 1"
                    title="Heading 1"
                    active={state?.heading1}
                    disabled={disabled}
                    onClick={() =>
                         editor.chain().focus().toggleHeading({ level: 1 }).run()
                    }
               >
                    <Heading1 className="h-4 w-4" />
               </ToolbarButton>
               <ToolbarButton
                    label="Heading 2"
                    title="Heading 2"
                    active={state?.heading2}
                    disabled={disabled}
                    onClick={() =>
                         editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
               >
                    <Heading2 className="h-4 w-4" />
               </ToolbarButton>
               <ToolbarButton
                    label="Heading 3"
                    title="Heading 3"
                    active={state?.heading3}
                    disabled={disabled}
                    onClick={() =>
                         editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
               >
                    <Heading3 className="h-4 w-4" />
               </ToolbarButton>
               <ToolbarDivider />
               <ToolbarButton
                    label="Bold"
                    title="Bold (Ctrl/Cmd+B)"
                    active={state?.bold}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleBold().run()}
               >
                    <Bold className="h-3.5 w-3.5" />
               </ToolbarButton>
               <ToolbarButton
                    label="Italic"
                    title="Italic (Ctrl/Cmd+I)"
                    active={state?.italic}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
               >
                    <Italic className="h-3.5 w-3.5" />
               </ToolbarButton>
               <ToolbarButton
                    label="Strikethrough"
                    title="Strikethrough"
                    active={state?.strike}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
               >
                    <Strikethrough className="h-3.5 w-3.5" />
               </ToolbarButton>
               <ToolbarButton
                    label="Inline code"
                    title="Inline code"
                    active={state?.code}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleCode().run()}
               >
                    <Code2 className="h-3.5 w-3.5" />
               </ToolbarButton>
               <ToolbarDivider />
               <ToolbarButton
                    label="Bullet list"
                    title="Bullet list"
                    active={state?.bulletList}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
               >
                    <List className="h-4 w-4" />
               </ToolbarButton>
               <ToolbarButton
                    label="Ordered list"
                    title="Ordered list"
                    active={state?.orderedList}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
               >
                    <ListOrdered className="h-4 w-4" />
               </ToolbarButton>
               <ToolbarButton
                    label="Task list"
                    title="Task list / checkbox"
                    active={state?.taskList}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
               >
                    <ListTodo className="h-4 w-4" />
               </ToolbarButton>
               <ToolbarDivider />
               <ToolbarButton
                    label="Blockquote"
                    title="Blockquote"
                    active={state?.blockquote}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
               >
                    <Quote className="h-3.5 w-3.5" />
               </ToolbarButton>
               <ToolbarButton
                    label="Code block"
                    title="Code block"
                    active={state?.codeBlock}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
               >
                    <span className="font-mono text-[11px]">{"</>"}</span>
               </ToolbarButton>
               <ToolbarButton
                    label="Horizontal divider"
                    title="Horizontal divider"
                    disabled={disabled}
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
               >
                    <Minus className="h-4 w-4" />
               </ToolbarButton>
               <ToolbarDivider />
               <ToolbarButton
                    label="Undo"
                    title="Undo (Ctrl/Cmd+Z)"
                    disabled={disabled || !editor.can().undo()}
                    onClick={() => editor.chain().focus().undo().run()}
               >
                    <Undo2 className="h-3.5 w-3.5" />
               </ToolbarButton>
               <ToolbarButton
                    label="Redo"
                    title="Redo (Ctrl/Cmd+Shift+Z)"
                    disabled={disabled || !editor.can().redo()}
                    onClick={() => editor.chain().focus().redo().run()}
               >
                    <Redo2 className="h-3.5 w-3.5" />
               </ToolbarButton>
          </div>
     );
}

function EditorSurface({
     workspaceId,
     workspaceSlug,
     document,
     canEdit,
     user,
}: {
     workspaceId: string;
     workspaceSlug: string;
     document: WorkspaceDoc;
     canEdit: boolean;
     user: CollaborationUser;
}) {
     const router = useRouter();
     const [ydoc] = useState(() => new Y.Doc());
     const [awareness] = useState(() => new Awareness(ydoc));
     const [activePresence, setActivePresence] = useState<CollaborationPresence[]>([]);
     const [title, setTitle] = useState(document.title);
     const [collaborationStatus, setCollaborationStatus] =
          useState<CollaborationStatus>({ state: "connecting" });
     const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
     const [saveError, setSaveError] = useState<string | null>(null);
     const [saveErrorCode, setSaveErrorCode] = useState<number | null>(null);
     const [lastUpdated, setLastUpdated] = useState(document.updatedAt);
     const [updatedBy, setUpdatedBy] = useState(document.updatedBy);
     const [confirmingDelete, setConfirmingDelete] = useState(false);
     const [deleting, setDeleting] = useState(false);
     const [deleteError, setDeleteError] = useState<string | null>(null);
     const [showInfo, setShowInfo] = useState(false);
     const [showComments, setShowComments] = useState(false);
     const [commentCount, setCommentCount] = useState(0);
     const [commentsRefreshKey, setCommentsRefreshKey] = useState(0);
     const titleInputRef = useRef<HTMLInputElement>(null);
     const initialTitleSelectedRef = useRef(false);
     const latestPayloadRef = useRef<UpdateDocPayload>({
          title: document.title,
     });
     const versionRef = useRef(0);
     const savedVersionRef = useRef(0);
     const requestSequenceRef = useRef(0);
     const inFlightRef = useRef(false);
     const flushRequestedRef = useRef(false);
     const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
     const flushRef = useRef<() => Promise<void>>(async () => {});
     const activeSaveRef = useRef<Promise<{ document: WorkspaceDoc }> | null>(null);
     const deleteStartedRef = useRef(false);

     const markChanged = useCallback((partial: UpdateDocPayload) => {
          if (deleteStartedRef.current) return;
          latestPayloadRef.current = {
               ...latestPayloadRef.current,
               ...partial,
          };
          versionRef.current += 1;
          setSaveStatus("unsaved");
          setSaveError(null);
          setSaveErrorCode(null);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
               debounceRef.current = null;
               void flushRef.current();
          }, SAVE_DELAY);
     }, []);

     useEffect(() => {
          const room = createCollaborationRoom({
               workspaceId,
               docId: document.id,
               document: ydoc,
               awareness,
               user,
               canEdit,
               onStatusChange: setCollaborationStatus,
               onPresenceChange: setActivePresence,
               onCommentsChanged: () => setCommentsRefreshKey((key) => key + 1),
          });
          return () => room.destroy();
     }, [awareness, canEdit, document.id, user, workspaceId, ydoc]);

     const editor = useEditor({
          extensions: [
               StarterKit.configure({
                    heading: { levels: [1, 2, 3] },
                    undoRedo: false,
               }),
               TaskList,
               TaskItem.configure({ nested: true }),
               Placeholder.configure({
                    placeholder: "Start writing...",
               }),
               Collaboration.configure({
                    document: ydoc,
                    field: "default",
               }),
               CollaborationCaret.configure({
                    provider: { awareness },
                    user,
                    render: (collaborator) => {
                         const caret = globalThis.document.createElement("span");
                         const name =
                              typeof collaborator.name === "string"
                                   ? collaborator.name
                                   : "Collaborator";
                         const color =
                              typeof collaborator.color === "string"
                                   ? collaborator.color
                                   : "#475467";
                         caret.classList.add("collaboration-carets__caret");
                         caret.style.borderColor = color;
                         caret.setAttribute("aria-hidden", "true");

                         const label = globalThis.document.createElement("span");
                         label.classList.add("collaboration-carets__label");
                         label.style.backgroundColor = color;
                         label.style.color = "#ffffff";
                         label.textContent = name;
                         label.title =
                              typeof collaborator.role === "string"
                                   ? `${name} · ${collaborator.role.toLowerCase()}`
                                   : name;
                         caret.appendChild(label);
                         return caret;
                    },
               }),
          ],
          editable: canEdit,
          immediatelyRender: false,
          onBlur: () => {
               void flushRef.current();
          },
     });

     const documentContent = useEditorState({
          editor,
          selector: ({ editor: currentEditor }) => currentEditor?.state.doc ?? null,
     });
     const insights = useMemo(() => {
          if (!documentContent) return null;
          const outline: Array<{
               text: string;
               level: number;
               position: number;
          }> = [];
          let taskCount = 0;
          let completedTasks = 0;
          documentContent.descendants((node, position) => {
                    if (node.type.name === "heading") {
                         outline.push({
                              text: node.textContent || "Untitled heading",
                              level: Number(node.attrs.level),
                              position,
                         });
                    }
                    if (node.type.name === "taskItem") {
                         taskCount += 1;
                         if (node.attrs.checked) completedTasks += 1;
                    }
          });
          const text = documentContent.textBetween(
               0,
               documentContent.content.size,
               "\n",
          );
          const trimmedText = text.trim();
          return {
               outline,
               wordCount: trimmedText ? trimmedText.split(/\s+/u).length : 0,
               characterCount: text.length,
               taskCount,
               completedTasks,
          };
     }, [documentContent]);

     const flushSave = useCallback(async () => {
          if (debounceRef.current) {
               clearTimeout(debounceRef.current);
               debounceRef.current = null;
          }
          if (!canEdit || deleteStartedRef.current) return;
          if (inFlightRef.current) {
               flushRequestedRef.current = true;
               return;
          }

          const version = versionRef.current;
          if (version <= savedVersionRef.current) return;

          const trimmedTitle = (latestPayloadRef.current.title ?? "").trim();
          if (!trimmedTitle) {
               setSaveStatus("error");
               setSaveError("Document title cannot be blank. Add a title before saving.");
               return;
          }

          const sequence = ++requestSequenceRef.current;
          const payload = {
               title: trimmedTitle,
          };
          inFlightRef.current = true;
          flushRequestedRef.current = false;
          setSaveStatus("saving");
          setSaveError(null);
          setSaveErrorCode(null);

          try {
               const request = docApi.updateDoc(
                    workspaceId,
                    document.id,
                    payload,
               );
               activeSaveRef.current = request;
               const response = await request;
               if (sequence === requestSequenceRef.current) {
                    savedVersionRef.current = version;
                    setLastUpdated(response.document.updatedAt);
                    setUpdatedBy(response.document.updatedBy);
                    if (versionRef.current === version) {
                         setTitle(response.document.title);
                         latestPayloadRef.current = {
                              ...latestPayloadRef.current,
                              title: response.document.title,
                         };
                         setSaveStatus("saved");
                    } else {
                         setSaveStatus("unsaved");
                    }
               }
          } catch (error) {
               if (sequence === requestSequenceRef.current) {
                    if (versionRef.current > version) {
                         setSaveStatus("unsaved");
                    } else {
                         setSaveStatus("error");
                         setSaveError(
                              getErrorMessage(error, "Unable to save changes."),
                         );
                         setSaveErrorCode(
                              error instanceof ApiClientError
                                   ? error.statusCode
                                   : null,
                         );
                    }
               }
          } finally {
               activeSaveRef.current = null;
               inFlightRef.current = false;
               if (
                    flushRequestedRef.current &&
                    versionRef.current > savedVersionRef.current
               ) {
                    flushRequestedRef.current = false;
                    void flushRef.current();
               } else {
                    flushRequestedRef.current = false;
               }
          }
     }, [canEdit, document.id, workspaceId]);

     useEffect(() => {
          flushRef.current = flushSave;
     }, [flushSave]);

     useEffect(
          () => () => {
               if (debounceRef.current) {
                    clearTimeout(debounceRef.current);
                    debounceRef.current = null;
               }
               if (!deleteStartedRef.current) void flushRef.current();
          },
          [],
     );

     const handleTitleChange = (value: string) => {
          setTitle(value);
          markChanged({ title: value });
     };

     const handleDelete = async () => {
          deleteStartedRef.current = true;
          if (debounceRef.current) {
               clearTimeout(debounceRef.current);
               debounceRef.current = null;
          }
          setDeleting(true);
          setDeleteError(null);
          try {
               await activeSaveRef.current?.catch(() => undefined);
               await docApi.deleteDoc(workspaceId, document.id);
               router.push(`/w/${encodeURIComponent(workspaceSlug)}/docs`);
          } catch (error) {
               setDeleteError(getErrorMessage(error, "Unable to delete this doc."));
               deleteStartedRef.current = false;
               setDeleting(false);
          }
     };

     const jumpToHeading = (position: number) => {
          if (!editor) return;
          const heading = editor.view.nodeDOM(position);
          if (heading instanceof HTMLElement) {
               heading.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          editor.chain().focus().setTextSelection(position + 1).run();
     };

     const statusLabel = {
          saved: "Saved",
          saving: "Saving...",
          unsaved: "Unsaved",
          error: "Retry save",
     }[saveStatus];
     const collaborationLabel = {
          connecting: "Connecting...",
          syncing: "Syncing...",
          connected: "Live",
          reconnecting: collaborationStatus.retryAttempt
               ? `Reconnecting ${collaborationStatus.retryAttempt}/10`
               : "Reconnecting...",
          disconnected: "Offline",
          error: "Connection error",
     }[collaborationStatus.state];

     return (
          <div
               className={`mx-auto grid gap-8 ${
                    showInfo || showComments
                         ? "max-w-6xl lg:grid-cols-[minmax(0,1fr)_18rem]"
                         : "max-w-3xl"
               }`}
          >
               <div className="min-w-0">
               <header
                    style={{ borderColor: "var(--border-hairline)" }}
                    className="flex min-h-11 flex-wrap items-center justify-between gap-3 border-b pb-3"
               >
                    <div className="flex min-w-0 items-center gap-3">
                         <Link
                              href={`/w/${encodeURIComponent(workspaceSlug)}/docs`}
                              style={{ color: "var(--text-secondary)" }}
                              className="inline-flex h-7 shrink-0 items-center gap-1 text-xs transition-colors hover:text-[var(--text-primary)]"
                         >
                              <ArrowLeft className="h-3.5 w-3.5" />
                              Docs
                         </Link>
                         <span
                              aria-hidden="true"
                              style={{ color: "var(--text-muted)" }}
                              className="text-xs"
                         >
                              /
                         </span>
                         <span className="max-w-40 truncate text-xs font-medium sm:max-w-64">
                              {title.trim() || "Untitled Doc"}
                         </span>
                         {!canEdit && (
                              <span
                                   style={{
                                        borderColor: "var(--border-hairline)",
                                        color: "var(--text-muted)",
                                   }}
                                   className="rounded border px-1.5 py-0.5 font-mono text-[9px] tracking-wide"
                              >
                                   VIEWER
                              </span>
                         )}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                         {activePresence.length > 0 && (
                              <div
                                   aria-label={`${activePresence.length} active collaborators`}
                                   className="flex items-center -space-x-1.5"
                              >
                                   {activePresence.slice(0, 4).map((collaborator) => (
                                        <span
                                             key={collaborator.userId}
                                             aria-label={`${collaborator.name}, ${collaborator.role.toLowerCase()}${collaborator.userId === user.userId ? ", you" : ""}`}
                                             title={`${collaborator.name} · ${collaborator.role.toLowerCase()}${collaborator.userId === user.userId ? " · you" : ""}`}
                                             style={{
                                                  backgroundColor: collaborator.color,
                                                  borderColor: "var(--bg-canvas)",
                                                  color: "#ffffff",
                                             }}
                                             className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 text-[9px] font-semibold leading-none"
                                        >
                                             {collaborator.name
                                                  .trim()
                                                  .split(/\s+/u)
                                                  .slice(0, 2)
                                                  .map((part) => part[0] ?? "")
                                                  .join("")
                                                  .toUpperCase()}
                                        </span>
                                   ))}
                                   {activePresence.length > 4 && (
                                        <span
                                             title={activePresence
                                                  .slice(4)
                                                  .map((collaborator) => collaborator.name)
                                                  .join(", ")}
                                             style={{
                                                  backgroundColor: "var(--bg-subtle)",
                                                  borderColor: "var(--bg-canvas)",
                                                  color: "var(--text-secondary)",
                                             }}
                                             className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border-2 px-1 text-[9px] font-medium leading-none"
                                        >
                                             +{activePresence.length - 4}
                                        </span>
                                   )}
                              </div>
                         )}
                         <div
                              role="status"
                              aria-live="polite"
                              title={collaborationStatus.message ?? collaborationLabel}
                              style={{
                                   borderColor:
                                        collaborationStatus.state === "error"
                                             ? "var(--danger-border)"
                                             : "var(--border-hairline)",
                                   backgroundColor:
                                        collaborationStatus.state === "error"
                                             ? "var(--danger-bg)"
                                             : "var(--bg-surface)",
                                   color:
                                        collaborationStatus.state === "connected"
                                             ? "var(--success-text)"
                                             : collaborationStatus.state === "error"
                                               ? "var(--danger-text)"
                                               : "var(--text-muted)",
                              }}
                              className="flex min-h-6 min-w-24 items-center justify-center rounded border px-2 font-mono text-[10px] tabular-nums"
                         >
                              {collaborationLabel}
                         </div>
                         <div
                              role="status"
                              aria-live="polite"
                              title={saveError ?? statusLabel}
                              style={{
                                   borderColor:
                                        saveStatus === "error"
                                             ? "var(--danger-border)"
                                             : "var(--border-hairline)",
                                   backgroundColor:
                                        saveStatus === "error"
                                             ? "var(--danger-bg)"
                                             : "var(--bg-surface)",
                                   color:
                                        saveStatus === "error"
                                             ? "var(--danger-text)"
                                             : saveStatus === "saved"
                                               ? "var(--success-text)"
                                               : "var(--text-muted)",
                              }}
                              className="flex min-h-6 min-w-24 items-center justify-center gap-2 rounded border px-2 font-mono text-[10px] tabular-nums"
                         >
                              {saveStatus === "error" ? (
                                   <button
                                        type="button"
                                        onClick={() => void flushRef.current()}
                                        className="cursor-pointer underline underline-offset-2"
                                   >
                                        {statusLabel}
                                   </button>
                              ) : (
                                   <span>{statusLabel}</span>
                              )}
                         </div>
                         {canEdit && (
                              <button
                                   type="button"
                                   onClick={() => {
                                        setDeleteError(null);
                                        setConfirmingDelete(true);
                                   }}
                                   style={{ color: "var(--text-secondary)" }}
                                   className="inline-flex h-7 cursor-pointer items-center gap-1 text-xs transition-colors hover:text-[var(--danger-text)]"
                              >
                                   <Trash2 className="h-3.5 w-3.5" />
                                   Delete
                              </button>
                         )}
                         <button
                              type="button"
                              onClick={() => {
                                   setShowInfo(false);
                                   setShowComments((visible) => !visible);
                              }}
                              aria-pressed={showComments}
                              aria-label={`Comments${commentCount ? ` (${commentCount})` : ""}`}
                              title={showComments ? "Hide comments" : "Show comments"}
                              style={{
                                   backgroundColor: showComments
                                        ? "var(--bg-subtle)"
                                        : "transparent",
                                   borderColor: "var(--border-hairline)",
                                   color: "var(--text-secondary)",
                              }}
                              className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded border px-2 text-[10px]"
                         >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Comments
                              <span className="font-mono tabular-nums">{commentCount}</span>
                         </button>
                         <button
                              type="button"
                              onClick={() => {
                                   setShowComments(false);
                                   setShowInfo((visible) => !visible);
                              }}
                              aria-pressed={showInfo}
                              aria-label={showInfo ? "Hide doc info and outline" : "Show doc info and outline"}
                              title={showInfo ? "Hide doc info" : "Show doc info"}
                              style={{
                                   backgroundColor: showInfo
                                        ? "var(--bg-subtle)"
                                        : "transparent",
                                   borderColor: "var(--border-hairline)",
                                   color: "var(--text-secondary)",
                              }}
                              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded border"
                         >
                              <Info className="h-3.5 w-3.5" />
                         </button>
                    </div>
               </header>

               {saveError && (
                    <div
                         role="alert"
                         style={{
                              backgroundColor: "var(--danger-bg)",
                              borderColor: "var(--danger-border)",
                              color: "var(--danger-text)",
                         }}
                         className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs"
                    >
                         <span>{saveError}</span>
                         {(saveErrorCode === 403 || saveErrorCode === 404) && (
                              <Link
                                   href={`/w/${encodeURIComponent(workspaceSlug)}/docs`}
                                   className="inline-flex shrink-0 items-center gap-1 underline underline-offset-2"
                              >
                                   <ArrowLeft className="h-3 w-3" />
                                   Back to docs
                              </Link>
                         )}
                    </div>
               )}

               {canEdit && (
                    <div className="mt-5">
                         <FormattingToolbar editor={editor} disabled={!canEdit} />
                    </div>
               )}

               <article className="mx-auto max-w-3xl pb-24 pt-9">
                    <input
                         ref={titleInputRef}
                         value={title}
                         onChange={(event) => handleTitleChange(event.target.value)}
                         onBlur={() => void flushRef.current()}
                         onFocus={(event) => {
                              if (
                                   !initialTitleSelectedRef.current &&
                                   title === "Untitled Doc"
                              ) {
                                   initialTitleSelectedRef.current = true;
                                   event.currentTarget.select();
                              }
                         }}
                         onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                   event.preventDefault();
                                   editor?.commands.focus("start");
                              }
                         }}
                         readOnly={!canEdit}
                         aria-label="Document title"
                         placeholder="Untitled Doc"
                         style={{ color: "var(--text-primary)" }}
                         className="mb-5 w-full border-0 bg-transparent p-0 text-3xl font-semibold leading-tight tracking-tight outline-none placeholder:text-[var(--text-muted)] read-only:cursor-default sm:text-4xl"
                    />
                    <div
                         onBlurCapture={(event) => {
                              if (
                                   !event.currentTarget.contains(
                                        event.relatedTarget as Node | null,
                                   )
                              ) {
                                   if (!deleteStartedRef.current) void flushRef.current();
                              }
                         }}
                         className="doc-editor-content min-h-[50vh] max-w-none text-sm leading-7"
                    >
                         <EditorContent editor={editor} />
                    </div>
               </article>
               </div>

               <DocCommentsPanel
                    workspaceId={workspaceId}
                    docId={document.id}
                    userId={user.userId}
                    isOwner={user.role === "OWNER"}
                    open={showComments}
                    refreshKey={commentsRefreshKey}
                    onCountChange={setCommentCount}
               />
               {showInfo && !showComments && (
                    <aside
                         aria-label="Document info and outline"
                         style={{ borderColor: "var(--border-hairline)" }}
                         className="border-t pt-5 lg:sticky lg:top-6 lg:mt-12 lg:h-fit lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"
                    >
                         <div>
                              <h2 className="text-xs font-semibold">Outline</h2>
                              {insights?.outline.length ? (
                                   <nav aria-label="Document outline" className="mt-3">
                                        <ol className="space-y-1">
                                             {insights.outline.map((heading, index) => (
                                                  <li key={`${heading.position}-${index}`}>
                                                       <button
                                                            type="button"
                                                            onClick={() =>
                                                                 jumpToHeading(heading.position)
                                                            }
                                                            style={{
                                                                 color: "var(--text-secondary)",
                                                            }}
                                                            className="block w-full cursor-pointer truncate text-left text-xs transition-colors hover:text-[var(--text-primary)]"
                                                            title={heading.text}
                                                            aria-label={`Jump to heading: ${heading.text}`}
                                                       >
                                                            <span
                                                                 className="block truncate"
                                                                 style={{
                                                                      paddingLeft: `${Math.min(
                                                                           Math.max(heading.level - 1, 0),
                                                                           2,
                                                                      ) * 0.75}rem`,
                                                                 }}
                                                            >
                                                                 {heading.text}
                                                            </span>
                                                       </button>
                                                  </li>
                                             ))}
                                        </ol>
                                   </nav>
                              ) : (
                                   <p
                                        style={{ color: "var(--text-muted)" }}
                                        className="mt-2 text-[11px] leading-relaxed"
                                   >
                                        Headings will appear here as you write.
                                   </p>
                              )}
                         </div>

                         <div
                              style={{ borderColor: "var(--border-hairline)" }}
                              className="mt-6 border-t pt-4"
                         >
                              <h2 className="text-xs font-semibold">Document stats</h2>
                              <dl
                                   style={{ color: "var(--text-secondary)" }}
                                   className="mt-3 space-y-2 text-[11px]"
                              >
                                   <div className="flex justify-between gap-3">
                                        <dt>Words</dt>
                                        <dd className="font-mono tabular-nums">
                                             {insights?.wordCount ?? 0}
                                        </dd>
                                   </div>
                                   <div className="flex justify-between gap-3">
                                        <dt>Characters</dt>
                                        <dd className="font-mono tabular-nums">
                                             {insights?.characterCount ?? 0}
                                        </dd>
                                   </div>
                                   <div className="flex justify-between gap-3">
                                        <dt>Tasks</dt>
                                        <dd className="font-mono tabular-nums">
                                             {insights?.completedTasks ?? 0} /{" "}
                                             {insights?.taskCount ?? 0} complete
                                        </dd>
                                   </div>
                              </dl>
                         </div>

                         <div
                              style={{ borderColor: "var(--border-hairline)" }}
                              className="mt-6 border-t pt-4"
                         >
                              <h2 className="text-xs font-semibold">Activity</h2>
                              <dl
                                   style={{ color: "var(--text-secondary)" }}
                                   className="mt-3 space-y-3 text-[11px]"
                              >
                                   <div>
                                        <dt style={{ color: "var(--text-muted)" }}>
                                             Created by
                                        </dt>
                                        <dd className="mt-0.5 truncate">
                                             {document.createdBy?.name ?? "Workspace member"}
                                        </dd>
                                        <dd
                                             style={{ color: "var(--text-muted)" }}
                                             className="mt-0.5 tabular-nums"
                                        >
                                             {formatUpdatedAt(document.createdAt)}
                                        </dd>
                                   </div>
                                   <div>
                                        <dt style={{ color: "var(--text-muted)" }}>
                                             Last updated by
                                        </dt>
                                        <dd className="mt-0.5 truncate">
                                             {updatedBy?.name ?? "Workspace member"}
                                        </dd>
                                        <dd
                                             style={{ color: "var(--text-muted)" }}
                                             className="mt-0.5 tabular-nums"
                                        >
                                             {formatUpdatedAt(lastUpdated)}
                                        </dd>
                                   </div>
                              </dl>
                         </div>
                    </aside>
               )}
               <ConfirmDeleteModal
                    open={confirmingDelete}
                    title={title.trim() || document.title}
                    deleting={deleting}
                    error={deleteError}
                    onCancel={() => {
                         if (!deleting) setConfirmingDelete(false);
                    }}
                    onConfirm={() => void handleDelete()}
               />
          </div>
     );
}

export function DocEditorView({ docId }: { docId: string }) {
     const { currentWorkspace } = useWorkspace();
     const { user } = useAuth();
     const [document, setDocument] = useState<WorkspaceDoc | null>(null);
     const [loading, setLoading] = useState(true);
     const [loadError, setLoadError] = useState<string | null>(null);
     const [loadErrorCode, setLoadErrorCode] = useState<number | null>(null);
     const [retry, setRetry] = useState(0);
     const workspaceId = currentWorkspace?.id;
     const workspaceSlug = currentWorkspace?.slug;
     const canEdit =
          currentWorkspace?.role === "OWNER" ||
          currentWorkspace?.role === "EDITOR";
     const currentUserId = user?.id;
     const currentUserName = user?.name;
     const currentRole = currentWorkspace?.role;
     const collaborationUser = useMemo<CollaborationUser | null>(() => {
          if (!currentUserId || !currentUserName || !currentRole) return null;
          return {
               userId: currentUserId,
               name: currentUserName,
               role: currentRole,
               color: getCollaborationColor(currentUserId),
          };
     }, [currentRole, currentUserId, currentUserName]);

     useEffect(() => {
          if (!workspaceId) return;
          let active = true;
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Load the document for the active workspace and route.
          setLoading(true);
          setLoadError(null);
          setLoadErrorCode(null);
          void docApi
               .getDoc(workspaceId, docId)
               .then((response) => {
                    if (active) setDocument(response.document);
               })
               .catch((error: unknown) => {
                    if (active) {
                         setLoadError(
                              error instanceof ApiClientError &&
                                   error.statusCode === 404
                                   ? "This document was not found in this workspace."
                                   : error instanceof ApiClientError &&
                                       error.statusCode === 403
                                     ? "You do not have access to this document."
                                     : getErrorMessage(error, "Unable to load this doc."),
                         );
                         setLoadErrorCode(
                              error instanceof ApiClientError
                                   ? error.statusCode
                                   : null,
                         );
                    }
               })
               .finally(() => {
                    if (active) setLoading(false);
               });
          return () => {
               active = false;
          };
     }, [docId, retry, workspaceId]);

     if (!currentWorkspace || !workspaceId || !workspaceSlug || !collaborationUser) return null;

     const docsHref = `/w/${encodeURIComponent(workspaceSlug)}/docs`;

     if (loading) {
          return (
               <div className="mx-auto max-w-3xl space-y-5">
                    <div
                         style={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--border-hairline)",
                         }}
                         className="h-9 animate-pulse border-b"
                    />
                    <div className="space-y-3 pt-8">
                         <div
                              style={{ backgroundColor: "var(--bg-surface)" }}
                              className="h-10 w-2/3 animate-pulse rounded"
                         />
                         <div
                              style={{ backgroundColor: "var(--bg-surface)" }}
                              className="h-4 w-full animate-pulse rounded"
                         />
                         <div
                              style={{ backgroundColor: "var(--bg-surface)" }}
                              className="h-4 w-5/6 animate-pulse rounded"
                         />
                    </div>
               </div>
          );
     }

     if (loadError || !document) {
          return (
               <div
                    style={{
                         backgroundColor: "var(--bg-surface)",
                         borderColor: "var(--border-hairline)",
                    }}
                    className="mx-auto max-w-xl rounded-lg border p-6"
               >
                    <h1 className="text-base font-semibold">Document unavailable</h1>
                    <p
                         style={{ color: "var(--text-secondary)" }}
                         className="mt-1 text-xs leading-relaxed"
                    >
                         {loadError ?? "This document could not be loaded."}
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                         <Link
                              href={docsHref}
                              style={{
                                   backgroundColor: "var(--cta-bg)",
                                   color: "var(--cta-fg)",
                              }}
                              className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium"
                         >
                              <ArrowLeft className="h-3.5 w-3.5" />
                              Back to docs
                         </Link>
                         {loadErrorCode !== 403 && loadErrorCode !== 404 && (
                              <button
                                   type="button"
                                   onClick={() => setRetry((value) => value + 1)}
                                   style={{ color: "var(--text-secondary)" }}
                                   className="inline-flex h-8 cursor-pointer items-center gap-1.5 text-xs"
                              >
                                   <RotateCcw className="h-3.5 w-3.5" />
                                   Retry
                              </button>
                         )}
                    </div>
               </div>
          );
     }

     return (
          <EditorSurface
               key={`${workspaceId}:${docId}`}
               workspaceId={workspaceId}
               workspaceSlug={workspaceSlug}
               document={document}
               canEdit={canEdit}
               user={collaborationUser}
          />
     );
}
