import { z } from "zod";
import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { externalWordSchema } from "@back/lib/external-api/books";
import type { ImportEntry } from "@back/lib/imports/parser";
import { materializeSenseSplit, SenseSplitFailure } from "@back/lib/vocab/sense-split";
import { authorizeExternalApi, externalApiError, externalApiHeaders } from "@back/lib/external-api/auth";
import { apiJson, PayloadTooLargeError, readLimitedJson } from "@/lib/server/api";
import { ResponsesVocabSenseSplitter } from "@/lib/server/vocab-sense-split";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ words: z.array(externalWordSchema).min(1).max(500) }).strict();

export async function POST(request: NextRequest) {
  const unauthorized = authorizeExternalApi(request);
  if (unauthorized) return unauthorized;
  try {
    const input = schema.safeParse(await readLimitedJson(request, 2 * 1_024 * 1_024));
    if (!input.success) return externalApiError(400, "VALIDATION", "의미 분류할 words 형식을 확인해 주세요.");
    const entries: ImportEntry[] = input.data.words.map((word) => ({ term: word.term, reading: word.reading ?? null, meanings: word.meanings, primaryMeaning: word.primaryMeaning ?? word.meanings[0] ?? null, nuance: word.nuance ?? null, partOfSpeech: word.partOfSpeech, jlptLevels: word.jlptLevels, years: word.years, categories: word.categories, relatedTerms: word.relatedTerms, examples: word.examples.map((example) => ({ ja: example.ja, ko: example.ko ?? null })), sources: word.sources, status: word.status, tags: word.tags }));
    const classified = await new ResponsesVocabSenseSplitter().classify(getDatabase(), entries, request.signal);
    return apiJson({ data: { groups: classified.result.groups, words: materializeSenseSplit(entries, classified.result), cachedBatches: classified.cachedBatches } }, { headers: externalApiHeaders() });
  } catch (error) {
    if (error instanceof SenseSplitFailure) return externalApiError(error.code === "OPENAI_REAUTH_REQUIRED" ? 409 : error.retryable ? 502 : 400, "SENSE_SPLIT_FAILED", error.message, { reason: error.code, originalCanBeCreated: true });
    if (error instanceof PayloadTooLargeError) return externalApiError(413, "TOO_LARGE", "의미 분류 입력이 너무 큽니다.");
    if (error instanceof SyntaxError) return externalApiError(400, "VALIDATION", "JSON 형식을 확인해 주세요.");
    return externalApiError(500, "INTERNAL", "의미 분류 미리보기를 만들지 못했습니다.");
  }
}
