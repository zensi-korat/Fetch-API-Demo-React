import { useState, useCallback } from "react";

/** DELETE a consumer by id with a plain `fetch`. */
export function useDeleteConsumer() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (id: string): Promise<void> => {
    setIsPending(true);
    setError(null);
    try {
      // DELETE requests usually carry no body — the id in the URL is enough.
      const res = await fetch(`/api/consumers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to delete consumer");
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Unknown error");
      setError(e);
      throw e;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { mutate, isPending, error };
}
