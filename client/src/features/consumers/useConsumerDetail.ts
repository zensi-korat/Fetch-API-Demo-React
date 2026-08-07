import { useEffect, useState } from "react";
import type { Consumer } from "./types";

interface ConsumerResponse {
  consumer: Consumer;
}

/** GET a single consumer by id with a plain `fetch`. */
export function useConsumerDetail(id: string) {
  const [consumer, setConsumer] = useState<Consumer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      try {
        // The id is dropped into the URL path (a "route parameter").
        const res = await fetch(`/api/consumers/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message ?? "Failed to load consumer");
        }
        const data: ConsumerResponse = await res.json();
        if (!ignore) setConsumer(data.consumer);
      } catch (err) {
        if (!ignore) {
          setIsError(true);
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    load();

    // If the id changes (or the component unmounts) before the request
    // finishes, ignore the result so we don't set state from a stale request.
    return () => {
      ignore = true;
    };
  }, [id]);

  return { consumer, isLoading, isError, error };
}
