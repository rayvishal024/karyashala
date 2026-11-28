import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import * as syncProtocol from "y-protocols/sync";
import * as Y from "yjs";
import { API_BASE_URL } from "@/lib/api-client";

const SYNC_MESSAGE = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY_MS = 500;
const MAX_RECONNECT_DELAY_MS = 15_000;
const SYNC_TIMEOUT_MS = 10_000;
const remoteOrigin = Symbol("remote");

export type CollaborationState =
     | "connecting"
     | "syncing"
     | "connected"
     | "reconnecting"
     | "disconnected"
     | "error";

export interface CollaborationStatus {
     state: CollaborationState;
     message?: string;
     retryAttempt?: number;
}

interface CollaborationRoomOptions {
     workspaceId: string;
     docId: string;
     document: Y.Doc;
     canEdit: boolean;
     onStatusChange: (status: CollaborationStatus) => void;
}

function getWebSocketUrl(workspaceId: string, docId: string): string {
     const apiUrl = new URL(API_BASE_URL);
     const protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
     return `${protocol}//${apiUrl.host}/ws/${encodeURIComponent(
          workspaceId,
     )}/docs/${encodeURIComponent(docId)}`;
}

function createSyncFrame(syncMessage: Uint8Array): Uint8Array {
     const encoder = encoding.createEncoder();
     encoding.writeVarUint(encoder, SYNC_MESSAGE);
     encoding.writeUint8Array(encoder, syncMessage);
     return encoding.toUint8Array(encoder);
}

async function refreshSession(): Promise<{
     state: "refreshed" | "unauthorized" | "unavailable";
     reason?: string;
}> {
     try {
          const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
               method: "POST",
               credentials: "include",
          });
          if (response.ok) return { state: "refreshed" };
          if (response.status === 401 || response.status === 403) {
               return { state: "unauthorized" };
          }
          return {
               state: "unavailable",
               reason: `Session refresh returned HTTP ${response.status}.`,
          };
     } catch (error) {
          return {
               state: "unavailable",
               reason:
                    error instanceof Error
                         ? error.message
                         : "Session refresh request failed.",
          };
     }
}

