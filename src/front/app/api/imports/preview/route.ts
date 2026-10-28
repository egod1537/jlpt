import { createHash, randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { duplicateSummary, parseImport } from "@back/lib/imports/parser";
import { apiError, apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1_024 * 1_024;

function detectedFormat(file: File): "csv" | "json" | null {
  const name = file.name.toLocaleLowerCase();
  if (file.type.includes("json") || name.endsWith(".json")) return "json";
  if (file.type.includes("csv") || file.type === "text/plain" || name.endsWith(".csv")) return "csv";
  return null;
}

export async function POST(request: NextRequest) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BYTES + 100_000) return apiError(413, "TOO_LARGE", "파일은 10MB 이하여야 합니다.");
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return apiError(400, "VALIDATION", "가져올 파일을 선택해 주세요.");
    if (file.size < 1 || file.size > MAX_BYTES) return apiError(file.size > MAX_BYTES ? 413 : 400, file.size > MAX_BYTES ? "TOO_LARGE" : "VALIDATION", "파일은 10MB 이하의 CSV 또는 JSON이어야 합니다.");
    const format = detectedFormat(file);
    if (!format) return apiError(400, "VALIDATION", "CSV 또는 JSON 파일만 가져올 수 있습니다.");
    const source = Buffer.from(await file.arrayBuffer());
    const parsed = parseImport(source, format);
    const db = getDatabase();
    const existing = db.prepare("SELECT DISTINCT term,reading FROM book_entries WHERE deleted_at IS NULL").all() as Array<{ term: string; reading: string | null }>;
    const duplicates = duplicateSummary(parsed.entries, existing);
    const previewId = randomUUID();
    const sourceHash = createHash("sha256").update(source).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString();
    const summary = { filename: file.name.slice(0, 255), suggestedTitle: parsed.title || file.name.replace(/\.[^.]+$/, "").slice(0, 160), category: parsed.category, originalId: parsed.originalId, totalRows: parsed.entries.length + parsed.errors.length, validRows: parsed.entries.length, invalidRows: parsed.errors.length, duplicates };
    db.transaction(() => {
      db.prepare("DELETE FROM import_previews WHERE expires_at<?").run(new Date().toISOString());
      db.prepare("INSERT INTO import_previews(preview_id,owner_id,mime,format,source_hash,source_blob,mapping_json,summary_json,expires_at,committed_at) VALUES (?,'owner',?,?,?,?,?,?,?,NULL)")
        .run(previewId, file.type || "application/octet-stream", format, sourceHash, source, JSON.stringify(parsed.mapping), JSON.stringify(summary), expiresAt);
    })();
    return apiJson({
      previewId, detectedFormat: format, columns: parsed.columns, sample: parsed.entries.slice(0, 20),
      totalRows: summary.totalRows, validRows: summary.validRows, invalidRows: summary.invalidRows,
      warnings: parsed.errors.slice(0, 100), duplicates, mapping: parsed.mapping,
      suggestedTitle: summary.suggestedTitle, expiresAt,
    });
  } catch (error) {
    return apiError(400, "VALIDATION", error instanceof Error ? error.message : "파일을 해석하지 못했습니다.");
  }
}
