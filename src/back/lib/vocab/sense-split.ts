import "server-only";

import type { AppDatabase } from "@back/lib/db/database";
import type { ImportEntry } from "@back/lib/imports/parser";

export const senseSplitPromptVersion = "vocab-sense-split-v1";

export type SenseSplitSense = {
  senseKey: string;
  nuance: string;
  meanings: string[];
  exampleSourceIds: string[];
  sourceRecordIds: string[];
  reason: string;
  reviewRequired: boolean;
};

export type SenseSplitGroup = { groupId: string; term: string; reading: string | null; senses: SenseSplitSense[] };
export type SenseSplitResult = { groups: SenseSplitGroup[] };
export type SenseSplitOverride = { groupId: string; merge?: boolean; labels?: Record<string, string> };

export class SenseSplitFailure extends Error {
  constructor(readonly code: string, message: string, readonly retryable = false) { super(message); this.name = "SenseSplitFailure"; }
}

export function senseSplitSource(entries: ImportEntry[]) {
  return entries.map((entry, index) => ({
    recordId: `r${index}`, term: entry.term, reading: entry.reading, meanings: entry.meanings,
    nuance: entry.nuance, examples: entry.examples.map((example, exampleIndex) => ({ id: `r${index}:e${exampleIndex}`, ...example })),
    partOfSpeech: entry.partOfSpeech, sources: entry.sources, collection: entry.categories,
  }));
}

