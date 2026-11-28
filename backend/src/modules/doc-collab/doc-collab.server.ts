import crypto from "node:crypto";
import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";
import { parse as parseUrl } from "node:url";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import { createClient, type RedisClientType } from "redis";
import * as Y from "yjs";
import { WebSocket, WebSocketServer } from "ws";
import { env } from "../../config/index.js";
import { prisma } from "../../config/prisma.js";
import { ACCESS_COOKIE_NAME, verifyAccessToken } from "../auth/auth.utils.js";
import type { Prisma, WorkspaceRole } from "../../generated/prisma/client.js";
import { logger } from "../../shared/logger/index.js";

const WS_PATH = /^\/ws\/([^/]+)\/docs\/([^/]+)$/;
const PRESENCE_TTL_MS = 90_000;
const PRESENCE_HEARTBEAT_MS = 30_000;
const SNAPSHOT_DEBOUNCE_MS = 1_000;
const SYNC_MESSAGE = 0;
const AWARENESS_MESSAGE = 1;
const PRESENCE_MESSAGE = 2;
const redisOrigin = Symbol("redis");

class UpgradeError extends Error {
     constructor(
          message: string,
          readonly status: number,
          readonly phase: string,
          options?: ErrorOptions,
     ) {
          super(message, options);
          this.name = "UpgradeError";
     }
}

interface Member {
     userId: string;
     name: string;
     role: WorkspaceRole;
     canEdit: boolean;
     color: string;
}

interface Presence extends Omit<Member, "canEdit"> {
     lastSeen: string;
}

interface Room {
     key: string;
     workspaceId: string;
     docId: string;
     doc: Y.Doc;
     awareness: awarenessProtocol.Awareness;
     clients: Map<WebSocket, Member>;
     channel: string;
     snapshotTimer?: NodeJS.Timeout;
     lastUpdatedById: string;
     closing: boolean;
}

interface Connection {
     room: Room;
     member: Member;
     connectionId: string;
     awarenessClientIds: Set<number>;
     heartbeat: NodeJS.Timeout;
     initialSyncComplete: boolean;
}

interface PubSubMessage {
     type: "update" | "awareness" | "presence";
     origin: string;
     payload?: string;
     userId?: string;
}

const instanceId = crypto.randomUUID();
const rooms = new Map<string, Room>();
const connectionBySocket = new WeakMap<WebSocket, Connection>();
const subscriptions = new Map<string, number>();
let redisPublisher: RedisClientType | undefined;
let redisSubscriber: RedisClientType | undefined;
let redisReady: Promise<void> | undefined;

function hashColor(userId: string): string {
     const digest = crypto.createHash("sha256").update(userId).digest();
     return `hsl(${digest.readUInt16BE(0) % 360} 70% 55%)`;
}

function getCookieToken(request: IncomingMessage): string | undefined {
     const authorization = request.headers.authorization;
     if (authorization?.startsWith("Bearer ")) {
          return authorization.slice("Bearer ".length);
     }

     const cookies = request.headers.cookie?.split(";") ?? [];
     for (const cookie of cookies) {
          const separator = cookie.indexOf("=");
          if (separator < 0 || cookie.slice(0, separator).trim() !== ACCESS_COOKIE_NAME) {
               continue;
          }
          return decodeURIComponent(cookie.slice(separator + 1).trim());
     }
     return undefined;
}

function rejectUpgrade(socket: Duplex, status: number, message: string): void {
     const reason = status === 401 ? "Unauthorized" : status === 403 ? "Forbidden" : "Service Unavailable";
     socket.end(
          `HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\nContent-Type: text/plain\r\n\r\n${message}`,
     );
}

async function ensureRedis(): Promise<void> {
     if (!env.REDIS_URL) {
          throw new Error("REDIS_URL must be configured to accept collaboration connections.");
     }
     if (!redisReady) {
          const publisher = createClient({
               url: env.REDIS_URL,
               socket: {
                    connectTimeout: 5_000,
                    reconnectStrategy: (retries) =>
                         retries >= 3
                              ? new Error("Redis connection retries exhausted.")
                              : Math.min(100 * (retries + 1), 1_000),
               },
          });
          const subscriber = publisher.duplicate();
          publisher.on("error", (error) => logger.error({ err: error }, "Redis publisher error"));
          subscriber.on("error", (error) => logger.error({ err: error }, "Redis subscriber error"));
          redisPublisher = publisher;
          redisSubscriber = subscriber;
          redisReady = Promise.all([publisher.connect(), subscriber.connect()])
               .then(() => undefined)
               .catch((error: unknown) => {
                    redisReady = undefined;
                    publisher.destroy();
                    subscriber.destroy();
                    redisPublisher = undefined;
                    redisSubscriber = undefined;
                    throw error;
               });
     }
     await redisReady;
}

