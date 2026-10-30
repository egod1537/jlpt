import { parse } from "csv-parse/sync";
import { z } from "zod";

const aliases: Record<string, string[]> = {
  term: ["term", "word", "단어", "표제어", "일본어", "어휘"],
  reading: ["reading", "읽기", "후리가나", "요미가나", "발음"],
  meanings: ["meanings", "meaning", "뜻", "의미", "한국어"],
  primaryMeaning: ["primarymeaning", "primary meaning", "대표뜻", "대표 의미"],
  nuance: ["nuance", "뉘앙스"],
  partOfSpeech: ["partofspeech", "part of speech", "품사"],
  jlptLevels: ["jlptlevel", "jlptlevels", "jlpt level", "jlpt levels", "jlpt", "급수"],
  years: ["years", "year", "연도"],
  categories: ["categories", "category", "분류"],
  relatedTerms: ["relatedterms", "related terms", "관련어"],
  examples: ["examples", "예문목록"],
  exampleJa: ["exampleja", "example ja", "예문", "일본어예문"],
  exampleKo: ["exampleko", "example ko", "예문뜻", "한국어예문"],
  sources: ["sources", "source", "출처"],
  tags: ["tags", "tag", "태그"],
  status: ["status", "상태"],
};

export interface ImportMapping { [field: string]: string | undefined }

export interface ImportEntry {
  term: string;
  reading: string | null;
  meanings: string[];
  primaryMeaning: string | null;
  nuance: string | null;
  partOfSpeech: string[];
  jlptLevels: Array<"N1" | "N2" | "N3" | "N4" | "N5">;
  years: number[];
  categories: string[];
  relatedTerms: string[];
  examples: Array<{ ja: string; ko: string | null }>;
  sources: Array<Record<string, unknown>>;
  status: "ready" | "needs-review";
  tags: string[];
  originalWordId?: string;
}

export interface ParsedImport {
  format: "csv" | "json";
  title: string | null;
  category: string | null;
  originalId: string | null;
  columns: string[];
  mapping: ImportMapping;
  entries: ImportEntry[];
  errors: Array<{ row: number; field: string; message: string }>;
}

export const importEntrySchema = z.object({
  term: z.string().trim().min(1).max(200), reading: z.string().max(200).nullable(), meanings: z.array(z.string().max(1_000)).max(50),
  primaryMeaning: z.string().max(1_000).nullable(), nuance: z.string().max(4_000).nullable(), partOfSpeech: z.array(z.string().max(200)).max(50),
  jlptLevels: z.array(z.enum(["N1", "N2", "N3", "N4", "N5"])).max(5), years: z.array(z.number().int().min(1900).max(2200)).max(100),
  categories: z.array(z.string().max(200)).max(50), relatedTerms: z.array(z.string().max(200)).max(100),
  examples: z.array(z.object({ ja: z.string().max(4_000), ko: z.string().max(4_000).nullable() })).max(100),
  sources: z.array(z.record(z.string(), z.unknown())).max(100), status: z.enum(["ready", "needs-review"]), tags: z.array(z.string().max(200)).max(50),
  originalWordId: z.string().max(200).optional(),
}).superRefine((entry, context) => { if (entry.status === "ready" && !entry.meanings.length) context.addIssue({ code: "custom", message: "정상 항목에는 뜻이 하나 이상 필요합니다.", path: ["meanings"] }); });

function normalizedHeader(value: string) {
  return value.trim().normalize("NFKC").toLocaleLowerCase("und").replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function detectMapping(columns: string[]) {
  const mapping: ImportMapping = {};
  for (const [field, names] of Object.entries(aliases)) {
    const found = columns.find((column) => names.some((name) => normalizedHeader(column) === normalizedHeader(name)));
    if (found) mapping[field] = found;
  }
  return mapping;
}

function list(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
    } catch { /* use delimited value */ }
  }
  return trimmed.split(/\s*[|;]\s*/).map((item) => item.trim()).filter(Boolean);
}

function objectArray(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch { throw new Error(`${field} 열은 JSON 배열이어야 합니다.`); }
}

const jsonEntrySchema = z.object({
  id: z.string().optional(),
  wordId: z.string().optional(),
  term: z.string().trim().min(1).max(200),
  reading: z.string().max(200).nullable().optional(),
  meanings: z.array(z.string().max(1_000)).max(50).optional(),
  meaning: z.string().max(1_000).optional(),
  primaryMeaning: z.string().max(1_000).nullable().optional(),
  nuance: z.string().max(4_000).nullable().optional(),
  partOfSpeech: z.array(z.string().max(200)).max(50).optional(),
  jlptLevels: z.array(z.enum(["N1", "N2", "N3", "N4", "N5"])).max(5).optional(),
  years: z.array(z.number().int()).max(100).optional(),
  categories: z.array(z.string().max(200)).max(50).optional(),
  relatedTerms: z.array(z.string().max(200)).max(100).optional(),
  examples: z.array(z.object({ ja: z.string().max(4_000), ko: z.string().max(4_000).nullable().optional() })).max(100).optional(),
  sources: z.array(z.record(z.string(), z.unknown())).max(100).optional(),
  status: z.enum(["ready", "needs-review"]).optional(),
  tags: z.array(z.string().max(200)).max(50).optional(),
}).passthrough();

