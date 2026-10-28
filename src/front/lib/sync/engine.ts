import { clientDatabase, deviceId, outboxCounts, replaceCachedEntries, storeBootstrap } from "@/lib/sync/client-db";
import type { ClientMutation, OutboxRecord, SyncChange, SyncState } from "@/lib/sync/types";
import { schedule } from "@/lib/review-scheduler";

type Listener = (state: SyncState) => void;
const listeners = new Set<Listener>();
let running: Promise<void> | undefined;
let currentState: SyncState = { state: "starting", pending: 0, conflicts: 0 };
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let retryAttempt = 0;
let lastQueuedAt = 0;

function nextQueueTimestamp() {
  const value = Math.max(Date.now(), lastQueuedAt + 1);
  lastQueuedAt = value;
  return new Date(value).toISOString();
}

function cancelScheduledRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = undefined;
}

function scheduleRetry() {
  if (retryTimer || !navigator.onLine) return;
  const exponential = Math.min(60_000, 1_000 * 2 ** Math.min(retryAttempt, 6));
  const jitter = Math.floor(Math.random() * Math.min(1_000, exponential / 2));
  retryAttempt += 1;
  retryTimer = setTimeout(() => {
    retryTimer = undefined;
    void runSync();
  }, exponential + jitter);
}

function emit(state: SyncState) {
  currentState = state;
  listeners.forEach((listener) => listener(state));
}

export function subscribeSync(listener: Listener) {
  listeners.add(listener);
  listener(currentState);
  return () => listeners.delete(listener);
}

async function bootstrapIfNeeded(): Promise<boolean> {
  const db = await clientDatabase();
  if (await db.get("meta", "bootstrapped")) return false;
  const response = await fetch("/api/bootstrap", { cache: "no-store" });
  if (!response.ok) throw new Error("BOOTSTRAP");
  await storeBootstrap(await response.json());
  return true;
}

async function pushOutbox(): Promise<Set<string>> {
  const db = await clientDatabase();
  const pending = (await db.getAllFromIndex("outbox", "status", "pending")).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, 20);
  if (!pending.length) return new Set();
  const attemptedAt = new Date().toISOString();
  const attemptTx = db.transaction("outbox", "readwrite");
  for (const record of pending) await attemptTx.store.put({ ...record, attempts: record.attempts + 1, lastAttemptAt: attemptedAt });
  await attemptTx.done;
  const response = await fetch("/api/sync/mutations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId: await deviceId(), mutations: pending.map((record) => record.mutation) }),
  });
  if (!response.ok) throw new Error("PUSH");
  const body = await response.json() as { results: Array<{ operationId: string; status: string; error?: { code: string; message: string }; entity?: unknown }> };
  const tx = db.transaction("outbox", "readwrite");
  for (const result of body.results) {
    const record = await tx.store.get(result.operationId);
    if (!record) continue;
    if (result.status === "applied" || result.status === "duplicate") await tx.store.delete(result.operationId);
    else await tx.store.put({ ...record, status: result.status === "conflict" ? "conflict" : "rejected", error: result.error, serverEntity: result.entity });
  }
  await tx.done;
  return new Set(body.results.flatMap((result) => {
    if (result.status !== "applied" && result.status !== "duplicate") return [];
    const mutation = pending.find((item) => item.operationId === result.operationId)?.mutation.type || "";
    if (mutation.startsWith("folder.")) return ["folder"];
    if (mutation.startsWith("book.") || mutation === "books.bulkMove") return ["book"];
    if (mutation.startsWith("entry.")) return ["entry"];
    if (mutation.startsWith("review.")) return ["reviewState"];
    if (mutation.startsWith("session.")) return ["studySession"];
    if (mutation.startsWith("bookmark.")) return ["bookmark"];
    return [];
  }));
}

