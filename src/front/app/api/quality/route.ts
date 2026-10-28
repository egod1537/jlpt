import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { entryFromRow } from "@back/lib/catalog/rows";
import { authorize } from "@/lib/server/authorize";
import { apiJson } from "@/lib/server/api";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export function GET(request: NextRequest) { const auth = authorize(request); if (!auth.ok) return auth.response; const db = getDatabase(); const count = Number((db.prepare("SELECT COUNT(*) count FROM book_entries e JOIN books b ON b.id=e.book_id WHERE e.status='needs-review' AND e.deleted_at IS NULL AND b.deleted_at IS NULL").get() as { count: number }).count); const entries = (db.prepare("SELECT e.*,b.title book_title FROM book_entries e JOIN books b ON b.id=e.book_id WHERE e.status='needs-review' AND e.deleted_at IS NULL AND b.deleted_at IS NULL ORDER BY e.updated_at DESC LIMIT 100").all() as Array<Record<string, unknown>>).map((row) => ({ ...entryFromRow(row), bookTitle: row.book_title })); return apiJson({ count, entries }); }
