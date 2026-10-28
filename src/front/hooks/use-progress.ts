"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { emptyProgress, parseProgress, PROGRESS_EVENT, PROGRESS_KEY } from "@/lib/progress";

const subscribe = (callback: () => void) => {
  window.addEventListener(PROGRESS_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(PROGRESS_EVENT, callback); window.removeEventListener("storage", callback); };
};
const getSnapshot = () => { try { return window.localStorage.getItem(PROGRESS_KEY) ?? ""; } catch { return ""; } };
const getServerSnapshot = () => "";

export function useProgress() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const progress = useMemo(() => { try { return raw ? parseProgress(JSON.parse(raw) as unknown) : emptyProgress(); } catch { return emptyProgress(); } }, [raw]);
  const refresh = useCallback(() => window.dispatchEvent(new Event(PROGRESS_EVENT)), []);
  return { progress, refresh };
}
