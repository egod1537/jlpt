import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { exportListeningScript } from "@back/lib/listening/script";
import { apiError } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/script/export">) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  try {
    const { audioId } = await context.params;
    const format = request.nextUrl.searchParams.get("format") || "json";
    if (!new Set(["json", "txt", "srt"]).has(format)) return apiError(400, "VALIDATION", "내보내기 형식을 확인해 주세요.");
    const exported = exportListeningScript(getDatabase(), audioId, format as "json" | "txt" | "srt");
    return new Response(exported.body, {
      headers: {
        "Content-Type": exported.contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(exported.filename)}`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}
