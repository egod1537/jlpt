import { GET as healthCheck } from "@/app/api/healthz/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return healthCheck();
}
