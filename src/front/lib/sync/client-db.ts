import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { OutboxRecord } from "@/lib/sync/types";

interface JlptClientSchema extends DBSchema {
  meta: { key: string; value: unknown };
  folders: { key: string; value: Record<string, unknown> };
  books: { key: string; value: Record<string, unknown> };
  entries: { key: string; value: Record<string, unknown>; indexes: { bookId: string } };
  reviewStates: { key: string; value: Record<string, unknown> };
  studySessions: { key: string; value: Record<string, unknown> };
  bookmarks: { key: string; value: Record<string, unknown> };
  preferences: { key: string; value: { key: string; value: unknown } };
  outbox: { key: string; value: OutboxRecord; indexes: { status: string; createdAt: string } };
}

let database: Promise<IDBPDatabase<JlptClientSchema>> | undefined;

export function clientDatabase() {
  database ??= openDB<JlptClientSchema>("jlpt-owner-v1", 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore("meta");
        db.createObjectStore("folders", { keyPath: "id" });
        db.createObjectStore("books", { keyPath: "id" });
        const entries = db.createObjectStore("entries", { keyPath: "entryId" });
        entries.createIndex("bookId", "bookId");
        db.createObjectStore("reviewStates", { keyPath: "wordId" });
        db.createObjectStore("studySessions", { keyPath: "id" });
        db.createObjectStore("preferences", { keyPath: "key" });
        const outbox = db.createObjectStore("outbox", { keyPath: "operationId" });
        outbox.createIndex("status", "status");
        outbox.createIndex("createdAt", "createdAt");
      }
      if (oldVersion < 2) db.createObjectStore("bookmarks", { keyPath: "entryId" });
    },
  });
  return database;
}

export async function deviceId() {
  const db = await clientDatabase();
  let id = await db.get("meta", "deviceId") as string | undefined;
  if (!id) {
    id = crypto.randomUUID();
    await db.put("meta", id, "deviceId");
  }
  return id;
}

export async function outboxCounts() {
  const db = await clientDatabase();
  const records = await db.getAll("outbox");
  return {
    pending: records.filter((record) => record.status === "pending").length,
    conflicts: records.filter((record) => record.status === "conflict" || record.status === "rejected").length,
  };
}

export async function storeBootstrap(value: {
  cursor: number;
  folders: Array<Record<string, unknown>>;
  books: Array<Record<string, unknown>>;
  reviewStates: Array<Record<string, unknown>>;
  activeSessions: Array<Record<string, unknown>>;
  bookmarks: Array<Record<string, unknown>>;
  preferences: Record<string, unknown>;
}) {
  const db = await clientDatabase();
  const stores = ["meta", "folders", "books", "reviewStates", "studySessions", "bookmarks", "preferences"] as const;
  const tx = db.transaction(stores, "readwrite");
  await Promise.all([
    tx.objectStore("folders").clear(), tx.objectStore("books").clear(), tx.objectStore("reviewStates").clear(),
    tx.objectStore("studySessions").clear(), tx.objectStore("bookmarks").clear(), tx.objectStore("preferences").clear(),
  ]);
  await Promise.all(value.folders.map((folder) => tx.objectStore("folders").put(folder)));
  await Promise.all(value.books.map((book) => tx.objectStore("books").put(book)));
  await Promise.all(value.reviewStates.map((state) => tx.objectStore("reviewStates").put(state)));
  await Promise.all(value.activeSessions.map((session) => tx.objectStore("studySessions").put(session)));
  await Promise.all(value.bookmarks.map((bookmark) => tx.objectStore("bookmarks").put(bookmark)));
  await Promise.all(Object.entries(value.preferences).map(([key, preference]) => tx.objectStore("preferences").put({ key, value: preference })));
  await tx.objectStore("meta").put(value.cursor, "lastAppliedCursor");
  await tx.objectStore("meta").put(true, "bootstrapped");
  await tx.done;
}

export async function cacheEntries(entries: Array<Record<string, unknown>>) {
  const db = await clientDatabase();
  const tx = db.transaction("entries", "readwrite");
  await Promise.all(entries.map((entry) => tx.store.put(entry)));
  await tx.done;
}

export async function replaceCachedEntries(bookId: string, entries: Array<Record<string, unknown>>) {
  const db = await clientDatabase();
  const tx = db.transaction("entries", "readwrite");
  for (const key of await tx.store.index("bookId").getAllKeys(bookId)) await tx.store.delete(key);
  for (const entry of entries) await tx.store.put(entry);
  await tx.done;
}

export async function cachedEntries(bookId: string) {
  return (await clientDatabase()).getAllFromIndex("entries", "bookId", bookId);
}

export async function clearSensitiveCache() {
  const db = await clientDatabase();
  const names = ["meta", "folders", "books", "entries", "reviewStates", "studySessions", "bookmarks", "preferences", "outbox"] as const;
  const tx = db.transaction(names, "readwrite");
  await Promise.all(names.map((name) => tx.objectStore(name).clear()));
  await tx.done;
}