async function applyChanges(changes: SyncChange[], nextCursor: number) {
  const db = await clientDatabase();
  const stores = ["meta", "folders", "books", "entries", "reviewStates", "studySessions", "bookmarks", "preferences"] as const;
  const tx = db.transaction(stores, "readwrite");
  const storeMap = { folder: "folders", book: "books", entry: "entries", reviewState: "reviewStates", studySession: "studySessions", bookmark: "bookmarks", preference: "preferences" } as const;
  for (const change of changes) {
    const store = storeMap[change.entityType];
    if (!store) continue;
    if (change.action === "delete") await tx.objectStore(store).delete(change.entityId);
    else if (store === "preferences") await tx.objectStore(store).put({ key: change.entityId, value: change.payload });
    else await tx.objectStore(store).put(change.payload);
  }
  await tx.objectStore("meta").put(nextCursor, "lastAppliedCursor");
  await tx.done;
}

async function pullChanges(): Promise<Set<string>> {
  const db = await clientDatabase();
  let cursor = Number(await db.get("meta", "lastAppliedCursor") || 0);
  let hasMore = true;
  const changed = new Set<string>();
  while (hasMore) {
    const response = await fetch(`/api/sync/changes?after=${cursor}&limit=200`, { cache: "no-store" });
    if (!response.ok) throw new Error("PULL");
    const body = await response.json() as { changes: SyncChange[]; nextCursor: number; hasMore: boolean };
    if (body.changes.length) await applyChanges(body.changes, body.nextCursor);
    else await db.put("meta", body.nextCursor, "lastAppliedCursor");
    body.changes.forEach((change) => changed.add(change.entityType));
    cursor = body.nextCursor;
    hasMore = body.hasMore;
  }
  return changed;
}

async function executeSync() {
  const before = await outboxCounts();
  if (!navigator.onLine) { cancelScheduledRetry(); emit({ state: "offline", ...before }); return; }
  try {
    const initialized = await bootstrapIfNeeded();
    const changed = new Set<string>();
    for (;;) {
      const pending = await (await clientDatabase()).getAllFromIndex("outbox", "status", "pending");
      if (!pending.length) break;
      for (const entity of await pushOutbox()) changed.add(entity);
    }
    for (const entity of await pullChanges()) changed.add(entity);
    const counts = await outboxCounts();
    retryAttempt = 0;
    cancelScheduledRetry();
    if (counts.conflicts) emit({ state: "conflict", ...counts });
    else if (counts.pending) emit({ state: "pending", ...counts });
    else emit({ state: "synced", pending: 0, conflicts: 0, syncedAt: new Date().toISOString() });
    if (initialized || changed.size) {
      const detail = { entities: initialized ? ["bootstrap"] : [...changed] };
      window.dispatchEvent(new CustomEvent("jlpt-data-changed", { detail }));
      const channel = new BroadcastChannel("jlpt-sync");
      channel.postMessage({ type: "synced", ...detail });
      channel.close();
    }
  } catch {
    const counts = await outboxCounts();
    if (!navigator.onLine) emit({ state: "offline", ...counts });
    else { emit({ state: "error", ...counts }); scheduleRetry(); }
  }
}

export function runSync() {
  if (running) return running;
  cancelScheduledRetry();
  const task = async () => {
    if (navigator.locks) await navigator.locks.request("jlpt-sync", () => executeSync());
    else await executeSync();
  };
  running = task().finally(() => { running = undefined; });
  return running;
}

