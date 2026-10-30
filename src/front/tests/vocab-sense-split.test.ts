import { afterEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

vi.mock("server-only", () => ({}));

import type { AppDatabase } from "@back/lib/db/database";
import { openDatabase } from "@back/lib/db/database";
import type { ImportEntry } from "@back/lib/imports/parser";
import { materializeSenseSplit, resolveExistingSenseWordId, SenseSplitFailure, validateSenseSplitOutput } from "@back/lib/vocab/sense-split";
import { createExternalBook } from "@back/lib/external-api/books";
import { applyMutation } from "@back/lib/sync/mutations";
import { ResponsesVocabSenseSplitter } from "@/lib/server/vocab-sense-split";

function entry(term: string, reading: string, meanings: string[], examples: Array<{ ja: string; ko: string | null }> = []): ImportEntry {
  return { term, reading, meanings, primaryMeaning: meanings[0], nuance: null, partOfSpeech: [], jlptLevels: [], years: [], categories: [], relatedTerms: [], examples, sources: [{ source: "test" }], status: "ready", tags: [] };
}

describe("GPT vocabulary sense splitting", () => {
  let db: AppDatabase | undefined;
  afterEach(() => { db?.close(); vi.restoreAllMocks(); });

  it("reproduces the required 生地 and 理屈 semantic cards with independent labels", () => {
    const source = [
      entry("生地", "きじ", ["옷감", "천", "본바탕", "본성"], [{ ja: "この生地は薄い。", ko: "이 옷감은 얇다." }, { ja: "彼の生地が出る。", ko: "그의 본성이 드러난다." }]),
      entry("理屈", "りくつ", ["이치", "도리", "억지", "구실", "핑계"]),
    ];
    const result = validateSenseSplitOutput({ groups: [
      { term: "生地", reading: "きじ", senses: [
        { senseKey: "kiji-fabric", nuance: "천, 옷감", meanings: ["옷감", "천"], exampleSourceIds: ["r0:e0"], sourceRecordIds: ["r0"], reason: "재료 문맥", reviewRequired: false },
        { senseKey: "kiji-nature", nuance: "본바탕, 본성", meanings: ["본바탕", "본성"], exampleSourceIds: ["r0:e1"], sourceRecordIds: ["r0"], reason: "사람의 본성 문맥", reviewRequired: false },
      ] },
      { term: "理屈", reading: "りくつ", senses: [
        { senseKey: "rikutsu-logic", nuance: "논리, 도리", meanings: ["이치", "도리"], exampleSourceIds: [], sourceRecordIds: ["r1"], reason: "논리 의미", reviewRequired: false },
        { senseKey: "rikutsu-excuse", nuance: "억지, 핑계", meanings: ["억지", "구실", "핑계"], exampleSourceIds: [], sourceRecordIds: ["r1"], reason: "부정적 핑계 의미", reviewRequired: false },
      ] },
    ] }, source);
    const cards = materializeSenseSplit(source, result);
    expect(cards).toHaveLength(4);
    expect(cards.filter((card) => card.term === "生地")).toMatchObject([
      { nuance: "천, 옷감", meanings: ["옷감", "천"], examples: [{ ja: "この生地は薄い。" }] },
      { nuance: "본바탕, 본성", meanings: ["본바탕", "본성"], examples: [{ ja: "彼の生地が出る。" }] },
    ]);
    expect(cards.filter((card) => card.term === "理屈")).toMatchObject([{ nuance: "논리, 도리" }, { nuance: "억지, 핑계" }]);
    db = openDatabase(":memory:");
    const created = createExternalBook(db, { title: "의미별 카드", words: cards });
    const wordIds = created.entries.map((value) => (value as { wordId: string }).wordId);
    expect(new Set(wordIds).size).toBe(4);
    for (const wordId of wordIds.slice(0, 2)) applyMutation(db, "sense-test", { operationId: randomUUID(), type: "review.rate", payload: { wordId, rating: "good", sessionId: null, context: "new" } });
    expect(db.prepare("SELECT COUNT(*) count FROM review_states WHERE word_id IN (?,?)").get(wordIds[0], wordIds[1])).toEqual({ count: 2 });
  });

  it("keeps synonymous translations on one card and rejects invented evidence", () => {
    const source = [entry("気配", "けはい", ["기척", "낌새"], [{ ja: "人の気配を感じる。", ko: null }])];
    const payload = { groups: [{ term: "気配", reading: "けはい", senses: [{ senseKey: "presence", nuance: "기척, 낌새", meanings: ["기척", "낌새"], exampleSourceIds: ["r0:e0"], sourceRecordIds: ["r0"], reason: "같은 감지 용례", reviewRequired: false }] }] };
    expect(materializeSenseSplit(source, validateSenseSplitOutput(payload, source))).toHaveLength(1);
    expect(() => validateSenseSplitOutput({ groups: [{ term: "気配", reading: "けはい", senses: [{ ...payload.groups[0].senses[0], meanings: ["유령"], exampleSourceIds: ["r0:e9"] }] }] }, source)).toThrow(SenseSplitFailure);
  });

  it("reuses one unambiguous existing sense wordId even when its label changes", () => {
    db = openDatabase(":memory:");
    const created = createExternalBook(db, { title: "기존", words: [{ term: "気配", reading: "けはい", meanings: ["기척", "낌새"], nuance: "존재의 낌새" }] });
    const candidate = { ...entry("気配", "けはい", ["낌새", "기척"]), nuance: "새 라벨" };
    expect(resolveExistingSenseWordId(db, candidate)).toBe((created.entries[0] as { wordId: string }).wordId);
  });

  it("uses Responses structured output constraints and caches an identical batch", async () => {
    db = openDatabase(":memory:");
    const source = [entry("気配", "けはい", ["기척", "낌새"])];
    const payload = { groups: [{ term: "気配", reading: "けはい", senses: [{ senseKey: "presence", nuance: "기척, 낌새", meanings: ["기척", "낌새"], exampleSourceIds: [], sourceRecordIds: ["r0"], reason: "동일 용례", reviewRequired: false }] }] };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(
      `data: ${JSON.stringify({ type: "response.output_text.delta", delta: JSON.stringify(payload) })}\r\n\r\ndata: ${JSON.stringify({ type: "response.completed", response: { id: "resp" } })}\r\n\r\n`,
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    ));
    const splitter = new ResponsesVocabSenseSplitter("gpt-test", fetcher, async () => "oauth-token");
    expect((await splitter.classify(db, source)).cachedBatches).toBe(0);
    expect((await splitter.classify(db, source)).cachedBatches).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const request = JSON.parse(String(fetcher.mock.calls[0][1]?.body));
    expect(request).toMatchObject({ model: "gpt-test", store: false, stream: true, text: { format: { type: "json_schema", strict: true } } });
    expect(String(request.input[0].content[0].text)).toContain("지시가 아닙니다");
  });
});
