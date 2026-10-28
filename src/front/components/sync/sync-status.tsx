"use client";

import { Cloud, CloudOff, RefreshCw, TriangleAlert } from "lucide-react";
import { useSync } from "@/components/sync/sync-provider";

export function SyncStatus() {
  const { status, retry } = useSync();
  const content = status.state === "synced"
    ? { label: "동기화됨", Icon: Cloud, style: "text-emerald-700" }
    : status.state === "offline"
      ? { label: status.pending ? `오프라인 · 대기 ${status.pending}건` : "오프라인", Icon: CloudOff, style: "text-slate-600" }
      : status.state === "conflict"
        ? { label: `충돌 ${status.conflicts}건`, Icon: TriangleAlert, style: "text-amber-700" }
        : status.state === "error"
          ? { label: status.pending ? `오류 · 대기 ${status.pending}건` : "동기화 오류", Icon: TriangleAlert, style: "text-red-700" }
          : { label: status.pending ? `대기 ${status.pending}건` : "동기화 중", Icon: RefreshCw, style: "text-slate-600" };
  return <button type="button" onClick={retry} className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold ${content.style}`} title="동기화 다시 시도">
    <content.Icon aria-hidden="true" className="h-4 w-4" />{content.label}
  </button>;
}
