import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { parseImport, type ImportMapping } from "@back/lib/imports/parser";
import { applyMutation } from "@back/lib/sync/mutations";
import { getBook } from "@back/lib/catalog/queries";
import { apiError, apiJson, PayloadTooLargeError, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const commitSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.string().trim().max(100).nullable().default(null),
  folderId: z.string().max(128).nullable().default(null),
  mapping: z.record(z.string(), z.string()).optional(),
  validRowsOnly: z.boolean().default(false),
  duplicatePolicy: z.literal("keep-separate").default("keep-separate"),
}).strict();

export async function POST(request: NextRequest, context: { params: Promise<{ previewId: string }> }) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const input = commitSchema.safeParse(await readLimitedJson(request, 64 * 1_024));
    if (!input.success) return apiError(400, "VALIDATION", "가져오기 설정을 확인해 주세요.");
    const { previewId } = await context.params;
    const db = getDatabase();
    const preview = db.prepare("SELECT * FROM import_previews WHERE preview_id=? AND owner_id='owner'").get(previewId) as Record<string, unknown> | undefined;
    if (!preview) return apiError(404, "NOT_FOUND", "가져오기 미리보기를 찾을 수 없습니다.");
    const priorSummary = JSON.parse(String(preview.summary_json)) as Record<string, unknown> & { result?: unknown; originalId?: string | null };
    if (preview.committed_at) return apiJson(priorSummary.result);
    if (new Date(String(preview.expires_at)) < new Date()) return apiError(404, "NOT_FOUND", "가져오기 미리보기가 만료되었습니다.");
    const mapping = { ...(JSON.parse(String(preview.mapping_json)) as ImportMapping), ...input.data.mapping };
    const parsed = parseImport(Buffer.from(preview.source_blob as Buffer), String(preview.format) as "csv" | "json", mapping);
    if (parsed.errors.length && !input.data.validRowsOnly) return apiError(400, "VALIDATION", "오류가 있는 행을 먼저 수정하거나 정상 행만 가져오기를 선택해 주세요.", { errors: parsed.errors.slice(0, 100) });
    if (!parsed.entries.length) return apiError(400, "VALIDATION", "가져올 수 있는 단어가 없습니다.");
    const result = db.transaction(() => {
      if (input.data.folderId) {
        const folder = db.prepare("SELECT 1 FROM folders WHERE id=? AND deleted_at IS NULL").get(input.data.folderId);
        if (!folder) throw new Error("선택한 폴더를 찾을 수 없습니다.");
      }
      const bookId = `book-${randomUUID()}`;
      const bookOperation = applyMutation(db, `import:${previewId}`, {
        operationId: randomUUID(), type: "book.create",
        payload: { id: bookId, title: input.data.title, category: input.data.category, folderId: input.data.folderId, orderIndex: 0, origin: "import", originRef: { previewId, sourceHash: preview.source_hash, originalId: priorSummary.originalId || null } },
      });
      if (bookOperation.status !== "applied") throw new Error(bookOperation.error?.message || "세트를 만들지 못했습니다.");
      parsed.entries.forEach((entry, position) => {
        const entryOperation = applyMutation(db, `import:${previewId}`, {
          operationId: randomUUID(), type: "entry.create",
          payload: {
            entryId: `entry-${randomUUID()}`, bookId, position,
            fields: { ...entry, sources: entry.originalWordId ? [...entry.sources, { sourceType: "import", originalWordId: entry.originalWordId }] : entry.sources },
          },
        });
        if (entryOperation.status !== "applied") throw new Error(entryOperation.error?.message || `${position + 1}번째 단어를 저장하지 못했습니다.`);
      });
      const imported = {
        bookId, insertedEntries: parsed.entries.length, skippedEntries: parsed.errors.length,
        mergedEntries: 0, warnings: parsed.errors.slice(0, 100), book: getBook(db, bookId),
      };
      db.prepare("UPDATE import_previews SET mapping_json=?,summary_json=?,source_blob=X'',committed_at=? WHERE preview_id=? AND committed_at IS NULL")
        .run(JSON.stringify(mapping), JSON.stringify({ ...priorSummary, result: imported }), new Date().toISOString(), previewId);
      return imported;
    })();
    return apiJson(result);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return apiError(413, "TOO_LARGE", "요청이 너무 큽니다.");
    if (error instanceof SyntaxError) return apiError(400, "VALIDATION", "JSON 형식이 올바르지 않습니다.");
    return apiError(400, "VALIDATION", error instanceof Error ? error.message : "가져오기를 완료하지 못했습니다.");
  }
}
