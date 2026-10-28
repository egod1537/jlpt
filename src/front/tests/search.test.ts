import { describe, expect, it } from "vitest";
import { normalizeSearch, searchGroups } from "@/lib/search";
import type { CollectionMeta, SearchOccurrence } from "@/lib/types";

const collections: CollectionMeta[] = [
  { id: "session-001", title: "첫 책", category: "시험", createdAt: "2026-01-01", dataFile: "", csvFile: "", wordCount: 2, sourceRecordCount: 2 },
  { id: "session-002", title: "둘째 책", category: "교재", createdAt: "2026-01-02", dataFile: "", csvFile: "", wordCount: 2, sourceRecordCount: 2 },
];
const base = { nuance: null, jlptLevels: ["N1"], years: [], status: "ready" as const };
const occurrences: SearchOccurrence[] = [
  { ...base, collectionId: "session-001", wordId: "word-000000000001", term: "学校", reading: "がっこう", meanings: ["학교", "배움터"], primaryMeaning: "학교", position: 0 },
  { ...base, collectionId: "session-002", wordId: "word-000000000001", term: "学校", reading: "ガッコウ", meanings: ["학교 기관"], primaryMeaning: "학교 기관", position: 0 },
  { ...base, collectionId: "session-001", wordId: "word-000000000002", term: "学校生活", reading: "がっこうせいかつ", meanings: ["학교생활"], primaryMeaning: "학교생활", position: 1 },
  { ...base, collectionId: "session-002", wordId: "word-000000000003", term: "学校", reading: "まなびや", meanings: ["배움의 장소"], primaryMeaning: "배움의 장소", position: 1 },
];

describe("search", () => {
  it("normalizes width, whitespace and kana variants", () => {
    expect(normalizeSearch("  ｶﾞｯｺｳ  ")).toBe(normalizeSearch("がっこう"));
  });

  it("groups by word ID while retaining occurrences and distinct readings", () => {
    const result = searchGroups(occurrences, "学校", {}, collections);
    expect(result.map((item) => item.wordId)).toEqual(["word-000000000001", "word-000000000003", "word-000000000002"]);
    expect(result[0].occurrences).toHaveLength(2);
    expect(result[0].occurrences[1].meanings).toEqual(["학교 기관"]);
  });

  it("finds secondary Korean meanings and keeps ranking stable", () => {
    expect(searchGroups(occurrences, "배움터", {}, collections)[0].wordId).toBe("word-000000000001");
    expect(searchGroups(occurrences, "가っこう", {}, collections)).toHaveLength(0);
    expect(searchGroups(occurrences, "ガッコウ", {}, collections)[0].occurrences).toHaveLength(2);
  });

  it("returns no eager groups for an empty query and applies filters", () => {
    expect(searchGroups(occurrences, "", {}, collections)).toEqual([]);
    const result = searchGroups(occurrences, "학교", { category: "교재", collectionIds: new Set(["session-002"]) }, collections);
    expect(result.every((group) => group.occurrences.every((item) => item.collectionId === "session-002"))).toBe(true);
  });
});
