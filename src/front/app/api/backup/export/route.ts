import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { createBackup } from "@back/lib/backup/service";
import { authorize } from "@/lib/server/authorize";
import { apiError } from "@/lib/server/api";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export function GET(request: NextRequest) { const auth = authorize(request); if (!auth.ok) return auth.response; const scope = request.nextUrl.searchParams.get("scope") || "all"; if (scope !== "all" && scope !== "progress") return apiError(400, "VALIDATION", "백업 범위를 확인해 주세요."); const backup = createBackup(getDatabase(), scope); return new Response(JSON.stringify(backup), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="jlpt-${scope}-backup-${new Date().toISOString().slice(0,10)}.json"`, "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" } }); }
