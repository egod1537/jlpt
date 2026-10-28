"use client";

import { useMemo, useSyncExternalStore } from "react";
import { parseSession, SESSION_EVENT, SESSION_KEY } from "@/lib/progress";

const subscribe = (callback: () => void) => {
  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(SESSION_EVENT, callback); window.removeEventListener("storage", callback); };
};
const getSnapshot = () => { try { return window.localStorage.getItem(SESSION_KEY) ?? ""; } catch { return ""; } };
const getServerSnapshot = () => "";

export function useSession() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => { try { return raw ? parseSession(JSON.parse(raw) as unknown) : null; } catch { return null; } }, [raw]);
}
