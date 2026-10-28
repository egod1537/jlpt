import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { statsDaily } from "@back/lib/stats/service";
import { authorize } from "@/lib/server/authorize";
import { apiError, apiJson } from "@/lib/server/api";
import { statsRequest } from "@/lib/server/stats-request";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export function GET(request: NextRequest) { const auth = authorize(request); if (!auth.ok) return auth.response; try { const input = statsRequest(request); return apiJson(statsDaily(getDatabase(), input.period, input.folderId, input.bookId)); } catch (error) { return apiError(400, "VALIDATION", error instanceof Error ? error.message : "기간을 확인해 주세요."); } }
