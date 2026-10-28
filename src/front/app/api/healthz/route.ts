import { apiJson } from "@/lib/server/api";
import { getDatabase } from "@back/lib/db/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  getDatabase().prepare("SELECT 1").get();
  return apiJson({ ok: true });
}