function encodePresence(presence: Presence[]): Uint8Array {
     const encoder = encoding.createEncoder();
     encoding.writeVarUint(encoder, PRESENCE_MESSAGE);
     encoding.writeVarString(encoder, JSON.stringify(presence));
     return encoding.toUint8Array(encoder);
}

function sendToSocket(socket: WebSocket, data: Uint8Array): void {
     if (socket.readyState === WebSocket.OPEN) socket.send(data);
}

function broadcast(room: Room, data: Uint8Array, except?: WebSocket): void {
     for (const socket of room.clients.keys()) {
          if (socket !== except) sendToSocket(socket, data);
     }
}

function sendPresence(room: Room, presence: Presence[]): void {
     broadcast(room, encodePresence(presence));
}

async function publish(room: Room, message: PubSubMessage): Promise<void> {
     if (!redisPublisher) return;
     if (!redisPublisher.isReady) {
          logger.error({ room: room.key }, "Redis is unavailable; collaboration message was not published");
          return;
     }
     try {
          await redisPublisher.publish(room.channel, JSON.stringify(message));
     } catch (error) {
          logger.error({ err: error, room: room.key }, "Failed to publish collaboration message");
     }
}

function marksToAttributes(marks: unknown): Record<string, unknown> {
     if (!Array.isArray(marks)) return {};
     return Object.fromEntries(
          marks.flatMap((mark: unknown) => {
               if (typeof mark !== "object" || mark === null || !("type" in mark)) return [];
               const value = mark as { type: string; attrs?: Record<string, unknown> };
               return [[value.type, value.attrs ?? {}]];
          }),
     );
}

function seedElement(value: unknown): Y.XmlElement | Y.XmlText | undefined {
     if (typeof value !== "object" || value === null || !("type" in value)) return undefined;
     const node = value as {
          type: string;
          attrs?: Record<string, unknown>;
          text?: string;
          marks?: unknown;
          content?: unknown[];
     };
     if (node.type === "text") {
          const xmlText = new Y.XmlText();
          xmlText.insert(0, node.text ?? "", marksToAttributes(node.marks));
          return xmlText;
     }

     const element = new Y.XmlElement(node.type);
     for (const [key, attrValue] of Object.entries(node.attrs ?? {})) {
          if (attrValue !== null && attrValue !== undefined) {
               element.setAttribute(
                    key,
                    typeof attrValue === "string"
                         ? attrValue
                         : JSON.stringify(attrValue),
               );
          }
     }
     const children = (node.content ?? [])
          .map(seedElement)
          .filter((child): child is Y.XmlElement | Y.XmlText => child !== undefined);
     if (children.length) element.insert(0, children);
     return element;
}

function seedFromJson(doc: Y.Doc, contentJson: unknown): void {
     const root = doc.getXmlFragment("default");
     if (typeof contentJson !== "object" || contentJson === null || !("content" in contentJson)) {
          return;
     }
     const content = (contentJson as { content?: unknown[] }).content ?? [];
     const elements = content
          .map(seedElement)
          .filter((element): element is Y.XmlElement | Y.XmlText => element !== undefined);
     if (elements.length) root.insert(0, elements);
}