export async function queueMutation(input: Omit<ClientMutation, "operationId" | "occurredAt"> & Partial<Pick<ClientMutation, "operationId" | "occurredAt">>) {
  const mutation: ClientMutation = { ...input, operationId: input.operationId || crypto.randomUUID(), occurredAt: input.occurredAt || new Date().toISOString() };
  const record: OutboxRecord = { operationId: mutation.operationId, mutation, status: "pending", attempts: 0, createdAt: nextQueueTimestamp() };
  try { await (await clientDatabase()).put("outbox", record); }
  catch {
    window.dispatchEvent(new CustomEvent("jlpt-storage-error", { detail: "변경을 기기에 영구 저장하지 못했습니다. 저장 공간을 확보한 뒤 다시 시도해 주세요." }));
    throw new Error("변경을 오프라인 저장소에 저장하지 못했습니다.");
  }
  const db = await clientDatabase();
  const timestamp = new Date().toISOString();
  if (mutation.type === "folder.create") {
    await db.put("folders", { ...mutation.payload, parentId: mutation.payload.parentId ?? null, revision: 0, createdAt: timestamp, updatedAt: timestamp, deletedAt: null, bookCount: 0, childCount: 0 });
  } else if (mutation.type === "book.create") {
    await db.put("books", { ...mutation.payload, folderId: mutation.payload.folderId ?? null, favorite: false, revision: 0, createdAt: timestamp, updatedAt: timestamp, deletedAt: null, entryCount: 0, studiedCount: 0 });
  } else if ((mutation.type === "book.update" || mutation.type === "book.move") && mutation.targetId) {
    const current = await db.get("books", mutation.targetId);
    if (current) await db.put("books", { ...current, ...mutation.payload, updatedAt: timestamp });
  } else if (mutation.type === "book.delete" && mutation.targetId) {
    await db.delete("books", mutation.targetId);
  } else if (mutation.type === "books.bulkMove") {
    const ids = mutation.payload.ids as string[];
    for (const [orderIndex, id] of ids.entries()) {
      const current = await db.get("books", id);
      if (current) await db.put("books", { ...current, folderId: mutation.payload.folderId ?? null, orderIndex, updatedAt: timestamp });
    }
  } else if ((mutation.type === "folder.rename" || mutation.type === "folder.move" || mutation.type === "folder.pin") && mutation.targetId) {
    const current = await db.get("folders", mutation.targetId);
    if (current) await db.put("folders", { ...current, ...mutation.payload, updatedAt: timestamp });
  } else if (mutation.type === "folder.delete" && mutation.targetId) {
    await db.delete("folders", mutation.targetId);
  } else if (mutation.type === "entry.create") {
    const fields = mutation.payload.fields as Record<string, unknown>;
    await db.put("entries", { ...fields, entryId: mutation.payload.entryId, bookId: mutation.payload.bookId, wordId: mutation.payload.wordId || `pending-${mutation.payload.entryId}`, position: mutation.payload.position ?? 0, revision: 0, createdAt: timestamp, updatedAt: timestamp, deletedAt: null });
  } else if (mutation.type === "entry.update" && mutation.targetId) {
    const current = await db.get("entries", mutation.targetId);
    if (current) await db.put("entries", { ...current, ...(mutation.payload.fields as Record<string, unknown>), updatedAt: timestamp });
  } else if (mutation.type === "entry.delete" && mutation.targetId) {
    await db.delete("entries", mutation.targetId);
  } else if (mutation.type === "session.create") {
    await db.put("studySessions", { ...mutation.payload, revision: 1, createdAt: timestamp, updatedAt: timestamp, deletedAt: null });
  } else if (mutation.type === "session.update" && mutation.targetId) {
    const current = await db.get("studySessions", mutation.targetId);
    if (current) await db.put("studySessions", { ...current, ...mutation.payload, revision: Number(current.revision || 0) + 1, updatedAt: timestamp });
  } else if (mutation.type === "review.rate") {
    const wordId = String(mutation.payload.wordId);
    const current = await db.get("reviewStates", wordId) as { state?: Parameters<typeof schedule>[0] } | undefined;
    const state = schedule(current?.state, mutation.payload.rating as "again" | "hard" | "good" | "easy", new Date(mutation.occurredAt));
    await db.put("reviewStates", { wordId, schedulerVersion: "sm2-v1-pending", state: { ...state, wordId }, dueAt: state.dueAt, lastReviewedAt: state.lastReviewedAt, lastRating: state.lastRating, lapses: state.lapses, repetitions: state.repetitions, knownFlag: state.knownFlag ?? null });
  } else if (mutation.type === "bookmark.set") {
    const entryId = String(mutation.payload.entryId);
    if (mutation.payload.bookmarked) {
      const current = await db.get("bookmarks", entryId);
      await db.put("bookmarks", { entryId, bookmarked: true, revision: Number(current?.revision || 0), createdAt: current?.createdAt || timestamp, updatedAt: timestamp });
    } else await db.delete("bookmarks", entryId);
  }
  const counts = await outboxCounts();
  emit({ state: navigator.onLine ? "pending" : "offline", ...counts });
  const entity = mutation.type.startsWith("folder.") ? "folder" : mutation.type.startsWith("book.") || mutation.type === "books.bulkMove" ? "book" : mutation.type.startsWith("entry.") ? "entry" : mutation.type.startsWith("review.") ? "reviewState" : mutation.type.startsWith("session.") ? "studySession" : mutation.type.startsWith("bookmark.") ? "bookmark" : "unknown";
  window.dispatchEvent(new CustomEvent("jlpt-data-changed", { detail: { entities: [entity] } }));
  void runSync();
  return mutation.operationId;
}

