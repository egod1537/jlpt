import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { validateBackup } from "@back/lib/backup/service";
import { authorize } from "@/lib/server/authorize";
import { apiError, apiJson } from "@/lib/server/api";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
const MAX = 25 * 1_024 * 1_024;
export async function POST(request: NextRequest) { const auth = authorize(request, true); if (!auth.ok) return auth.response; const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File) || file.size < 1 || file.size > MAX) return apiError(file instanceof File && file.size > MAX ? 413 : 400, file instanceof File && file.size > MAX ? "TOO_LARGE" : "VALIDATION", "25MB 이하의 백업 JSON을 선택해 주세요."); try { const source = Buffer.from(await file.arrayBuffer()); const backup = validateBackup(JSON.parse(source.toString("utf8"))); const previewId = randomUUID(); const summary = { scope: backup.scope, exportedAt: backup.exported_at, datasetRevision: backup.dataset_revision, counts: Object.fromEntries(Object.entries(backup.data).map(([table, rows]) => [table, rows.length])) }; getDatabase().prepare("INSERT INTO import_previews(preview_id,mime,format,source_hash,source_blob,mapping_json,summary_json,expires_at,committed_at) VALUES (?,'application/json','backup',?,?, '{}',?,?,NULL)").run(previewId, backup.checksum, source, JSON.stringify(summary), new Date(Date.now()+24*60*60*1000).toISOString()); return apiJson({ previewId, ...summary }); } catch (error) { return apiError(400, "VALIDATION", error instanceof Error ? error.message : "백업을 확인하지 못했습니다."); } }