export function createCollaborationRoom({
     workspaceId,
     docId,
     document,
     canEdit,
     onStatusChange,
}: CollaborationRoomOptions): { destroy: () => void } {
     let socket: WebSocket | undefined;
     let retryTimer: ReturnType<typeof setTimeout> | undefined;
     let syncTimer: ReturnType<typeof setTimeout> | undefined;
     let destroyed = false;
     let hasConnected = false;
     let refreshingSession = false;
     let reconnectAttempts = 0;

     const setStatus = (status: CollaborationStatus) => {
          if (!destroyed) onStatusChange(status);
     };

     const onDocumentUpdate = (update: Uint8Array, origin: unknown) => {
          if (
               !canEdit ||
               origin === remoteOrigin ||
               socket?.readyState !== WebSocket.OPEN
          ) {
               return;
          }

          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, SYNC_MESSAGE);
          encoding.writeVarUint(encoder, 2);
          encoding.writeVarUint8Array(encoder, update);
          try {
               socket.send(encoding.toUint8Array(encoder));
          } catch (error) {
               console.error("[doc-collab] Failed to send a Yjs document update.", {
                    workspaceId,
                    docId,
                    error,
               });
               socket.close(1011, "Could not send Yjs document update.");
          }
     };

     const scheduleReconnect = (reason: string, closeCode?: number) => {
          if (destroyed) return;
          if (closeCode === 1008 || closeCode === 1003) {
               setStatus({
                    state: "error",
                    message: "The collaboration server rejected this connection.",
               });
               return;
          }

          if (retryTimer) clearTimeout(retryTimer);
          if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
               console.error(
                    "[doc-collab] WebSocket reconnect limit reached.",
                    { workspaceId, docId, reason, attempts: reconnectAttempts },
               );
               setStatus({
                    state: "error",
                    message: reason || "Unable to connect to live collaboration.",
               });
               return;
          }

          const delay = Math.min(
               INITIAL_RECONNECT_DELAY_MS * 2 ** reconnectAttempts,
               MAX_RECONNECT_DELAY_MS,
          );
          const retryAttempt = reconnectAttempts + 1;
          reconnectAttempts += 1;
          retryTimer = setTimeout(() => {
               retryTimer = undefined;
               void reconnect();
          }, delay);
          setStatus({
               state: "reconnecting",
               message: `${reason} Retrying in ${Math.ceil(delay / 1000)}s.`,
               retryAttempt,
          });
     };

     const reconnect = async () => {
          if (destroyed) return;

          if (!refreshingSession) {
               refreshingSession = true;
               const refreshResult = await refreshSession();
               refreshingSession = false;
               if (destroyed) return;
               if (refreshResult.state === "unauthorized") {
                    console.error(
                         "[doc-collab] Session refresh rejected; live collaboration stopped.",
                         { workspaceId, docId },
                    );
                    setStatus({
                         state: "error",
                         message: "Your session expired. Sign in again to reconnect.",
                    });
                    return;
               }
               if (refreshResult.state === "unavailable") {
                    console.warn(
                         "[doc-collab] Session refresh unavailable; retrying the WebSocket handshake.",
                         { workspaceId, docId, reason: refreshResult.reason },
                    );
               }
          }

          connect();
     };

     const handleMessage = (event: MessageEvent<ArrayBuffer | Blob | string>) => {
          if (event.currentTarget !== socket || destroyed) return;
          const messageSocket = socket;
          void (async () => {
               if (typeof event.data === "string") {
                    throw new Error("Unexpected text message from collaboration server.");
               }
               const bytes =
                    event.data instanceof Blob
                         ? new Uint8Array(await event.data.arrayBuffer())
                         : new Uint8Array(event.data);
               const messageDecoder = decoding.createDecoder(bytes);
               const messageType = decoding.readVarUint(messageDecoder);
               if (messageType !== SYNC_MESSAGE) return;

               const syncTypeDecoder = decoding.createDecoder(bytes);
               decoding.readVarUint(syncTypeDecoder);
               const syncType = decoding.readVarUint(syncTypeDecoder);
               const decoder = decoding.createDecoder(bytes);
               decoding.readVarUint(decoder);
               const response = encoding.createEncoder();
               if (!(syncType === 0 && !canEdit)) {
                    syncProtocol.readSyncMessage(
                         decoder,
                         response,
                         document,
                         remoteOrigin,
                    );
               }
               if (
                    encoding.length(response) > 0 &&
                    messageSocket?.readyState === WebSocket.OPEN
               ) {
                    messageSocket.send(
                         createSyncFrame(encoding.toUint8Array(response)),
                    );
               }

               if (syncType === 1) {
                    if (syncTimer) clearTimeout(syncTimer);
                    syncTimer = undefined;
                    hasConnected = true;
                    reconnectAttempts = 0;
                    console.info("[doc-collab] Yjs document is live.", {
                         workspaceId,
                         docId,
                    });
                    setStatus({ state: "connected" });
               }
          })().catch((error: unknown) => {
               const message =
                    error instanceof Error
                         ? error.message
                         : "Received invalid collaboration data.";
               console.error("[doc-collab] Invalid WebSocket sync frame.", {
                    workspaceId,
                    docId,
                    error,
               });
               setStatus({
                    state: "error",
                    message: `Invalid collaboration response: ${message}`,
               });
               messageSocket?.close(1003, "Malformed collaboration message.");
          });
     };

     const connect = () => {
          if (destroyed) return;
          setStatus({
               state: reconnectAttempts > 0 ? "reconnecting" : "connecting",
          });

          try {
               const nextSocket = new WebSocket(
                    getWebSocketUrl(workspaceId, docId),
               );
               nextSocket.binaryType = "arraybuffer";
               socket = nextSocket;
               nextSocket.addEventListener("open", () => {
                    if (socket !== nextSocket || destroyed) return;
                    setStatus({
                         state: "syncing",
                         message: "WebSocket connected; exchanging document state.",
                    });
                    syncTimer = setTimeout(() => {
                         if (socket === nextSocket) {
                              setStatus({
                                   state: "error",
                                   message: "The WebSocket opened, but Yjs synchronization timed out.",
                              });
                              nextSocket.close(1011, "Collaboration sync timed out.");
                         }
                    }, SYNC_TIMEOUT_MS);
                    const encoder = encoding.createEncoder();
                    syncProtocol.writeSyncStep1(encoder, document);
                    try {
                         nextSocket.send(createSyncFrame(encoding.toUint8Array(encoder)));
                    } catch (error) {
                         console.error(
                              "[doc-collab] Failed to send initial Yjs sync frame.",
                              { workspaceId, docId, error },
                         );
                         nextSocket.close(1011, "Could not send initial Yjs sync frame.");
                    }
               });
               nextSocket.addEventListener("message", handleMessage);
               nextSocket.addEventListener("close", (event) => {
                    if (socket !== nextSocket || destroyed) return;
                    if (syncTimer) clearTimeout(syncTimer);
                    syncTimer = undefined;
                    socket = undefined;
                    const reason =
                         event.reason ||
                         (event.code === 1006
                              ? "WebSocket handshake failed or connection dropped without a close response. Check backend logs for the rejection reason."
                              : `WebSocket closed with code ${event.code}.`);
                    console.warn("[doc-collab] WebSocket closed.", {
                         workspaceId,
                         docId,
                         code: event.code,
                         reason,
                         wasClean: event.wasClean,
                         nextAttempt: reconnectAttempts + 1,
                    });
                    scheduleReconnect(reason, event.code);
               });
               nextSocket.addEventListener("error", () => {
                    if (socket === nextSocket) {
                         console.warn("[doc-collab] WebSocket transport error.", {
                              workspaceId,
                              docId,
                              message:
                                   "Browser WebSocket errors do not expose handshake response bodies; see backend logs for rejection details.",
                         });
                         setStatus({
                              state: hasConnected ? "reconnecting" : "connecting",
                         });
                    }
               });
          } catch (error) {
               console.error("[doc-collab] Could not create WebSocket connection.", {
                    workspaceId,
                    docId,
                    error,
               });
               scheduleReconnect(
                    error instanceof Error
                         ? error.message
                         : "Unable to open the collaboration connection.",
               );
          }
     };

     document.on("update", onDocumentUpdate);
     connect();

     return {
          destroy() {
               if (destroyed) return;
               destroyed = true;
               if (retryTimer) clearTimeout(retryTimer);
               if (syncTimer) clearTimeout(syncTimer);
               document.off("update", onDocumentUpdate);
               socket?.close(1000, "Collaboration room closed.");
               socket = undefined;
          },
     };
}
