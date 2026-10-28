import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { previewLegacy } from "@back/lib/legacy/import";
import { authorize } from "@/lib/server/authorize";
import { apiError, apiJson, PayloadTooLargeError, readLimitedJson } from "@/lib/server/api";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) { const auth = authorize(request, true); if (!auth.ok) return auth.response; try { return apiJson(previewLegacy(getDatabase(), await readLimitedJson(request, 5 * 1_024 * 1_024))); } catch (error) { if (error instanceof PayloadTooLargeError) return apiError(413, "TOO_LARGE", "이전 진도 데이터가 너무 큽니다."); return apiError(400, "VALIDATION", "이전 진도 형식을 확인해 주세요."); } }
