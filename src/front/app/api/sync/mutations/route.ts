import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { applyMutationBatch, mutationBatchSchema } from "@back/lib/sync/mutations";
import { apiError, apiJson, PayloadTooLargeError, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const parsed = mutationBatchSchema.safeParse(await readLimitedJson(request, 256 * 1_024));
    if (!parsed.success) return apiError(400, "VALIDATION", "변경 요청 형식이 올바르지 않습니다.");
    return apiJson(applyMutationBatch(getDatabase(), parsed.data.deviceId, parsed.data.mutations));
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return apiError(413, "TOO_LARGE", "변경 요청이 너무 큽니다.");
    if (error instanceof SyntaxError) return apiError(400, "VALIDATION", "JSON 형식이 올바르지 않습니다.");
    return apiError(500, "INTERNAL", "변경 처리 중 오류가 발생했습니다.");
  }
}