function getNodeJson(node: Y.XmlElement | Y.XmlText): Record<string, unknown>[] {
     if (node instanceof Y.XmlText) {
          return node.toDelta().flatMap((part: {
               insert: unknown;
               attributes?: Record<string, unknown>;
          }) => {
               if (typeof part.insert !== "string") return [];
               const textNode: Record<string, unknown> = {
                    type: "text",
                    text: part.insert,
               };
               const attributes = part.attributes;
               if (attributes && Object.keys(attributes).length) {
                    textNode.marks = Object.entries(attributes).map(([type, value]) => ({
                         type,
                         ...(typeof value === "object" && value !== null && Object.keys(value).length
                              ? { attrs: value }
                              : {}),
                    }));
               }
               return [textNode];
          });
     }

     const result: Record<string, unknown> = { type: node.nodeName };
     const attrs = Object.fromEntries(
          Object.entries(node.getAttributes()).map(([key, value]) => {
               if (
                    typeof value !== "string" ||
                    (!value.startsWith("{") && !value.startsWith("["))
               ) {
                    return [key, value];
               }
               try {
                    return [key, JSON.parse(value) as unknown];
               } catch {
                    return [key, value];
               }
          }),
     );
     if (Object.keys(attrs).length) result.attrs = attrs;
     const content = node.toArray().flatMap((child) =>
          child instanceof Y.XmlElement || child instanceof Y.XmlText
               ? getNodeJson(child)
               : [],
     );
     if (content.length) result.content = content;
     return [result];
}

function getDocumentJson(doc: Y.Doc): Prisma.InputJsonValue {
     return {
          type: "doc",
          content: doc
               .getXmlFragment("default")
               .toArray()
               .flatMap((child) =>
                    child instanceof Y.XmlElement || child instanceof Y.XmlText
                         ? getNodeJson(child)
                         : [],
               ),
     } as Prisma.InputJsonValue;
}

function getTextContent(doc: Y.Doc): string {
     const visit = (node: Y.XmlElement | Y.XmlText): string =>
          node instanceof Y.XmlText
               ? node
                    .toDelta()
                    .map((part: { insert: unknown }) => part.insert)
                    .join("")
               : node
                    .toArray()
                    .map((child) =>
                         child instanceof Y.XmlElement || child instanceof Y.XmlText
                              ? visit(child)
                              : "",
                    )
                    .join("");
     return doc
          .getXmlFragment("default")
          .toArray()
          .filter((child): child is Y.XmlElement | Y.XmlText =>
               child instanceof Y.XmlElement || child instanceof Y.XmlText,
          )
          .map(visit)
          .join("")
          .replace(/\s+/g, " ")
          .trim();
}

async function persistRoom(room: Room): Promise<void> {
     const state = Buffer.from(Y.encodeStateAsUpdate(room.doc));
     const contentJson = getDocumentJson(room.doc);
     const contentText = getTextContent(room.doc);
     const result = await prisma.document.updateMany({
          where: { id: room.docId, workspaceId: room.workspaceId },
          data: {
               yjsState: state,
               contentJson,
               contentText,
               updatedById: room.lastUpdatedById,
          },
     });
     if (result.count !== 1) {
          throw new Error(`Document ${room.docId} disappeared before its collaboration state was saved.`);
     }
}

function scheduleSnapshot(room: Room): void {
     if (room.closing) return;
     if (room.snapshotTimer) clearTimeout(room.snapshotTimer);
     room.snapshotTimer = setTimeout(() => {
          room.snapshotTimer = undefined;
          void persistRoom(room).catch((error: unknown) => {
               logger.error({ err: error, room: room.key }, "Failed to persist collaboration snapshot");
          });
     }, SNAPSHOT_DEBOUNCE_MS);
}

async function loadPresence(room: Room): Promise<Presence[]> {
     if (!redisPublisher) return [];
     const hashKey = `presence:${room.key}:connections`;
     const leaseKey = `presence:${room.key}:leases`;
     const now = Date.now();
     const expired = await redisPublisher.zRangeByScore(leaseKey, 0, now);
     if (expired.length) {
          await redisPublisher.multi().zRem(leaseKey, expired).hDel(hashKey, expired).exec();
     }
     const entries = await redisPublisher.hGetAll(hashKey);
     const users = new Map<string, Presence>();
     for (const serialized of Object.values(entries)) {
          const connection = JSON.parse(serialized) as Presence;
          const existing = users.get(connection.userId);
          if (!existing || connection.lastSeen > existing.lastSeen) {
               users.set(connection.userId, connection);
          }
     }
     return [...users.values()];
}

async function updatePresence(connection: Connection): Promise<void> {
     if (!redisPublisher) return;
     const { room, member, connectionId } = connection;
     const presence: Presence = {
          userId: member.userId,
          name: member.name,
          role: member.role,
          color: member.color,
          lastSeen: new Date().toISOString(),
     };
     const hashKey = `presence:${room.key}:connections`;
     const leaseKey = `presence:${room.key}:leases`;
     const expiresAt = Date.now() + PRESENCE_TTL_MS;
     await redisPublisher
          .multi()
          .hSet(hashKey, connectionId, JSON.stringify(presence))
          .zAdd(leaseKey, { score: expiresAt, value: connectionId })
          .pExpire(hashKey, PRESENCE_TTL_MS)
          .pExpire(leaseKey, PRESENCE_TTL_MS)
          .exec();
     await publish(room, { type: "presence", origin: instanceId });
}

