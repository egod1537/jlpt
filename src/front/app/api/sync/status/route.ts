import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  const newestCursor = Number((getDatabase().prepare("SELECT COALESCE(MAX(seq),0) value FROM sync_changes").get() as { value: number }).value);
  return apiJson({ serverTime: new Date().toISOString(), newestCursor });
}
