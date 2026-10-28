"use client";

import { useCallback, useEffect, useState } from "react";

export function useAsync<T>(loader: () => Promise<T>) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ data?: T; error?: unknown; loading: boolean }>({ loading: true });
  useEffect(() => {
    let active = true;
    loader().then((data) => active && setState({ data, loading: false })).catch((error: unknown) => active && setState({ error, loading: false }));
    return () => { active = false; };
  }, [loader, revision]);
  const retry = useCallback(() => { setState({ loading: true }); setRevision((value) => value + 1); }, []);
  return { ...state, retry };
}
