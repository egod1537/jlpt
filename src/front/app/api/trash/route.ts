import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { listTrash } from "@back/lib/catalog/queries";
import { apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const auth = authorize(request);
  return auth.ok ? apiJson(listTrash(getDatabase())) : auth.response;
}
