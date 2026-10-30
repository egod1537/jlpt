import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { parseImport, type ImportMapping } from "@back/lib/imports/parser";
import { materializeSenseSplit, SenseSplitFailure } from "@back/lib/vocab/sense-split";
import { apiError, apiJson, PayloadTooLargeError } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { ResponsesVocabSenseSplitter } from "@/lib/server/vocab-sense-split";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: RouteContext<"/api/imports/[previewId]/sense-split">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > 64 * 1_024) throw new PayloadTooLargeError();
    const input = text ? JSON.parse(text) as { mapping?: ImportMapping } : {};
    const { previewId } = await context.params;
    const db = getDatabase();
    const preview = db.prepare("SELECT * FROM import_previews WHERE preview_id=?").get(previewId) as Record<string, unknown> | undefined;
    if (!preview || preview.committed_at || new Date(String(preview.expires_at)) < new Date()) return apiError(404, "NOT_FOUND", "사용 가능한 가져오기 미리보기를 찾을 수 없습니다.");
    const mapping = { ...(JSON.parse(String(preview.mapping_json)) as ImportMapping), ...(input.mapping || {}) };
    const parsed = parseImport(Buffer.from(preview.source_blob as Buffer), String(preview.format) as "csv" | "json", mapping);
    if (!parsed.entries.length) return apiError(400, "VALIDATION", "분류할 정상 단어가 없습니다.");
    try {
      const classified = await new ResponsesVocabSenseSplitter().classify(db, parsed.entries, request.signal);
      const summary = JSON.parse(String(preview.summary_json)) as Record<string, unknown>;
      db.prepare("UPDATE import_previews SET mapping_json=?,summary_json=? WHERE preview_id=? AND committed_at IS NULL")
        .run(JSON.stringify(mapping), JSON.stringify({ ...summary, senseSplit: { result: classified.result, analyzedAt: new Date().toISOString() } }), previewId);
      const entries = materializeSenseSplit(parsed.entries, classified.result);
      return apiJson({ status: "analyzed", groups: classified.result.groups, entries, originalCount: parsed.entries.length, cardCount: entries.length, cachedBatches: classified.cachedBatches, totalBatches: classified.totalBatches });
    } catch (error) {
      if (!(error instanceof SenseSplitFailure)) throw error;
      return apiJson({ status: "skipped", reason: error.code, message: `${error.message} 원본 단어는 그대로 가져올 수 있습니다.`, groups: [], entries: parsed.entries, originalCount: parsed.entries.length, cardCount: parsed.entries.length });
    }
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return apiError(413, "TOO_LARGE", "분류 설정이 너무 큽니다.");
    if (error instanceof SyntaxError) return apiError(400, "VALIDATION", "JSON 형식을 확인해 주세요.");
    return apiError(400, "VALIDATION", error instanceof Error ? error.message : "의미 분류를 시작하지 못했습니다.");
  }
}