async function removePresence(connection: Connection): Promise<void> {
     if (!redisPublisher) return;
     const hashKey = `presence:${connection.room.key}:connections`;
     const leaseKey = `presence:${connection.room.key}:leases`;
     await redisPublisher.multi()
          .hDel(hashKey, connection.connectionId)
          .zRem(leaseKey, connection.connectionId)
          .exec();
     await publish(connection.room, { type: "presence", origin: instanceId });
}

async function subscribeRoom(room: Room): Promise<void> {
     const count = subscriptions.get(room.channel) ?? 0;
     subscriptions.set(room.channel, count + 1);
     if (count > 0) return;

     await redisSubscriber?.subscribe(room.channel, (serialized) => {
          void (async () => {
               const message = JSON.parse(serialized) as PubSubMessage;
               if (message.origin === instanceId || room.closing) return;
               if (message.type === "update" && message.payload) {
                    const update = Buffer.from(message.payload, "base64");
                    if (message.userId) room.lastUpdatedById = message.userId;
                    Y.applyUpdate(room.doc, update, redisOrigin);
                    scheduleSnapshot(room);
                    const encoder = encoding.createEncoder();
                    encoding.writeVarUint(encoder, SYNC_MESSAGE);
                    encoding.writeVarUint(encoder, 2);
                    encoding.writeVarUint8Array(encoder, update);
                    broadcast(room, encoding.toUint8Array(encoder));
               } else if (message.type === "awareness" && message.payload) {
                    const update = Buffer.from(message.payload, "base64");
                    awarenessProtocol.applyAwarenessUpdate(room.awareness, update, redisOrigin);
                    const encoder = encoding.createEncoder();
                    encoding.writeVarUint(encoder, AWARENESS_MESSAGE);
                    encoding.writeVarUint8Array(encoder, update);
                    broadcast(room, encoding.toUint8Array(encoder));
               } else if (message.type === "presence") {
                    sendPresence(room, await loadPresence(room));
               }
          })().catch((error: unknown) => {
               logger.error({ err: error, room: room.key }, "Failed to process Redis collaboration message");
          });
     });
}

async function unsubscribeRoom(room: Room): Promise<void> {
     const count = subscriptions.get(room.channel) ?? 0;
     if (count > 1) {
          subscriptions.set(room.channel, count - 1);
          return;
     }
     subscriptions.delete(room.channel);
     await redisSubscriber?.unsubscribe(room.channel);
}

async function createRoom(
     workspaceId: string,
     docId: string,
     document: {
          yjsState: Uint8Array | null;
          contentJson: unknown;
          contentText: string;
          updatedById: string;
     },
): Promise<Room> {
     const key = `ws:${workspaceId}:doc:${docId}`;
     const doc = new Y.Doc();
     if (document.yjsState) {
          Y.applyUpdate(doc, document.yjsState);
     } else if (document.contentJson) {
          seedFromJson(doc, document.contentJson);
     } else if (document.contentText) {
          seedFromJson(doc, {
               type: "doc",
               content: [{ type: "paragraph", content: [{ type: "text", text: document.contentText }] }],
          });
     }
     const room: Room = {
          key,
          workspaceId,
          docId,
          doc,
          awareness: new awarenessProtocol.Awareness(doc),
          clients: new Map(),
          channel: key,
          lastUpdatedById: document.updatedById,
          closing: false,
     };

     doc.on("update", (update: Uint8Array, origin: unknown) => {
          if (origin === redisOrigin || room.closing) return;
          if (origin && typeof origin === "object" && "readyState" in origin) {
               const connection = connectionBySocket.get(origin as WebSocket);
               if (connection) room.lastUpdatedById = connection.member.userId;
          }
          const message: PubSubMessage = {
               type: "update",
               origin: instanceId,
               payload: Buffer.from(update).toString("base64"),
               userId: room.lastUpdatedById,
          };
          void publish(room, message);
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, SYNC_MESSAGE);
          encoding.writeVarUint(encoder, 2);
          encoding.writeVarUint8Array(encoder, update);
          broadcast(room, encoding.toUint8Array(encoder), origin instanceof WebSocket ? origin : undefined);
          scheduleSnapshot(room);
     });
     room.awareness.on("update", ({ added, updated, removed }: {
          added: number[];
          updated: number[];
          removed: number[];
     }, origin: unknown) => {
          if (origin === redisOrigin || room.closing) return;
          const changed = [...added, ...updated, ...removed];
          if (!changed.length) return;
          const update = awarenessProtocol.encodeAwarenessUpdate(room.awareness, changed);
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, AWARENESS_MESSAGE);
          encoding.writeVarUint8Array(encoder, update);
          broadcast(room, encoding.toUint8Array(encoder));
          void publish(room, {
               type: "awareness",
               origin: instanceId,
               payload: Buffer.from(update).toString("base64"),
          });
     });

     rooms.set(key, room);
     try {
          await subscribeRoom(room);
     } catch (error) {
          subscriptions.delete(room.channel);
          rooms.delete(key);
          room.awareness.destroy();
          room.doc.destroy();
          throw error;
     }
     if (!document.yjsState) scheduleSnapshot(room);
     return room;
}