export function validateSenseSplitOutput(payload: unknown, entries: ImportEntry[]): SenseSplitResult {
  if (!record(payload) || !Array.isArray(payload.groups) || payload.groups.length < 1 || payload.groups.length > entries.length) throw new SenseSplitFailure("SENSE_SCHEMA_INVALID", "GPT 의미 그룹 형식이 올바르지 않습니다.", true);
  const source = senseSplitSource(entries);
  const sourceById = new Map(source.map((item) => [item.recordId, item]));
  const allExampleIds = new Set(source.flatMap((item) => item.examples.map((example) => example.id)));
  const covered = new Set<string>();
  const senseKeys = new Set<string>();
  const groupKeys = new Set<string>();
  const groups = payload.groups.map((rawGroup, groupIndex) => {
    if (!record(rawGroup) || typeof rawGroup.term !== "string" || !(typeof rawGroup.reading === "string" || rawGroup.reading === null) || !Array.isArray(rawGroup.senses) || rawGroup.senses.length < 1 || rawGroup.senses.length > 50) throw new SenseSplitFailure("SENSE_GROUP_INVALID", "GPT 의미 그룹이 올바르지 않습니다.", true);
    const groupKey = lexicalKey(rawGroup.term, rawGroup.reading);
    if (groupKeys.has(groupKey)) throw new SenseSplitFailure("SENSE_GROUP_DUPLICATE", "같은 표제어가 여러 그룹으로 중복되었습니다.", true);
    groupKeys.add(groupKey);
    const senses = rawGroup.senses.map((rawSense) => {
      if (!record(rawSense) || typeof rawSense.senseKey !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(rawSense.senseKey) || senseKeys.has(rawSense.senseKey)) throw new SenseSplitFailure("SENSE_KEY_INVALID", "GPT 의미 식별자가 올바르지 않습니다.", true);
      senseKeys.add(rawSense.senseKey);
      if (!Array.isArray(rawSense.sourceRecordIds) || !rawSense.sourceRecordIds.length || rawSense.sourceRecordIds.some((id) => typeof id !== "string" || !sourceById.has(id))) throw new SenseSplitFailure("SENSE_SOURCE_INVALID", "GPT가 존재하지 않는 원본 레코드를 참조했습니다.", true);
      const sourceIds = [...new Set(rawSense.sourceRecordIds as string[])];
      const referenced = sourceIds.map((id) => sourceById.get(id)!);
      if (referenced.some((item) => lexicalKey(item.term, item.reading) !== groupKey)) throw new SenseSplitFailure("SENSE_SOURCE_MISMATCH", "서로 다른 표제어가 한 의미로 합쳐졌습니다.", true);
      if (!Array.isArray(rawSense.meanings) || rawSense.meanings.length < 1 || rawSense.meanings.some((meaning) => typeof meaning !== "string" || !meaning.trim())) throw new SenseSplitFailure("SENSE_MEANING_INVALID", "GPT 의미 목록이 올바르지 않습니다.", true);
      const allowedMeanings = new Set(referenced.flatMap((item) => item.meanings));
      const meanings = [...new Set((rawSense.meanings as string[]).map((meaning) => meaning.trim()))];
      if (meanings.some((meaning) => !allowedMeanings.has(meaning))) throw new SenseSplitFailure("SENSE_MEANING_HALLUCINATED", "GPT가 원본에 없는 뜻을 만들었습니다.", true);
      if (!Array.isArray(rawSense.exampleSourceIds) || rawSense.exampleSourceIds.some((id) => typeof id !== "string" || !allExampleIds.has(id) || !sourceIds.includes(id.split(":e")[0]))) throw new SenseSplitFailure("SENSE_EXAMPLE_HALLUCINATED", "GPT가 원본에 없는 예문을 만들었습니다.", true);
      if (typeof rawSense.nuance !== "string" || rawSense.nuance.length > 200 || typeof rawSense.reason !== "string" || rawSense.reason.length > 1_000 || typeof rawSense.reviewRequired !== "boolean") throw new SenseSplitFailure("SENSE_METADATA_INVALID", "GPT 의미 메타데이터가 올바르지 않습니다.", true);
      sourceIds.forEach((id) => covered.add(id));
      return { senseKey: rawSense.senseKey, nuance: rawSense.nuance.trim(), meanings, exampleSourceIds: [...new Set(rawSense.exampleSourceIds as string[])], sourceRecordIds: sourceIds, reason: rawSense.reason.trim(), reviewRequired: rawSense.reviewRequired };
    });
    if (senses.length > 1 && senses.some((sense) => !sense.nuance)) throw new SenseSplitFailure("SENSE_LABEL_MISSING", "분리된 의미에는 구별 라벨이 필요합니다.", true);
    const groupSourceIds = [...new Set(senses.flatMap((sense) => sense.sourceRecordIds))];
    const expectedMeanings = new Set(groupSourceIds.flatMap((id) => sourceById.get(id)!.meanings));
    const returnedMeanings = new Set(senses.flatMap((sense) => sense.meanings));
    if ([...expectedMeanings].some((meaning) => !returnedMeanings.has(meaning))) throw new SenseSplitFailure("SENSE_MEANING_OMITTED", "GPT 결과에서 원본 뜻이 누락되었습니다.", true);
    const expectedExamples = new Set(groupSourceIds.flatMap((id) => sourceById.get(id)!.examples.map((example) => example.id)));
    const returnedExamples = new Set(senses.flatMap((sense) => sense.exampleSourceIds));
    if ([...expectedExamples].some((exampleId) => !returnedExamples.has(exampleId))) throw new SenseSplitFailure("SENSE_EXAMPLE_OMITTED", "GPT 결과에서 원본 예문이 누락되었습니다.", true);
    return { groupId: `g${groupIndex}`, term: rawGroup.term, reading: rawGroup.reading, senses };
  });
  if (covered.size !== entries.length) throw new SenseSplitFailure("SENSE_SOURCE_OMITTED", "GPT 결과에서 원본 단어가 누락되었습니다.", true);
  return { groups };
}

