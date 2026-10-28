"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { blockedOperations, keepServerVersion, reapplyLocalVersion } from "@/lib/sync/engine";
import type { OutboxRecord } from "@/lib/sync/types";
import { Button } from "@/components/ui/button";
import { useSync } from "@/components/sync/sync-provider";

function operationLabel(type: string) {
  const labels: Record<string, string> = {
    "folder.rename": "폴더 이름 변경", "folder.move": "폴더 이동", "folder.delete": "폴더 삭제",
    "book.update": "세트 수정", "book.move": "세트 이동", "book.delete": "세트 삭제", "books.bulkMove": "세트 일괄 이동",
    "entry.update": "단어 수정", "entry.move": "단어 순서 변경", "entry.delete": "단어 삭제", "session.update": "학습 세션 갱신",
  };
  return labels[type] || type;
}

export function SyncConflicts() {
  const { status } = useSync();
  const [records, setRecords] = useState<OutboxRecord[]>([]);
  const refresh = useCallback(() => { void blockedOperations().then(setRecords); }, []);
  useEffect(() => { const timer = window.setTimeout(refresh, 0); window.addEventListener("jlpt-data-changed", refresh); return () => { window.clearTimeout(timer); window.removeEventListener("jlpt-data-changed", refresh); }; }, [refresh, status.conflicts]);
  if (!records.length) return null;
  return <section className="mt-5 rounded-2xl border border-amber-300 bg-amber-950 p-5" aria-labelledby="sync-conflicts-title">
    <h2 id="sync-conflicts-title" className="flex items-center gap-2 font-black text-amber-950"><AlertTriangle className="h-5 w-5" />동기화 충돌 {records.length}건</h2>
    <p className="mt-2 text-sm leading-6 text-amber-200">내 변경은 기기에 보존되어 있습니다. 서버 내용과 비교해 처리 방법을 선택하세요.</p>
    <div className="mt-4 space-y-3">{records.map((record) => <article key={record.operationId} className="rounded-xl bg-app-surface p-4 ring-1 ring-amber-200"><p className="font-bold">{operationLabel(record.mutation.type)}</p><p className="mt-1 text-xs text-app-muted">{record.error?.message || "서버가 변경을 적용하지 못했습니다."}</p><details className="mt-3 text-xs text-app-muted"><summary className="min-h-11 cursor-pointer py-2 font-bold">내 변경과 서버 내용 비교</summary><div className="grid gap-2 sm:grid-cols-2"><pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-app-raised p-3">내 변경{`\n`}{JSON.stringify(record.mutation.payload, null, 2)}</pre><pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-app-raised p-3">서버 내용{`\n`}{JSON.stringify(record.serverEntity || null, null, 2)}</pre></div></details><div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => void keepServerVersion(record.operationId).then(refresh)}>서버 유지</Button><Button disabled={record.status !== "conflict"} onClick={() => void reapplyLocalVersion(record.operationId).then(refresh)}>내 변경 재적용</Button></div></article>)}</div>
  </section>;
}