export async function blockedOperations() {
  const records = await (await clientDatabase()).getAll("outbox");
  return records.filter((record) => record.status === "conflict" || record.status === "rejected").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function reconcileServerEntity(record: OutboxRecord) {
  const db = await clientDatabase();
  const entity = record.serverEntity as Record<string, unknown> | undefined;
  if (entity) {
    if (record.mutation.type.startsWith("folder.")) await db.put("folders", entity);
    else if (record.mutation.type.startsWith("book.")) await db.put("books", entity);
    else if (record.mutation.type === "books.bulkMove") await db.put("books", entity);
    else if (record.mutation.type.startsWith("entry.")) await db.put("entries", entity);
    else if (record.mutation.type.startsWith("session.")) await db.put("studySessions", entity);
    else if (record.mutation.type.startsWith("bookmark.")) await db.put("bookmarks", entity);
    return;
  }
  if (record.mutation.type === "folder.create") await db.delete("folders", String(record.mutation.payload.id));
  else if (record.mutation.type === "book.create") await db.delete("books", String(record.mutation.payload.id));
  else if (record.mutation.type === "entry.create") await db.delete("entries", String(record.mutation.payload.entryId));
  else if (record.mutation.type.startsWith("entry.") && record.mutation.targetId) await db.delete("entries", record.mutation.targetId);
  await db.delete("meta", "bootstrapped");
}

export async function keepServerVersion(operationId: string) {
  const db = await clientDatabase();
  const record = await db.get("outbox", operationId);
  if (!record) return;
  await reconcileServerEntity(record);
  await db.delete("outbox", operationId);
  const counts = await outboxCounts();
  emit(counts.conflicts ? { state: "conflict", ...counts } : { state: navigator.onLine ? "pending" : "offline", ...counts });
  window.dispatchEvent(new CustomEvent("jlpt-data-changed"));
  void runSync();
}

export async function reapplyLocalVersion(operationId: string) {
  const db = await clientDatabase();
  const record = await db.get("outbox", operationId);
  const server = record?.serverEntity as { id?: string; revision?: number } | undefined;
  if (!record || record.status !== "conflict" || !server?.revision) return;
  const nextOperationId = crypto.randomUUID();
  const mutation = { ...record.mutation, operationId: nextOperationId };
  if (mutation.type === "books.bulkMove") {
    const expectedRevisions = { ...(mutation.payload.expectedRevisions as Record<string, number>), ...(server.id ? { [server.id]: server.revision } : {}) };
    mutation.payload = { ...mutation.payload, expectedRevisions };
  } else mutation.expectedRevision = server.revision;
  const next: OutboxRecord = { ...record, operationId: nextOperationId, mutation, status: "pending", attempts: 0, createdAt: new Date().toISOString(), lastAttemptAt: undefined, error: undefined, serverEntity: undefined };
  const tx = db.transaction("outbox", "readwrite");
  await tx.store.delete(operationId);
  await tx.store.put(next);
  await tx.done;
  const counts = await outboxCounts();
  emit({ state: navigator.onLine ? "pending" : "offline", ...counts });
  void runSync();
}

export async function fetchAndCacheEntries(bookId: string) {
  const all: Array<Record<string, unknown>> = [];
  let cursor: number | null = -1;
  while (cursor !== null) {
    const response = await fetch(`/api/books/${encodeURIComponent(bookId)}/entries?cursor=${cursor}&limit=200`, { cache: "no-store" });
    if (!response.ok) throw new Error("단어장을 불러오지 못했습니다.");
    const body = await response.json() as { entries: Array<Record<string, unknown>>; nextCursor: number | null };
    all.push(...body.entries);
    cursor = body.nextCursor;
  }
  await replaceCachedEntries(bookId, all);
  return all;
}