async function getRoom(
     workspaceId: string,
     docId: string,
     document: {
          yjsState: Uint8Array | null;
          contentJson: unknown;
          contentText: string;
          updatedById: string;
     },
): Promise<Room> {
     const key = `ws:${workspaceId}:doc:${docId}`;
     const existing = rooms.get(key);
     return existing ?? createRoom(workspaceId, docId, document);
}

function readAwarenessClientIds(update: Uint8Array): number[] {
     const decoder = decoding.createDecoder(update);
     const count = decoding.readVarUint(decoder);
     const clientIds: number[] = [];
     for (let i = 0; i < count; i += 1) {
          clientIds.push(decoding.readVarUint(decoder));
          decoding.readVarUint(decoder);
          decoding.readVarString(decoder);
     }
     return clientIds;
}

function handleMessage(socket: WebSocket, data: Buffer | ArrayBuffer | Buffer[]): void {
     const connection = connectionBySocket.get(socket);
     if (!connection) return;
     try {
          const bytes = data instanceof ArrayBuffer
               ? new Uint8Array(data)
               : Array.isArray(data)
                    ? Buffer.concat(data)
                    : data;
          const decoder = decoding.createDecoder(bytes);
          const messageType = decoding.readVarUint(decoder);
          if (messageType === SYNC_MESSAGE) {
               const innerDecoder = decoding.createDecoder(bytes);
               decoding.readVarUint(innerDecoder);
               const syncType = decoding.readVarUint(innerDecoder);
               if (!connection.member.canEdit && syncType === 2) {
                    socket.close(1008, "This workspace membership is read-only.");
                    return;
               }
               if (!connection.member.canEdit && syncType === 1) return;
               const response = encoding.createEncoder();
               encoding.writeVarUint(response, SYNC_MESSAGE);
               syncProtocol.readSyncMessage(decoder, response, connection.room.doc, socket);
               if (encoding.length(response) > 1) sendToSocket(socket, encoding.toUint8Array(response));
               if (syncType === 1 && !connection.initialSyncComplete) {
                    connection.initialSyncComplete = true;
                    logger.info(
                         {
                              room: connection.room.key,
                              userId: connection.member.userId,
                              role: connection.member.role,
                         },
                         "Yjs initial sync completed",
                    );
               }
          } else if (messageType === AWARENESS_MESSAGE) {
               const update = decoding.readVarUint8Array(decoder);
               const ids = readAwarenessClientIds(update);
               for (const id of ids) connection.awarenessClientIds.add(id);
               awarenessProtocol.applyAwarenessUpdate(connection.room.awareness, update, socket);
          } else {
               socket.close(1003, "Unsupported collaboration message.");
          }
     } catch (error) {
          logger.warn({ err: error, room: connection.room.key }, "Rejected malformed collaboration message");
          socket.close(1003, "Malformed collaboration message.");
     }
}

