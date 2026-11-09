import "server-only";

import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import {
  createGrammarBook, createGrammarNote, deleteGrammarBook, deleteGrammarNote, getGrammarBook, getGrammarNote,
  GrammarFailure, listGrammarBooks, listGrammarNotes, updateGrammarBook, updateGrammarNote,
} from "@back/lib/grammar/repository";
import type { GrammarBookInput, GrammarNoteInput } from "@back/lib/grammar/types";
import { PayloadTooLargeError, readLimitedJson } from "@/lib/server/api";
import { ensureGrammarSeeded } from "@/lib/server/grammar-seed";

export type GrammarApiResult = { body: unknown; status?: number; headers?: HeadersInit };

function paging(request: NextRequest, defaultLimit: number) {
  const limit = Number(request.nextUrl.searchParams.get("limit") || defaultLimit);
  const offset = Number(request.nextUrl.searchParams.get("offset") ?? request.nextUrl.searchParams.get("cursor") ?? 0);
  if (!Number.isInteger(limit) || limit < 1 || limit > 500 || !Number.isInteger(offset) || offset < 0) throw new GrammarFailure(400, "VALIDATION", "페이지 값을 확인해 주세요.");
  return { limit, offset };
}

function object(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new GrammarFailure(400, "VALIDATION", "JSON 객체가 필요합니다.");
  return value as Record<string, unknown>;
}

function expectedRevision(request: NextRequest, payload?: Record<string, unknown>) {
  const candidate = payload?.revision ?? payload?.expectedRevision ?? request.nextUrl.searchParams.get("revision") ?? request.nextUrl.searchParams.get("expectedRevision");
  if (Number.isInteger(candidate) && Number(candidate) > 0) return Number(candidate);
  if (typeof candidate === "string" && /^[1-9]\d*$/.test(candidate)) return Number(candidate);
  const match = /^(?:W\/)?"?([1-9]\d*)"?$/.exec(request.headers.get("if-match") || "");
  if (match) return Number(match[1]);
  throw new GrammarFailure(400, "VALIDATION", "revision 또는 If-Match가 필요합니다.");
}

export async function dispatchGrammarApi(request: NextRequest, path: string[]): Promise<GrammarApiResult> {
  const method = request.method;
  const db = getDatabase();
  ensureGrammarSeeded(db);

  if (path.length === 1 && path[0] === "books") {
    if (method === "GET") {
      const { limit, offset } = paging(request, 50);
      const typeValue = request.nextUrl.searchParams.get("type");
      if (typeValue && typeValue !== "book" && typeValue !== "flashcard") throw new GrammarFailure(400, "VALIDATION", "type을 확인해 주세요.");
      const result = listGrammarBooks(db, { q: request.nextUrl.searchParams.get("q") || undefined, type: typeValue as "book" | "flashcard" | undefined, limit, offset });
      return { body: { books: result.books, pagination: { limit, offset, nextCursor: result.nextOffset === null ? null : String(result.nextOffset) } } };
    }
    if (method === "POST") {
      const payload = object(await readLimitedJson(request, 4_194_304));
      const book = createGrammarBook(db, payload as GrammarBookInput);
      return { body: { book }, status: 201, headers: { Location: `/api/grammar/books/${encodeURIComponent(book.id)}`, ETag: `W/"${book.revision}"` } };
    }
  }

  if (path.length === 2 && path[0] === "books") {
    const bookId = path[1];
    if (method === "GET") { const book = getGrammarBook(db, bookId); return { body: { book }, headers: { ETag: `W/"${book.revision}"` } }; }
    if (method === "PATCH") {
      const payload = object(await readLimitedJson(request, 2_621_440));
      const book = updateGrammarBook(db, bookId, { ...payload, revision: expectedRevision(request, payload) } as Partial<GrammarBookInput> & { revision: number });
      return { body: { book }, headers: { ETag: `W/"${book.revision}"` } };
    }
    if (method === "DELETE") { deleteGrammarBook(db, bookId, expectedRevision(request)); return { body: { deleted: true, id: bookId } }; }
  }

  if (path.length === 3 && path[0] === "books" && path[2] === "notes") {
    const bookId = path[1];
    if (method === "GET") {
      const { limit, offset } = paging(request, 100);
      const result = listGrammarNotes(db, bookId, { q: request.nextUrl.searchParams.get("q") || undefined, limit, offset });
      return { body: { notes: result.notes, pagination: { limit, offset, nextCursor: result.nextOffset === null ? null : String(result.nextOffset) } } };
    }
    if (method === "POST") {
      const note = createGrammarNote(db, bookId, object(await readLimitedJson(request, 786_432)) as GrammarNoteInput);
      return { body: { note }, status: 201, headers: { Location: `/api/grammar/books/${encodeURIComponent(bookId)}/notes/${encodeURIComponent(note.id)}`, ETag: `W/"${note.revision}"` } };
    }
  }

  if (path.length === 4 && path[0] === "books" && path[2] === "notes") {
    const [bookId, noteId] = [path[1], path[3]];
    if (method === "GET") { const note = getGrammarNote(db, bookId, noteId); return { body: { note }, headers: { ETag: `W/"${note.revision}"` } }; }
    if (method === "PATCH") {
      const payload = object(await readLimitedJson(request, 786_432));
      const note = updateGrammarNote(db, bookId, noteId, { ...payload, revision: expectedRevision(request, payload) } as Partial<GrammarNoteInput> & { revision: number });
      return { body: { note }, headers: { ETag: `W/"${note.revision}"` } };
    }
    if (method === "DELETE") { deleteGrammarNote(db, bookId, noteId, expectedRevision(request)); return { body: { deleted: true, id: noteId, bookId } }; }
  }

  throw new GrammarFailure(404, "NOT_FOUND", "문법 API 경로를 찾을 수 없습니다.");
}

export function grammarApiFailure(error: unknown) {
  if (error instanceof GrammarFailure) return { status: error.status, code: error.code, message: error.message };
  if (error instanceof PayloadTooLargeError) return { status: 413, code: "TOO_LARGE" as const, message: "요청 본문이 너무 큽니다." };
  if (error instanceof SyntaxError) return { status: 400, code: "VALIDATION" as const, message: "JSON 형식이 올바르지 않습니다." };
  return { status: 500, code: "INTERNAL" as const, message: "문법 API 요청을 처리하지 못했습니다." };
}
