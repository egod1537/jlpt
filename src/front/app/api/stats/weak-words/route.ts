import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { weakWords } from "@back/lib/stats/service";
import { authorize } from "@/lib/server/authorize";
import { apiError, apiJson } from "@/lib/server/api";
import { statsRequest } from "@/lib/server/stats-request";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export function GET(request: NextRequest) { const auth = authorize(request); if (!auth.ok) return auth.response; try { const input = statsRequest(request); const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") || 20), 1), 100); if (!Number.isInteger(limit)) throw new Error("개수를 확인해 주세요."); return apiJson(weakWords(getDatabase(), input.period, limit, input.folderId, input.bookId)); } catch (error) { return apiError(400, "VALIDATION", error instanceof Error ? error.message : "기간을 확인해 주세요."); } }