export function materializeSenseSplit(entries: ImportEntry[], result: SenseSplitResult, overrides: SenseSplitOverride[] = []) {
  const source = senseSplitSource(entries);
  const sourceById = new Map(source.map((item, index) => [item.recordId, { source: item, entry: entries[index] }]));
  const overrideByGroup = new Map(overrides.map((override) => [override.groupId, override]));
  return result.groups.flatMap((group) => {
    const override = overrideByGroup.get(group.groupId);
    if (override?.merge) {
      const ids = [...new Set(group.senses.flatMap((sense) => sense.sourceRecordIds))];
      return [combineEntries(group, ids, [...new Set(ids.flatMap((id) => sourceById.get(id)!.entry.meanings))], ids.flatMap((id) => sourceById.get(id)!.source.examples.map((example) => example.id)), sourceById, {
        senseKey: `merged-${group.groupId}`, nuance: override.labels?.merged?.trim() || group.senses[0]?.nuance || "", reason: "사용자가 미리보기에서 의미를 합침", reviewRequired: group.senses.some((sense) => sense.reviewRequired),
      })];
    }
    return group.senses.map((sense) => combineEntries(group, sense.sourceRecordIds, sense.meanings, sense.exampleSourceIds, sourceById, { ...sense, nuance: override?.labels?.[sense.senseKey]?.trim().slice(0, 200) ?? sense.nuance }));
  });
}

export function resolveExistingSenseWordId(db: AppDatabase, entry: ImportEntry) {
  const rows = db.prepare("SELECT word_id,meanings_json FROM book_entries WHERE deleted_at IS NULL AND term=? AND COALESCE(reading,'')=COALESCE(?,'')").all(entry.term, entry.reading) as Array<{ word_id: string; meanings_json: string }>;
  const wanted = normalizedMeaningKey(entry.meanings);
  const matches = [...new Set(rows.filter((row) => {
    try { return normalizedMeaningKey(JSON.parse(row.meanings_json) as string[]) === wanted; } catch { return false; }
  }).map((row) => row.word_id))];
  return matches.length === 1 ? matches[0] : null;
}

function combineEntries(
  group: SenseSplitGroup,
  sourceIds: string[], meanings: string[], exampleIds: string[],
  sourceById: Map<string, { source: ReturnType<typeof senseSplitSource>[number]; entry: ImportEntry }>,
  sense: Pick<SenseSplitSense, "senseKey" | "nuance" | "reason" | "reviewRequired">,
): ImportEntry {
  const records = sourceIds.map((id) => sourceById.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (!records.length) throw new SenseSplitFailure("SENSE_SOURCE_INVALID", "의미에 연결된 원본이 없습니다.");
  const examples = exampleIds.map((id) => { const recordId = id.split(":e")[0]; return sourceById.get(recordId)?.source.examples.find((example) => example.id === id); }).filter((item): item is NonNullable<typeof item> => Boolean(item)).map(({ id: _id, ...example }) => example);
  const union = <T,>(values: T[][]) => [...new Set(values.flat())];
  return {
    term: group.term, reading: group.reading, meanings, primaryMeaning: meanings[0] || null, nuance: sense.nuance || null,
    partOfSpeech: union(records.map((item) => item.entry.partOfSpeech)), jlptLevels: union(records.map((item) => item.entry.jlptLevels)),
    years: union(records.map((item) => item.entry.years)), categories: union(records.map((item) => item.entry.categories)),
    relatedTerms: union(records.map((item) => item.entry.relatedTerms)), examples,
    sources: [...records.flatMap((item) => item.entry.sources), { sourceType: "gpt-sense-split", promptVersion: senseSplitPromptVersion, senseKey: sense.senseKey, sourceRecordIds: sourceIds, reason: sense.reason }],
    status: sense.reviewRequired || records.some((item) => item.entry.status === "needs-review") ? "needs-review" : "ready",
    tags: union(records.map((item) => item.entry.tags)),
  };
}

function lexicalKey(term: string, reading: string | null) { return `${term.normalize("NFKC")}\0${reading?.normalize("NFKC") || ""}`; }
function normalizedMeaningKey(meanings: string[]) { return [...new Set(meanings.map((value) => value.normalize("NFKC").trim().toLocaleLowerCase("und")))].sort().join("\0"); }
function record(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
