import { z } from "zod";
import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { importEntrySchema } from "@back/lib/imports/parser";
import { materializeSenseSplit, SenseSplitFailure } from "@back/lib/vocab/sense-split";
import { apiError, apiJson, PayloadTooLargeError, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { ResponsesVocabSenseSplitter } from "@/lib/server/vocab-sense-split";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ entries: z.array(importEntrySchema).min(1).max(500) }).strict();

export async function POST(request: NextRequest) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const input = schema.safeParse(await readLimitedJson(request, 2 * 1_024 * 1_024));
    if (!input.success) return apiError(400, "VALIDATION", "의미 분류할 단어 형식을 확인해 주세요.");
    const classified = await new ResponsesVocabSenseSplitter().classify(getDatabase(), input.data.entries, request.signal);
    return apiJson({ status: "analyzed", groups: classified.result.groups, entries: materializeSenseSplit(input.data.entries, classified.result), cachedBatches: classified.cachedBatches, totalBatches: classified.totalBatches });
  } catch (error) {
    if (error instanceof SenseSplitFailure) return apiError(error.code === "OPENAI_REAUTH_REQUIRED" ? 409 : error.retryable ? 502 : 400, "UPSTREAM", error.message, { reason: error.code, originalCanBeSaved: true });
    if (error instanceof PayloadTooLargeError) return apiError(413, "TOO_LARGE", "의미 분류 입력이 너무 큽니다.");
    if (error instanceof SyntaxError) return apiError(400, "VALIDATION", "JSON 형식을 확인해 주세요.");
    return apiError(500, "INTERNAL", "의미 분류 미리보기를 만들지 못했습니다.");
  }
}
