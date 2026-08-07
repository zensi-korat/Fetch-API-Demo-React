import { useEffect, useState, useCallback } from "react";
import type { Consumer } from "./types";

const URL = "/api/consumers";

interface ConsumersResponse {
  consumers: Consumer[];
}

/**
 * GET the whole consumers list with a plain `fetch`.
 *
 * We keep three pieces of state by hand and update them as the request goes
 * out, succeeds, or fails:
 *   - `consumers` — the data once it arrives
 *   - `isLoading` — true while the request is in flight
 *   - `isError` / `error` — set if the request fails
 */
export function useConsumers() {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      // No options object, so `fetch` uses its default method: GET.
      const res = await fetch(URL);
      // `fetch` only throws on a network failure, so we check the status
      // ourselves and turn a 4xx/5xx into a thrown error.
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to load consumers");
      }
      const data: ConsumersResponse = await res.json();
      setConsumers(data.consumers);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // `refetch` lets a component reload the list on demand.
  return { consumers, isLoading, isError, error, refetch: load };
}
