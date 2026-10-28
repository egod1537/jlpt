import { z } from "zod";
import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { PURGE_CONFIRMATION, purgeTrash } from "@back/lib/catalog/trash";
import { authorize } from "@/lib/server/authorize";
import { apiError, apiJson, PayloadTooLargeError, readLimitedJson } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ confirmation: z.literal(PURGE_CONFIRMATION) }).strict();

export async function POST(request: NextRequest) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const parsed = schema.safeParse(await readLimitedJson(request, 1_024));
    if (!parsed.success) return apiError(400, "VALIDATION", `계속하려면 '${PURGE_CONFIRMATION}'를 정확히 입력해 주세요.`);
    return apiJson({ deleted: purgeTrash(getDatabase()) });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return apiError(413, "TOO_LARGE", "확인 요청이 너무 큽니다.");
    if (error instanceof SyntaxError) return apiError(400, "VALIDATION", "JSON 형식이 올바르지 않습니다.");
    return apiError(409, "CONFLICT", error instanceof Error ? error.message : "휴지통을 비우지 못했습니다.");
  }
}