async function onDisconnect(socket: WebSocket): Promise<void> {
     const connection = connectionBySocket.get(socket);
     if (!connection) return;
     connectionBySocket.delete(socket);
     const { room } = connection;
     clearInterval(connection.heartbeat);
     room.clients.delete(socket);
     if (connection.awarenessClientIds.size) {
          awarenessProtocol.removeAwarenessStates(
               room.awareness,
               [...connection.awarenessClientIds],
               socket,
          );
     }
     try {
          await removePresence(connection);
          sendPresence(room, await loadPresence(room));
     } catch (error) {
          logger.error({ err: error, room: room.key }, "Failed to clean up collaboration presence");
     }

     if (room.clients.size === 0) {
          room.closing = true;
          if (room.snapshotTimer) clearTimeout(room.snapshotTimer);
          room.snapshotTimer = undefined;
          try {
               await unsubscribeRoom(room);
               await persistRoom(room);
          } finally {
               rooms.delete(room.key);
               room.awareness.destroy();
               room.doc.destroy();
          }
     }
}

async function authorizeUpgrade(request: IncomingMessage): Promise<{
     workspaceId: string;
     docId: string;
     member: Member;
     document: {
          yjsState: Uint8Array | null;
          contentJson: unknown;
          contentText: string;
          updatedById: string;
     };
}> {
     const token = getCookieToken(request);
     if (!token) {
          throw new UpgradeError("Authentication required.", 401, "authentication");
     }
     let payload;
     try {
          payload = verifyAccessToken(token);
     } catch {
          throw new UpgradeError(
               "Access token is invalid or expired.",
               401,
               "authentication",
          );
     }
     if (!payload.sub) {
          throw new UpgradeError("Invalid access token.", 401, "authentication");
     }

     const parsedUrl = parseUrl(request.url ?? "", true);
     const match = WS_PATH.exec(parsedUrl.pathname ?? "");
     if (!match) {
          throw new UpgradeError("Invalid collaboration path.", 403, "route");
     }
     let workspaceId: string;
     let docId: string;
     try {
          workspaceId = decodeURIComponent(match[1]);
          docId = decodeURIComponent(match[2]);
     } catch (error) {
          throw new UpgradeError("Invalid encoded room identifier.", 403, "route", {
               cause: error,
          });
     }

     const origin = request.headers.origin;
     if (origin && !env.CORS_ORIGIN.includes(origin)) {
          throw new UpgradeError("Origin is not allowed.", 403, "origin validation");
     }
     try {
          await ensureRedis();
     } catch (error) {
          throw new UpgradeError(
               "Redis is not ready. Set REDIS_URL and verify the Redis service is reachable.",
               503,
               "Redis readiness",
               { cause: error },
          );
     }

     let document;
     let membership;
     try {
          [document, membership] = await Promise.all([
               prisma.document.findFirst({
                    where: { id: docId, workspaceId },
                    select: {
                         id: true,
                         yjsState: true,
                         contentJson: true,
                         contentText: true,
                         updatedById: true,
                    },
               }),
               prisma.workspaceMember.findUnique({
                    where: { workspaceId_userId: { workspaceId, userId: payload.sub } },
                    select: { role: true, user: { select: { name: true } } },
               }),
          ]);
     } catch (error) {
          throw new UpgradeError(
               "PostgreSQL could not verify the document and workspace membership. Check database connectivity and apply pending migrations.",
               503,
               "PostgreSQL authorization query",
               { cause: error },
          );
     }
     if (!document) {
          throw new UpgradeError("Document not found in this workspace.", 403, "authorization");
     }
     if (!membership) {
          throw new UpgradeError("Workspace membership is required.", 403, "authorization");
     }

     const canEdit = membership.role === "OWNER" || membership.role === "EDITOR";
     return {
          workspaceId,
          docId,
          member: {
               userId: payload.sub,
               name: membership.user.name,
               role: membership.role,
               canEdit,
               color: hashColor(payload.sub),
          },
          document,
     };
}

