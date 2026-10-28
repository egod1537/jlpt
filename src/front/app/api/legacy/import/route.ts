import { z } from "zod";
import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { importLegacy, legacyPayloadSchema } from "@back/lib/legacy/import";
import { authorize } from "@/lib/server/authorize";
import { apiError, apiJson, PayloadTooLargeError, readLimitedJson } from "@/lib/server/api";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
const schema = z.object({ data: legacyPayloadSchema, strategy: z.enum(["merge", "replace"]), replaceConfirmation: z.literal("기존 서버 진도 교체").optional() });
export async function POST(request: NextRequest) { const auth = authorize(request, true); if (!auth.ok) return auth.response; try { const input = schema.parse(await readLimitedJson(request, 5 * 1_024 * 1_024)); if (input.strategy === "replace" && input.replaceConfirmation !== "기존 서버 진도 교체") return apiError(400, "VALIDATION", "교체 확인 문구가 필요합니다."); return apiJson(importLegacy(getDatabase(), input.data, input.strategy)); } catch (error) { if (error instanceof PayloadTooLargeError) return apiError(413, "TOO_LARGE", "이전 진도 데이터가 너무 큽니다."); return apiError(400, "VALIDATION", "이전 진도를 가져오지 못했습니다."); } }
