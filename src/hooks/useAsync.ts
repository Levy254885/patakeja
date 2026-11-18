"use client";
import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  setData: (d: T | null) => void;
}

/** Runs an async loader on mount and whenever `deps` change. Ignores results from stale runs. */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList = [], enabled = true): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const run = useRef(0);

  const execute = useCallback(() => {
    if (!enabled) return;
    const id = ++run.current;
    setLoading(true);
    setError(null);
    loader()
      .then((d) => run.current === id && setData(d))
      .catch((e: unknown) => run.current === id && setError(e instanceof Error ? e.message : "Something went wrong"))
      .finally(() => run.current === id && setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, reload: execute, setData };
}