function jsonEntry(value: unknown): ImportEntry {
  const parsed = jsonEntrySchema.parse(value);
  const meanings = parsed.meanings || (parsed.meaning ? [parsed.meaning] : []);
  const status = parsed.status || (meanings.length ? "ready" : "needs-review");
  if (status === "ready" && meanings.length === 0) throw new Error("정상 항목에는 뜻이 하나 이상 필요합니다.");
  return importEntrySchema.parse({
    term: parsed.term,
    reading: parsed.reading ?? null,
    meanings,
    primaryMeaning: parsed.primaryMeaning ?? meanings[0] ?? null,
    nuance: parsed.nuance ?? null,
    partOfSpeech: parsed.partOfSpeech || [],
    jlptLevels: parsed.jlptLevels || [],
    years: parsed.years || [],
    categories: parsed.categories || [],
    relatedTerms: parsed.relatedTerms || [],
    examples: (parsed.examples || []).map((example) => ({ ja: example.ja, ko: example.ko ?? null })),
    sources: parsed.sources || [],
    status,
    tags: parsed.tags || [],
    originalWordId: parsed.id || parsed.wordId,
  });
}

export function parseJsonImport(source: Buffer): ParsedImport {
  const value = JSON.parse(source.toString("utf8")) as unknown;
  if (value && typeof value === "object" && !Array.isArray(value) && "format_version" in value) throw new Error("전체 백업 파일은 단어장 가져오기에서 사용할 수 없습니다.");
  const wrapper = Array.isArray(value) ? { words: value } : value as Record<string, unknown>;
  if (!wrapper || !Array.isArray(wrapper.words)) throw new Error("words 배열을 찾을 수 없습니다.");
  const entries: ImportEntry[] = [];
  const errors: ParsedImport["errors"] = [];
  wrapper.words.forEach((item, index) => {
    try { entries.push(jsonEntry(item)); }
    catch (error) { errors.push({ row: index + 1, field: "words", message: error instanceof Error ? error.message : "항목 형식 오류" }); }
  });
  return {
    format: "json",
    title: typeof wrapper.title === "string" ? wrapper.title.slice(0, 160) : null,
    category: typeof wrapper.category === "string" ? wrapper.category.slice(0, 100) : null,
    originalId: typeof wrapper.id === "string" ? wrapper.id : null,
    columns: [], mapping: {}, entries, errors,
  };
}

export function parseCsvImport(source: Buffer, mappingOverride?: ImportMapping): ParsedImport {
  const records = parse(source, { bom: true, columns: true, skip_empty_lines: true, relax_column_count: true, max_record_size: 1024 * 1024 }) as Array<Record<string, string>>;
  const columns = records.length ? Object.keys(records[0]) : [];
  const mapping = { ...detectMapping(columns), ...mappingOverride };
  const entries: ImportEntry[] = [];
  const errors: ParsedImport["errors"] = [];
  records.forEach((record, index) => {
    const get = (field: string) => mapping[field] ? record[mapping[field]!] : undefined;
    try {
      const term = get("term")?.trim() || "";
      const meanings = list(get("meanings"));
      const rawStatus = get("status")?.trim();
      const status = rawStatus === "needs-review" || (!meanings.length && rawStatus !== "ready") ? "needs-review" : "ready";
      if (!term) throw new Error("표제어가 비어 있습니다.");
      if (status === "ready" && !meanings.length) throw new Error("뜻이 비어 있습니다.");
      const jlptLevels = list(get("jlptLevels")).filter((level): level is ImportEntry["jlptLevels"][number] => /^N[1-5]$/.test(level));
      const exampleJa = get("exampleJa")?.trim();
      const examples = get("examples")?.trim() ? objectArray(get("examples"), "examples") : exampleJa ? [{ ja: exampleJa, ko: get("exampleKo")?.trim() || null }] : [];
      const sources = get("sources")?.trim() ? objectArray(get("sources"), "sources") : [];
      entries.push(importEntrySchema.parse({
        term, reading: get("reading")?.trim() || null, meanings,
        primaryMeaning: get("primaryMeaning")?.trim() || meanings[0] || null,
        nuance: get("nuance")?.trim() || null,
        partOfSpeech: list(get("partOfSpeech")), jlptLevels, years: list(get("years")).map(Number), categories: list(get("categories")), relatedTerms: list(get("relatedTerms")),
        examples, sources, status, tags: list(get("tags")),
      }));
    } catch (error) {
      errors.push({ row: index + 2, field: "row", message: error instanceof Error ? error.message : "행 형식 오류" });
    }
  });
  return { format: "csv", title: null, category: null, originalId: null, columns, mapping, entries, errors };
}

export function parseImport(source: Buffer, format: "csv" | "json", mapping?: ImportMapping) {
  return format === "json" ? parseJsonImport(source) : parseCsvImport(source, mapping);
}

export function duplicateSummary(entries: ImportEntry[], existing: Array<{ term: string; reading: string | null }>) {
  const seen = new Map<string, number>();
  const within: Array<{ index: number; term: string }> = [];
  const database = new Set(existing.map((entry) => `${entry.term.normalize("NFKC")}\0${entry.reading?.normalize("NFKC") || ""}`));
  const existingMatches: Array<{ index: number; term: string }> = [];
  entries.forEach((entry, index) => {
    const key = `${entry.term.normalize("NFKC")}\0${entry.reading?.normalize("NFKC") || ""}`;
    if (seen.has(key)) within.push({ index: index + 1, term: entry.term }); else seen.set(key, index);
    if (database.has(key)) existingMatches.push({ index: index + 1, term: entry.term });
  });
  return { withinUpload: within.slice(0, 100), existingDatabase: existingMatches.slice(0, 100), withinCount: within.length, existingCount: existingMatches.length };
}
