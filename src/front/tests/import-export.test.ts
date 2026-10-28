// @vitest-environment node

import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseCsvImport, parseJsonImport } from "@back/lib/imports/parser";
import { openDatabase } from "@back/lib/db/database";
import { applyMutation } from "@back/lib/sync/mutations";
import { exportBookCsv, exportBookJson } from "@back/lib/exports/book";

describe("book import and export", () => {
  it("parses UTF-8 BOM, Korean headers, quoted commas and embedded newlines", () => {
    const csv = Buffer.from('\uFEFF단어,읽기,뜻,예문,예문뜻\r\n"見る,観る",みる,"보다, 관찰하다","첫 줄\n둘째 줄","두 줄 예문"\r\n読む,よむ,읽다,本を読む。,책을 읽다.\r\n');
    const parsed = parseCsvImport(csv);
    expect(parsed.mapping).toMatchObject({ term: "단어", reading: "읽기", meanings: "뜻" });
    expect(parsed.errors).toEqual([]);
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.entries[0]).toMatchObject({ term: "見る,観る", meanings: ["보다, 관찰하다"], examples: [{ ja: "첫 줄\n둘째 줄", ko: "두 줄 예문" }] });
  });

  it("accepts legacy WordBook JSON, simple JSON, and a bare array", () => {
    const word = { id: "word-123456abcdef", term: "学ぶ", reading: "まなぶ", meanings: ["배우다"], examples: [{ ja: "学ぶ。", ko: null }], sources: [], status: "ready" };
    expect(parseJsonImport(Buffer.from(JSON.stringify({ id: "session-001", title: "원본", words: [word] }))).entries[0].originalWordId).toBe(word.id);
    expect(parseJsonImport(Buffer.from(JSON.stringify({ title: "간단", words: [{ term: "読む", meaning: "읽다" }] }))).entries[0].meanings).toEqual(["읽다"]);
    expect(parseJsonImport(Buffer.from(JSON.stringify([{ term: "書く", meanings: ["쓰다"] }]))).entries).toHaveLength(1);
  });

  it("exports JSON and RFC 4180 CSV without losing commas or newlines", () => {
    const db = openDatabase(":memory:");
    try {
      const bookId = `book-${randomUUID()}`;
      expect(applyMutation(db, "test", { operationId: randomUUID(), type: "book.create", payload: { id: bookId, title: "내, 단어장", folderId: null, category: null } }).status).toBe("applied");
      const fields = { term: "見る,観る", reading: "みる", meanings: ["보다, 관찰하다"], primaryMeaning: "보다", nuance: "첫 줄\n둘째 줄", partOfSpeech: [], jlptLevels: [], years: [], categories: [], relatedTerms: [], examples: [{ ja: "映画を観る。", ko: "영화를 보다." }], sources: [], status: "ready", tags: [] };
      expect(applyMutation(db, "test", { operationId: randomUUID(), type: "entry.create", payload: { entryId: `entry-${randomUUID()}`, bookId, fields } }).status).toBe("applied");
      const json = exportBookJson(db, bookId)!;
      expect(json.words[0]).toMatchObject({ term: fields.term, meanings: fields.meanings, nuance: fields.nuance });
      expect(parseJsonImport(Buffer.from(JSON.stringify(json))).entries[0]).toMatchObject({ term: fields.term, meanings: fields.meanings, nuance: fields.nuance });
      const csv = exportBookCsv(db, bookId)!;
      expect(csv).toContain('"見る,観る"');
      expect(parseCsvImport(Buffer.from(csv)).entries[0]).toMatchObject({ term: fields.term, meanings: fields.meanings, nuance: fields.nuance, examples: fields.examples });
    } finally {
      db.close();
    }
  });
});