export function attachDocCollaboration(server: HttpServer): () => Promise<void> {
     const webSocketServer = new WebSocketServer({ noServer: true, maxPayload: 1_000_000 });
     logger.info(
          {
               path: "/ws/:workspaceId/docs/:docId",
               redisConfigured: Boolean(env.REDIS_URL),
          },
          "Document collaboration WebSocket handler attached",
     );

     server.on("upgrade", (request, socket, head) => {
          logger.info(
               {
                    path: request.url,
                    origin: request.headers.origin,
                    hasAccessCookie: Boolean(
                         request.headers.cookie
                              ?.split(";")
                              .some((cookie) =>
                                   cookie.trim().startsWith(`${ACCESS_COOKIE_NAME}=`),
                              ),
                    ),
                    hasBearerToken: request.headers.authorization?.startsWith("Bearer ") ?? false,
               },
               "Collaboration WebSocket upgrade received",
          );
          void authorizeUpgrade(request)
               .then(async (auth) => {
                    const room = await getRoom(auth.workspaceId, auth.docId, auth.document);
                    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
                         logger.info(
                              {
                                   room: room.key,
                                   userId: auth.member.userId,
                                   role: auth.member.role,
                                   clientCount: room.clients.size + 1,
                              },
                              "Collaboration WebSocket accepted",
                         );
                         const connection: Connection = {
                              room,
                              member: auth.member,
                              connectionId: crypto.randomUUID(),
                              awarenessClientIds: new Set(),
                              initialSyncComplete: false,
                              heartbeat: setInterval(() => {
                                   void updatePresence(connection)
                                        .then(() => loadPresence(room))
                                        .then((presence) => sendPresence(room, presence))
                                        .catch((error: unknown) => {
                                             logger.error({ err: error, room: room.key }, "Presence heartbeat failed");
                                        });
                              }, PRESENCE_HEARTBEAT_MS),
                         };
                         room.clients.set(webSocket, auth.member);
                         connectionBySocket.set(webSocket, connection);
                         webSocket.on("message", (data) => handleMessage(webSocket, data));
                         webSocket.on("close", () => {
                              void onDisconnect(webSocket).catch((error: unknown) => {
                                   logger.error({ err: error, room: room.key }, "Collaboration disconnect cleanup failed");
                              });
                         });
                         webSocket.on("error", (error) => {
                              logger.warn({ err: error, room: room.key }, "Collaboration WebSocket error");
                         });
                         const syncEncoder = encoding.createEncoder();
                         encoding.writeVarUint(syncEncoder, SYNC_MESSAGE);
                         syncProtocol.writeSyncStep1(syncEncoder, room.doc);
                         sendToSocket(webSocket, encoding.toUint8Array(syncEncoder));
                         const awarenessClientIds = [...room.awareness.getStates().keys()];
                         if (awarenessClientIds.length) {
                              const awarenessEncoder = encoding.createEncoder();
                              encoding.writeVarUint(awarenessEncoder, AWARENESS_MESSAGE);
                              encoding.writeVarUint8Array(
                                   awarenessEncoder,
                                   awarenessProtocol.encodeAwarenessUpdate(
                                        room.awareness,
                                        awarenessClientIds,
                                   ),
                              );
                              sendToSocket(webSocket, encoding.toUint8Array(awarenessEncoder));
                         }
                         void updatePresence(connection)
                              .then(() => loadPresence(room))
                              .then((presence) => sendPresence(room, presence))
                              .catch((error: unknown) => {
                                   logger.error({ err: error, room: room.key }, "Failed to register collaboration presence");
                                   webSocket.close(1011, "Could not register room presence.");
                              });
                    });
               })
               .catch((error: unknown) => {
                    const status = error instanceof UpgradeError ? error.status : 503;
                    const phase =
                         error instanceof UpgradeError ? error.phase : "room initialization";
                    const message =
                         error instanceof Error ? error.message : "Collaboration unavailable.";
                    logger.error(
                         {
                              err: error,
                              status,
                              phase,
                              path: request.url,
                              origin: request.headers.origin,
                         },
                         "Rejected collaboration connection",
                    );
                    rejectUpgrade(socket, status === 401 || status === 403 ? status : 503, message);
               });
     });

     return async () => {
          for (const room of [...rooms.values()]) {
               room.closing = true;
               if (room.snapshotTimer) clearTimeout(room.snapshotTimer);
               for (const socket of [...room.clients.keys()]) {
                    socket.close(1001, "Server shutting down.");
                    await onDisconnect(socket);
               }
               if (rooms.has(room.key)) {
                    await persistRoom(room);
                    await unsubscribeRoom(room);
                    rooms.delete(room.key);
                    room.awareness.destroy();
                    room.doc.destroy();
               }
          }
          rooms.clear();
          webSocketServer.close();
          if (redisSubscriber?.isReady) await redisSubscriber.quit();
          if (redisPublisher?.isReady) await redisPublisher.quit();
     };
}
