export type SyncEntityType = "folder" | "book" | "entry" | "reviewState" | "studySession" | "preference";

export interface ClientMutation {
  operationId: string;
  type: string;
  targetId?: string;
  expectedRevision?: number;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export interface OutboxRecord {
  operationId: string;
  mutation: ClientMutation;
  status: "pending" | "conflict" | "rejected";
  attempts: number;
  createdAt: string;
  lastAttemptAt?: string;
  error?: { code: string; message: string };
  serverEntity?: unknown;
}

export interface SyncChange {
  seq: number;
  entityType: SyncEntityType;
  entityId: string;
  revision: number;
  action: "upsert" | "delete";
  payload: Record<string, unknown>;
  changedAt: string;
}

export type SyncState =
  | { state: "starting"; pending: number; conflicts: number }
  | { state: "synced"; pending: 0; conflicts: 0; syncedAt: string }
  | { state: "pending"; pending: number; conflicts: number }
  | { state: "offline"; pending: number; conflicts: number }
  | { state: "conflict"; pending: number; conflicts: number }
  | { state: "auth"; pending: number; conflicts: number }
  | { state: "error"; pending: number; conflicts: number };
