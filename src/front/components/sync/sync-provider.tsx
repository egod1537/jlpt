"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { runSync, subscribeSync, queueMutation } from "@/lib/sync/engine";
import type { SyncState } from "@/lib/sync/types";

const SyncContext = createContext<{ status: SyncState; queue: typeof queueMutation; retry: () => void } | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncState>({ state: "starting", pending: 0, conflicts: 0 });
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    const unsubscribe = subscribeSync(setStatus);
    const sync = () => { void runSync(); };
    const visible = () => { if (document.visibilityState === "visible") sync(); };
    const failedStorage = (event: Event) => setStorageError((event as CustomEvent<string>).detail || "오프라인 저장소에 저장하지 못했습니다.");
    window.addEventListener("online", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("jlpt-storage-error", failedStorage);
    sync();
    return () => {
      unsubscribe();
      window.removeEventListener("online", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("jlpt-storage-error", failedStorage);
    };
  }, []);
  return <SyncContext.Provider value={{ status, queue: queueMutation, retry: () => { void runSync(); } }}>{storageError ? <div role="alert" className="fixed inset-x-3 top-[calc(4rem+env(safe-area-inset-top))] z-50 mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950 shadow-lg"><p className="font-bold">오프라인 저장 실패</p><p className="mt-1">{storageError} 설정에서 JSON 백업을 받은 뒤 브라우저 저장 공간을 확인하세요.</p><button type="button" onClick={() => setStorageError("")} className="mt-2 min-h-11 font-bold underline">알림 닫기</button></div> : null}{children}</SyncContext.Provider>;
}

export function useSync() {
  const value = useContext(SyncContext);
  if (!value) throw new Error("SyncProvider 안에서 사용해야 합니다.");
  return value;
}
